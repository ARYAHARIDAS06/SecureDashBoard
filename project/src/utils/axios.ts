import axios, { AxiosRequestConfig, AxiosInstance } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api/',
  timeout: 10000,
});

api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Sending request with token:', token);
    } else {
      console.log('No token found in localStorage');
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: any) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const resp = await api.post('auth/passkeys/refresh/', { refresh: refreshToken }); // Adjust endpoint if needed
          localStorage.setItem('access_token', resp.data.access);
          originalRequest.headers.Authorization = `Bearer ${resp.data.access}`;
          return api(originalRequest);
        } catch (e) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;