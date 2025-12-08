import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Sparkles } from 'lucide-react';

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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full max-w-lg h-[600px] bg-gray-900/90 border border-blue-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
                >
                   
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none"></div>

                    
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Bot className="text-white" size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                    Nova AI <Sparkles size={14} className="text-yellow-400" />
                                </h3>
                                <p className="text-xs text-blue-200">Your intelligent assistant</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {aiMessages.length === 0 && (
                            <div className="text-center mt-20 text-gray-500">
                                <Bot size={48} className="mx-auto mb-4 opacity-50" />
                                <p>Hello! I am Nova.</p>
                                <p className="text-sm">Ask me anything...</p>
                            </div>
                        )}
                        
                        {aiMessages.map((msg, index) => (
                            <div key={index} className={`chat ${msg.sender === 'Nova AI' ? 'chat-start' : 'chat-end'}`}>
                                <div className="chat-image avatar">
                                    <div className="w-8 rounded-full bg-gray-700 flex items-center justify-center">
                                        {msg.sender === 'Nova AI' ? <Bot size={16} className="text-blue-400 m-auto mt-2" /> : <span className="text-xs text-white flex items-center justify-center h-full">You</span>}
                                    </div>
                                </div>
                                <div className={`chat-bubble ${msg.sender === 'Nova AI' ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30' : 'bg-gray-700 text-white'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleAiSubmit} className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md z-10">
                        <div className="relative">
                            <input 
                                type="text" 
                                value={aiInput}
                                onChange={(e) => setAiInput(e.target.value)}
                                placeholder="Ask something..."
                                className="w-full bg-gray-800/50 text-white border border-white/10 rounded-full px-5 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-gray-500"
                            />
                            <button 
                                type="submit"
                                disabled={!aiInput.trim()} 
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-full text-white hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AiAssistantModal;