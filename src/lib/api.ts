const TOKEN_KEY = 'koni_bandung_auth_token';

// Support connecting directly to external Laravel API or local dev server
const API_BASE_URL = (
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.VITE_LARAVEL_API_URL ||
  ''
).replace(/\/+$/, '');

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export function resolveApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (!API_BASE_URL) {
    return path;
  }
  if (API_BASE_URL.endsWith('/api') && path.startsWith('/api/')) {
    return `${API_BASE_URL}${path.substring(4)}`;
  }
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const fullUrl = resolveApiUrl(url);
  const response = await fetch(fullUrl, { ...options, headers });
  
  if (response.status === 401) {
    // If unauthorized, token expired or invalid
    removeStoredToken();
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Terjadi kesalahan pada server');
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    fetchWithAuth('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  me: () => fetchWithAuth('/api/auth/me'),
  changePassword: (data: { current_password: string; new_password: string }) =>
    fetchWithAuth('/api/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  resetPassword: (data: { user_id: string; default_password?: string }) =>
    fetchWithAuth('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  getUsers: () => fetchWithAuth('/api/auth/users'),
  createUser: (data: any) => fetchWithAuth('/api/auth/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) => fetchWithAuth(`/api/auth/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Dashboard
  getDashboardStats: () => fetchWithAuth('/api/dashboard/stats'),

  // Sports & Events
  getSports: () => fetchWithAuth('/api/sports'),
  createSport: (data: any) => fetchWithAuth('/api/sports', { method: 'POST', body: JSON.stringify(data) }),
  updateSport: (id: string, data: any) => fetchWithAuth(`/api/sports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getEvents: (sportId?: string) => fetchWithAuth(`/api/events${sportId ? `?sport_id=${sportId}` : ''}`),
  createEvent: (data: any) => fetchWithAuth('/api/events', { method: 'POST', body: JSON.stringify(data) }),

  // Athletes & Officials
  getAthletes: (params?: { sport_id?: string; status?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchWithAuth(`/api/athletes${q ? `?${q}` : ''}`);
  },
  createAthlete: (data: any) => fetchWithAuth('/api/athletes', { method: 'POST', body: JSON.stringify(data) }),
  updateAthlete: (id: string, data: any) => fetchWithAuth(`/api/athletes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAthlete: (id: string) => fetchWithAuth(`/api/athletes/${id}`, { method: 'DELETE' }),

  getOfficials: (params?: { sport_id?: string; role_type?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchWithAuth(`/api/officials${q ? `?${q}` : ''}`);
  },
  createOfficial: (data: any) => fetchWithAuth('/api/officials', { method: 'POST', body: JSON.stringify(data) }),

  // Host Regions, Venues, Posts & Personnel
  getHostRegions: () => fetchWithAuth('/api/host-regions'),
  getVenues: () => fetchWithAuth('/api/venues'),
  getPosts: () => fetchWithAuth('/api/posts'),
  updatePost: (id: string, data: any) => fetchWithAuth(`/api/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getPostPersonnel: (postId?: string) => fetchWithAuth(`/api/post-personnel${postId ? `?post_id=${postId}` : ''}`),
  createPostPersonnel: (data: any) => fetchWithAuth('/api/post-personnel', { method: 'POST', body: JSON.stringify(data) }),
  updatePostPersonnel: (id: string, data: any) => fetchWithAuth(`/api/post-personnel/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Fixtures & Results
  getFixtures: (params?: { sport_id?: string; region_id?: string; post_id?: string; status?: string; date?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchWithAuth(`/api/fixtures${q ? `?${q}` : ''}`);
  },
  createFixture: (data: any) => fetchWithAuth('/api/fixtures', { method: 'POST', body: JSON.stringify(data) }),
  updateFixture: (id: string, data: any) => fetchWithAuth(`/api/fixtures/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  recordResult: (id: string, data: any) => fetchWithAuth(`/api/fixtures/${id}/result`, { method: 'POST', body: JSON.stringify(data) }),

  // Medals & Target Settings
  getMedals: (params?: { sport_id?: string; medal_type?: string; is_verified?: boolean }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchWithAuth(`/api/medals${q ? `?${q}` : ''}`);
  },
  createMedal: (data: any) => fetchWithAuth('/api/medals', { method: 'POST', body: JSON.stringify(data) }),
  verifyMedal: (id: string, data: { is_verified: boolean; notes?: string }) =>
    fetchWithAuth(`/api/medals/${id}/verify`, { method: 'PUT', body: JSON.stringify(data) }),
  updateMedalTargets: (data: any) => fetchWithAuth('/api/settings/medal-targets', { method: 'PUT', body: JSON.stringify(data) }),

  // Daily Reports & Issues
  getDailyReports: (params?: { post_id?: string; date?: string; status?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchWithAuth(`/api/daily-reports${q ? `?${q}` : ''}`);
  },
  createDailyReport: (data: any) => fetchWithAuth('/api/daily-reports', { method: 'POST', body: JSON.stringify(data) }),
  getIssues: (params?: { post_id?: string; category?: string; priority?: string; status?: string; escalated?: boolean }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchWithAuth(`/api/issues${q ? `?${q}` : ''}`);
  },
  createIssue: (data: any) => fetchWithAuth('/api/issues', { method: 'POST', body: JSON.stringify(data) }),
  getIssueUpdates: (issueId: string) => fetchWithAuth(`/api/issues/${issueId}/updates`),
  addIssueUpdate: (issueId: string, data: any) => fetchWithAuth(`/api/issues/${issueId}/updates`, { method: 'POST', body: JSON.stringify(data) }),

  // Medical Cases (Restricted Access)
  getMedicalCases: (params?: { sport_id?: string; urgency_level?: string; status?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchWithAuth(`/api/medical${q ? `?${q}` : ''}`);
  },
  createMedicalCase: (data: any) => fetchWithAuth('/api/medical', { method: 'POST', body: JSON.stringify(data) }),
  updateMedicalCase: (id: string, data: any) => fetchWithAuth(`/api/medical/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Accommodation & Transportation
  getAccommodations: () => fetchWithAuth('/api/accommodations'),
  updateAccommodation: (id: string, data: any) => fetchWithAuth(`/api/accommodations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getTransportAssignments: () => fetchWithAuth('/api/transport'),
  updateTransportAssignment: (id: string, data: any) => fetchWithAuth(`/api/transport/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Protests
  getProtests: () => fetchWithAuth('/api/protests'),
  createProtest: (data: any) => fetchWithAuth('/api/protests', { method: 'POST', body: JSON.stringify(data) }),
  updateProtest: (id: string, data: any) => fetchWithAuth(`/api/protests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Audit Logs & Settings
  getAuditLogs: (params?: { module?: string; action?: string; limit?: number }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchWithAuth(`/api/audit-logs${q ? `?${q}` : ''}`);
  },
  getSettings: () => fetchWithAuth('/api/settings'),
  updateSetting: (key: string, data: any) => fetchWithAuth(`/api/settings/${key}`, { method: 'PUT', body: JSON.stringify(data) }),
  getBackupJson: () => fetchWithAuth('/api/settings/backup-json'),

  // Visit Photos & AI Assistant
  getVisitPhotos: () => fetchWithAuth('/api/visit-photos'),
  askAi: (question: string) => fetchWithAuth('/api/ai/ask', { method: 'POST', body: JSON.stringify({ question }) }),
};
