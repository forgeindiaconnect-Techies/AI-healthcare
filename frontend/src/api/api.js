import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Add a request interceptor
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("doctorToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Add a response interceptor
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If the server returns a 401 Unauthorized error
    if (error.response && error.response.status === 401) {
      // Clear the stale token from localStorage
      localStorage.removeItem('userInfo');
      // Redirect to the login page (or root)
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const getCorrectUrl = (url) => {
  if (!url) return null;
  // Replace spaces with %20 to avoid fetch TypeError: Invalid URL
  let safeUrl = url.replace(/ /g, '%20');
  
  let backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  if (backendUrl.endsWith('/')) {
    backendUrl = backendUrl.slice(0, -1);
  }
  if (safeUrl.includes('http://localhost:5000')) {
    return safeUrl.replace('http://localhost:5000', backendUrl);
  }
  if (safeUrl.startsWith('/uploads/')) {
    return `${backendUrl}${safeUrl}`;
  }
  return safeUrl;
};

export default API;
