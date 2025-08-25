const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          throw new Error('Authentication failed');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication endpoints
  async register(userData: { name: string; email: string; password: string }) {
    return this.request<{ success: boolean; token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: { email: string; password: string }) {
    return this.request<{ success: boolean; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser() {
    return this.request<{ success: boolean; user: any }>('/auth/me');
  }

  // Asset endpoints
  async getAssets() {
    return this.request<{ success: boolean; data: any[]; count: number }>('/assets');
  }

  async getAsset(id: string) {
    return this.request<{ success: boolean; data: any }>(`/assets/${id}`);
  }

  async createAsset(assetData: { name: string; description?: string; ipAddress?: string; macAddress?: string; osType?: string }) {
    return this.request<{ success: boolean; data: any }>('/assets', {
      method: 'POST',
      body: JSON.stringify(assetData),
    });
  }

  async updateAsset(id: string, assetData: Partial<{ name: string; description: string; ipAddress: string; osType: string }>) {
    return this.request<{ success: boolean; data: any }>(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assetData),
    });
  }

  async deleteAsset(id: string) {
    return this.request<{ success: boolean; data: {} }>(`/assets/${id}`, {
      method: 'DELETE',
    });
  }

  // Patch endpoints
  async getPatches() {
    return this.request<{ success: boolean; data: any[]; count: number }>('/patches');
  }

  async getPatchesForAsset(assetId: string) {
    return this.request<{ success: boolean; data: any[]; count: number }>(`/patches/asset/${assetId}`);
  }

  async scanForPatches(assetId: string) {
    return this.request<{ success: boolean; data: any[]; message: string }>(`/patches/scan/${assetId}`, {
      method: 'POST',
    });
  }

  async updatePatchStatus(patchId: string, status: string) {
    return this.request<{ success: boolean; data: any }>(`/patches/${patchId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getPatchStats() {
    return this.request<{ success: boolean; data: any }>('/patches/stats');
  }

  async deletePatch(patchId: string) {
    return this.request<{ success: boolean; data: {} }>(`/patches/${patchId}`, {
      method: 'DELETE',
    });
  }

  async installPatch(patchId: string) {
    return this.request<{ success: boolean; message: string; data: any }>(`/patches/${patchId}/install`, {
      method: 'POST',
    });
  }

  async getDownloadUrl(patchId: string) {
    return this.request<{ success: boolean; data: { patch: any; downloadUrl: string; message: string } }>(`/patches/${patchId}/download-url`, {
      method: 'GET',
    });
  }

  // Agent management methods
  async getAvailableAgents() {
    return this.request<{ success: boolean; data: any[] }>('/agent/agents', {
      method: 'GET',
    });
  }

  async startAgent(agentId: string, apiKey: string) {
    return this.request<{ success: boolean; message: string }>('/agent/start', {
      method: 'POST',
      body: JSON.stringify({ agentId, apiKey }),
    });
  }

  async stopAgent(agentId: string) {
    return this.request<{ success: boolean; message: string }>('/agent/stop', {
      method: 'POST',
      body: JSON.stringify({ agentId }),
    });
  }

  async installViaAgent(agentId: string, appName: string, appId?: string, installationMethod?: string) {
    return this.request<{ success: boolean; message: string; data: any }>('/agent/install', {
      method: 'POST',
      body: JSON.stringify({ 
        agentId, 
        appName, 
        appId: appId || appName, 
        installationMethod: installationMethod || 'WINGET' 
      }),
    });
  }

  async getAgentStatus(agentId: string) {
    return this.request<{ success: boolean; data: any }>(`/agent/status?agentId=${agentId}`, {
      method: 'GET',
    });
  }

  // System info endpoints
  async getSystemInfo() {
    return this.request<{ success: boolean; data: any }>('/system-info');
  }

  async testMacAddress() {
    return this.request<{ success: boolean; macAddress: string; platform: string; interfaces: any }>('/system-info/test-mac');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);


