import React, { useState, useEffect } from 'react'
import Summary from '../components/Summary'
import BudgetStatus from '../components/BudgetStatus'
import TransactionTable from '../components/TransactionTable'
import AddTransactionForm from '../components/AddTransactionForm'
import { transactionApi, budgetApi, categoryApi } from '../api/transactionApi'

const Dashboard = () => {
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Mock user ID (in real app, this would come from authentication)
  const uid = 1

  // Mock categories data
  const mockCategories = [
    { categoryID: 1, categoryName: 'Food' },
    { categoryID: 2, categoryName: 'Rent' },
    { categoryID: 3, categoryName: 'Transport' },
    { categoryID: 4, categoryName: 'Entertainment' },
    { categoryID: 5, categoryName: 'Utilities' },
    { categoryID: 6, categoryName: 'Health' },
    { categoryID: 7, categoryName: 'Other' }
  ]

  // Mock budgets data (with isLow flag based on schema)
  const mockBudgets = [
    { categoryID: 1, budgetLimit: 300, isLow: false },
    { categoryID: 2, budgetLimit: 1200, isLow: false },
    { categoryID: 3, budgetLimit: 150, isLow: false },
    { categoryID: 4, budgetLimit: 100, isLow: false },
    { categoryID: 5, budgetLimit: 150, isLow: false },
    { categoryID: 6, budgetLimit: 100, isLow: true },
    { categoryID: 7, budgetLimit: 100, isLow: false }
  ]

  // Mock transactions data (25+ transactions across 5+ categories)
  const mockTransactions = [
    { txnID: 1, uid: 1, categoryID: 1, amount: 45.50, txnType: 'Expense', txnDate: '2024-05-01', description: 'Grocery shopping' },
    { txnID: 2, uid: 1, categoryID: 2, amount: 1200, txnType: 'Expense', txnDate: '2024-05-02', description: 'Monthly rent' },
    { txnID: 3, uid: 1, categoryID: 3, amount: 30, txnType: 'Expense', txnDate: '2024-05-03', description: 'Gas' },
    { txnID: 4, uid: 1, categoryID: 4, amount: 25, txnType: 'Expense', txnDate: '2024-05-04', description: 'Movie tickets' },
    { txnID: 5, uid: 1, categoryID: 1, amount: 500, txnType: 'Income', txnDate: '2024-05-05', description: 'Part-time job' },
    { txnID: 6, uid: 1, categoryID: 1, amount: 35.75, txnType: 'Expense', txnDate: '2024-05-06', description: 'Restaurant' },
    { txnID: 7, uid: 1, categoryID: 5, amount: 80, txnType: 'Expense', txnDate: '2024-05-07', description: 'Electricity bill' },
    { txnID: 8, uid: 1, categoryID: 1, amount: 62.50, txnType: 'Expense', txnDate: '2024-05-08', description: 'Weekly groceries' },
    { txnID: 9, uid: 1, categoryID: 3, amount: 50, txnType: 'Expense', txnDate: '2024-05-09', description: 'Bus pass' },
    { txnID: 10, uid: 1, categoryID: 4, amount: 15, txnType: 'Expense', txnDate: '2024-05-10', description: 'Concert ticket' },
    { txnID: 11, uid: 1, categoryID: 1, amount: 28.90, txnType: 'Expense', txnDate: '2024-05-11', description: 'Coffee and snacks' },
    { txnID: 12, uid: 1, categoryID: 5, amount: 45, txnType: 'Expense', txnDate: '2024-05-12', description: 'Water bill' },
    { txnID: 13, uid: 1, categoryID: 6, amount: 120, txnType: 'Expense', txnDate: '2024-05-13', description: 'Doctor visit' },
    { txnID: 14, uid: 1, categoryID: 3, amount: 40, txnType: 'Expense', txnDate: '2024-05-14', description: 'Uber ride' },
    { txnID: 15, uid: 1, categoryID: 1, amount: 55, txnType: 'Expense', txnDate: '2024-05-15', description: 'Farmer market' },
    { txnID: 16, uid: 1, categoryID: 4, amount: 35, txnType: 'Expense', txnDate: '2024-05-16', description: 'Gaming subscription' },
    { txnID: 17, uid: 1, categoryID: 2, amount: 1200, txnType: 'Expense', txnDate: '2024-05-17', description: 'June rent payment' },
    { txnID: 18, uid: 1, categoryID: 1, amount: 32.40, txnType: 'Expense', txnDate: '2024-05-18', description: 'Fast food' },
    { txnID: 19, uid: 1, categoryID: 5, amount: 60, txnType: 'Expense', txnDate: '2024-05-19', description: 'Internet bill' },
    { txnID: 20, uid: 1, categoryID: 1, amount: 1200, txnType: 'Income', txnDate: '2024-05-20', description: 'Scholarship stipend' },
    { txnID: 21, uid: 1, categoryID: 3, amount: 85, txnType: 'Expense', txnDate: '2024-05-21', description: 'Car maintenance' },
    { txnID: 22, uid: 1, categoryID: 4, amount: 50, txnType: 'Expense', txnDate: '2024-05-22', description: 'Streaming service' },
    { txnID: 23, uid: 1, categoryID: 1, amount: 71.30, txnType: 'Expense', txnDate: '2024-05-23', description: 'Restaurant dinner' },
    { txnID: 24, uid: 1, categoryID: 6, amount: 25, txnType: 'Expense', txnDate: '2024-05-24', description: 'Pharmacy' },
    { txnID: 25, uid: 1, categoryID: 5, amount: 100, txnType: 'Expense', txnDate: '2024-05-25', description: 'Phone bill' },
    { txnID: 26, uid: 1, categoryID: 1, amount: 40, txnType: 'Expense', txnDate: '2024-05-26', description: 'Lunch with friends' },
    { txnID: 27, uid: 1, categoryID: 4, amount: 12, txnType: 'Expense', txnDate: '2024-05-27', description: 'Book purchase' },
    { txnID: 28, uid: 1, categoryID: 3, amount: 65, txnType: 'Expense', txnDate: '2024-05-28', description: 'Gas refill' },
  ]

  // Initialize with mock data
  useEffect(() => {
    setCategories(mockCategories)
    setBudgets(mockBudgets)
    setTransactions(mockTransactions)
  }, [])

  // Calculate totals
  const calculateTotals = () => {
    let income = 0
    let expenses = 0

    transactions.forEach(transaction => {
      if (transaction.txnType === 'Income') {
        income += parseFloat(transaction.amount)
      } else {
        expenses += parseFloat(transaction.amount)
      }
    })

    return { income, expenses }
  }

  // Calculate category expenses
  const calculateCategoryExpenses = () => {
    const expenses = {}
    budgets.forEach(budget => {
      expenses[budget.categoryID] = 0
    })

    transactions.forEach(transaction => {
      if (transaction.txnType === 'Expense' && expenses.hasOwnProperty(transaction.categoryID)) {
        expenses[transaction.categoryID] += parseFloat(transaction.amount)
      }
    })

    return expenses
  }

  const { income, expenses } = calculateTotals()
  const categoryExpenses = calculateCategoryExpenses()

  // Handle form submission
  const handleAddTransaction = (formData) => {
    // Generate new txnID
    const maxTxnID = transactions.length > 0 ? Math.max(...transactions.map(t => t.txnID || 0)) : 0
    const newTxnID = maxTxnID + 1

    const newTransaction = {
      txnID: newTxnID,
      uid: uid,
      categoryID: parseInt(formData.categoryID),
      amount: parseFloat(formData.amount),
      txnType: formData.txnType,
      txnDate: formData.txnDate,
      description: formData.description
    }

    if (editingTransaction) {
      // Update existing transaction
      setTransactions(transactions.map(t => t.txnID === editingTransaction.txnID ? 
        { ...t, ...newTransaction, txnID: t.txnID } : t))
      setEditingTransaction(null)
    } else {
      // Add new transaction
      setTransactions([newTransaction, ...transactions])
    }

    setShowForm(false)
    alert(`Transaction ${editingTransaction ? 'updated' : 'added'} successfully!`)
  }

  // Handle edit
  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction)
    setShowForm(true)
  }

  // Handle delete
  const handleDeleteTransaction = (txnID) => {
    setTransactions(transactions.filter(t => t.txnID !== txnID))
    alert('Transaction deleted successfully!')
  }

  // Handle form close
  const handleCloseForm = () => {
    setShowForm(false)
    setEditingTransaction(null)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Budget Management System</h1>
              <p className="text-gray-600 mt-2">Track your income and expenses</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105"
            >
              {showForm ? '✕ Close Form' : '+ Add Transaction'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Add Transaction Form */}
        {showForm && (
          <AddTransactionForm
            onSubmit={handleAddTransaction}
            onCancel={handleCloseForm}
            editingTransaction={editingTransaction}
          />
        )}

        {/* Summary Cards */}
        <Summary
          totalIncome={income}
          totalExpenses={expenses}
        />

        {/* Budget Status */}
        <BudgetStatus
          budgets={budgets}
          categoryExpenses={categoryExpenses}
          categories={categories}
        />

        {/* Transaction Table */}
        <div className="mt-6">
          <TransactionTable
            transactions={transactions}
            categories={categories}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            isLoading={isLoading}
          />
        </div>
      </div>
    </main>
  )
}

export default Dashboard
