import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api'; 
import io from 'socket.io-client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const API_BASE_URL = 'https://chatter-x-backend-lnwx.vercel.app';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    const navigate = useNavigate();

    // handleAuthSuccess now only manages application state, not token storage
    const handleAuthSuccess = (userData) => {
        setUser(userData); 

        // Initialize Socket.io
        // Note: For socket.io to work with cookies across domains in production, 
        // ensure backend CORS is perfect.
        const newSocket = io(API_BASE_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'], 
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            if (userData?._id) {
                newSocket.emit('setup', userData);
            }
        });

        if (window.location.pathname === '/login') {
            navigate('/');
        }
    };

    const login = async (data) => {
        try {
            const response = await api.post('/user/login', data);
            
            // Backend should return user object but NO token in body
            const userData = response.data.user || response.data;

            if (!userData) {
                throw new Error("Server returned an incomplete user response.");
            }
            
            handleAuthSuccess(userData); 
            return response.data;

        } catch (error) {
            const errorMessage = error.response?.data?.message || "Login failed due to network error.";
            setUser(null); 
            throw errorMessage; 
        }
    };

    const logout = async () => {
        try {
            await api.post('/user/logout'); // Backend clears the cookie
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            setUser(null);
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            navigate('/login');
        }
    };

    useEffect(() => {
        const checkUser = async () => {
            try {
                // We rely on the cookie being sent automatically
                const response = await api.get('/user/current-user'); 
                const userData = response.data.user || response.data.data;
                handleAuthSuccess(userData); 
            } catch (error) {
                // If 401, cookie is missing or invalid
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkUser();
    }, []);

    const value = {
        user,
        loading,
        socket,
        login,
        logout,
        handleAuthSuccess 
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};