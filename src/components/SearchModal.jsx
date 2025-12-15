import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, Loader2, User } from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';

const SearchModal = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sendingRequestId, setSendingRequestId] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        try {
            const { data } = await api.get(`/user/search?search=${searchQuery}`);
            setSearchResults(data.users || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to search users");
        } finally {
            setIsLoading(false);
        }
    };

    const sendFriendRequest = async (user) => {
        setSendingRequestId(user._id);
        try {
            await api.post('/user/friend/send', { 
                recipientUsername: user.username 
            });
            toast.success(`Request sent to ${user.username}`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send request");
        } finally {
            setSendingRequestId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="bg-gray-900/95 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* --- Decorative Backgrounds --- */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />

                    {/* --- Header --- */}
                    <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-xl relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-xl">
                                <Search className="text-blue-400" size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white leading-none">Find People</h2>
                                <p className="text-xs text-gray-400 mt-1">Search for friends by username</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-5 relative z-10">
                        {/* --- Search Input --- */}
                        <form onSubmit={handleSearch} className="relative mb-4 group">
                            <div className="absolute -inset-0.5  from-blue-500 to-purple-500 rounded-xl opacity-0 group-focus-within:opacity-50 transition duration-500 blur-sm"></div>
                            <div className="relative flex items-center bg-gray-900 border border-white/10 rounded-xl">
                                <Search className="absolute left-4 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by username or email..."
                                    className="w-full pl-11 pr-4 py-3.5 bg-transparent text-white placeholder-gray-500 focus:outline-none rounded-xl"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </form>

                        {/* --- Results List --- */}
                        <div className="mt-2 max-h-[300px] overflow-y-auto custom-scrollbar space-y-2">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <Loader2 className="animate-spin text-blue-500 mb-2" size={24} />
                                    <p className="text-xs text-gray-500">Searching...</p>
                                </div>
                            ) : searchResults.length > 0 ? (
                                searchResults.map((user) => (
                                    <motion.div 
                                        key={user._id} 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-200 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-800 p-2px border border-white/10 group-hover:border-blue-500/50 transition-colors relative overflow-hidden">
                                                {user.avatar ? (
                                                    <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400">
                                                        <User size={16} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white text-sm">{user.fullName}</p>
                                                <p className="text-xs text-gray-400">@{user.username}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => sendFriendRequest(user)}
                                            disabled={sendingRequestId === user._id}
                                            className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                                        >
                                            {sendingRequestId === user._id ? (
                                                <Loader2 className="animate-spin" size={18}/> 
                                            ) : (
                                                <UserPlus size={18} />
                                            )}
                                        </button>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-8 opacity-50">
                                    <p className="text-gray-400 text-sm">No users found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SearchModal;