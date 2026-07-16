import type { Bet, Match, User } from '@/types';

const API_BASE = import.meta.env.VITE_API_BASE || '';
const TOKEN_STORAGE_KEY = 'ranking_admin_token';

let adminToken: string | null = localStorage.getItem(TOKEN_STORAGE_KEY);

export const setAdminToken = (token: string | null) => {
  adminToken = token;
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

export const getAdminToken = () => adminToken;

export interface ServerData {
  users: User[];
  bets: Bet[];
  matches: Match[];
  apiKey?: string;
  competition?: string;
  currentUserId: string | null;
}

const buildAuthHeaders = (requireAuth: boolean): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (requireAuth && adminToken) {
    headers.Authorization = `Bearer ${adminToken}`;
  }
  return headers;
};

const handle401 = (status: number, requireAuth: boolean) => {
  if (status === 401 && requireAuth) {
    setAdminToken(null);
  }
};

async function request<T>(url: string, options: RequestInit = {}, requireAuth = false): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
    ...buildAuthHeaders(requireAuth),
  };
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });
  handle401(res.status, requireAuth);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

async function uploadRequest<T>(url: string, formData: FormData, requireAuth = false): Promise<T> {
  const headers = buildAuthHeaders(requireAuth);
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    body: formData,
    headers,
  });
  handle401(res.status, requireAuth);
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export const api = {
  health: () => request<{ status: string }>('/api/health'),

  getData: (environment: string) =>
    request<ServerData>(`/api/data?environment=${encodeURIComponent(environment)}`),

  saveData: (data: ServerData & { environment: string }) =>
    request<{ success: boolean }>('/api/data', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true),

  createBet: (environment: string, input: CreateBetInput) =>
    request<{ success: boolean; bet: Bet }>('/api/bets', {
      method: 'POST',
      body: JSON.stringify({ environment, ...input }),
    }),

  syncMatches: (environment: string) =>
    request<{ success: boolean; count?: number; liveCount?: number; message?: string }>(
      `/api/matches/sync?environment=${encodeURIComponent(environment)}`,
      { method: 'POST' },
      true
    ),

  adminLogin: async (password: string) => {
    const res = await request<{ success: boolean; token?: string; message?: string }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    if (res.success && res.token) {
      setAdminToken(res.token);
    }
    return res;
  },

  adminLogout: () =>
    request<{ success: boolean }>('/api/admin/logout', {
      method: 'POST',
    }, true).then(() => setAdminToken(null)),

  validateAdminSession: () =>
    request<{ success: boolean }>('/api/admin/session', {}, true),

  changeAdminPassword: (oldPassword: string, newPassword: string) =>
    request<{ success: boolean; message?: string }>('/api/admin/password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    }, true),

  getFootballConfig: (environment: string) =>
    request<{ success: boolean; config: FootballConfigStatus }>(
      `/api/admin/football-config?environment=${encodeURIComponent(environment)}`,
      {},
      true
    ),

  saveFootballConfig: (environment: string, config: { apiKey?: string; competition: string }) =>
    request<{ success: boolean; config: FootballConfigStatus }>('/api/admin/football-config', {
      method: 'POST',
      body: JSON.stringify({ environment, ...config }),
    }, true),

  uploadAvatar: async (file: File | Blob, filename = 'avatar.png'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file, filename);
    const data = await uploadRequest<{ url: string }>('/api/upload/avatar', formData, true);
    return data.url;
  },

  uploadBetImage: async (file: File | Blob, filename = 'bet.jpg'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file, filename);
    const data = await uploadRequest<{ url: string }>('/api/upload/bet', formData);
    return data.url;
  },

  clearEnvironmentData: (environment: string) =>
    request<{ success: boolean }>('/api/admin/clear-data', {
      method: 'POST',
      body: JSON.stringify({ environment }),
    }, true),

  listBackups: (environment: string) =>
    request<{ success: boolean; backups: BackupInfo[] }>(
      `/api/admin/backups?environment=${encodeURIComponent(environment)}`,
      {}, true
    ),

  createBackup: (environment: string, label = 'manual') =>
    request<{ success: boolean; backup: BackupInfo; message?: string }>(
      '/api/admin/backups/create',
      {
        method: 'POST',
        body: JSON.stringify({ environment, label }),
      }, true
    ),

  restoreBackup: (environment: string, filename: string) =>
    request<{ success: boolean; message?: string }>(
      '/api/admin/backups/restore',
      {
        method: 'POST',
        body: JSON.stringify({ environment, filename }),
      }, true
    ),

  deleteBackup: (environment: string, filename: string) =>
    request<{ success: boolean; message?: string }>(
      '/api/admin/backups/delete',
      {
        method: 'POST',
        body: JSON.stringify({ environment, filename }),
      }, true
    ),

  downloadBackup: (environment: string, filename: string) =>
    request<{ success: boolean; data: BackupContent }>(
      `/api/admin/backups/download?environment=${encodeURIComponent(environment)}&filename=${encodeURIComponent(filename)}`,
      {}, true
    ),

  getAIConfig: () =>
    request<{ success: boolean; config: AIConfigResponse }>('/api/ai-config', {}, true),

  saveAIConfig: (config: AIConfigResponse) =>
    request<{ success: boolean; config: AIConfigResponse }>('/api/ai-config', {
      method: 'POST',
      body: JSON.stringify(config),
    }, true),

  recognizeBetImage: (imageUrl: string, winAmount?: number) =>
    request<{ success: boolean; result: AIRecognitionResult | null; message?: string }>('/api/ai/recognize', {
      method: 'POST',
      body: JSON.stringify({ imageUrl, winAmount }),
    }, true),

  updateAllAiComments: (environment: string) =>
    request<{ success: boolean; message?: string; updated?: number; failed?: number; total?: number }>(
      `/api/ai/update-all?environment=${encodeURIComponent(environment)}`,
      { method: 'POST' },
      true
    ),

  generatePredictions: () =>
    request<{ success: boolean; predictions?: AIPrediction[]; message?: string }>(
      '/api/ai/predict',
      {},
      true
    ),
};

export type CreateBetInput = Pick<Bet, 'userId' | 'date' | 'winAmount' | 'note' | 'imageUrl'>;

export interface FootballConfigStatus {
  competition: string;
  apiKeyConfigured: boolean;
}

export interface AIPrediction {
  matchNumber: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  result: string;
  analysis: string;
  confidence: number;
  actualHomeScore?: number | null;
  actualAwayScore?: number | null;
  actualResult?: string | null;
  isCorrect?: boolean | null;
  matchTime?: string | null;
}

export interface BackupContent {
  version: number;
  environment: string;
  createdAt: string;
  label: string;
  data: {
    users: User[];
    bets: Bet[];
    apiKey: string;
    competition: string;
  };
}

export interface BackupInfo {
  filename: string;
  size: number;
  createdAt: string;
  label: string;
}

export interface AIConfigResponse {
  apiEndpoint: string;
  apiKey: string;
  model: string;
  siteUrl: string;
}

export interface AIRecognitionResult {
  comment: string;
}
