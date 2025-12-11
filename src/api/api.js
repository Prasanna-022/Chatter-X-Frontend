import axios from 'axios';

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
        if (error.response && error.response.status === 401) {
           
        }
        return Promise.reject(error);
    }
);

export default api;