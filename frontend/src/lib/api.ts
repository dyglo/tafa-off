import axios, { AxiosInstance, AxiosError } from 'axios';
import type { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  RefreshTokenRequest,
  ApiResponse 
} from '@toff/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<AuthResponse> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshAccessToken();
            const token = this.getAccessToken();
            if (token && originalRequest) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.logout();
            throw refreshError;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  private setTokens(accessToken: string, refreshToken: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearTokens() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async refreshAccessToken(): Promise<AuthResponse> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = this.client
      .post<ApiResponse<AuthResponse>>('/api/auth/refresh', { refreshToken })
      .then((response) => {
        const authData = response.data.data!;
        this.setTokens(authData.accessToken, authData.refreshToken);
        return authData;
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  // Auth methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>(
      '/api/auth/login',
      credentials
    );
    
    const authData = response.data.data!;
    this.setTokens(authData.accessToken, authData.refreshToken);
    return authData;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>(
      '/api/auth/register',
      userData
    );
    
    const authData = response.data.data!;
    this.setTokens(authData.accessToken, authData.refreshToken);
    return authData;
  }

  async logout(): Promise<void> {
    try {
      // Only call logout API if we have a valid token
      const token = this.getAccessToken();
      if (token) {
        await this.client.post('/api/auth/logout');
      }
    } catch (error) {
      // Continue with logout even if API call fails (normal during development)
      console.debug('Logout API call failed (expected during development):', error.message);
    } finally {
      this.clearTokens();
    }
  }

  async getProfile() {
    const response = await this.client.get('/api/auth/profile');
    return response.data.data;
  }

  async updateProfile(data: { displayName?: string; avatarUrl?: string }) {
    const response = await this.client.put('/api/auth/profile', data);
    return response.data.data;
  }

  // Friends methods
  async getFriends() {
    const response = await this.client.get('/api/friends');
    return response.data.data;
  }

  async sendFriendRequest(addresseeId: string) {
    const response = await this.client.post('/api/friends/request', { addresseeId });
    return response.data.data;
  }

  async respondToFriendRequest(requestId: string, status: 'accepted' | 'declined') {
    const response = await this.client.put(`/api/friends/request/${requestId}`, { status });
    return response.data.data;
  }

  async removeFriend(friendshipId: string) {
    const response = await this.client.delete(`/api/friends/${friendshipId}`);
    return response.data;
  }

  // User search methods
  async searchUsers(query: string, type: 'username' | 'email') {
    const response = await this.client.get('/api/users/search', {
      params: { q: query, type },
    });
    return response.data.data;
  }

  async generateInviteCode() {
    const response = await this.client.post('/api/users/invite-code');
    return response.data.data;
  }

  async redeemInviteCode(code: string) {
    const response = await this.client.post('/api/users/redeem-invite', { code });
    return response.data.data;
  }

  // Conversations methods
  async getConversations() {
    const response = await this.client.get('/api/conversations');
    return response.data.data;
  }

  async createConversation(participantId: string) {
    const response = await this.client.post('/api/conversations', { participantId });
    return response.data.data;
  }

  async getMessages(conversationId: string, page = 1, limit = 50) {
    const response = await this.client.get(`/api/conversations/${conversationId}/messages`, {
      params: { page, limit },
    });
    return response.data.data;
  }

  async sendMessage(conversationId: string, data: {
    content?: string;
    messageType: 'text' | 'image' | 'pdf' | 'txt' | 'other_file';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileMimeType?: string;
  }) {
    const response = await this.client.post(
      `/api/conversations/${conversationId}/messages`,
      data
    );
    return response.data.data;
  }

  async markMessageAsRead(messageId: string) {
    const response = await this.client.put(`/api/messages/${messageId}/read`);
    return response.data;
  }

  // File upload
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  getCurrentUser() {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  setCurrentUser(user: any) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
}

export const apiClient = new ApiClient();
