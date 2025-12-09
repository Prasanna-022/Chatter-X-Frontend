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
    const handleAuthSuccess = (userData) => {
     
        setUser(userData); 

        const newSocket = io(API_BASE_URL, {
            withCredentials: true, 
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('setup', userData);
        });

        navigate('/');
    };

    const login = async (data) => {
        try {
           
            const response = await api.post('/user/login', data);

            const { user } = response.data; 

            if (!user) {
                throw new Error("Server returned an incomplete user response.");
            }
            handleAuthSuccess(user); 
            return response.data;

        } catch (error) {
            const errorMessage = error.response?.data?.message || "Login failed due to network error.";
         
            setUser(null); 

            throw errorMessage; 
        }
    };

    const logout = async () => {
        try {
            await api.post('/user/logout'); 
        } catch (error) {
        } finally {
            setUser(null);
            if (socket) socket.disconnect();
            navigate('/login');
        }
    };


    useEffect(() => {
        const checkUser = async () => {
            try {
                const response = await api.get('/user/current-user'); 
                const { user: validatedUser } = response.data;
            
                handleAuthSuccess(validatedUser); 
            } catch (error) {
                
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