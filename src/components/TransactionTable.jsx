import React, { useMemo } from 'react'

const TransactionTable = ({ transactions, categories, onEdit, onDelete, isLoading }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const getTypeColor = (type) => {
    return type === 'Income' ? 'text-green-600' : 'text-red-600'
  }

  const getTypeBackground = (type) => {
    return type === 'Income' ? 'bg-green-100' : 'bg-red-100'
  }

  // Create a map of categoryID to categoryName
  const categoryMap = useMemo(() => {
    const map = {}
    categories.forEach(cat => {
      map[cat.categoryID] = cat.categoryName
    })
    return map
  }, [categories])

  const getCategoryIcon = (categoryName) => {
    const icons = {
      'Food': '🍔',
      'Rent': '🏠',
      'Transport': '🚗',
      'Entertainment': '🎬',
      'Utilities': '💡',
      'Health': '🏥',
      'Other': '📦'
    }
    return icons[categoryName] || '💰'
  }

  // Get category name from categoryID
  const getCategoryNameFromID = (categoryID) => {
    return categoryMap[categoryID] || 'Unknown'
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-40">
          <div className="text-gray-500">Loading transactions...</div>
        </div>
      </div>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Transactions</h2>
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No transactions yet. Start by adding your first transaction!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">Recent Transactions</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Amount</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Type</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => {
              const categoryName = getCategoryNameFromID(transaction.categoryID)
              return (
                <tr key={transaction.txnID} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatDate(transaction.txnDate)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="text-lg">{getCategoryIcon(categoryName)}</span>
                    <span className="ml-2 text-gray-900 font-medium">{categoryName}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {transaction.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-right">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getTypeBackground(transaction.txnType)} ${getTypeColor(transaction.txnType)}`}>
                      {transaction.txnType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => onEdit(transaction)}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this transaction?')) {
                            onDelete(transaction.txnID)
                          }
                        }}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TransactionTable
