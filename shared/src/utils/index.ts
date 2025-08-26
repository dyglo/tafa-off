// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUsername = (username: string): boolean => {
  // Username: 3-20 characters, alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

export const isValidPassword = (password: string): boolean => {
  // Password: minimum 8 characters, at least one letter and one number
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
};

// File utilities
export const getFileTypeFromMimeType = (mimeType: string): 'image' | 'pdf' | 'txt' | 'other_file' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'text/plain') return 'txt';
  return 'other_file';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const isAllowedFileType = (mimeType: string): boolean => {
  const allowedTypes = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain'
  ];
  return allowedTypes.includes(mimeType);
};

export const getMaxFileSize = (mimeType: string): number => {
  if (mimeType.startsWith('image/')) return 5 * 1024 * 1024; // 5MB for images
  if (mimeType === 'application/pdf' || mimeType === 'text/plain') {
    return 10 * 1024 * 1024; // 10MB for PDFs and text files
  }
  return 5 * 1024 * 1024; // Default 5MB
};

// Date utilities
export const formatMessageTime = (date: Date): string => {
  const now = new Date();
  const messageDate = new Date(date);
  const diffInMs = now.getTime() - messageDate.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const diffInDays = diffInHours / 24;

  if (diffInHours < 24) {
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInDays < 7) {
    return messageDate.toLocaleDateString([], { weekday: 'short' });
  } else {
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

export const formatLastSeen = (date: Date): string => {
  const now = new Date();
  const lastSeen = new Date(date);
  const diffInMs = now.getTime() - lastSeen.getTime();
  const diffInMinutes = diffInMs / (1000 * 60);
  const diffInHours = diffInMinutes / 60;
  const diffInDays = diffInHours / 24;

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m ago`;
  if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
  if (diffInDays < 7) return `${Math.floor(diffInDays)}d ago`;
  return lastSeen.toLocaleDateString();
};

// ID generation utilities
export const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Text utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};
