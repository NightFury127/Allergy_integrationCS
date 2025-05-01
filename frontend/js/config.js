const API_CONFIG = {
    BASE_URL: 'http://localhost:8000',
    ENDPOINTS: {
        AUTH: '/api/auth/',
        ALLERGIES: '/api/allergies/',
        MEDICATIONS: '/api/medications/',
        CHAT: '/api/chat/',
        TEST: '/api/test/'
    },
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

// Add token to headers if available
const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
        ...API_CONFIG.HEADERS,
        ...(token ? { 'Authorization': `Token ${token}` } : {})
    };
};

// API request helper
const apiRequest = async (endpoint, method = 'GET', data = null) => {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
            method,
            headers: getAuthHeaders(),
            ...(data ? { body: JSON.stringify(data) } : {})
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}; 