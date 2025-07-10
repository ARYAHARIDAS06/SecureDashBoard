import axios, { AxiosRequestConfig, AxiosInstance } from 'axios';

  const api: AxiosInstance = axios.create({
    baseURL: 'http://localhost:8000/api/',
    timeout: 10000,
  });

  api.interceptors.request.use(
    (config: AxiosRequestConfig) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Token ${token}`;
        console.log('Sending request with token:', token); // Debug log
      } else {
        console.log('No token found in localStorage'); // Debug log
      }
      return config;
    },
    (error: any) => Promise.reject(error)
  );

  export default api;