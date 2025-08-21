import { apiClient } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export class AuthService {
  private static instance: AuthService;
  private user: User | null = null;
  private listeners: ((state: AuthState) => void)[] = [];

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getState(): AuthState {
    return {
      user: this.user,
      isAuthenticated: !!this.user,
      isLoading: false,
    };
  }

  async login(email: string, password: string): Promise<User> {
    try {
      const response = await apiClient.login({ email, password });
      if (response.success) {
        apiClient.setToken(response.token);
        this.user = response.user;
        this.notifyListeners();
        return response.user;
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(name: string, email: string, password: string): Promise<User> {
    try {
      const response = await apiClient.register({ name, email, password });
      if (response.success) {
        apiClient.setToken(response.token);
        this.user = response.user;
        this.notifyListeners();
        return response.user;
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    apiClient.clearToken();
    this.user = null;
    this.notifyListeners();
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = apiClient.getToken();
      if (!token) {
        return null;
      }

      const response = await apiClient.getCurrentUser();
      if (response.success) {
        this.user = response.user;
        this.notifyListeners();
        return response.user;
      } else {
        this.logout();
        return null;
      }
    } catch (error) {
      console.error('Get current user error:', error);
      this.logout();
      return null;
    }
  }

  async initialize(): Promise<void> {
    const token = apiClient.getToken();
    if (token) {
      await this.getCurrentUser();
    }
  }
}

export const authService = AuthService.getInstance();
