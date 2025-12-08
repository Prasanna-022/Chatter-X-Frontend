import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserCheck, UserX, Bell } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

const FriendRequestModal = ({ isOpen, onClose, onFriendshipChange }) => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        if (!isOpen || !user) return;
        setLoading(true);
        try {
            const response = await api.get('/user/friend/requests');
            setRequests(response.data.requests);
        } catch (error) {
            console.error("Failed to fetch requests:", error);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [isOpen, user]);

    const handleResponse = async (requestId, status) => {
        try {
            await api.post('/user/friend/respond', { requestId, status });
            setRequests(requests.filter(req => req._id !== requestId));
            if (status === 'accepted') {
                onFriendshipChange();
            }
        } catch (error) {
            alert(`Failed to ${status} request.`);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-white/20"
                >
                    {/* --- UNIQUE BACKGROUND IMAGE (Connection Theme) --- */}
                    <div className="absolute inset-0 z-0">
                        <img 
                            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1000&auto=format&fit=crop" 
                            alt="Background" 
                            className="w-full h-full object-cover opacity-30"
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0  from-white/80 via-white/90 to-white dark:from-gray-900/80 dark:via-gray-900/90 dark:to-gray-900 backdrop-blur-sm"></div>
                    </div>

                    {/* Content Wrapper */}
                    <div className="relative z-10 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full text-red-500">
                                    <Bell size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Notifications</h2>
                                    <p className="text-xs text-gray-500">Manage your friend requests</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-3">
                            {loading ? (
                                <p className="text-center text-gray-500 py-4">Loading...</p>
                            ) : requests.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-400 text-sm">No new notifications</p>
                                </div>
                            ) : (
                                requests.map((request) => (
                                    <motion.div 
                                        key={request._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <img src={request.sender.avatar || "https://via.placeholder.com/40"} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                                            <div>
                                                <p className="font-semibold text-gray-800 dark:text-white">{request.sender.fullName}</p>
                                                <p className="text-xs text-gray-500">wants to be your friend</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleResponse(request._id, 'accepted')}
                                                className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex justify-center items-center gap-2 transition-colors"
                                            >
                                                <UserCheck size={16} /> Accept
                                            </button>
                                            <button
                                                onClick={() => handleResponse(request._id, 'rejected')}
                                                className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium flex justify-center items-center gap-2 transition-colors"
                                            >
                                                <UserX size={16} /> Decline
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default FriendRequestModal;