import axios from 'axios';

const API_BASE_URL = 'https://chatter-x-backend.onrender.com';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, 
    headers: {
        'Content-Type': 'application/json',
    },
});

// No interceptor needed for Authorization header since we use cookies

export default api;