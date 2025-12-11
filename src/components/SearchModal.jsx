import React, { useState } from 'react';
import { X, Search, UserPlus, Loader2 } from 'lucide-react';
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
            // ✅ FIX: Send 'recipientUsername' exactly as backend expects
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Search Users</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-4">
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            placeholder="Search by username or email..."
                            className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    </form>

                    <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
                        {isLoading ? (
                            <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                        ) : searchResults.length > 0 ? (
                            searchResults.map((user) => (
                                <div key={user._id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                            <img src={user.avatar || "https://via.placeholder.com/40"} alt={user.username} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{user.fullName}</p>
                                            <p className="text-xs text-gray-500">@{user.username}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => sendFriendRequest(user)}
                                        disabled={sendingRequestId === user._id}
                                        className="btn btn-sm btn-primary"
                                    >
                                        {sendingRequestId === user._id ? <Loader2 className="animate-spin" size={16}/> : <UserPlus size={18} />}
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-4">No users found</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchModal;