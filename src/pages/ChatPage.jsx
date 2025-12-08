import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatSidebar from '../components/ChatSidebar';
import AiAssistantModal from '../components/AiAssistantModal';
import SettingsModal from '../components/SettingsModal'; 
import { useAuth } from '../context/AuthContext';
import SearchModal from '../components/SearchModal';
import FriendRequestModal from '../components/FriendRequestModal';
import api from '../api/api';
import SimplePeer from 'simple-peer';
import { Phone, Video, X, MoreVertical, Paperclip, Smile, Mic, Send, Loader2, Trash2 } from 'lucide-react';

const EMOJI_LIST = ['😀', '😂', '😍', '🤔', '🥳', '😭', '🤯', '😎', '👍', '👎', '❤️', '🔥', '✨', '🎉', '💡', '✅'];

const ChatPage = () => {
    const { user, logout, socket } = useAuth();

    // UI States
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isRequestsOpen, setIsRequestsOpen] = useState(false);
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false); // <--- SETTINGS STATE
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    // Data States
    const [chats, setChats] = useState([]);
    const [filterQuery, setFilterQuery] = useState('');
    const [aiInput, setAiInput] = useState('');
    const [aiMessages, setAiMessages] = useState([]);

    const [currentChat, setCurrentChat] = useState(null);
    const [currentMessages, setCurrentMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');

    // Call States
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState({});
    const [callerSignal, setCallerSignal] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [stream, setStream] = useState(null);
    const [peer, setPeer] = useState(null);

    const [contextMenu, setContextMenu] = useState(null);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const userVideo = useRef();
    const partnerVideo = useRef();
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

   

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

    const filteredChats = chats.filter(chat => {
        if (!filterQuery) return true;
        const otherUser = chat.users.find(u => u._id !== user._id);
        const name = otherUser?.name?.toLowerCase() || '';
        const message = chat.latestMessage?.content?.toLowerCase() || '';
        return name.includes(filterQuery.toLowerCase()) || message.includes(filterQuery.toLowerCase());
    });

    useEffect(() => {
        if (currentMessages) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [currentMessages]);

    useEffect(() => {
        if (user) refreshChatList();

        if (socket && user) {
            socket.on("call_user", ({ signal, from, name }) => {
                setReceivingCall(true);
                setCaller({ name: name, from: from });
                setCallerSignal(signal);
            });
            socket.on("call_accepted", (signal) => {
                setCallAccepted(true);
                if (peer) peer.signal(signal);
            });
            socket.on("call_ended", () => {
                setCallEnded(true);
                setCallAccepted(false);
                setReceivingCall(false);
                if (peer) peer.destroy();
                if (stream) stream.getTracks().forEach(track => track.stop());
            });
            socket.on("message_received", (newMessageReceived) => {
                if (currentChat && currentChat._id === newMessageReceived.chat._id) {
                    setCurrentMessages(prev => [...prev, newMessageReceived]);
                }
                refreshChatList();
            });
        }
        return () => {
            if (socket) {
                socket.off("call_user");
                socket.off("call_accepted");
                socket.off("call_ended");
                socket.off("message_received");
            }
        };
    }, [user, socket, currentChat]);

    useEffect(() => {
        if (currentChat) {
            const fetchMessages = async () => {
                setIsLoadingMessages(true);
                try {
                    const response = await api.get(`/message/${currentChat._id}`);
                    const messagesArray = response.data?.messages || response.data?.data?.messages;
                    setCurrentMessages(Array.isArray(messagesArray) ? messagesArray : []);

                    if (socket) socket.emit("join_chat", currentChat._id);
                } catch (error) {
                    console.error(error);
                    setCurrentMessages([]);
                } finally {
                    setIsLoadingMessages(false);
                }
            };
            fetchMessages();
        }
    }, [currentChat, socket]);

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

    const handleCallUser = (isVideo) => {
        if (!currentChat || !socket) return;
        setCallEnded(false); setCallAccepted(false); setReceivingCall(false);
        const recipient = currentChat.users.find(u => u._id !== user._id);
        navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true }).then((localStream) => {
            setStream(localStream);
            if (userVideo.current) userVideo.current.srcObject = localStream;
            const newPeer = new SimplePeer({ initiator: true, trickle: false, stream: localStream });
            newPeer.on("signal", (signalData) => {
                socket.emit("call_user", { userToCall: recipient._id, signalData: signalData, from: user._id, name: user.fullName });
            });
            newPeer.on("stream", (remoteStream) => { if (partnerVideo.current) partnerVideo.current.srcObject = remoteStream; });
            setPeer(newPeer);
        }).catch((err) => { alert("Check permissions."); });
    };

    const answerCall = () => {
        setCallAccepted(true); setReceivingCall(false); setCallEnded(false);
        const recipient = currentChat.users.find(u => u._id !== user._id);
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((localStream) => {
            setStream(localStream);
            if (userVideo.current) userVideo.current.srcObject = localStream;
            const newPeer = new SimplePeer({ initiator: false, trickle: false, stream: localStream });
            newPeer.on("signal", (signalData) => { socket.emit("answer_call", { signal: signalData, to: recipient._id }); });
            newPeer.on("stream", (remoteStream) => { if (partnerVideo.current) partnerVideo.current.srcObject = remoteStream; });
            if (callerSignal) newPeer.signal(callerSignal);
            setPeer(newPeer);
        });
    };

    const leaveCall = async () => {
        const recipient = currentChat?.users.find(u => u._id !== user._id);
        if (socket && recipient) socket.emit("end_call", { to: recipient._id });

        setCallEnded(true);
        setCallAccepted(false);
        setReceivingCall(false);

        if (peer) peer.destroy();
        if (stream) stream.getTracks().forEach(track => track.stop());

        try {
            const content = "📞 Call ended";
            const response = await api.post('/message', { content, chatId: currentChat._id });
            const newMessage = response.data.data;
            socket.emit("new_message", newMessage);
            setCurrentMessages(prev => [...prev, newMessage]);
        } catch (error) {
            console.error("Failed to log call end:", error);
        }
    };

    const handleMessageSubmit = async (e) => {
        e.preventDefault();
        if (!messageInput.trim()) {
            if (!isRecording) handleStartRecording();
            else handleStopRecording();
            return;
        };
        if (!currentChat || !socket) return;
        try {
            const content = messageInput.trim();
            setMessageInput('');
            const response = await api.post('/message', { content, chatId: currentChat._id });
            const newMessage = response.data.data;
            socket.emit("new_message", newMessage);
            setCurrentMessages(prev => [...prev, newMessage]);
        } catch (error) { console.error(error); }
    };

    const openContextMenu = (e, msg) => {
        e.preventDefault();
        if (msg.content === "📞 Call ended") return;
        setContextMenu({ msgId: msg._id, isSender: msg.sender._id === user._id, x: e.clientX, y: e.clientY });
    };

    const handleDeleteMessage = async (type) => {
        if (!contextMenu) return;
        const { msgId } = contextMenu;
        
        setContextMenu(null);
        const previousMessages = [...currentMessages];
        setCurrentMessages(prev => prev.filter(msg => msg._id !== msgId));

        try {
            const response = await api.delete(`/message/${msgId}?type=${type}`);
            if (response.status !== 200) {
                setCurrentMessages(previousMessages);
                alert("Failed to delete message from server.");
            }
        } catch (error) {
            console.error(error);
            setCurrentMessages(previousMessages);
            alert("Error deleting message");
        }
    };

    const handleAttachmentClick = () => fileInputRef.current?.click();
    const handleFileChange = async (e) => { /* File logic */ };
    const handleStartRecording = () => { /* Recording Logic */ };
    const handleStopRecording = () => { /* Stop Logic */ };


    if (!user) return null;

    return (
        <div className="flex h-screen antialiased bg-base-200 text-base-content overflow-hidden font-sans" onClick={() => setContextMenu(null)}>

            {/* --- MODALS --- */}
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
            <FriendRequestModal isOpen={isRequestsOpen} onClose={() => setIsRequestsOpen(false)} onFriendshipChange={refreshChatList} />
            <AiAssistantModal isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} aiMessages={aiMessages} aiInput={aiInput} setAiInput={setAiInput} handleAiSubmit={handleAiSubmit} />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} /> {/* <--- RENDER SETTINGS */}

            {/* Call Overlay */}
            {receivingCall && !callAccepted && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-8 bg-gray-900 rounded-3xl shadow-2xl border border-white/10 text-center">
                        <div className="avatar mb-4">
                            <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 animate-pulse">
                                <img src="https://via.placeholder.com/150" alt="caller" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-6">{caller?.name || 'Unknown'} is calling...</h3>
                        <div className="flex gap-6 justify-center">
                            <button onClick={answerCall} className="btn btn-circle btn-success btn-lg shadow-lg shadow-green-500/30"><Phone className="text-white" /></button>
                            <button onClick={() => setReceivingCall(false)} className="btn btn-circle btn-error btn-lg shadow-lg shadow-red-500/30"><X className="text-white" /></button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Sidebar */}
            <ChatSidebar
                user={user}
                chats={filteredChats}
                currentChat={currentChat}
                setCurrentChat={setCurrentChat}
                onOpenSearch={() => setIsSearchOpen(true)}
                onOpenRequests={() => setIsRequestsOpen(true)}
                onOpenAi={() => setIsAiOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)} // <--- PASS HANDLER
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
                                    <button onClick={() => handleCallUser(false)} className="btn btn-circle btn-ghost btn-sm hover:bg-base-200"><Phone size={18} /></button>
                                    <button onClick={() => handleCallUser(true)} className="btn btn-circle btn-ghost btn-sm hover:bg-base-200"><Video size={18} /></button>
                                    <button className="btn btn-circle btn-ghost btn-sm hover:bg-base-200"><MoreVertical size={18} /></button>
                                </div>
                            </motion.div>
                        </div>

                        {(callAccepted || stream) && !callEnded && (
                            <div className="absolute top-20 left-4 right-4 h-64 bg-black rounded-2xl overflow-hidden z-30 shadow-2xl">
                                <video ref={partnerVideo} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover"></video>
                                <video ref={userVideo} muted autoPlay playsInline className="absolute bottom-4 right-4 w-32 h-24 border-2 border-white rounded-xl object-cover z-40 shadow-lg"></video>
                                <button onClick={leaveCall} className="absolute bottom-4 left-1/2 -translate-x-1/2 btn btn-error btn-circle shadow-lg text-white"><X /></button>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto px-4 pt-24 pb-28 custom-scrollbar space-y-2">
                            {isLoadingMessages ? (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 className="animate-spin text-primary" size={40} />
                                </div>
                            ) : (
                                currentMessages.map((msg, idx) => {
                                    const isSender = msg.sender._id === user._id;
                                    const isSystemMessage = msg.content === "📞 Call ended";

                                    if (isSystemMessage) {
                                        return (
                                            <div key={msg._id} className="flex justify-center my-4">
                                                <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-1 rounded-full text-xs font-medium shadow-sm flex items-center gap-2">
                                                    <Phone size={12} /> Call ended • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        )
                                    }

                                    return (
                                        <motion.div
                                            key={msg._id}
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ duration: 0.2 }}
                                            onContextMenu={(e) => openContextMenu(e, msg)}
                                            className={`chat ${isSender ? 'chat-end' : 'chat-start'}`}
                                        >
                                            <div className="chat-image avatar">
                                                <div className="w-8 rounded-full">
                                                    <img src={msg.sender.avatar || "https://via.placeholder.com/30"} alt="av" />
                                                </div>
                                            </div>

                                            <div className={`chat-bubble shadow-sm ${isSender
                                                ? 'bg-blue-600 text-white rounded-br-none'
                                                : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-gray-600'
                                                }`}>
                                                {msg.content.includes("[Voice Message]") ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Mic size={14} /></div>
                                                        <span>Voice Message</span>
                                                    </div>
                                                ) : msg.content}
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

                        {contextMenu && (
                            <div
                                className="absolute bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-2xl py-2 z-50 w-52"
                                style={{ top: contextMenu?.y, left: contextMenu?.x }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {contextMenu.isSender && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteMessage('for_everyone');
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium flex items-center gap-2"
                                    >
                                        <Trash2 size={14} /> Delete for Everyone
                                    </button>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteMessage('for_me');
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-base-content hover:bg-base-200 flex items-center gap-2"
                                >
                                    <Trash2 size={14} /> Delete for Me
                                </button>
                            </div>
                        )}

                        <div className="absolute bottom-4 left-4 right-4 z-20">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/20 shadow-xl rounded-full p-2 flex items-center gap-2"
                            >
                                <button onClick={handleAttachmentClick} className="btn btn-circle btn-ghost btn-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <Paperclip size={20} />
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder={isRecording ? "Recording audio..." : "Type your message..."}
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-base-content placeholder-gray-400 px-2"
                                    disabled={isRecording}
                                />

                                <button onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)} className="btn btn-circle btn-ghost btn-sm text-gray-500">
                                    <Smile size={20} />
                                </button>

                                {isEmojiPickerOpen && (
                                    <div className="absolute bottom-16 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-3 grid grid-cols-8 gap-1 w-80">
                                        {EMOJI_LIST.map((emoji, i) => (
                                            <button key={i} onClick={() => { setMessageInput(p => p + emoji); setIsEmojiPickerOpen(false) }} className="text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1">{emoji}</button>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={handleMessageSubmit}
                                    className={`btn btn-circle btn-sm ${messageInput.trim() ? 'btn-primary' : 'btn-ghost text-gray-500'} transition-all duration-200`}
                                >
                                    {messageInput.trim() ? <Send size={18} className="ml-0.5" /> : <Mic size={20} />}
                                </button>
                            </motion.div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-base-200">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="w-40 h-40 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 shadow-xl"
                        >
                            <img src="https://cdn-icons-png.flaticon.com/512/1041/1041916.png" alt="Chat" className="w-24 opacity-80" />
                        </motion.div>
                        <h2 className="text-3xl font-bold text-base-content mb-2">Welcome to NovaChat</h2>
                        <p className="text-gray-500 max-w-md">
                            Select a conversation from the sidebar or start a new one to connect with your friends instantly.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;