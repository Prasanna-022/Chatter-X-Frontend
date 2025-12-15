import axios from 'axios';

// ✅ Your Live Render Backend
const API_URL = "https://chatter-x-backend.onrender.com"; 

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, 
    headers: {
        'Content-Type': 'application/json',
    },
});


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