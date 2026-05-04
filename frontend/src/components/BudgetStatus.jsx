import React, { useState } from 'react'
import { budgetApi } from '../api/transactionApi'

const BudgetStatus = ({ uid, buckets, onRefresh }) => {
  const [editingId, setEditingId] = useState(null)
  const [draftLimit, setDraftLimit] = useState('')
  const [saving, setSaving] = useState(false)
  const [localError, setLocalError] = useState(null)

  const getPercentage = (spent, limit) => {
    if (!limit || limit === 0) return 0
    return Math.min((spent / limit) * 100, 100)
  }

  const startEdit = (row) => {
    setLocalError(null)
    setEditingId(row.budgetid)
    setDraftLimit(String(row.limitamount))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraftLimit('')
    setLocalError(null)
  }

  const saveLimit = async (budgetid) => {
    const val = parseFloat(draftLimit)
    if (Number.isNaN(val) || val < 0) {
      setLocalError('Enter a valid limit (≥ 0).')
      return
    }
    setSaving(true)
    setLocalError(null)
    try {
      await budgetApi.updateBudget(budgetid, { uid, limitamount: val })
      cancelEdit()
      await onRefresh()
    } catch (err) {
      const d = err.response?.data?.detail
      setLocalError(typeof d === 'string' ? d : err.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  if (!buckets || buckets.length === 0) {
    return (
      <div className="card-panel p-6">
        <h2 className="text-xl font-bold text-stone-100 mb-2">Budget buckets</h2>
        <p className="text-stone-300 text-center py-6">
          No budget rows yet. Create a category and add a budget.
        </p>
      </div>
    )
  }

  return (
    <div className="card-panel p-6">
      <h2 className="text-xl font-bold text-stone-100 mb-4">Budget buckets</h2>
      {localError && (
        <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-900/50 text-red-200 text-sm">
          {localError}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {buckets.map((row) => {
          const spent = Number(row.spent)
          const limit = Number(row.limitamount)
          const pct = getPercentage(spent, limit)
          const low = row.islow_computed
          const barColor = low
            ? 'bg-rose-600'
            : pct > 90
              ? 'bg-amber-600'
              : pct > 70
                ? 'bg-amber-700/80'
                : 'bg-emerald-700/90'

          return (
            <div
              key={row.budgetid}
              className="p-4 rounded-lg bg-wine-950/40 border border-wine-850/40 hover:border-rose-900/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-stone-100 truncate">
                    {row.categoryname}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full text-white shrink-0 ${
                    low ? 'bg-rose-700' : 'bg-wine-850'
                  }`}
                >
                  {low ? 'Low balance' : 'OK'}
                </span>
              </div>

              <div className="space-y-1 text-sm text-stone-300 mb-3">
                <div className="flex justify-between">
                  <span>Balance</span>
                  <span className="font-medium text-stone-100">
                    ${Number(row.current_balance).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Spent</span>
                  <span>${spent.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining (vs limit)</span>
                  <span>${Number(row.remaining_budget).toFixed(2)}</span>
                </div>
              </div>

              <div className="w-full bg-wine-950/80 rounded-full h-2 overflow-hidden mb-3">
                <div
                  className={`h-full ${barColor} transition-all`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>

              {editingId === row.budgetid ? (
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-stone-300">Budget limit ($)</label>
                  <input
                    type="number"
                    min="0"
                    max="99999999.99"
                    step="0.01"
                    value={draftLimit}
                    onChange={(e) => setDraftLimit(e.target.value)}
                    className="input-field text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => saveLimit(row.budgetid)}
                      className="btn-primary flex-1 py-2 text-sm"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="btn-muted flex-1 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-stone-300">
                    Limit: <span className="text-stone-100">${limit.toFixed(2)}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => startEdit(row)}
                    className="text-xs font-medium text-rose-300 hover:text-rose-200"
                  >
                    Edit limit
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BudgetStatus
