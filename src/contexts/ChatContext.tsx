import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { chatService } from '../api/chatService';
import type { ChatThread, ChatMessage } from '../types/chat';

interface ChatContextValue {
  threads: ChatThread[];
  activeThreadId: string | null;
  activeThread: ChatThread | null;
  messages: ChatMessage[];
  loadingThreads: boolean;
  isChatOpen: boolean;
  openThread: (threadId: string) => void;
  startThreadWithArtist: (artistId: string, artistName: string, artistPhoto?: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  closeChat: () => void;
  setIsChatOpen: (open: boolean) => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Subscribe to threads
  useEffect(() => {
    if (!user?.uid) {
      setThreads([]);
      setLoadingThreads(false);
      return;
    }
    const unsub = chatService.subscribeToThreads(user.uid, (data) => {
      setThreads(data);
      setLoadingThreads(false);
    });
    return () => unsub();
  }, [user?.uid]);

  // Subscribe to messages
  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }
    const unsub = chatService.subscribeToMessages(activeThreadId, setMessages);
    return () => unsub();
  }, [activeThreadId]);

  const activeThread = threads.find((t) => t.id === activeThreadId) || null;

  const openThread = (threadId: string) => {
    setActiveThreadId(threadId);
    setIsChatOpen(true);
    if (user?.uid) {
      chatService.markAsRead(threadId, user.uid);
    }
  };

  const startThreadWithArtist = async (artistId: string, artistName: string, artistPhoto?: string) => {
    if (!user?.uid) return;
    const threadId = await chatService.getOrCreateThread(
      artistId,
      user.uid,
      { name: artistName, photo: artistPhoto },
      { name: user.displayName || 'Cliente', photo: user.photoURL || '' }
    );
    openThread(threadId);
  };

  const sendMessage = async (content: string) => {
    if (!activeThreadId || !user?.uid || !activeThread) return;
    const recipientId = activeThread.participants.find((p) => p !== user.uid);
    if (!recipientId) return;
    
    await chatService.sendMessage(
      activeThreadId,
      user.uid,
      user.displayName || 'Usuario',
      content,
      recipientId
    );
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  return (
    <ChatContext.Provider
      value={{
        threads,
        activeThreadId,
        activeThread,
        messages,
        loadingThreads,
        isChatOpen,
        openThread,
        startThreadWithArtist,
        sendMessage,
        closeChat,
        setIsChatOpen,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
