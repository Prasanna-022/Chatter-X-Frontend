import axios from 'axios';

// ✅ Your Live Render Backend
const API_URL = "https://chatter-x-backend.onrender.com"; 

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // ✅ CRITICAL: This sends the Cookie to the backend
    headers: {
        'Content-Type': 'application/json',
    },
});

// Optional: Log errors for debugging
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn("User not authorized or session expired.");
        }
        return Promise.reject(error);
    }
);

export default api;