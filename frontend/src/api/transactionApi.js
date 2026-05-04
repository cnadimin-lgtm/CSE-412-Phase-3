import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const authApi = {
  login: (payload) => api.post('/auth/login', payload),
}

export const dashboardApi = {
  getDashboard: (uid) => api.get(`/users/${uid}/dashboard`),
}

export const categoryApi = {
  getCategories: (uid) => api.get(`/users/${uid}/categories`),
  createCategory: (payload) => api.post('/categories', payload),
  updateCategory: (categoryid, payload) =>
    api.put(`/categories/${categoryid}`, payload),
  deleteCategory: (categoryid, uid) =>
    api.delete(`/categories/${categoryid}`, { params: { uid } }),
}

export const budgetApi = {
  getBudgets: (uid) => api.get(`/users/${uid}/budgets`),
  createBudget: (payload) => api.post('/budgets', payload),
  updateBudget: (budgetid, payload) =>
    api.put(`/budgets/${budgetid}`, payload),
  deleteBudget: (budgetid, uid) =>
    api.delete(`/budgets/${budgetid}`, { params: { uid } }),
}

export const transactionApi = {
  getTransactions: (uid) => api.get(`/users/${uid}/transactions`),
  createTransaction: (payload) => api.post('/transactions', payload),
  updateTransaction: (txnid, payload) =>
    api.put(`/transactions/${txnid}`, payload),
  deleteTransaction: (txnid, uid) =>
    api.delete(`/transactions/${txnid}`, { params: { uid } }),
}

export default api
