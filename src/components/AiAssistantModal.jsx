import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Sparkles, User } from 'lucide-react';

const AiAssistantModal = ({ isOpen, onClose, aiMessages, aiInput, setAiInput, handleAiSubmit }) => {
    const messagesEndRef = useRef(null);
    
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [aiMessages, isOpen]);

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
                    className="w-full max-w-lg h-[600px] bg-gray-900/95 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* --- Background --- */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />

                    {/* --- Header --- */}
                    <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-xl z-10 relative">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                {/* Icon Container (Solid Blue) */}
                                <div className="relative w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg border border-white/10">
                                    <Bot className="text-white" size={24} />
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-green-500 w-3.5 h-3.5 rounded-full border-2 border-gray-900"></div>
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                    Nova AI 
                                    <Sparkles size={16} className="text-yellow-400 animate-pulse" />
                                </h3>
                                <p className="text-sm text-blue-200/70 font-medium">Always here to help</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors duration-200"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* --- Chat Area --- */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative z-0">
                        {aiMessages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-fade-in">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-2 animate-bounce">
                                    <Bot size={40} className="text-blue-400 opacity-80" />
                                </div>
                                <div className="space-y-2 max-w-xs mx-auto">
                                    <h4 className="text-xl font-semibold text-white">How can I help?</h4>
                                    <p className="text-gray-400 text-sm">I can answer questions, write code, or just chat.</p>
                                </div>
                            </div>
                        )}
                        
                        {aiMessages.map((msg, index) => {
                            const isAi = msg.sender === 'Nova AI';
                            return (
                                <motion.div 
                                    key={index} 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className={`flex w-full ${isAi ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div className={`flex max-w-[85%] ${isAi ? 'flex-row' : 'flex-row-reverse'} gap-3`}>
                                        <div className="flex mt-1">
                                            {/* Solid Blue for Bot */}
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-white/10 ${isAi ? 'bg-blue-600' : 'bg-gray-700'}`}>
                                                {isAi ? <Bot size={16} className="text-white" /> : <User size={16} className="text-gray-300" />}
                                            </div>
                                        </div>
                                        
                                        <div className={`
                                            p-4 rounded-2xl text-sm leading-relaxed shadow-md backdrop-blur-sm border
                                            ${isAi 
                                                ? 'bg-white/10 border-white/10 text-gray-100 rounded-tl-none' 
                                                : 'bg-blue-600 border-blue-500 text-white rounded-tr-none'
                                            }
                                        `}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* --- Input Area --- */}
                    <form onSubmit={handleAiSubmit} className="p-5 border-t border-white/10 bg-white/5 backdrop-blur-md z-10">
                        <div className="relative group">
                            <div className="relative flex items-center bg-gray-900 rounded-full border border-white/10 focus-within:border-white/20 transition-all duration-300">
                                <input 
                                    type="text" 
                                    value={aiInput}
                                    onChange={(e) => setAiInput(e.target.value)}
                                    placeholder="Ask Nova anything..."
                                    className="w-full bg-transparent text-white px-6 py-4 pr-14 rounded-full focus:outline-none placeholder-gray-500"
                                />
                                <button 
                                    type="submit"
                                    disabled={!aiInput.trim()} 
                                    // Solid Blue Button
                                    className="absolute right-2 p-2 bg-blue-600 rounded-full text-white shadow-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 transform active:scale-95"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AiAssistantModal;