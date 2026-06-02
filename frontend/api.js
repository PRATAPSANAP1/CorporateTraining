// Global Configuration and API Utility
const getApiUrl = () => {
    // If running locally, connect to local backend port
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }
    
    // Check if there is an environment variable injected (e.g. via Bundlers)
    try {
        if (typeof process !== 'undefined' && process.env && process.env.VITE_API_URL) {
            return process.env.VITE_API_URL;
        }
    } catch (e) {}

    try {
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
            return import.meta.env.VITE_API_URL;
        }
    } catch (e) {}

    // Live backend fallback
    return 'https://corporatetraining.onrender.com/api';
};

const CONFIG = {
    API_URL: getApiUrl()
};

let accessToken = null;

// Global API Utility
const api = {
    // Get token - returns in-memory token, or checks if user is logged in
    getToken: () => accessToken || (localStorage.getItem('logged_in') === 'true' ? 'placeholder_token' : null),

    // Set token to local storage (we now save to memory and set logged_in indicator)
    setToken: (token) => {
        accessToken = token;
        localStorage.setItem('logged_in', 'true');
    },

    // Remove token
    removeToken: () => {
        accessToken = null;
        localStorage.removeItem('logged_in');
    },

    // Logout helper
    logout: () => {
        accessToken = null;
        localStorage.removeItem('logged_in');
        window.location.href = 'login.html';
    },

    // Sanitize rich-text using DOMPurify if loaded, or simple HTML escape
    sanitize: (html) => {
        if (window.DOMPurify) {
            return window.DOMPurify.sanitize(html);
        }
        return html
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    // Generic Fetch Wrapper with auto port fallback for local dev
    async request(endpoint, options = {}) {
        let baseUrl = CONFIG.API_URL;
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const isPublicRoute = endpoint.startsWith('/auth/login') || 
                              endpoint.startsWith('/auth/register') || 
                              endpoint.startsWith('/auth/forgot-password') || 
                              endpoint.includes('/reset-password');

        // If we don't have an in-memory accessToken, but the user is supposed to be logged in,
        // try to refresh the token first.
        if (!accessToken && !isPublicRoute && localStorage.getItem('logged_in') === 'true') {
            try {
                const refreshResponse = await fetch(`${baseUrl}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();
                    accessToken = data.data.token;
                } else {
                    this.removeToken();
                    const isAuthPage = window.location.pathname.endsWith('login.html') || 
                                       window.location.pathname.endsWith('register.html') ||
                                       window.location.pathname.endsWith('forgot-password.html');
                    if (!isAuthPage) {
                        window.location.href = 'login.html';
                        return;
                    }
                }
            } catch (err) {
                console.error('Failed to auto-refresh token on request', err);
            }
        }

        const token = accessToken;
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers,
        };

        const attemptFetch = async (url) => {
            const response = await fetch(url, config);

            // Auto logout if authentication token expires (returns 401 Unauthorized)
            if (response.status === 401) {
                console.warn('Authentication token has expired or is invalid. Performing auto-logout.');
                const isAuthPage = window.location.pathname.endsWith('login.html') || 
                                   window.location.pathname.endsWith('register.html') ||
                                   window.location.pathname.endsWith('forgot-password.html');
                if (!isAuthPage) {
                    api.removeToken();
                    window.location.href = 'login.html';
                    return;
                }
            }

            const contentType = response.headers.get('content-type') || '';
            
            if (!contentType.includes('application/json')) {
                throw new SyntaxError('Response is not JSON (received HTML fallback)');
            }
            
            const data = await response.json();
            if (!response.ok) {
                const err = new Error(data.message || 'Something went wrong');
                err.errors = data.errors || null;
                throw err;
            }
            return data;
        };

        try {
            return await attemptFetch(`${baseUrl}${endpoint}`);
        } catch (error) {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const isJsonParseError = error instanceof SyntaxError || error.message.includes('Unexpected token') || error.message.includes('JSON');
            const isNetworkError = error instanceof TypeError || error.name === 'TypeError';

            if (isLocal && (isJsonParseError || isNetworkError)) {
                const altBaseUrl = baseUrl.includes('5000') 
                    ? baseUrl.replace('5000', '3000') 
                    : baseUrl.replace('3000', '5000');
                
                console.warn(`API request to ${baseUrl} failed. Attempting auto-fallback to alternate local port: ${altBaseUrl}`);
                try {
                    return await attemptFetch(`${altBaseUrl}${endpoint}`);
                } catch (retryError) {
                    console.error('API Error after fallback attempt:', retryError);
                    throw retryError;
                }
            }
            console.error('API Error:', error);
            throw error;
        }
    },

    // Specific API calls
    auth: {
        login: (credentials) => api.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        }),
        register: (userData) => api.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        }),
        forgotPassword: (email) => api.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        }),
        getProfile: () => api.request('/auth/profile', { method: 'GET' }),
        updateProfile: (data) => api.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        })
    },

    admin: {
        getStats: () => api.request('/analytics/dashboard'),
        getUsers: (params = '') => api.request(`/users${params}`),
        deleteUser: (id) => api.request(`/users/${id}`, { method: 'DELETE' }),
        getUserStats: (id) => api.request(`/users/${id}/stats`),
        getTests: (params = '') => api.request(`/tests${params}`),
        getTest: (id) => api.request(`/tests/${id}`),
        createTest: (data) => api.request('/tests', { method: 'POST', body: JSON.stringify(data) }),
        updateTest: (id, data) => api.request(`/tests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        deleteTest: (id) => api.request(`/tests/${id}`, { method: 'DELETE' }),
        toggleTest: (id) => api.request(`/tests/${id}/toggle`, { method: 'PATCH' }),
        getCoding: (params = '') => api.request(`/coding/problems${params}`),
        getCodingProblem: (id) => api.request(`/coding/problems/${id}`),
        createCoding: (data) => api.request('/coding/problems', { method: 'POST', body: JSON.stringify(data) }),
        updateCoding: (id, data) => api.request(`/coding/problems/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        deleteCoding: (id) => api.request(`/coding/problems/${id}`, { method: 'DELETE' }),
        getCategories: (params = '') => api.request(`/categories${params}`)
    },

    tests: {
        getAll: (params = '') => api.request(`/tests${params}`),
        getOne: (id) => api.request(`/tests/${id}`),
        start: (id) => api.request(`/tests/${id}/start`, { method: 'POST' }),
        submit: (id, data) => api.request(`/tests/${id}/submit`, { method: 'POST', body: JSON.stringify(data) })
    },

    results: {
        getMy: (params = '') => api.request(`/results/my${params}`),
        getOne: (id) => api.request(`/results/${id}`),
        getAll: (params = '') => api.request(`/results${params}`),
        saveAnswer: (resultId, data) => api.request(`/results/${resultId}/answer`, { method: 'PUT', body: JSON.stringify(data) })
    },

    coding: {
        getProblems: (params = '') => api.request(`/coding/problems${params}`),
        getProblem: (id) => api.request(`/coding/problems/${id}`),
        getSubmissions: (id) => api.request(`/coding/problems/${id}/submissions`),
        run: (data) => api.request('/coding/run', { method: 'POST', body: JSON.stringify(data) }),
        submit: (data) => api.request('/coding/submit', { method: 'POST', body: JSON.stringify(data) })
    },

    leaderboard: {
        get: (params = '') => api.request(`/leaderboard${params}`)
    },

    categories: {
        getAll: () => api.request('/categories'),
        getOne: (id) => api.request(`/categories/${id}`),
        create: (data) => api.request('/categories', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => api.request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id) => api.request(`/categories/${id}`, { method: 'DELETE' }),
        getSubcategories: (id) => api.request(`/categories/${id}/subcategories`),
        createSubcategory: (id, data) => api.request(`/categories/${id}/subcategories`, { method: 'POST', body: JSON.stringify(data) }),
        updateSubcategory: (id, data) => api.request(`/categories/subcategories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        deleteSubcategory: (id) => api.request(`/categories/subcategories/${id}`, { method: 'DELETE' }),
        bulkImportSubcategories: (id, data) => api.request(`/categories/${id}/subcategories/bulk`, { method: 'POST', body: JSON.stringify(data) })
    },

    questions: {
        getAll: (params = '') => api.request(`/questions${params}`),
        getOne: (id) => api.request(`/questions/${id}`),
        create: (data) => api.request('/questions', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => api.request(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id) => api.request(`/questions/${id}`, { method: 'DELETE' }),
        bulkImport: (data) => api.request('/questions/bulk', { method: 'POST', body: JSON.stringify(data) })
    },

    interview: {
        start: (data) => api.request('/interview/start', { method: 'POST', body: JSON.stringify(data) }),
        answer: (data) => api.request('/interview/answer', { method: 'POST', body: JSON.stringify(data) }),
        end: (data) => api.request('/interview/end', { method: 'POST', body: JSON.stringify(data) }),
        getHistory: () => api.request('/interview/history')
    },

    analytics: {
        getStudents: () => api.request('/analytics/students'),
        getTests: () => api.request('/analytics/tests'),
        getCategories: () => api.request('/analytics/categories')
    }
};

// Inactivity Auto-Logout Tracker (30 Minutes)
(function() {
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in ms
    const CHECK_INTERVAL = 10000; // 10 seconds check interval
    
    const isAuthPage = window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('register.html');
    if (isAuthPage) return;

    // Initialize last active timestamp
    if (!localStorage.getItem('lastActivity')) {
        localStorage.setItem('lastActivity', Date.now());
    }

    const updateActivity = () => {
        localStorage.setItem('lastActivity', Date.now());
    };

    // Track active interactions (mouse movement, keypress, click, scroll, touch)
    const interactionEvents = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll', 'click'];
    interactionEvents.forEach(evtName => {
        window.addEventListener(evtName, updateActivity, { passive: true });
    });

    // Check periodically if inactivity exceeds threshold
    setInterval(() => {
        const token = localStorage.getItem('token');
        if (!token) return; // Only track authenticated users

        const lastActivity = parseInt(localStorage.getItem('lastActivity') || Date.now(), 10);
        const idleDuration = Date.now() - lastActivity;

        if (idleDuration >= INACTIVITY_TIMEOUT) {
            console.warn('Auto logout triggered due to 30 minutes of inactivity.');
            api.logout();
        }
    }, CHECK_INTERVAL);
})();
