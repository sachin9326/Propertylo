import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000, // 15 second timeout — fail fast instead of hanging
});

// Helper to resolve image URLs (handles relative paths from backend)
export const getImageUrl = (path) => {
  if (!path) return 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=60';
  if (path.startsWith('http')) return path;
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

console.log('API Base URL:', API_URL);

api.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    const { token } = JSON.parse(userInfo);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// ============================================================
// Backend wake-up / warmup utility
// Returns a promise that resolves when backend is ready
// ============================================================
let backendReady = null;

export const ensureBackendReady = () => {
  if (backendReady) return backendReady;
  
  backendReady = new Promise(async (resolve) => {
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        await axios.get(`${API_URL}/api/health`, { timeout: 10000 });
        console.log('✅ Backend is ready');
        resolve(true);
        return;
      } catch (e) {
        console.log(`⏳ Backend waking up... (attempt ${i + 1}/${maxRetries})`);
        if (i < maxRetries - 1) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }
    console.warn('⚠️ Backend may be slow, proceeding anyway');
    resolve(false);
  });
  
  return backendReady;
};

// Start warming up backend immediately when this module loads
ensureBackendReady();

export default api;
