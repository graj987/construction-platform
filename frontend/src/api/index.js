import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err.response?.data || err)
);

// ─── CLIENTS ──────────────────────────────────────────────────────────────────
export const clientAPI = {
  getAll: (params) => api.get('/clients', { params }),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  getStats: () => api.get('/clients/stats'),
};

// ─── PROJECTS ─────────────────────────────────────────────────────────────────
export const projectAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getStats: () => api.get('/projects/stats'),
};

// ─── WORKERS ──────────────────────────────────────────────────────────────────
export const workerAPI = {
  getAll: (params) => api.get('/workers', { params }),
  getById: (id) => api.get(`/workers/${id}`),
  getProfile: (id) => api.get(`/workers/${id}/profile`),
  getStats: () => api.get('/workers/stats'),
  getByProject: (projectId) => api.get(`/workers/project/${projectId}`),
  create: (data) => api.post('/workers', data),
  update: (id, data) => api.put(`/workers/${id}`, data),
  delete: (id) => api.delete(`/workers/${id}`),
};

// ─── ADVANCES ─────────────────────────────────────────────────────────────────
export const advanceAPI = {
  getAll: (params) => api.get('/advances', { params }),
  getWorkerSummary: (workerId) => api.get(`/advances/worker/${workerId}/summary`),
  create: (data) => api.post('/advances', data),
  update: (id, data) => api.put(`/advances/${id}`, data),
  delete: (id) => api.delete(`/advances/${id}`),
};

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────
export const attendanceAPI = {
  get: (params) => api.get('/attendance', { params }),
  getProjectDay: (projectId, date) => api.get(`/attendance/project/${projectId}/date/${date}`),
  mark: (data) => api.post('/attendance', data),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  getMonthlyReport: (params) => api.get('/attendance/monthly-report', { params }),
};

// ─── SALARY ───────────────────────────────────────────────────────────────────
export const salaryAPI = {
  getAll: (params) => api.get('/salary', { params }),
  preview: (params) => api.get('/salary/preview', { params }),
  calculate: (data) => api.post('/salary', data),
  update: (id, data) => api.put(`/salary/${id}`, data),
  markPaid: (id, data) => api.put(`/salary/${id}/pay`, data),
  delete: (id) => api.delete(`/salary/${id}`),
};

// ─── MATERIALS ────────────────────────────────────────────────────────────────
export const materialAPI = {
  getAll: (params) => api.get('/materials', { params }),
  getSummary: (params) => api.get('/materials/summary', { params }),
  create: (data) => api.post('/materials', data),
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`),
};

// ─── EXPENSES ─────────────────────────────────────────────────────────────────
export const expenseAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getById: (id) => api.get(`/expenses/${id}`),
  getStats: () => api.get('/expenses/stats'),
  getReport: (params) => api.get('/expenses/report', { params }),
  getProfitability: () => api.get('/expenses/profitability'),
  getProjectCosts: (projectId) => api.get(`/expenses/project/${projectId}/costs`),
  create: (formData) => api.post('/expenses', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => {
    if (data instanceof FormData)
      return api.put(`/expenses/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    return api.put(`/expenses/${id}`, data);
  },
  delete: (id) => api.delete(`/expenses/${id}`),
  deleteBill: (id) => api.delete(`/expenses/${id}/bill`),
};

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────
export const paymentAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  getStats: () => api.get('/payments/stats'),
  getCashFlow: () => api.get('/payments/cash-flow'),
  getReceivables: () => api.get('/payments/receivables'),
  getProjectPayments: (projectId) => api.get(`/payments/project/${projectId}`),

  create: (formData) =>
    api.post('/payments', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => {
    if (data instanceof FormData)
      return api.put(`/payments/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    return api.put(`/payments/${id}`, data);
  },
  delete: (id) => api.delete(`/payments/${id}`),
  deleteReceipt: (id) => api.delete(`/payments/${id}/receipt`),
};

// ─── MILESTONES ───────────────────────────────────────────────────────────────
export const milestoneAPI = {
  getAll: (params) => api.get('/milestones', { params }),
  create: (data) => api.post('/milestones', data),
  update: (id, data) => api.put(`/milestones/${id}`, data),
  delete: (id) => api.delete(`/milestones/${id}`),
};

// ─── QUOTATIONS ───────────────────────────────────────────────────────────────
export const quotationAPI = {
  getAll: (params) => api.get('/quotations', { params }),
  getById: (id) => api.get(`/quotations/${id}`),
  generate: (data) => api.post('/quotations/generate', data),
  update: (id, data) => api.put(`/quotations/${id}`, data),
  getRates: () => api.get('/quotations/rates'),
};

// ─── DIARY ────────────────────────────────────────────────────────────────────
export const diaryAPI = {
  getAll: (params) => api.get('/diary', { params }),
  create: (formData) => api.post('/diary', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/diary/${id}`, data),
  delete: (id) => api.delete(`/diary/${id}`),
};

// ─── CONTACT ──────────────────────────────────────────────────────────────────
export const contactAPI = {
  submit: (data) => api.post('/contact', data),
  getAll: (params) => api.get('/contact', { params }),
  markRead: (id) => api.put(`/contact/${id}/read`),
  convertToClient: (id) => api.post(`/contact/${id}/convert`),
};

// ─── PLANNER ──────────────────────────────────────────────────────────────────
export const plannerAPI = {
  generate:      (data) => api.post('/planner/generate', data),
  calculateCost: (data) => api.post('/planner/calculate-cost', data),
  getReports:    ()     => api.get('/planner/reports'),
  chat:          (data) => api.post('/planner/chat', data),
  // ai-generate uses raw fetch (SSE streaming) — see AIPlannerPage
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;
