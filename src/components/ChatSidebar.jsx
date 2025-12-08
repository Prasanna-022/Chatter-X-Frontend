import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, LogOut, MessageSquare, Bot, Settings } from 'lucide-react';

const ChatSidebar = ({ 
    user, 
    chats, 
    currentChat, 
    setCurrentChat, 
    onOpenSearch, 
    onOpenRequests, 
    onOpenAi,
    onOpenSettings, 
    logout,
    onlineUsers = [],
}) => {
    
    return (
        <div className="w-full md:w-80 h-full flex flex-col glass-panel border-r border-white/10 relative z-20 bg-base-100/80 backdrop-blur-xl">
           
            <div className="p-6 pb-4 border-b border-base-300">
                
                <div className="flex items-center gap-3 mb-4">
                    
                    <div className="avatar online placeholder cursor-pointer hover:opacity-80 transition" onClick={onOpenSettings}>
                        <div className="bg-neutral text-neutral-content rounded-full w-12 ring ring-primary ring-offset-base-100 ring-offset-2 shadow-md">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="profile" />
                            ) : (
                                <span className="text-xl">{user?.fullName?.[0]}</span>
                            )}
                        </div>
                    </div>

                    
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-base-content leading-tight truncate">
                            {user?.fullName}
                        </h2>
                        <p className="text-xs text-primary font-medium truncate">@ {user?.username}</p>
                    </div>

                    <button 
                        onClick={onOpenSettings} 
                        className="btn btn-sm btn-ghost btn-circle hover:bg-base-200 transition text-base-content/60" 
                        title="Settings"
                    >
                         <Settings size={20} />
                    </button>
                </div>
                <div className="flex gap-2">
                    <button onClick={onOpenSearch} className="btn btn-sm btn-outline flex-1 gap-2">
                        <Search size={16} /> Find
                    </button>
                    
                    <button onClick={onOpenRequests} className="btn btn-sm btn-ghost btn-circle relative hover:bg-base-200">
                        <Bell size={20} />
                    </button>
                    
                    <button 
                        onClick={onOpenAi} 
                        className="btn btn-sm btn-primary btn-circle shadow-lg shadow-primary/40 animate-pulse hover:animate-none text-white"
                        title="Nova AI"
                    >
                        <Bot size={20} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
                <h3 className="text-xs font-bold text-base-content/50 px-4 uppercase tracking-wider mb-2 mt-2">
                    Messages
                </h3>

                {chats.length === 0 ? (
                    <div className="text-center mt-10 opacity-50">
                        <MessageSquare size={40} className="mx-auto mb-2" />
                        <p className="text-sm">No chats yet</p>
                    </div>
                ) : (
                    chats.map((chat, index) => {
                        const otherUser = chat.users.find(u => u._id !== user._id);
                        const isActive = currentChat?._id === chat._id;

                        return (
                            <motion.div
                                key={chat._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => setCurrentChat(chat)}
                                className={`
                                    flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200
                                    ${isActive 
                                        ? 'bg-primary text-primary-content shadow-lg shadow-primary/30' 
                                        : 'hover:bg-base-200'
                                    }
                                `}
                            >
                                <div className={`avatar ${onlineUsers.includes(otherUser?._id) ? 'online' : ''}`}>
                                    <div className="w-12 h-12 rounded-full border border-base-300">
                                        <img src={otherUser?.avatar || 'https://via.placeholder.com/40'} alt="user" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <h4 className={`font-semibold truncate ${isActive ? 'text-primary-content' : 'text-base-content'}`}>
                                            {otherUser?.name}
                                        </h4>
                                    </div>
                                    <p className={`text-xs truncate opacity-80 ${isActive ? 'text-primary-content' : 'text-base-content/60'}`}>
                                        {chat.latestMessage?.content || "Start a conversation..."}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-base-300">
                <button 
                    onClick={logout} 
                    className="btn btn-error btn-outline btn-block btn-sm gap-2"
                >
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </div>
    );
};

export default ChatSidebar;