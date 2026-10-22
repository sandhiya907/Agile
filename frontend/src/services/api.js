/**
 * SpendWise API Service Layer
 * Uses Fetch API with credentials: 'include' for HttpOnly cookie session management
 * and X-Requested-With for CSRF protection.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://spendwise-api-7sj4.onrender.com/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('spendwise_token') : null;

  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
    credentials: 'include', // Sends HttpOnly cookie
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.error || 'An error occurred. Please try again.');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (!err.status) {
      err.message = 'Unable to connect to the server. Please check your connection.';
    }
    throw err;
  }
}

// Authentication API
export const authApi = {
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: async (credentials) => {
    const data = await request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
    if (data && data.token) {
      localStorage.setItem('spendwise_token', data.token);
    }
    return data;
  },
  logout: async () => {
    try {
      return await request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('spendwise_token');
    }
  },
  getMe: () => request('/auth/me', { method: 'GET' }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (payload) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
};

// Expenses API
export const expensesApi = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/expenses${queryString}`, { method: 'GET' });
  },
  create: (expense) => request('/expenses', { method: 'POST', body: JSON.stringify(expense) }),
  get: (id) => request(`/expenses/${id}`, { method: 'GET' }),
  update: (id, expense) => request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(expense) }),
  delete: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),
};

// Budgets API
export const budgetsApi = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.month) query.append('month', params.month);
    if (params.year) query.append('year', params.year);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/budgets${queryString}`, { method: 'GET' });
  },
  set: (payload) => request('/budgets', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
};

// Dashboard API
export const dashboardApi = {
  getSummary: (month, year) => {
    const query = new URLSearchParams();
    if (month) query.append('month', month);
    if (year) query.append('year', year);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/dashboard/summary${queryString}`, { method: 'GET' });
  },
};

// Analytics API
export const analyticsApi = {
  getCategories: (month, year) => {
    const query = new URLSearchParams();
    if (month) query.append('month', month);
    if (year) query.append('year', year);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/analytics/categories${queryString}`, { method: 'GET' });
  },
  getMonthlyTrends: (year) => {
    const query = new URLSearchParams();
    if (year) query.append('year', year);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/analytics/monthly-trends${queryString}`, { method: 'GET' });
  },
};

// Profile API
export const profileApi = {
  getProfile: () => request('/profile', { method: 'GET' }),
  updateProfile: (payload) => request('/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  changePassword: (payload) => request('/profile/change-password', { method: 'POST', body: JSON.stringify(payload) }),
  deleteAccount: async (payload) => {
    try {
      return await request('/profile/account', { method: 'DELETE', body: JSON.stringify(payload) });
    } finally {
      localStorage.removeItem('spendwise_token');
    }
  },
};
