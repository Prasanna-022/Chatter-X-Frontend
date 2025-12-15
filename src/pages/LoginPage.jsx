import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2, User, Mail, Lock, Camera, Palette, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/api';

const THEMES = [
    { name: 'light', icon: '☀️' },
    { name: 'dark', icon: '🌙' },
    { name: 'synthwave', icon: '🌆' },
    { name: 'retro', icon: '📼' },
    { name: 'aqua', icon: '💧' },
];

const LoginPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    
    const [formData, setFormData] = useState({ fullName: '', username: '', email: '', password: '' });
    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    const { login, handleAuthSuccess } = useAuth();

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        return () => {
            if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        };
    }, [avatarPreview]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatar(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                // Your AuthContext handles the login API call
                await login({ email: formData.email, password: formData.password });
                toast.success("Welcome back!");
            } else {
                // Registration Logic
                const registerData = new FormData();
                registerData.append('fullName', formData.fullName);
                registerData.append('username', formData.username);
                registerData.append('email', formData.email);
                registerData.append('password', formData.password);
                
                if (avatar) {
                    registerData.append('avatar', avatar);
                } else {
                    toast.error("Please select an avatar image");
                    setLoading(false);
                    return;
                }

                // Call API
                const response = await api.post('/user/register', registerData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                // RESPONSE HANDLING FIX:
                // We extract the user. The cookie is set automatically by the backend.
                const userData = response.data.user; 
                
                handleAuthSuccess(userData);
                toast.success("Account created successfully!");
            }
        } catch (err) {
            console.error(err);
            const msg = typeof err === 'string' ? err : (err.response?.data?.message || "Authentication failed");
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-base-200 relative overflow-hidden transition-colors duration-500">
            {/* Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/30 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/30 rounded-full blur-[100px] animate-pulse delay-1000"></div>

            {/* Theme Toggle */}
            <div className="absolute top-6 right-6 z-50 dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-circle btn-ghost bg-base-100/50 backdrop-blur-md border border-white/10 shadow-lg">
                    <Palette size={20} />
                </div>
                <ul tabIndex={0} className="dropdown-content menu p-2 shadow-2xl bg-base-100 rounded-box w-52 border border-base-300 mt-2">
                    {THEMES.map((t) => (
                        <li key={t.name}>
                            <button onClick={() => setTheme(t.name)} className={`flex justify-between ${theme === t.name ? 'active' : ''}`}>
                                <span className="capitalize">{t.name}</span>
                                <span>{t.icon}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Main Card */}
            <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-5xl h-[650px] bg-base-100/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex flex-col md:flex-row relative z-10"
            >
                {/* Form Section */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-black  from-primary to-secondary bg-clip-text text-transparent mb-2">
                            NovaChat
                        </h1>
                        <p className="text-base-content/60">
                            {isLogin ? 'Welcome back! Please enter your details.' : 'Create an account to start chatting.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 z-10">
                        <AnimatePresence mode='wait'>
                            {!isLogin && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }} 
                                    animate={{ opacity: 1, height: 'auto' }} 
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4 overflow-hidden"
                                >
                                    <div className="flex justify-center mb-4">
                                        <div className="relative group cursor-pointer">
                                            <div className="w-20 h-20 rounded-full bg-base-300 flex items-center justify-center overflow-hidden border-2 border-primary/50">
                                                {avatarPreview ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" /> : <User size={32} className="opacity-50"/>}
                                            </div>
                                            <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-full transition-opacity cursor-pointer">
                                                <Camera className="text-white" size={20} />
                                                <input type="file" className="hidden" onChange={handleAvatarChange} accept="image/*" />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="input input-bordered flex items-center gap-2 bg-base-200/50 focus-within:bg-base-100 transition-colors">
                                            <User size={18} className="opacity-50" />
                                            <input type="text" name="fullName" className="grow" placeholder="Full Name" onChange={handleChange} />
                                        </label>
                                        <label className="input input-bordered flex items-center gap-2 bg-base-200/50 focus-within:bg-base-100 transition-colors">
                                            <span className="opacity-50 font-bold">@</span>
                                            <input type="text" name="username" className="grow" placeholder="Username" onChange={handleChange} />
                                        </label>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <label className="input input-bordered flex items-center gap-2 bg-base-200/50 focus-within:bg-base-100 transition-colors">
                            <Mail size={18} className="opacity-50" />
                            <input type="email" name="email" className="grow" placeholder="Email Address" onChange={handleChange} required />
                        </label>

                        <label className="input input-bordered flex items-center gap-2 bg-base-200/50 focus-within:bg-base-100 transition-colors">
                            <Lock size={18} className="opacity-50" />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                name="password" 
                                className="grow" 
                                placeholder="Password" 
                                onChange={handleChange} 
                                required 
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-primary transition-colors">
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </label>

                        {isLogin && (
                            <div className="flex justify-end">
                                <a href="#" className="text-xs link link-hover link-primary font-medium">Forgot password?</a>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="btn btn-primary w-full shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 text-lg"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>

                    <div className="divider text-xs opacity-50 my-6">OR CONTINUE WITH</div>

                    <p className="text-center mt-8 text-sm">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button 
                            onClick={() => setIsLogin(!isLogin)} 
                            className="link link-primary font-bold hover:scale-105 transition-transform inline-block"
                        >
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </button>
                    </p>
                </div>

                {/* Decorative Side */}
                <div className="hidden md:flex w-1/2 relative  from-primary to-secondary items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>
                    <div className="relative z-10 text-white text-center p-10">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mb-6"
                        >
                            <div className="w-24 h-24 bg-white/20 rounded-3xl mx-auto backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl rotate-12 hover:rotate-0 transition-transform duration-500">
                                <Globe size={48} className="text-white" />
                            </div>
                        </motion.div>
                        <h2 className="text-3xl font-bold mb-4 drop-shadow-lg">Connect with the World</h2>
                        <p className="text-lg opacity-90 max-w-sm mx-auto font-light">
                            Experience real-time messaging, AI assistance, and seamless video calls in one beautiful platform.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;