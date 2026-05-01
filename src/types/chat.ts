import type { Timestamp } from 'firebase/firestore';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  content: string;
  timestamp: Timestamp | string | number | any;
  read: boolean;
}

export interface ChatThread {
  id: string;
  /** IDs of participants [artistId, clientId] */
  participants: string[];
  /** Latest message summary for previews */
  lastMessage?: string;
  /** Firestore timestamp */
  updatedAt: Timestamp | string | number | any;
  /** Metadata to avoid extra lookups */
  participantNames: Record<string, string>;
  participantPhotos: Record<string, string>;
  /** Unread counts per participant */
  unreadCount: Record<string, number>;
}

export interface CreateMessagePayload {
  threadId: string;
  content: string;
}
