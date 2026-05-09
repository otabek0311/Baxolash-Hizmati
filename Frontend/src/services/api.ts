const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;

const getToken = () => localStorage.getItem('token');

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export const registerUnauthorizedHandler = (handler: UnauthorizedHandler) => {
  unauthorizedHandler = handler;
};

const request = async (method: string, path: string, body?: any) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    unauthorizedHandler?.();
    throw new Error(data.message || 'Sessiya tugadi');
  }

  if (!res.ok) throw new Error(data.message || 'Server xatosi');
  return data;
};

const uploadFile = async (path: string, formData: FormData) => {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: formData });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    unauthorizedHandler?.();
    throw new Error(data.message || 'Sessiya tugadi');
  }

  if (!res.ok) throw new Error(data.message || 'Yuklash xatosi');
  return data;
};

export const api = {
  // Auth
  login: (email: string, password: string) => request('POST', '/auth/login', { email, password }),
  logout: () => request('POST', '/auth/logout'),
  getMe: () => request('GET', '/auth/me'),

  // Documents
  uploadDocument: (file: File, retentionDays: number) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('retentionDays', String(retentionDays));
    return uploadFile('/documents/upload', fd);
  },
  getDocuments: (page = 1, limit = 50) => request('GET', `/documents?page=${page}&limit=${limit}`),
  getDocument: (id: string) => request('GET', `/documents/${id}`),
  getDocumentPreviewUrl: async (id: string): Promise<string> => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}/documents/${id}/preview`, { headers });
    if (res.status === 401) { unauthorizedHandler?.(); throw new Error('Sessiya tugadi'); }
    if (!res.ok) throw new Error('Preview yuklanmadi');
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
  downloadDocument: async (id: string, filename: string) => {
    const token = getToken();
    const dlHeaders: Record<string, string> = {};
    if (token) dlHeaders['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}/documents/${id}/download`, {
      headers: dlHeaders,
    });
    if (res.status === 401) { unauthorizedHandler?.(); throw new Error('Sessiya tugadi'); }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Yuklab olishda xato' }));
      throw new Error(err.message || 'Yuklab olishda xato');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace(/\.(doc|docx|pdf)$/i, '') + '.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  },
  deleteDocument: (id: string) => request('DELETE', `/documents/${id}`),
  getStats: () => request('GET', '/documents/stats'),

  // Users
  getUsers: () => request('GET', '/users'),
  createUser: (data: any) => request('POST', '/users', data),
  updateUser: (id: string, data: any) => request('PUT', `/users/${id}`, data),
  deleteUser: (id: string) => request('DELETE', `/users/${id}`),
  resetPassword: (id: string, password: string) => request('POST', `/users/${id}/reset-password`, { password }),

  // Audit
  getAuditLogs: (params?: string) => request('GET', `/audit${params ? '?' + params : ''}`),

  // Settings
  getSettings: () => request('GET', '/settings'),
  updateSettings: (data: any) => request('PUT', '/settings', data),

  // AI
  chat: (message: string) => request('POST', '/ai/chat', { message }),
  getChatHistory: () => request('GET', '/ai/history'),
  clearChatHistory: () => request('DELETE', '/ai/history'),

  // Search
  search: (q: string) => request('GET', `/search?q=${encodeURIComponent(q)}`),

  // QR
  scanQR: async (token: string) => {
    const res = await fetch(`${BASE_URL}/qr/${token}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'QR kod yaroqsiz');
    return data;
  },
};
