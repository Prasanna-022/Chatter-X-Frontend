import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2, UserPlus, Shield } from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';

const FriendRequestModal = ({ isOpen, onClose, onFriendshipChange }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) fetchRequests();
    }, [isOpen]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/user/friend/requests');
            setRequests(data.requests || []);
        } catch (error) {
            console.error("Error fetching requests", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (requestId, status) => {
        try {
            await api.post('/user/friend/respond', { 
                requestId, 
                status 
            });
            
            toast.success(status === 'accepted' ? "Friend request accepted" : "Request rejected");
            setRequests((prev) => prev.filter((req) => req._id !== requestId));
            
            if (status === 'accepted' && onFriendshipChange) {
                onFriendshipChange();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
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
                                <UserPlus className="text-blue-400" size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white leading-none">Friend Requests</h2>
                                <p className="text-xs text-gray-400 mt-1">Manage your pending connections</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    
                    {/* --- Content --- */}
                    <div className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar relative z-10">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <Loader2 className="animate-spin text-blue-500" size={32} />
                                <p className="text-sm text-gray-500">Loading requests...</p>
                            </div>
                        ) : requests.length > 0 ? (
                            <div className="space-y-2 p-2">
                                {requests.map((req) => (
                                    <motion.div 
                                        key={req._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-200 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-full bg-gray-800 p-2px border border-white/10 group-hover:border-blue-500/50 transition-colors">
                                                    <img 
                                                        src={req.sender.avatar || "https://via.placeholder.com/40"} 
                                                        alt="avatar" 
                                                        className="w-full h-full rounded-full object-cover" 
                                                    />
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 bg-gray-900 rounded-full p-2px">
                                                    <Shield size={12} className="text-blue-400" />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white text-sm">{req.sender.fullName}</p>
                                                <p className="text-xs text-gray-400">@{req.sender.username}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleRespond(req._id, 'accepted')} 
                                                className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all transform hover:scale-105 active:scale-95"
                                                title="Accept"
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleRespond(req._id, 'rejected')} 
                                                className="p-2.5 rounded-full bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-500 border border-white/5 hover:border-red-500/30 transition-all transform hover:scale-105 active:scale-95"
                                                title="Decline"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                    <UserPlus size={32} className="text-gray-500 opacity-50" />
                                </div>
                                <p className="text-gray-300 font-medium">No pending requests</p>
                                <p className="text-xs text-gray-500 mt-1">New friend requests will appear here</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FriendRequestModal;