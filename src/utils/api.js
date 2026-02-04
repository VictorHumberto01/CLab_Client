import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    let token = null;
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
      token = window.localStorage.getItem('token');
      const customIp = window.localStorage.getItem('clab-server-ip');
      if (customIp) {
        config.baseURL = customIp;
      }
    }
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("[API] Request Interceptor Error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to log errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with a status code outside the 2xx range
      console.error("[API] Response Error:", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error("[API] No Response:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("[API] Request Setup Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
