// config.js - Dynamic Configuration for Kisan Setu AI Frontend

/**
 * Get the API base URL based on the environment
 * - Production (Vercel): https://kisan-setu-api.onrender.com
 * - Development: http://localhost:8000
 */
function getAPIBaseURL() {
    // Check if running on Vercel (production)
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        // Production on Vercel
        if (hostname.includes('vercel.app') || hostname.includes('kisan-setu')) {
            return 'https://kisan-setu-api.onrender.com';
        }
        
        // Localhost development
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:8000';
        }
    }
    
    // Fallback
    return 'http://localhost:8000';
}

// Export configuration
export const APP_CONFIG = {
    apiBaseURL: getAPIBaseURL(),
    appName: 'Kisan Setu AI',
    version: '1.0.0',
};

// Also expose as global for non-module scripts
if (typeof window !== 'undefined') {
    window.APP_CONFIG = APP_CONFIG;
}
