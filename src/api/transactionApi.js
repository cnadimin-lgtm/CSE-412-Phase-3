import axios from 'axios'

// Configure base URL for API requests
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Category API endpoints
export const categoryApi = {
  // Get all categories
  getAllCategories: () => apiClient.get('/categories'),

  // Get category by ID
  getCategoryById: (categoryID) => apiClient.get(`/categories/${categoryID}`),
}

// Transaction API endpoints (using txnID as primary key)
export const transactionApi = {
  // Get all transactions for a user
  getAllTransactions: (uid) => apiClient.get(`/users/${uid}/transactions`),

  // Get transaction by txnID
  getTransactionById: (uid, txnID) => apiClient.get(`/users/${uid}/transactions/${txnID}`),

  // Create a new transaction (requires uid, categoryID, amount, txnType, txnDate)
  createTransaction: (uid, transactionData) => apiClient.post(`/users/${uid}/transactions`, transactionData),

  // Update a transaction (txnID is the primary key)
  updateTransaction: (uid, txnID, transactionData) => apiClient.put(`/users/${uid}/transactions/${txnID}`, transactionData),

  // Delete a transaction (txnID is the primary key)
  deleteTransaction: (uid, txnID) => apiClient.delete(`/users/${uid}/transactions/${txnID}`),

  // Get transactions by category
  getTransactionsByCategory: (uid, categoryID) => apiClient.get(`/users/${uid}/transactions/category/${categoryID}`),

  // Get transaction summary/statistics
  getTransactionSummary: (uid) => apiClient.get(`/users/${uid}/transactions/summary`),
}

// Budget API endpoints (using categoryID as key, associated with user uid)
export const budgetApi = {
  // Get all budgets for a user
  getAllBudgets: (uid) => apiClient.get(`/users/${uid}/budgets`),

  // Get budget for a specific category
  getBudget: (uid, categoryID) => apiClient.get(`/users/${uid}/budgets/${categoryID}`),

  // Get budget summary for user
  getBudgetSummary: (uid) => apiClient.get(`/users/${uid}/budgets/summary`),

  // Update budget for a category (includes isLow flag)
  updateBudget: (uid, categoryID, budgetData) => apiClient.put(`/users/${uid}/budgets/${categoryID}`, budgetData),
}

export default apiClient
