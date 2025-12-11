// src/pages/ChatPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Pusher from 'pusher-js'; 
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt'; 

import ChatSidebar from '../components/ChatSidebar';
import AiAssistantModal from '../components/AiAssistantModal';
import SettingsModal from '../components/SettingsModal'; 
import { useAuth } from '../context/AuthContext';
import SearchModal from '../components/SearchModal';
import FriendRequestModal from '../components/FriendRequestModal';
import api from '../api/api';
import { Phone, Video, MoreVertical, Paperclip, Smile, Mic, Send, Loader2, Trash2, X } from 'lucide-react';

const EMOJI_LIST = ['😀', '😂', '😍', '🤔', '🥳', '😭', '🤯', '😎', '👍', '👎', '❤️', '🔥', '✨', '🎉', '💡', '✅'];


const PUSHER_KEY = "5980ac2f1b1c333882d1"; 
const PUSHER_CLUSTER = "ap2"; 
const ZEGO_APP_ID = 990441467; 
const ZEGO_SERVER_SECRET = "96f56fa1ce109f77c71ba33bce375cf5"; 

const ChatPage = () => {
    const { user, logout } = useAuth();

    // UI States
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isRequestsOpen, setIsRequestsOpen] = useState(false);
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    // Data States
    const [chats, setChats] = useState([]);
    const [filterQuery, setFilterQuery] = useState('');
    const [aiInput, setAiInput] = useState('');
    const [aiMessages, setAiMessages] = useState([]);

    const [currentChat, setCurrentChat] = useState(null);
    const [currentMessages, setCurrentMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');

    // Call States (ZEGO)
    const [isInCall, setIsInCall] = useState(false);

    const [contextMenu, setContextMenu] = useState(null);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const pusherRef = useRef(null);

   
    useEffect(() => {
        if (!user) return;

        
        const pusher = new Pusher(PUSHER_KEY, {
            cluster: PUSHER_CLUSTER,
        });
        pusherRef.current = pusher;

        return () => {
            pusher.disconnect();
        };
    }, [user]);

    // --- 2. SUBSCRIBE TO CHAT ROOM ---
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

    // Filter Logic
    const filteredChats = chats.filter(chat => {
        if (!filterQuery) return true;
        const otherUser = chat.users.find(u => u._id !== user._id);
        const name = otherUser?.name?.toLowerCase() || '';
        const message = chat.latestMessage?.content?.toLowerCase() || '';
        return name.includes(filterQuery.toLowerCase()) || message.includes(filterQuery.toLowerCase());
    });

    // Fetch Messages
    useEffect(() => {
        if (currentChat) {
            const fetchMessages = async () => {
                setIsLoadingMessages(true);
                try {
                    const response = await api.get(`/message/${currentChat._id}`);
                    const messagesArray = response.data?.messages || response.data?.data?.messages;
                    setCurrentMessages(Array.isArray(messagesArray) ? messagesArray : []);
                } catch (error) {
                    console.error(error);
                    setCurrentMessages([]);
                } finally {
                    setIsLoadingMessages(false);
                }
            };
            fetchMessages();
        }
    }, [currentChat]);

    // Auto Scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentMessages]);

    // --- 3. ZEGO VIDEO CALL LOGIC ---
    const startCall = async (isVideo) => {
        if (!currentChat) return;
        
        const roomID = currentChat._id; 
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
            ZEGO_APP_ID, 
            ZEGO_SERVER_SECRET, 
            roomID, 
            user._id, 
            user.fullName
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        
        setIsInCall(true);

        zp.joinRoom({
            container: document.getElementById("call-container"),
            scenario: {
                mode: isVideo ? ZegoUIKitPrebuilt.OneONoneCall : ZegoUIKitPrebuilt.OneONoneCall, // Or GroupCall
            },
            showPreJoinView: false,
            turnOnCameraWhenJoining: isVideo,
            turnOnMicrophoneWhenJoining: true,
            onLeaveRoom: () => {
                setIsInCall(false);
            },
        });
    };

    // --- HANDLERS ---
    const handleMessageSubmit = async (e) => {
        e.preventDefault();
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
            const aiReply = response.data.reply;
            setAiMessages(prev => [...prev, { sender: 'Nova AI', content: aiReply }]);
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
        <div className="flex h-screen antialiased bg-base-200 text-base-content overflow-hidden font-sans" onClick={() => setContextMenu(null)}>

            {/* --- MODALS --- */}
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
            <FriendRequestModal isOpen={isRequestsOpen} onClose={() => setIsRequestsOpen(false)} onFriendshipChange={refreshChatList} />
            <AiAssistantModal isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} aiMessages={aiMessages} aiInput={aiInput} setAiInput={setAiInput} handleAiSubmit={handleAiSubmit} />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            <div 
                id="call-container" 
                className={`fixed inset-0 z-50 bg-black ${isInCall ? 'block' : 'hidden'}`}
            ></div>

            {/* Sidebar */}
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

            {/* Right Panel */}
            <div className="flex-1 h-full relative bg-base-100 flex flex-col">
                <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
                    backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}></div>

                {currentChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="absolute top-4 left-4 right-4 z-20">
                            <motion.div
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl p-3 flex justify-between items-center"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="avatar online">
                                        <div className="w-10 h-10 rounded-full">
                                            <img src={currentChat.users.find(u => u._id !== user._id)?.avatar || 'https://via.placeholder.com/40'} alt="user" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base-content leading-none">{currentChat.users.find(u => u._id !== user._id)?.name}</h3>
                                        <span className="text-xs text-green-500 font-medium flex items-center gap-1 mt-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Active Now
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => startCall(false)} className="btn btn-circle btn-ghost btn-sm hover:bg-base-200" title="Voice Call"><Phone size={18} /></button>
                                    <button onClick={() => startCall(true)} className="btn btn-circle btn-ghost btn-sm hover:bg-base-200" title="Video Call"><Video size={18} /></button>
                                    <button className="btn btn-circle btn-ghost btn-sm hover:bg-base-200"><MoreVertical size={18} /></button>
                                </div>
                            </motion.div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto px-4 pt-24 pb-28 custom-scrollbar space-y-2">
                            {isLoadingMessages ? (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 className="animate-spin text-primary" size={40} />
                                </div>
                            ) : (
                                currentMessages.map((msg) => {
                                    const isSender = msg.sender._id === user._id;
                                    return (
                                        <motion.div
                                            key={msg._id}
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            onContextMenu={(e) => openContextMenu(e, msg)}
                                            className={`chat ${isSender ? 'chat-end' : 'chat-start'}`}
                                        >
                                            <div className="chat-image avatar">
                                                <div className="w-8 rounded-full">
                                                    <img src={msg.sender.avatar || "https://via.placeholder.com/30"} alt="av" />
                                                </div>
                                            </div>
                                            <div className={`chat-bubble shadow-sm ${isSender ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100'}`}>
                                                {msg.content}
                                            </div>
                                            <div className="chat-footer opacity-50 text-[10px] mt-1 font-medium">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Context Menu (Delete) */}
                        {contextMenu && (
                            <div
                                className="absolute bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-2xl py-2 z-50 w-52"
                                style={{ top: contextMenu?.y, left: contextMenu?.x }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {contextMenu.isSender && (
                                    <button onClick={() => handleDeleteMessage('for_everyone')} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2">
                                        <Trash2 size={14} /> Delete for Everyone
                                    </button>
                                )}
                                <button onClick={() => handleDeleteMessage('for_me')} className="w-full text-left px-4 py-2 text-sm text-base-content hover:bg-base-200 flex items-center gap-2">
                                    <Trash2 size={14} /> Delete for Me
                                </button>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="absolute bottom-4 left-4 right-4 z-20">
                            <motion.div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/20 shadow-xl rounded-full p-2 flex items-center gap-2">
                                <button className="btn btn-circle btn-ghost btn-sm text-gray-500">
                                    <Paperclip size={20} />
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" />

                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-base-content placeholder-gray-400 px-2"
                                    onKeyDown={(e) => e.key === 'Enter' && handleMessageSubmit(e)}
                                />

                                <button onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)} className="btn btn-circle btn-ghost btn-sm text-gray-500">
                                    <Smile size={20} />
                                </button>

                                {isEmojiPickerOpen && (
                                    <div className="absolute bottom-16 right-0 bg-white dark:bg-gray-800 border rounded-2xl shadow-2xl p-3 grid grid-cols-8 gap-1 w-80">
                                        {EMOJI_LIST.map((emoji, i) => (
                                            <button key={i} onClick={() => { setMessageInput(p => p + emoji); setIsEmojiPickerOpen(false) }} className="text-xl hover:bg-gray-100 rounded p-1">{emoji}</button>
                                        ))}
                                    </div>
                                )}

                                <button onClick={handleMessageSubmit} className="btn btn-circle btn-sm btn-primary">
                                    <Send size={18} />
                                </button>
                            </motion.div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-base-200">
                        <h2 className="text-3xl font-bold text-base-content mb-2">Welcome to NovaChat</h2>
                        <p className="text-gray-500">Select a conversation to start chatting.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;