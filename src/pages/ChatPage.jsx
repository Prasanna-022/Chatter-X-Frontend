import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Pusher from 'pusher-js';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import toast, { Toaster } from 'react-hot-toast';

import ChatSidebar from '../components/ChatSidebar';
import AiAssistantModal from '../components/AiAssistantModal';
import SettingsModal from '../components/SettingsModal'; 
import { useAuth } from '../context/AuthContext';
import SearchModal from '../components/SearchModal';
import FriendRequestModal from '../components/FriendRequestModal';
import api from '../api/api';
import { Phone, Video, MoreVertical, Paperclip, Smile, Send, Loader2, Trash2 } from 'lucide-react';

const EMOJI_LIST = ['😀', '😂', '😍', '🤔', '🥳', '😭', '🤯', '😎', '👍', '👎', '❤️', '🔥', '✨', '🎉', '💡', '✅'];

const PUSHER_KEY = "5980ac2f1b1c333882d1"; 
const PUSHER_CLUSTER = "ap2"; 
const ZEGO_APP_ID = 990441467; 
const ZEGO_SERVER_SECRET = "96f56fa1ce109f77c71ba33bce375cf5"; 

const ChatPage = () => {
    const { user, logout } = useAuth();

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isRequestsOpen, setIsRequestsOpen] = useState(false);
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    const [chats, setChats] = useState([]);
    const [filterQuery, setFilterQuery] = useState('');
    const [aiInput, setAiInput] = useState('');
    const [aiMessages, setAiMessages] = useState([]);

    const [currentChat, setCurrentChat] = useState(null);
    const [currentMessages, setCurrentMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');

    const [isInCall, setIsInCall] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const pusherRef = useRef(null);

    const refreshChatList = async () => {
        try {
            const response = await api.get('/chat');
            const chatArray = response.data?.data;
            setChats(Array.isArray(chatArray) ? chatArray : []);
        } catch (error) {
            console.error(error);
            setChats([]);
        }
    };

    useEffect(() => {
        if (!user) return;
        const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER });
        pusherRef.current = pusher;

        const userChannel = pusher.subscribe(user._id);
        userChannel.bind("friend-request-received", (data) => toast.success(data.message || "New Friend Request!"));
        userChannel.bind("request-accepted", (data) => {
            toast.success(data.message || "Friend Request Accepted!");
            refreshChatList();
        });

        refreshChatList();

        return () => {
            userChannel.unbind_all();
            userChannel.unsubscribe();
            pusher.disconnect();
        };
    }, [user]);

    useEffect(() => {
        if (!currentChat || !pusherRef.current) return;
        const channel = pusherRef.current.subscribe(currentChat._id);
        channel.bind('new-message', (newMessage) => {
            setCurrentMessages((prev) => {
                if (prev.some(m => m._id === newMessage._id)) return prev;
                return [...prev, newMessage];
            });
            refreshChatList(); 
        });
        return () => {
            channel.unbind_all();
            channel.unsubscribe();
        };
    }, [currentChat]);

    const filteredChats = chats.filter(chat => {
        if (!filterQuery) return true;
        const otherUser = chat.users.find(u => u._id !== user._id);
        return otherUser?.name?.toLowerCase().includes(filterQuery.toLowerCase());
    });

    useEffect(() => {
        if (currentChat) {
            const fetchMessages = async () => {
                setIsLoadingMessages(true);
                try {
                    const response = await api.get(`/message/${currentChat._id}`);
                    const messagesArray = response.data?.messages || response.data?.data?.messages;
                    setCurrentMessages(Array.isArray(messagesArray) ? messagesArray : []);
                } catch (error) {
                    setCurrentMessages([]);
                } finally {
                    setIsLoadingMessages(false);
                }
            };
            fetchMessages();
        }
    }, [currentChat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentMessages]);

    const startCall = async (isVideo) => {
        if (!currentChat) return;
        const roomID = currentChat._id; 
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
            ZEGO_APP_ID, ZEGO_SERVER_SECRET, roomID, user._id, user.fullName || user.username
        );
        const zp = ZegoUIKitPrebuilt.create(kitToken);
        setIsInCall(true);
        zp.joinRoom({
            container: document.getElementById("call-container"),
            scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
            showPreJoinView: false,
            turnOnCameraWhenJoining: isVideo,
            turnOnMicrophoneWhenJoining: true,
            onLeaveRoom: () => {
                document.getElementById("call-container").style.display = "none";
                setIsInCall(false);
            },
        });
        document.getElementById("call-container").style.display = "block";
    };

    const handleMessageSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!messageInput.trim()) return;
        const tempContent = messageInput.trim();
        setMessageInput('');
        try {
            await api.post('/message', { content: tempContent, chatId: currentChat._id });
        } catch (error) { console.error(error); }
    };

    const handleAiSubmit = async (e) => {
        e.preventDefault();
        if (!aiInput.trim()) return;
        const userPrompt = aiInput.trim();
        setAiMessages(prev => [...prev, { sender: user.fullName, content: userPrompt }]);
        setAiInput('');
        try {
            const response = await api.post('/user/ai/ask', { prompt: userPrompt });
            setAiMessages(prev => [...prev, { sender: 'Nova AI', content: response.data.reply }]);
        } catch (error) {
            setAiMessages(prev => [...prev, { sender: 'Nova AI', content: "Error: Could not reach AI." }]);
        }
    };

    const handleDeleteMessage = async (type) => {
        if (!contextMenu) return;
        const { msgId } = contextMenu;
        setContextMenu(null);
        try {
            await api.delete(`/message/${msgId}?type=${type}`);
            setCurrentMessages(prev => prev.filter(msg => msg._id !== msgId));
        } catch (error) { alert("Error deleting message"); }
    };

    const openContextMenu = (e, msg) => {
        e.preventDefault();
        setContextMenu({ msgId: msg._id, isSender: msg.sender._id === user._id, x: e.clientX, y: e.clientY });
    };

    if (!user) return null;

    return (
        <div className="flex h-screen antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden font-sans" onClick={() => setContextMenu(null)}>
            
            <Toaster position="top-right" reverseOrder={false} />
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
            <FriendRequestModal isOpen={isRequestsOpen} onClose={() => setIsRequestsOpen(false)} onFriendshipChange={refreshChatList} />
            <AiAssistantModal isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} aiMessages={aiMessages} aiInput={aiInput} setAiInput={setAiInput} handleAiSubmit={handleAiSubmit} />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            <div id="call-container" className={`fixed inset-0 z-50 bg-black hidden`}></div>

            <ChatSidebar
                user={user}
                chats={filteredChats}
                currentChat={currentChat}
                setCurrentChat={setCurrentChat}
                onOpenSearch={() => setIsSearchOpen(true)}
                onOpenRequests={() => setIsRequestsOpen(true)}
                onOpenAi={() => setIsAiOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                logout={logout}
            />

            <div className="flex-1 h-full relative flex flex-col bg-white dark:bg-gray-900">
                <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                }}></div>

                {currentChat ? (
                    <>
                        {/* --- Glass Header --- */}
                        <div className="absolute top-0 left-0 right-0 z-20 p-4">
                            <motion.div
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-sm rounded-2xl p-3 flex justify-between items-center"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <img 
                                            src={currentChat.users.find(u => u._id !== user._id)?.avatar || 'https://via.placeholder.com/40'} 
                                            alt="user" 
                                            className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700"
                                        />
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-700 rounded-full animate-pulse"></span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white leading-none">
                                            {currentChat.users.find(u => u._id !== user._id)?.name}
                                        </h3>
                                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">Active Now</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 text-gray-500 dark:text-gray-400">
                                    <button onClick={() => startCall(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"><Phone size={20} /></button>
                                    <button onClick={() => startCall(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"><Video size={20} /></button>
                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"><MoreVertical size={20} /></button>
                                </div>
                            </motion.div>
                        </div>

                        {/* --- Messages Area --- */}
                        <div className="flex-1 overflow-y-auto px-4 pt-28 pb-28 custom-scrollbar space-y-3">
                            {isLoadingMessages ? (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 className="animate-spin text-blue-500" size={40} />
                                </div>
                            ) : (
                                currentMessages.map((msg, index) => {
                                    const isSender = msg.sender._id === user._id;
                                    return (
                                        <motion.div
                                            key={msg._id || index}
                                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            onContextMenu={(e) => openContextMenu(e, msg)}
                                            className={`flex ${isSender ? 'justify-end' : 'justify-start'} group`}
                                        >
                                            <div className={`flex max-w-[70%] gap-2 ${isSender ? 'flex-row-reverse' : 'flex-row'}`}>
                                                {!isSender && (
                                                    <img 
                                                        src={msg.sender.avatar || "https://via.placeholder.com/30"} 
                                                        alt="av" 
                                                        className="w-8 h-8 rounded-full object-cover self-end mb-1 border border-gray-200 dark:border-gray-700"
                                                    />
                                                )}
                                                
                                                <div className="flex flex-col">
                                                    <div 
                                                        className={`
                                                            px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed
                                                            ${isSender 
                                                                ? 'bg-blue-600 text-white rounded-br-none' 
                                                                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                                                            }
                                                        `}
                                                    >
                                                        {msg.content}
                                                    </div>
                                                    <span className={`text-[10px] text-gray-400 mt-1 ${isSender ? 'text-right' : 'text-left'}`}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* --- Context Menu --- */}
                        {contextMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="fixed bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-2xl py-1 z-50 w-48 overflow-hidden"
                                style={{ top: contextMenu.y, left: contextMenu.x }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {contextMenu.isSender && (
                                    <button onClick={() => handleDeleteMessage('for_everyone')} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors">
                                        <Trash2 size={16} /> Delete for Everyone
                                    </button>
                                )}
                                <button onClick={() => handleDeleteMessage('for_me')} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-2 transition-colors">
                                    <Trash2 size={16} /> Delete for Me
                                </button>
                            </motion.div>
                        )}

                        {/* --- Input Area --- */}
                        <div className="absolute bottom-6 left-0 right-0 px-4 z-20">
                            <motion.div 
                                layout
                                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-xl rounded-full p-2 flex items-center gap-2 max-w-4xl mx-auto"
                            >
                                <button className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-white/10 rounded-full transition-all">
                                    <Paperclip size={20} />
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" />

                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 dark:text-white placeholder-gray-400 px-2"
                                    onKeyDown={(e) => e.key === 'Enter' && handleMessageSubmit(e)}
                                />

                                <div className="relative">
                                    <button 
                                        onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)} 
                                        className="p-2 text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-white/10 rounded-full transition-all"
                                    >
                                        <Smile size={20} />
                                    </button>
                                    
                                    {isEmojiPickerOpen && (
                                        <div className="absolute bottom-14 right-0 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl p-3 grid grid-cols-8 gap-1 w-80 z-50">
                                            {EMOJI_LIST.map((emoji, i) => (
                                                <button key={i} onClick={() => { setMessageInput(p => p + emoji); setIsEmojiPickerOpen(false) }} className="text-xl hover:bg-gray-100 dark:hover:bg-white/10 rounded p-1 transition-colors">{emoji}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={handleMessageSubmit} 
                                    disabled={!messageInput.trim()}
                                    className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:shadow-none transform active:scale-95"
                                >
                                    <Send size={18} />
                                </button>
                            </motion.div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <span className="text-4xl">👋</span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome to ChatterX</h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                            Select a conversation from the sidebar or start a new one to begin chatting.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;