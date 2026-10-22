export async function api(path, options = {}) {
  const response = await fetch(path, { credentials: 'same-origin', ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers } });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(data.error || 'Request failed');
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}
export const post = (path, data) => api(path, { method: 'POST', body: JSON.stringify(data) });
export const auth = {
  me: async () => (await api('/api/auth/me')).user,
  login: async (email, password) => (await post('/api/auth/login', { email, password })).user,
  register: async (email, password, full_name) => (await post('/api/auth/register', { email, password, full_name })).user,
  logout: () => post('/api/auth/logout', {}),
  requestReset: email => post('/api/auth/request-password-reset', { email }),
  setPassword: async (token, password) => (await post('/api/auth/set-password', { token, password })).user,
};
