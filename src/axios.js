import axios from 'axios';

axios.defaults.withCredentials = true;
// axios.defaults.baseURL = 'http://localhost:8000/api';
axios.defaults.baseURL = 'https://churchbe.aissystem.org/api';

// Request interceptor to add token and branch ID
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    const branchId = localStorage.getItem('selected_branch_id');
    if (branchId) {
        config.headers['X-Branch-ID'] = branchId;
    }

    return config;
});

axios.interceptors.response.use(response => {
    return response;
}, error => {
    if (error.response && error.response.status === 401) {
        // Only redirect if we are not already on the login page
        if (!window.location.pathname.includes('/login')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('selected_branch_id');
            window.location.href = '/login';
        }
    }
    return Promise.reject(error);
});

export default axios;
