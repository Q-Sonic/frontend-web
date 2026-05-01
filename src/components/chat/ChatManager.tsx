import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiX, FiChevronLeft, FiMessageCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '../Skeleton';
import { es } from 'date-fns/locale/es';

import { buildWhatsappUrl, SUPPORT_MESSAGES } from '../../config/whatsapp';

export function ChatManager() {
  const { 
    isChatOpen, 
    setIsChatOpen, 
    threads, 
    activeThread, 
    messages, 
    openThread, 
    sendMessage, 
    activeThreadId,
    loadingThreads 
  } = useChat();
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [showThreadsList, setShowThreadsList] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // If a thread is opened from outside (e.g. artist profile), hide list
  useEffect(() => {
    if (activeThreadId) {
      setShowThreadsList(false);
    }
  }, [activeThreadId]);

  if (!isChatOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;
    const content = inputValue.trim();
    setInputValue('');
    await sendMessage(content);
  };

  const getParticipantTitle = (thread: any) => {
    const otherId = thread.participants.find((p: string) => p !== user?.uid);
    return thread.participantNames[otherId] || 'Chat';
  };

  const getParticipantPhoto = (thread: any) => {
    const otherId = thread.participants.find((p: string) => p !== user?.uid);
    return thread.participantPhotos[otherId];
  };

  return (
    <div className="fixed bottom-20 right-6 z-50 w-full max-w-[360px] h-[500px] flex flex-col bg-[#0c0e12]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          {!showThreadsList && threads.length > 0 && (
            <button 
              onClick={() => setShowThreadsList(true)}
              className="p-1 hover:bg-white/10 rounded-lg text-neutral-400 transition"
            >
              <FiChevronLeft size={20} />
            </button>
          )}
          <h3 className="font-bold text-white text-sm">
            {showThreadsList ? 'Mensajes' : (activeThread ? getParticipantTitle(activeThread) : 'Chat')}
          </h3>
        </div>
        <button 
          onClick={() => setIsChatOpen(false)}
          className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-400 transition"
        >
          <FiX size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {showThreadsList ? (
          <div className="h-full overflow-y-auto p-2 space-y-1">
            {loadingThreads ? (
              <div className="space-y-2 p-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                       <Skeleton className="h-4 w-24 rounded" />
                       <Skeleton className="h-3 w-full rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-neutral-500">
                  <FiMessageCircle size={24} />
                </div>
                <p className="text-xs text-neutral-400">No tienes conversaciones activas aún.</p>
                <a 
                  href={buildWhatsappUrl(SUPPORT_MESSAGES.PRIME)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#25D366] text-black font-bold text-xs rounded-full hover:scale-105 transition-transform"
                >
                  Soporte por WhatsApp
                </a>
              </div>
            ) : (
              threads.map((t) => {
                const unread = t.unreadCount[user?.uid || ''] || 0;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      openThread(t.id);
                      setShowThreadsList(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition text-left group ${activeThreadId === t.id ? 'bg-accent/10 border border-accent/20' : 'hover:bg-white/5 border border-transparent'}`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-accent/20 border border-white/10 overflow-hidden">
                        {getParticipantPhoto(t) ? (
                          <img src={getParticipantPhoto(t)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-accent text-xs font-bold">
                            {getParticipantTitle(t).charAt(0)}
                          </div>
                        )}
                      </div>
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-[10px] text-black font-bold flex items-center justify-center rounded-full ring-2 ring-[#0c0e12]">
                          {unread}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-white text-sm truncate">{getParticipantTitle(t)}</span>
                        <span className="text-[10px] text-neutral-500 shrink-0">
                          {t.updatedAt?.seconds ? formatDistanceToNow(t.updatedAt.seconds * 1000, { addSuffix: false, locale: es }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 truncate group-hover:text-neutral-400">
                        {t.lastMessage || 'Empieza a chatear...'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500 py-10">
                  <FiClock size={32} className="opacity-20 mb-2" />
                  <p className="text-[11px]">No hay mensajes aún. ¡Sé el primero en escribir!</p>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isMe = m.senderId === user?.uid;
                  return (
                    <div key={m.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                        isMe 
                          ? 'bg-accent text-black rounded-tr-none' 
                          : 'bg-white/10 text-white rounded-tl-none border border-white/5'
                      }`}>
                        <p className="leading-relaxed">{m.content}</p>
                        <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-black/60' : 'text-neutral-500'}`}>
                          {m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Area */}
            <form 
              onSubmit={handleSend}
              className="p-3 border-t border-white/5 bg-white/[0.01]"
            >
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="w-full bg-white/[0.04] border border-white/10 rounded-full pl-4 pr-12 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-accent/50"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="absolute right-1 w-9 h-9 flex items-center justify-center rounded-full bg-accent text-black disabled:opacity-50 disabled:bg-neutral-700 transition-all hover:scale-105 active:scale-95"
                >
                  <FiSend size={16} />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
