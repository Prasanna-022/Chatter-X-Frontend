import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, Check } from 'lucide-react';
import api from '../api/api';

const SearchModal = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [statusMessage, setStatusMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setStatusMessage('');
        setLoading(true);

        try {
            const response = await api.get(`/user/search?search=${searchQuery}`);
            setSearchResults(response.data.users);
            if (response.data.users.length === 0) {
                setStatusMessage('No users found.');
            }
        } catch (error) {
            setStatusMessage('Error searching users.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendRequest = async (username) => {
        try {
            await api.post('/user/friend/send', { recipientUsername: username });
            setStatusMessage(`Request sent to ${username}.`);
            // Remove user from list to prevent double sending
            setSearchResults(searchResults.filter(user => user.username !== username)); 
        } catch (error) {
            setStatusMessage(error.response?.data?.message || 'Failed to send request.');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                {/* Modal Container */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-white/20"
                >
                    {/* --- UNIQUE BACKGROUND IMAGE (Search Theme) --- */}
                    <div className="absolute inset-0 z-0">
                        <img 
                            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop" 
                            alt="Background" 
                            className="w-full h-full object-cover opacity-30"
                        />
                        {/* Gradient Overlay for Readability */}
                        <div className="absolute inset-0  from-white/80 via-white/90 to-white dark:from-gray-900/80 dark:via-gray-900/90 dark:to-gray-900 backdrop-blur-sm"></div>
                    </div>

                    {/* Content Wrapper */}
                    <div className="relative z-10 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Find Friends</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Search users by name or email</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition text-gray-500">
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="relative mb-6">
                            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 backdrop-blur-md transition-all"
                            />
                            <button 
                                type="submit" 
                                className="absolute right-2 top-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                {loading ? '...' : 'Search'}
                            </button>
                        </form>

                        {statusMessage && (
                            <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm text-center border border-blue-100 dark:border-blue-800">
                                {statusMessage}
                            </div>
                        )}

                        {/* Results List */}
                        <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-3">
                            {searchResults.map((user) => (
                                <motion.div 
                                    key={user._id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex justify-between items-center p-3 bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-md transition-all"
                                >
                                    <div className="flex items-center space-x-3">
                                        <img 
                                            src={user.avatar || "https://via.placeholder.com/40"} 
                                            alt={user.fullName} 
                                            className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600" 
                                        />
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-100">{user.fullName}</p>
                                            <p className="text-xs text-gray-500">@{user.username}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleSendRequest(user.username)}
                                        className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full transition-colors"
                                        title="Send Request"
                                    >
                                        <UserPlus size={18} />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default SearchModal;