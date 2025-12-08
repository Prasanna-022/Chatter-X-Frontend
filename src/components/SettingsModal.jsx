import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Camera, User, Lock, Loader2, AtSign } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

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
            
            alert("Profile Updated Successfully!");
            onClose();
        } catch (error) {
            console.error("Update failed", error);
            alert(error.response?.data?.message || "Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <User size={20} className="text-blue-600" /> Edit Profile
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition text-gray-500">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        
                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center">
                            <div className="relative group cursor-pointer">
                                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg ring-2 ring-blue-100 dark:ring-blue-900">
                                    <img src={preview || "https://via.placeholder.com/150"} alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white backdrop-blur-sm">
                                    <Camera size={28} />
                                    <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 mt-3 font-medium">Click to upload new picture</p>
                        </div>

                        {/* Inputs */}
                        <div className="space-y-4">
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Full Name" 
                                    className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-all"
                                />
                            </div>
                            
                            <div className="relative">
                                <AtSign className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Username" 
                                    className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-all"
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="New Password (leave empty to keep)" 
                                    className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-3  from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 flex justify-center items-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Save Changes</>}
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default SettingsModal;