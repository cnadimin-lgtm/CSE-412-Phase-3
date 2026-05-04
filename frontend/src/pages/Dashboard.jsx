import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Summary from '../components/Summary'
import BudgetStatus from '../components/BudgetStatus'
import TransactionTable from '../components/TransactionTable'
import AddTransactionForm from '../components/AddTransactionForm'
import CategoryPanel from '../components/CategoryPanel'
import {
  dashboardApi,
  transactionApi,
  categoryApi,
} from '../api/transactionApi'

const Dashboard = ({ user, onLogout }) => {
  const uid = user.uid
  const [transactions, setTransactions] = useState([])
  const [dashboardBuckets, setDashboardBuckets] = useState([])
  const [categories, setCategories] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = useCallback(async (opts = {}) => {
    const showSpinner = opts.showSpinner === true
    setError(null)
    if (showSpinner) setIsLoading(true)
    const detailFrom = (reason) => {
      const d = reason?.response?.data?.detail
      if (typeof d === 'string') return d
      return reason?.message || String(reason)
    }
    try {
      const [dashR, txnR, catR] = await Promise.allSettled([
        dashboardApi.getDashboard(uid),
        transactionApi.getTransactions(uid),
        categoryApi.getCategories(uid),
      ])
      const failed = []
      if (dashR.status === 'fulfilled') {
        const rows = dashR.value.data
        setDashboardBuckets(Array.isArray(rows) ? [...rows] : [])
      } else failed.push(`Dashboard: ${detailFrom(dashR.reason)}`)
      if (txnR.status === 'fulfilled') {
        const rows = txnR.value.data
        setTransactions(Array.isArray(rows) ? [...rows] : [])
      } else failed.push(`Transactions: ${detailFrom(txnR.reason)}`)
      if (catR.status === 'fulfilled') {
        const rows = catR.value.data
        setCategories(Array.isArray(rows) ? [...rows] : [])
      } else failed.push(`Categories: ${detailFrom(catR.reason)}`)
      if (failed.length) setError(failed.join(' · '))
    } finally {
      if (showSpinner) setIsLoading(false)
    }
  }, [uid])

  useEffect(() => {
    loadData({ showSpinner: true })
  }, [loadData])

  const budgetCategoryIds = useMemo(
    () => new Set((dashboardBuckets || []).map((b) => b.categoryid)),
    [dashboardBuckets],
  )

  const { income, expenses } = useMemo(() => {
    let inc = 0
    let exp = 0
    transactions.forEach((t) => {
      const a = Number(t.amount)
      if (t.type === 'INCOME') inc += a
      else if (t.type === 'EXPENSE') exp += a
    })
    return { income: inc, expenses: exp }
  }, [transactions])

  const handleAddOrUpdateTransaction = async (payload) => {
    setError(null)
    try {
      if (editingTransaction) {
        await transactionApi.updateTransaction(editingTransaction.txnid, payload)
      } else {
        await transactionApi.createTransaction(payload)
      }
      setShowForm(false)
      setEditingTransaction(null)
      await loadData()
    } catch (err) {
      const d = err.response?.data?.detail
      const msg = typeof d === 'string' ? d : err.message || 'Request failed'
      setError(msg)
    }
  }

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction)
    setShowForm(true)
  }

  const handleDeleteTransaction = async (txnid) => {
    setError(null)
    try {
      await transactionApi.deleteTransaction(txnid, uid)
      await loadData()
    } catch (err) {
      const d = err.response?.data?.detail
      setError(typeof d === 'string' ? d : err.message || 'Delete failed')
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingTransaction(null)
  }

  return (
    <main className="page-bg">
      <header className="panel border-b border-wine-850/50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-stone-100">
                Student Budgeting
              </h1>
              <p className="text-stone-300 mt-1">
                Signed in as <span className="text-stone-200">{user.username}</span>
                {' · '}
                {user.email}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingTransaction(null)
                  setShowForm(!showForm)
                }}
                className="btn-primary px-5 py-2.5"
              >
                {showForm ? 'Close form' : '+ Add transaction'}
              </button>
              <button type="button" onClick={onLogout} className="btn-muted px-4 py-2.5">
                Log out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/45 border border-red-900/50 text-red-200 text-sm">
            {error}
          </div>
        )}

        {showForm && (
          <AddTransactionForm
            uid={uid}
            categories={categories}
            onSubmit={handleAddOrUpdateTransaction}
            onCancel={handleCloseForm}
            editingTransaction={editingTransaction}
          />
        )}

        <Summary totalIncome={income} totalExpenses={expenses} />

        <div className="mb-6">
          <BudgetStatus
            uid={uid}
            buckets={dashboardBuckets}
            onRefresh={loadData}
          />
        </div>

        <CategoryPanel
          uid={uid}
          categories={categories}
          budgetCategoryIds={budgetCategoryIds}
          onChanged={loadData}
        />

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
