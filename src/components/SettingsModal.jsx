import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Camera, User, Lock, Loader2, AtSign } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SettingsModal = ({ isOpen, onClose }) => {
    const { user, handleAuthSuccess } = useAuth();
    
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [username, setUsername] = useState(user?.username || '');
    const [password, setPassword] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [preview, setPreview] = useState(user?.avatar);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('fullName', fullName);
        formData.append('username', username);
        if (password) formData.append('password', password);
        if (avatarFile) formData.append('avatar', avatarFile);

        try {
            const response = await api.put('/user/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            
            handleAuthSuccess(response.data);
            toast.success("Profile Updated Successfully!");
            onClose();
        } catch (error) {
            console.error("Update failed", error);
            toast.error(error.response?.data?.message || "Failed to update profile.");
        } finally {
            setLoading(false);
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
                    className="w-full max-w-md bg-gray-900/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Decorative Backgrounds */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />

                    {/* Header */}
                    <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-xl relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600/20 rounded-xl">
                                <User className="text-blue-400" size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-white">Edit Profile</h2>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6 relative z-10">
                        
                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center">
                            <div className="relative group cursor-pointer">
                                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-800 shadow-xl ring-2 ring-blue-500/30 group-hover:ring-blue-500 transition-all duration-300">
                                    <img 
                                        src={preview || "https://via.placeholder.com/150"} 
                                        alt="Avatar" 
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                                    />
                                </div>
                                <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer text-white backdrop-blur-sm">
                                    <Camera size={28} className="drop-shadow-lg" />
                                    <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
                                </label>
                            </div>
                            <p className="text-xs text-gray-400 mt-3 font-medium">Click to upload new picture</p>
                        </div>

                        {/* Inputs */}
                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                                </div>
                                <input 
                                    type="text" 
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Full Name" 
                                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none text-white placeholder-gray-500 transition-all"
                                />
                            </div>
                            
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <AtSign className="text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                                </div>
                                <input 
                                    type="text" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Username" 
                                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none text-white placeholder-gray-500 transition-all"
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                                </div>
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="New Password (leave empty to keep)" 
                                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none text-white placeholder-gray-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 flex justify-center items-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Save Changes</>}
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SettingsModal;