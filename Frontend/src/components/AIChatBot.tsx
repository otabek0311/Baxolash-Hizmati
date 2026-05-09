import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { ConfirmationModal } from './ConfirmationModal';
import { useLang } from '../context/LanguageContext';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export const AIChatBot = () => {
  const { t } = useLang();

  const [isOpen, setIsOpen] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: t('ai.greeting') },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !historyLoaded) {
      api.getChatHistory().then((history: any[]) => {
        if (history.length > 0) {
          setMessages(history.map((m: any) => ({ role: m.role, content: m.content })));
        }
        setHistoryLoaded(true);
      }).catch(() => setHistoryLoaded(true));
    }
  }, [isOpen, historyLoaded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const confirmClearHistory = async () => {
    try {
      await api.clearChatHistory();
      setMessages([{ role: 'model', content: t('ai.greeting') }]);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSendMessage = async (text?: string) => {
    const userMessage = text || input.trim();
    if (!userMessage || isLoading) return;
    if (!text) setInput('');

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { response } = await api.chat(userMessage);
      setMessages(prev => [...prev, { role: 'model', content: response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'model', content: t('ai.error') }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    t('ai.q1'),
    t('ai.q2'),
    t('ai.q3'),
    t('ai.q4'),
  ];

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-[500px]"
          >
            {/* Header */}
            <div className="bg-blue-600 p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-widest">{t('ai.title')}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold opacity-80 uppercase">{t('ai.online')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowClearModal(true)}
                  title={t('ai.clearHistory')}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
              {messages.map((message, index) => (
                <React.Fragment key={index}>
                  <motion.div
                    initial={{ opacity: 0, x: message.role === 'user' ? 10 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user'
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                          : 'bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 text-gray-500 dark:text-gray-400 shadow-sm'
                      }`}>
                        {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-100 dark:shadow-blue-900/30'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-600 rounded-tl-none shadow-sm'
                      }`}>
                        {message.content}
                      </div>
                    </div>
                  </motion.div>
                  {index === 0 && messages.length === 1 && (
                    <div className="flex flex-wrap gap-2 mt-4 px-2">
                      {quickQuestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(q)}
                          className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-blue-100 dark:border-blue-800 text-[10px] font-bold text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors shadow-sm"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 items-center bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 p-3 rounded-2xl rounded-tl-none shadow-sm">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('ai.typing')}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={e => { e.preventDefault(); handleSendMessage(); }}
              className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700"
            >
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={t('ai.placeholder')}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-2xl py-3 pl-4 pr-12 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-gray-600 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-blue-100 dark:shadow-blue-900/30"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            <ConfirmationModal
              isOpen={showClearModal}
              onClose={() => setShowClearModal(false)}
              onConfirm={confirmClearHistory}
              title={t('ai.clearConfirmTitle')}
              message={t('ai.clearConfirmMsg')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:bg-blue-700 transition-colors relative group"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white dark:border-gray-900 rounded-full" />
        <div className="absolute right-full mr-4 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {t('ai.help')}
        </div>
      </motion.button>
    </div>
  );
};
