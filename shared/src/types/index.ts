// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  displayName: string;
  password: string;
}

export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Friend Types
export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
  requester?: User;
  addressee?: User;
}

export interface FriendRequest {
  id: string;
  from: UserProfile;
  to: UserProfile;
  status: FriendshipStatus;
  createdAt: Date;
}

// Conversation Types
export interface Conversation {
  id: string;
  participantOne: string;
  participantTwo: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
  otherParticipant?: UserProfile;
  lastMessage?: Message;
  unreadCount?: number;
}

// Message Types
export type MessageType = 'text' | 'image' | 'pdf' | 'txt' | 'other_file';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string;
  messageType: MessageType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
  isEdited: boolean;
  isRead: boolean;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  sender?: UserProfile;
}

export interface SendMessageRequest {
  conversationId: string;
  content?: string;
  messageType: MessageType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
}

// Real-time Activity Types
export type ActivityType = 'typing' | 'online' | 'offline';

export interface UserActivity {
  id: string;
  userId: string;
  conversationId?: string;
  activityType: ActivityType;
  lastActivity: Date;
  createdAt: Date;
}

// Search Types
export type SearchType = 'username' | 'email';

export interface UserSearchRequest {
  query: string;
  type: SearchType;
}

export interface UserSearchResult {
  users: UserProfile[];
  total: number;
}

// Invite Code Types
export interface InviteCode {
  code: string;
  createdBy: string;
  expiresAt: Date;
  isUsed: boolean;
  usedBy?: string;
  createdAt: Date;
}

export interface GenerateInviteCodeResponse {
  code: string;
  expiresAt: Date;
}

export interface RedeemInviteCodeRequest {
  code: string;
}

// File Upload Types
export interface FileUploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

// Socket Event Types
export interface SocketEvents {
  // Client to Server
  join_conversation: (conversationId: string) => void;
  send_message: (message: SendMessageRequest) => void;
  typing_start: (conversationId: string) => void;
  typing_stop: (conversationId: string) => void;
  mark_read: (messageId: string) => void;
  user_online: () => void;
  user_offline: () => void;

  // Server to Client
  message_received: (message: Message) => void;
  message_delivered: (messageId: string, deliveredAt: Date) => void;
  message_read: (messageId: string, readAt: Date) => void;
  user_typing: (userId: string, conversationId: string) => void;
  user_stopped_typing: (userId: string, conversationId: string) => void;
  friend_online: (userId: string) => void;
  friend_offline: (userId: string, lastSeen: Date) => void;
  conversation_updated: (conversation: Conversation) => void;
  read_receipt_updated: (messageId: string, userId: string, readAt: Date) => void;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}
