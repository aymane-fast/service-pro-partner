const API_BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api` || 'http://localhost:8000/api';

export const API_ROUTES = {
    LOGIN: `${API_BASE_URL}/login`,
    LOGOUT: `${API_BASE_URL}/logout`,
    CLIENTS: `${API_BASE_URL}/clients`,
    ORDERS: `${API_BASE_URL}/orders`,
    PARTNERS: `${API_BASE_URL}/partners`,
    PRESTATAIRES: `${API_BASE_URL}/prestataires`,
    USERS: `${API_BASE_URL}/users`,
    USER: `${API_BASE_URL}/user`,
    QUOTES: `${API_BASE_URL}/quotes`,
};

export default API_BASE_URL;
