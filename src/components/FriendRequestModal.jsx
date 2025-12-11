import React, { useEffect, useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Friend Requests</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-4 max-h-80 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-4"><Loader2 className="animate-spin" /></div>
                    ) : requests.length > 0 ? (
                        requests.map((req) => (
                            <div key={req._id} className="flex items-center justify-between p-3 border-b dark:border-gray-700 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                        <img src={req.sender.avatar || "https://via.placeholder.com/40"} alt="avatar" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{req.sender.fullName}</p>
                                        <p className="text-xs text-gray-500">@{req.sender.username}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleRespond(req._id, 'accepted')} className="btn btn-sm btn-circle btn-primary">
                                        <Check size={16} />
                                    </button>
                                    <button onClick={() => handleRespond(req._id, 'rejected')} className="btn btn-sm btn-circle btn-ghost text-red-500 bg-red-50">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-4">No pending requests</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FriendRequestModal;