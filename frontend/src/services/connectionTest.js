import api from './api';

/**
 * Test connection to the backend server
 */
export const testConnection = async () => {
    try {
        const response = await api.get('/health', { timeout: 5000 });
        console.log('✅ Backend Connected:', response.data);
        return {
            success: true,
            message: 'Connected to server',
            data: response.data
        };
    } catch (error) {
        console.log('⚠️ Backend Connection Failed:', error.message);
        return {
            success: false,
            message: error.response?.data?.message || 'Cannot connect to server',
            error: error.message
        };
    }
};

/**
 * Test authentication by attempting to login
 */
export const testAuth = async (username, password) => {
    try {
        const response = await api.post('/auth/login', { username, password });
        console.log('✅ Authentication Successful:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('❌ Authentication Failed:', error.message);
        return {
            success: false,
            message: error.response?.data?.message || 'Login failed',
            error: error.message
        };
    }
};

/**
 * Get server info
 */
export const getServerInfo = async () => {
    try {
        const response = await api.get('/health');
        return {
            status: 'online',
            timestamp: response.data.timestamp,
            url: api.defaults.baseURL
        };
    } catch (error) {
        return {
            status: 'offline',
            error: error.message
        };
    }
};
