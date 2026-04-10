import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('cafe_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config;
    // retry once on network error or 5xx
    if (!config._retry && (!err.response || err.response.status >= 500)) {
      config._retry = true;
      await new Promise(r => setTimeout(r, 2000)); // wait 2s
      return api(config);
    }
    if (err.response?.status === 401) {
      sessionStorage.removeItem('cafe_token');
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

// api.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     if (err.response?.status === 401) {
//       sessionStorage.removeItem('cafe_token');
//       window.location.reload();
//     }
//     return Promise.reject(err);
//   }
// );

export const authAPI = {
  login:  (pin)   => api.post('/auth/login', { pin }),
  verify: (token) => api.post('/auth/verify', { token }),
};

export const productsAPI = {
  getAll: (params)   => api.get('/products', { params }),
  create: (data)     => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  toggle: (id)       => api.patch(`/products/${id}/toggle`),
  delete: (id)       => api.delete(`/products/${id}`),
};

export const expensesAPI = {
  getAll:     (params)   => api.get('/expenses', { params }),
  getSummary: (month)    => api.get('/expenses/summary', { params: { month } }),
  create:     (data)     => api.post('/expenses', data),
  update:     (id, data) => api.put(`/expenses/${id}`, data),
  delete:     (id)       => api.delete(`/expenses/${id}`),
};

export const withdrawalsAPI = {
  getAll:     (params)   => api.get('/withdrawals', { params }),
  getSummary: (month)    => api.get('/withdrawals/summary', { params: { month } }),
  create:     (data)     => api.post('/withdrawals', data),
  update:     (id, data) => api.put(`/withdrawals/${id}`, data),
  delete:     (id)       => api.delete(`/withdrawals/${id}`),
};

export const ordersAPI = {
  place:      (data)     => api.post('/orders', data),
  edit:       (id, data) => api.put(`/orders/${id}`, data),
  getAll:     (params)   => api.get('/orders', { params }),
  getSummary: (days)     => api.get('/orders/summary', { params: { days } }),
  getToday:   ()         => api.get('/orders/today'),
  getOne:     (id)       => api.get(`/orders/${id}`),
  cancel:     (id)       => api.patch(`/orders/${id}/cancel`),
};

export const settingsAPI = {
  getPublic: ()     => api.get('/settings'),
  getFull:   ()     => api.get('/settings/full'),
  update:    (data) => api.put('/settings', data),
};

export default api;