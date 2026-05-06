import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDocs,
  limit,
  setDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ChatMessage, ChatThread } from '../types/chat';

const THREADS_COLLECTION = 'chat_threads';
const MESSAGES_SUB_COLLECTION = 'messages';

export const chatService = {
  /**
   * Listen to active threads for a specific user (either artist or client).
   */
  subscribeToThreads: (userId: string, callback: (threads: ChatThread[]) => void) => {
    const q = query(
      collection(db, THREADS_COLLECTION),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const threads = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatThread);
      callback(threads);
    });
  },

  /**
   * Listen to messages in a specific thread.
   */
  subscribeToMessages: (threadId: string, callback: (messages: ChatMessage[]) => void) => {
    const q = query(
      collection(db, THREADS_COLLECTION, threadId, MESSAGES_SUB_COLLECTION),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatMessage);
      callback(messages);
    });
  },

  /**
   * Sends a message to a thread and updates the thread's last message and timestamp.
   */
  sendMessage: async (
    threadId: string,
    senderId: string,
    senderName: string,
    content: string,
    recipientId: string
  ) => {
    const msgData = {
      senderId,
      senderName,
      content,
      read: false,
      timestamp: serverTimestamp(),
    };

    await addDoc(collection(db, THREADS_COLLECTION, threadId, MESSAGES_SUB_COLLECTION), msgData);

    await updateDoc(doc(db, THREADS_COLLECTION, threadId), {
      lastMessage: content,
      updatedAt: serverTimestamp(),
      [`unreadCount.${recipientId}`]: (currentCount: number = 0) => currentCount + 1,
    });
  },

  /**
   * Finds or creates a thread between two users.
   */
  getOrCreateThread: async (
    artistId: string,
    clientId: string,
    artistData: { name: string; photo?: string },
    clientData: { name: string; photo?: string }
  ): Promise<string> => {
    // Participants are [artistId, clientId] sorted to ensure uniqueness
    const participants = [artistId, clientId].sort();
    
    const q = query(
      collection(db, THREADS_COLLECTION),
      where('participants', '==', participants),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }

    // Create new thread
    const newThreadRef = doc(collection(db, THREADS_COLLECTION));
    const newThread: Omit<ChatThread, 'id'> = {
      participants,
      participantNames: {
        [artistId]: artistData.name,
        [clientId]: clientData.name,
      },
      participantPhotos: {
        [artistId]: artistData.photo || '',
        [clientId]: clientData.photo || '',
      },
      unreadCount: {
        [artistId]: 0,
        [clientId]: 0,
      },
      updatedAt: serverTimestamp(),
    };

    await setDoc(newThreadRef, newThread);
    return newThreadRef.id;
  },

  /**
   * Marks a thread as read for a specific user.
   */
  markAsRead: async (threadId: string, userId: string) => {
    await updateDoc(doc(db, THREADS_COLLECTION, threadId), {
      [`unreadCount.${userId}`]: 0,
    });
  },
};
