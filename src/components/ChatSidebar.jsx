import React from 'react';
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
        <div className="w-full md:w-80 h-full flex flex-col border-r border-white/10 relative z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl">
           
            {/* --- Header Section --- */}
            <div className="p-5 pb-4 border-b border-gray-200 dark:border-white/5">
                
                <div className="flex items-center gap-4 mb-5 group">
                    <div 
                        className="relative cursor-pointer transition-transform duration-300 hover:scale-105" 
                        onClick={onOpenSettings}
                    >
                        {/* Solid Blue Ring */}
                        <div className="relative w-12 h-12 rounded-full p-2px bg-blue-500">
                            <div className="w-full h-full rounded-full overflow-hidden border-2 border-white dark:border-gray-900 bg-gray-200">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 font-bold">
                                        {user?.fullName?.[0]}
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Online Dot */}
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm"></div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white leading-tight truncate">
                            {user?.fullName}
                        </h2>
                        <p className="text-xs text-blue-500 font-medium truncate opacity-80 group-hover:opacity-100 transition-opacity">
                            @{user?.username}
                        </p>
                    </div>

                    <button 
                        onClick={onOpenSettings} 
                        className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-white/5 rounded-full transition-all duration-200" 
                        title="Settings"
                    >
                         <Settings size={20} />
                    </button>
                </div>

                {/* --- Action Buttons --- */}
                <div className="flex gap-2">
                    <button 
                        onClick={onOpenSearch} 
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 text-sm font-medium py-2 rounded-xl transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                    >
                        <Search size={16} /> Find
                    </button>
                    
                    <button 
                        onClick={onOpenRequests} 
                        className="p-2 bg-gray-100 dark:bg-white/5 hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 rounded-xl transition-all duration-200 relative"
                        title="Notifications"
                    >
                        <Bell size={20} />
                    </button>
                    
                    <button 
                        onClick={onOpenAi} 
                        // Solid Blue Button
                        className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:scale-105"
                        title="Nova AI"
                    >
                        <Bot size={20} />
                    </button>
                </div>
            </div>

            {/* --- Chat List --- */}
            <div className="flex-1 overflow-y-auto px-3 py-3 custom-scrollbar space-y-1">
                <div className="flex items-center justify-between px-2 mb-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Messages
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                        {chats.length}
                    </span>
                </div>

                <AnimatePresence>
                    {chats.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center mt-12 opacity-50 space-y-3"
                        >
                            <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center">
                                <MessageSquare size={32} className="text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-500">No chats yet</p>
                        </motion.div>
                    ) : (
                        chats.map((chat, index) => {
                            const otherUser = chat.users.find(u => u._id !== user._id);
                            const isActive = currentChat?._id === chat._id;
                            const isOnline = onlineUsers.includes(otherUser?._id);

                            return (
                                <motion.div
                                    key={chat._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => setCurrentChat(chat)}
                                    className={`
                                        group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent
                                        ${isActive 
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-500/30 shadow-sm' 
                                            : 'hover:bg-gray-100 dark:hover:bg-white/5'
                                        }
                                    `}
                                >
                                    <div className="relative">
                                        {/* Solid Blue on Hover */}
                                        <div className="w-12 h-12 rounded-full p-2px bg-transparent group-hover:bg-blue-400 transition-all duration-300">
                                            <img 
                                                src={otherUser?.avatar || 'https://via.placeholder.com/40'} 
                                                alt="user" 
                                                className="w-full h-full rounded-full object-cover border-2 border-white dark:border-gray-900" 
                                            />
                                        </div>
                                        {isOnline && (
                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm"></span>
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h4 className={`font-semibold text-sm truncate transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                                                {otherUser?.name}
                                            </h4>
                                        </div>
                                        <p className={`text-xs truncate transition-colors ${isActive ? 'text-blue-500/80 dark:text-blue-300/80' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {chat.latestMessage?.content || "Start a conversation..."}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

            {/* --- Footer --- */}
            <div className="p-4 border-t border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 backdrop-blur-sm">
                <button 
                    onClick={logout} 
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all duration-200 text-sm font-medium"
                >
                    <LogOut size={18} /> 
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
};

export default ChatSidebar;