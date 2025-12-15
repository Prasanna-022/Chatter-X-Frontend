import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/api'; 

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    // Helper to update state and redirect if needed
    const handleAuthSuccess = (userData) => {
        setUser(userData); 
        // Only redirect to home if the user is currently on the login page
        if (location.pathname === '/login') {
            navigate('/');
        }
    };

    const login = async (data) => {
        try {
            const response = await api.post('/user/login', data);
            
            // Handle potentially different response structures
            const userData = response.data.user || response.data.data;
            
            if (!userData) throw new Error("Incomplete user response.");
            
            handleAuthSuccess(userData); 
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Login failed.";
            setUser(null); 
            throw errorMessage; 
        }
    };

    const logout = async () => {
        try {
            await api.post('/user/logout');
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            setUser(null);
            navigate('/login');
        }
    };

    // Check if user is logged in on page refresh
    useEffect(() => {
        const checkUser = async () => {
            try {
                const response = await api.get('/user/current-user'); 
                const userData = response.data.user || response.data.data;
                
                setUser(userData); 
            } catch (error) {
                
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkUser();
    }, []);

    const value = { user, loading, login, logout, handleAuthSuccess };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};