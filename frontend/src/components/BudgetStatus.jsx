import React, { useState } from 'react'
import { budgetApi } from '../api/transactionApi'

/** Same as category_bucket_summary.islow_computed: current_balance <= limitamount (floor). */
function computeIsLow(currentBalance, floor) {
  const b = Number(currentBalance)
  const f = Number(floor)
  if (Number.isNaN(b) || Number.isNaN(f)) return false
  return b <= f + 1e-9
}

const BudgetStatus = ({ uid, buckets, onRefresh }) => {
  const [editingId, setEditingId] = useState(null)
  const [draftLimit, setDraftLimit] = useState('')
  const [saving, setSaving] = useState(false)
  const [localError, setLocalError] = useState(null)

  /** Share of category income still in the bucket (balance / allocated). Moves when you add income or spend. */
  const balanceRetentionPct = (balance, allocated) => {
    const a = Number(allocated)
    const b = Number(balance)
    if (!a || a <= 0 || Number.isNaN(a) || Number.isNaN(b)) return 0
    return Math.min(100, Math.max(0, (b / a) * 100))
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
      setLocalError('Enter a valid floor (≥ 0).')
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
          No budget rows yet. Set a low-balance floor on a category first.
        </p>
      </div>
    )
  }

  return (
    <div className="card-panel p-6">
      <h2 className="text-xl font-bold text-stone-100 mb-1">Budget buckets</h2>
      <p className="text-xs text-stone-300 mb-4 leading-relaxed">
        The floor is the lowest balance allowed before the card is marked low. If current balance is
        at or below the floor, you get a low warning. Raising the floor makes the warning easier to
        trigger; lowering it (or setting $0) only flags when the balance is at the bottom.
      </p>
      {localError && (
        <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-900/50 text-red-200 text-sm">
          {localError}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {buckets.map((row) => {
          const spent = Number(row.spent)
          const allocated = Number(row.allocated)
          const floor = Number(row.limitamount)
          const bal = Number(row.current_balance)
          const pct = balanceRetentionPct(bal, allocated)
          const low =
            typeof row.islow_computed === 'boolean'
              ? row.islow_computed
              : computeIsLow(row.current_balance, row.limitamount)
          const barColor = low
            ? 'bg-rose-600'
            : pct < 15
              ? 'bg-amber-600'
              : pct < 35
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
                  <span>Income in category</span>
                  <span>${allocated.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Spent</span>
                  <span>${spent.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Buffer (balance − floor)</span>
                  <span>${Number(row.remaining_budget).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-wine-850/40">
                  <span>Low if balance ≤</span>
                  <span className="text-stone-200">${floor.toFixed(2)}</span>
                </div>
              </div>

              <div
                className="w-full bg-wine-950/80 rounded-full h-2 overflow-hidden mb-1"
                title="Share of category income still in balance"
              >
                <div
                  className={`h-full ${barColor} transition-all`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-stone-500 mb-3">
                Bar = balance ÷ income in category (updates on income and expenses)
              </p>

              {editingId === row.budgetid ? (
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-stone-300">Low balance floor ($)</label>
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
                    Floor: <span className="text-stone-100">${floor.toFixed(2)}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => startEdit(row)}
                    className="text-xs font-medium text-rose-300 hover:text-rose-200"
                  >
                    Edit floor
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
