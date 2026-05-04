import React, { useMemo } from 'react'

const BudgetStatus = ({ budgets, categoryExpenses, categories }) => {
  const getPercentage = (spent, budget) => {
    if (budget === 0) return 0
    return Math.min((spent / budget) * 100, 100)
  }

  // Determine status color based on isLow boolean from database
  const getStatusColor = (budget) => {
    // If isLow is true in the database, apply danger styling
    if (budget.isLow) {
      return 'bg-red-500'
    }
    
    const percentage = getPercentage(categoryExpenses[budget.categoryID] || 0, budget.budgetLimit)
    if (percentage > 90) return 'bg-red-500'
    if (percentage > 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusText = (budget) => {
    if (budget.isLow) {
      return 'Alert: Low Budget'
    }
    
    const percentage = getPercentage(categoryExpenses[budget.categoryID] || 0, budget.budgetLimit)
    if (percentage > 90) return 'Over Budget'
    if (percentage > 70) return 'Warning'
    return 'On Track'
  }

  // Create a map of categoryID to categoryName
  const categoryMap = useMemo(() => {
    const map = {}
    categories.forEach(cat => {
      map[cat.categoryID] = cat.categoryName
    })
    return map
  }, [categories])

  const getCategoryName = (categoryID) => {
    return categoryMap[categoryID] || 'Unknown'
  }

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

  if (!budgets || budgets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Budget Status</h2>
        <div className="text-center py-8">
          <p className="text-gray-500">No budgets available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Budget Status</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((budget) => {
          const categoryName = getCategoryName(budget.categoryID)
          const spent = categoryExpenses[budget.categoryID] || 0
          const percentage = getPercentage(spent, budget.budgetLimit)
          const statusColor = getStatusColor(budget)
          const statusText = getStatusText(budget)

          return (
            <div key={budget.categoryID} className="p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getCategoryIcon(categoryName)}</span>
                  <span className="font-semibold text-gray-800">{categoryName}</span>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full text-white ${statusColor}`}>
                  {statusText}
                </span>
              </div>

              {/* Spent Amount */}
              <div className="mb-3">
                <div className="flex justify-between items-end mb-1">
                  <p className="text-sm text-gray-600">Spent</p>
                  <p className="text-lg font-bold text-gray-900">
                    ${spent.toFixed(2)}
                  </p>
                </div>
                <p className="text-xs text-gray-500">Budget: ${budget.budgetLimit.toFixed(2)}</p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full ${statusColor} transition-all duration-300 ease-out`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>

              {/* Percentage */}
              <div className="mt-2 text-right">
                <p className="text-xs font-medium text-gray-700">
                  {percentage.toFixed(0)}% of budget used
                </p>
                {budget.isLow && (
                  <p className="text-xs font-bold text-red-600 mt-1">
                    ⚠️ Budget marked as low
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BudgetStatus
