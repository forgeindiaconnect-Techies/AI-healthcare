import axios from "axios";

// Safely get base URL and remove trailing slash
let baseURL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
if (baseURL.endsWith('/')) {
  baseURL = baseURL.slice(0, -1);
}

const API = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor
API.interceptors.request.use((config) => {
  // Try to get unified access token first
  let token = localStorage.getItem("accessToken");
  
  // Fallback for legacy logins
  if (!token) {
    token = localStorage.getItem("doctorToken");
  }
  if (!token) {
    const userInfoStr = localStorage.getItem("userInfo");
    if (userInfoStr && userInfoStr !== 'undefined' && userInfoStr !== 'null') {
      try {
        const userInfo = JSON.parse(userInfoStr);
        token = userInfo.token;
      } catch (e) {
        console.error("Failed to parse userInfo", e);
      }
    }
  }

  // Never send "Bearer undefined"
  if (token && token !== 'undefined' && token !== 'null') {
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
    // Check if error response exists
    if (error.response) {
      const status = error.response.status;
      
      // 401 Unauthorized: Clear session and redirect to login
      if (status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('doctorToken');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('userRole');
        localStorage.removeItem('doctor');
        
        // Prevent redirect loop if already on login/root
        if (window.location.pathname !== '/' && !window.location.pathname.includes('login')) {
           window.location.href = '/';
        }
      }
      
      // 403 Forbidden: Do not log out, just reject so the UI can show a permission error
      if (status === 403) {
        console.warn('403 Forbidden - Permission Denied');
      }
    }
    
    return Promise.reject(error);
  }
);

export const getCorrectUrl = (url) => {
  if (!url) return null;
  let safeUrl = url.replace(/ /g, '%20');
  
  if (safeUrl.includes('http://localhost:5000')) {
    return safeUrl.replace('http://localhost:5000', baseURL);
  }
  if (safeUrl.startsWith('/uploads/')) {
    return `${baseURL}${safeUrl}`;
  }
  return safeUrl;
};

export default API;
