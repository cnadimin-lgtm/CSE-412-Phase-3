import React, { useState, useEffect } from 'react'
import { categoryApi } from '../api/transactionApi'

const AddTransactionForm = ({ onSubmit, onCancel, editingTransaction }) => {
  const [formData, setFormData] = useState({
    amount: '',
    categoryID: '',
    txnDate: new Date().toISOString().split('T')[0],
    txnType: 'Expense',
    description: ''
  })

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const transactionTypes = ['Income', 'Expense']

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const response = await categoryApi.getAllCategories()
        // Handle both API response and mock data structures
        const categoryList = response.data.data || response.data || [
          { categoryID: 1, categoryName: 'Food' },
          { categoryID: 2, categoryName: 'Rent' },
          { categoryID: 3, categoryName: 'Transport' },
          { categoryID: 4, categoryName: 'Entertainment' },
          { categoryID: 5, categoryName: 'Utilities' },
          { categoryID: 6, categoryName: 'Health' },
          { categoryID: 7, categoryName: 'Other' }
        ]
        setCategories(categoryList)
        // Set default category if not editing
        if (!editingTransaction && categoryList.length > 0) {
          setFormData(prev => ({
            ...prev,
            categoryID: categoryList[0].categoryID
          }))
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
        // Fallback to mock categories
        const mockCategories = [
          { categoryID: 1, categoryName: 'Food' },
          { categoryID: 2, categoryName: 'Rent' },
          { categoryID: 3, categoryName: 'Transport' },
          { categoryID: 4, categoryName: 'Entertainment' },
          { categoryID: 5, categoryName: 'Utilities' },
          { categoryID: 6, categoryName: 'Health' },
          { categoryID: 7, categoryName: 'Other' }
        ]
        setCategories(mockCategories)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Pre-fill form if editing
  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        amount: editingTransaction.amount,
        categoryID: editingTransaction.categoryID,
        txnDate: editingTransaction.txnDate,
        txnType: editingTransaction.txnType,
        description: editingTransaction.description || ''
      })
    }
  }, [editingTransaction])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (!formData.categoryID) {
      alert('Please select a category')
      return
    }

    if (!formData.txnDate) {
      alert('Please select a date')
      return
    }

    if (!formData.txnType) {
      alert('Please select a transaction type')
      return
    }

    onSubmit(formData)
    
    // Reset form
    setFormData({
      amount: '',
      categoryID: categories.length > 0 ? categories[0].categoryID : '',
      txnDate: new Date().toISOString().split('T')[0],
      txnType: 'Expense',
      description: ''
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
              disabled={loading}
            />
          </div>

          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              name="txnType"
              value={formData.txnType}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={loading}
            >
              {transactionTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown (using categoryID) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              name="categoryID"
              value={formData.categoryID}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={loading}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.categoryID} value={cat.categoryID}>
                  {cat.categoryName}
                </option>
              ))}
            </select>
          </div>

          {/* Date Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              name="txnDate"
              value={formData.txnDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={loading}
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-gray-500">(Optional)</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add a note about this transaction..."
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            disabled={loading}
          />
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2.5 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddTransactionForm
