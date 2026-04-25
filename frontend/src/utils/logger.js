const API_URL = import.meta.env.VITE_API_BASE_URL || '';

const logger = {
    error: (message, meta = {}) => {
        const logData = {
            level: 'error',
            message,
            meta,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.error(`[ERROR] ${message}`, meta);
        
        fetch(`${API_URL}/api/logs/client-error`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(logData),
        }).catch(() => {});
    },
    
    warn: (message, meta = {}) => {
        console.warn(`[WARN] ${message}`, meta);
    },
    
    info: (message, meta = {}) => {
        console.log(`[INFO] ${message}`, meta);
    },
    
    logApiError: (error, context = {}) => {
        const meta = {
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            method: error.config?.method,
            ...context
        };
        
        logger.error(error.message || 'API Error', meta);
    }
};

export default logger;