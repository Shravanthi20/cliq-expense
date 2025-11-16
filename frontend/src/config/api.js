import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api', // Using proxy configuration from package.json
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
};

export const expenseAPI = {
  getAll: () => api.get('/expenses'),
  create: (expenseData) => api.post('/expenses', expenseData),
  update: (id, expenseData) => api.put(`/expenses/${id}`, expenseData),
  delete: (id) => api.delete(`/expenses/${id}`),
  search: (params) => api.get('/expenses/search', { params }),
};

export const incomeAPI = {
  getAll: () => api.get('/income'),
  create: (incomeData) => api.post('/income', incomeData),
  update: (id, incomeData) => api.put(`/income/${id}`, incomeData),
  delete: (id) => api.delete(`/income/${id}`),
  search: (params) => api.get('/income/search', { params }),
};

export const uploadAPI = {
  uploadFile: (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/upload?type=${type}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const groupAPI = {
  getAll: () => api.get('/groups'),
  create: (groupData) => api.post('/groups', groupData),
  update: (id, groupData) => api.put(`/groups/${id}`, groupData),
  delete: (id) => api.delete(`/groups/${id}`),
  getById: (id) => api.get(`/groups/${id}`),
  addMember: (id, member) => api.post(`/groups/${id}/members`, member),
  removeMember: (id, memberId) => api.delete(`/groups/${id}/members/${memberId}`),
  leave: (id) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user?.id) return Promise.reject(new Error('Not authenticated'));
    return api.delete(`/groups/${id}/members/${user.id}`);
  },
};

export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
};

export const invoiceAPI = {
  getAll: () => api.get('/invoices'),
  create: (invoiceData) => api.post('/invoices', invoiceData),
  update: (id, invoiceData) => api.put(`/invoices/${id}`, invoiceData),
  delete: (id) => api.delete(`/invoices/${id}`),
  getById: (id) => api.get(`/invoices/${id}`),
};

// ✅ REPORT API (🔹 FIXED)
export const reportAPI = {
  // Fetch filtered invoices for reporting
  getFinancialReport: (params) => api.get('/reports/invoices', { params }),

  // Download a single invoice PDF
  downloadInvoicePDF: (id) =>
    api.get(`/reports/invoice/${id}/pdf`, { responseType: 'blob' }),

  // Download all invoices as CSV summary
  downloadSummaryCSV: (params) =>
    api.get('/reports/summary/csv', { params, responseType: 'blob' }),
};

export default api;
