import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', timeout: 15000, withCredentials: true });
let accessToken = null;
export const setAccessToken = (token) => { accessToken = token; };
api.interceptors.request.use((config) => { if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`; return config; });
let renewing = null;
api.interceptors.response.use((response) => response, async (error) => {
  const config = error.config;
  if (error.response?.status === 401 && config && !config._retried && !config.url?.includes('/users/refresh') && !config.url?.includes('/users/login')) {
    config._retried = true;
    try {
      renewing ||= axios.post(`${api.defaults.baseURL}/users/refresh`, {}, { withCredentials: true });
      const response = await renewing;
      accessToken = response.data.data.token;
      config.headers.Authorization = `Bearer ${accessToken}`;
      return api(config);
    } catch { accessToken = null; } finally { renewing = null; }
  }
  return Promise.reject(error);
});
export default api;
