// API Constants
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile',
  },
  FRIENDS: {
    LIST: '/api/friends',
    REQUEST: '/api/friends/request',
    ACCEPT: (id: string) => `/api/friends/request/${id}`,
    DELETE: (id: string) => `/api/friends/${id}`,
  },
  USERS: {
    SEARCH: '/api/users/search',
    INVITE_CODE: '/api/users/invite-code',
    REDEEM_INVITE: '/api/users/redeem-invite',
  },
  CONVERSATIONS: {
    LIST: '/api/conversations',
    CREATE: '/api/conversations',
    MESSAGES: (id: string) => `/api/conversations/${id}/messages`,
  },
  MESSAGES: {
    READ: (id: string) => `/api/messages/${id}/read`,
  },
  UPLOAD: '/api/upload',
} as const;

// File Upload Constants
export const FILE_UPLOAD = {
  MAX_SIZE: {
    IMAGE: 5 * 1024 * 1024, // 5MB
    PDF: 10 * 1024 * 1024,  // 10MB
    TXT: 10 * 1024 * 1024,  // 10MB
    DEFAULT: 5 * 1024 * 1024, // 5MB
  },
  ALLOWED_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    PDF: ['application/pdf'],
    TXT: ['text/plain'],
  },
  ALLOWED_EXTENSIONS: {
    IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    PDF: ['.pdf'],
    TXT: ['.txt'],
  },
} as const;

// Socket Events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // Client to Server
  JOIN_CONVERSATION: 'join_conversation',
  SEND_MESSAGE: 'send_message',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  MARK_READ: 'mark_read',
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  
  // Server to Client
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_DELIVERED: 'message_delivered',
  MESSAGE_READ: 'message_read',
  USER_TYPING: 'user_typing',
  USER_STOPPED_TYPING: 'user_stopped_typing',
  FRIEND_ONLINE: 'friend_online',
  FRIEND_OFFLINE: 'friend_offline',
  CONVERSATION_UPDATED: 'conversation_updated',
  READ_RECEIPT_UPDATED: 'read_receipt_updated',
} as const;

// UI Constants
export const UI = {
  COLORS: {
    BG_PRIMARY: '#000000',
    BG_SECONDARY: '#0a0a0a',
    BG_CARD: '#1f1f1f',
    BG_HOVER: '#2a2a2a',
    TEXT_PRIMARY: '#ffffff',
    TEXT_SECONDARY: '#a1a1aa',
    ACCENT_PRIMARY: '#fbbf24',
    ACCENT_HOVER: '#f59e0b',
    BORDER_DEFAULT: '#27272a',
    BORDER_FOCUS: '#fbbf24',
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
  },
} as const;

// Validation Constants
export const VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_]{3,20}$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    PATTERN: /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/,
  },
  DISPLAY_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
  },
  MESSAGE: {
    MAX_LENGTH: 2000,
  },
  INVITE_CODE: {
    LENGTH: 8,
    PATTERN: /^[A-Z0-9]{8}$/,
    EXPIRES_IN_DAYS: 7,
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_EXISTS: 'User already exists',
    INVALID_TOKEN: 'Invalid or expired token',
    UNAUTHORIZED: 'Unauthorized access',
  },
  VALIDATION: {
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_USERNAME: 'Username must be 3-20 characters, alphanumeric and underscores only',
    INVALID_PASSWORD: 'Password must be at least 8 characters with letters and numbers',
    REQUIRED_FIELD: 'This field is required',
  },
  FILE: {
    INVALID_TYPE: 'File type not allowed',
    TOO_LARGE: 'File size exceeds maximum limit',
    UPLOAD_FAILED: 'File upload failed',
  },
  GENERAL: {
    NETWORK_ERROR: 'Network error, please try again',
    SERVER_ERROR: 'Server error, please try again later',
    NOT_FOUND: 'Resource not found',
  },
} as const;
