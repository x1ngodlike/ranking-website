const API_BASE = import.meta.env.VITE_API_BASE || '';

export interface ServerData {
  users: any[];
  bets: any[];
  matches: any[];
  apiKey: string;
  competition: string;
  theme: string;
  currentUserId: string | null;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
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
    }),

  adminLogin: (password: string) =>
    request<{ success: boolean; message?: string }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  changeAdminPassword: (oldPassword: string, newPassword: string) =>
    request<{ success: boolean; message?: string }>('/api/admin/password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  uploadAvatar: async (file: File | Blob, filename = 'avatar.png'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file, filename);
    const res = await fetch(`${API_BASE}/api/upload/avatar`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.url;
  },

  clearEnvironmentData: (environment: string) =>
    request<{ success: boolean }>('/api/admin/clear-data', {
      method: 'POST',
      body: JSON.stringify({ environment }),
    }),

  // 备份相关接口
  listBackups: (environment: string) =>
    request<{ success: boolean; backups: BackupInfo[] }>(
      `/api/admin/backups?environment=${encodeURIComponent(environment)}`
    ),

  createBackup: (environment: string, label = 'manual') =>
    request<{ success: boolean; backup: BackupInfo; message?: string }>(
      '/api/admin/backups/create',
      {
        method: 'POST',
        body: JSON.stringify({ environment, label }),
      }
    ),

  restoreBackup: (environment: string, filename: string) =>
    request<{ success: boolean; message?: string }>(
      '/api/admin/backups/restore',
      {
        method: 'POST',
        body: JSON.stringify({ environment, filename }),
      }
    ),

  deleteBackup: (environment: string, filename: string) =>
    request<{ success: boolean; message?: string }>(
      '/api/admin/backups/delete',
      {
        method: 'POST',
        body: JSON.stringify({ environment, filename }),
      }
    ),
};

export interface BackupInfo {
  filename: string;
  size: number;
  createdAt: string;
  label: string;
}
