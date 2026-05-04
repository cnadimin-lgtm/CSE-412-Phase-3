import React, { useState } from 'react'
import { budgetApi, categoryApi } from '../api/transactionApi'

const CategoryPanel = ({ uid, categories, budgetCategoryIds, onChanged }) => {
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [budgetLimitByCategory, setBudgetLimitByCategory] = useState({})

  const refresh = async () => {
    await onChanged()
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setBusy(true)
    setError(null)
    try {
      await categoryApi.createCategory({ uid, categoryname: name })
      setNewName('')
      await refresh()
    } catch (err) {
      const d = err.response?.data?.detail
      setError(typeof d === 'string' ? d : err.message || 'Could not create category')
    } finally {
      setBusy(false)
    }
  }

  const startEdit = (c) => {
    setEditId(c.categoryid)
    setEditName(c.categoryname)
    setError(null)
  }

  const cancelEdit = () => {
    setEditId(null)
    setEditName('')
  }

  const saveEdit = async (categoryid) => {
    const name = editName.trim()
    if (!name) return
    setBusy(true)
    setError(null)
    try {
      await categoryApi.updateCategory(categoryid, { uid, categoryname: name })
      cancelEdit()
      await refresh()
    } catch (err) {
      const d = err.response?.data?.detail
      setError(typeof d === 'string' ? d : err.message || 'Could not update')
    } finally {
      setBusy(false)
    }
  }

  const hasBudget = (categoryid) =>
    budgetCategoryIds && budgetCategoryIds.has(categoryid)

  const setBudgetLimitField = (categoryid, value) => {
    setBudgetLimitByCategory((prev) => ({ ...prev, [categoryid]: value }))
  }

  const handleCreateBudget = async (categoryid) => {
    const raw = (budgetLimitByCategory[categoryid] || '').trim()
    const val = parseFloat(raw)
    if (Number.isNaN(val) || val < 0) {
      setError('Enter a valid budget limit (0 or more).')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await budgetApi.createBudget({ uid, categoryid, limitamount: val })
      setBudgetLimitByCategory((prev) => {
        const next = { ...prev }
        delete next[categoryid]
        return next
      })
      await refresh()
    } catch (err) {
      const d = err.response?.data?.detail
      setError(typeof d === 'string' ? d : err.message || 'Could not create budget')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (categoryid) => {
    if (!confirm('Delete this category? Only allowed if it has no transactions.')) return
    setBusy(true)
    setError(null)
    try {
      await categoryApi.deleteCategory(categoryid, uid)
      await refresh()
    } catch (err) {
      const d = err.response?.data?.detail
      setError(typeof d === 'string' ? d : err.message || 'Could not delete')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card-panel p-6 mb-6">
      <h2 className="text-xl font-bold text-stone-100 mb-3">Categories</h2>
      <p className="text-sm text-stone-300 mb-4">
        Categories are per-user spending buckets. Add a budget separately for limits.
      </p>
      {error && (
        <div className="mb-3 p-3 rounded-lg bg-red-950/40 border border-red-900/50 text-red-200 text-sm">
          {error}
        </div>
      )}
      <ul className="space-y-2 mb-4">
        {(categories || []).map((c) => (
          <li
            key={c.categoryid}
            className="flex flex-wrap items-center gap-2 justify-between py-2 border-b border-wine-900/40"
          >
            {editId === c.categoryid ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-field flex-1 min-w-[140px] text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => saveEdit(c.categoryid)}
                    className="btn-primary px-3 py-1.5 text-sm"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="btn-muted px-3 py-1.5 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <span className="text-stone-100 font-medium">{c.categoryname}</span>
                  {!hasBudget(c.categoryid) && (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="99999999.99"
                        step="0.01"
                        placeholder="Budget limit"
                        value={budgetLimitByCategory[c.categoryid] ?? ''}
                        onChange={(e) =>
                          setBudgetLimitField(c.categoryid, e.target.value)
                        }
                        className="input-field max-w-[140px] text-sm py-1.5"
                        disabled={busy}
                      />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleCreateBudget(c.categoryid)}
                        className="text-xs font-medium text-rose-300 hover:text-rose-200"
                      >
                        Set budget
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(c)}
                    className="text-xs text-rose-300 hover:text-rose-200"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.categoryid)}
                    className="text-xs text-stone-500 hover:text-rose-400"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          className="input-field flex-1 text-sm"
          disabled={busy}
        />
        <button type="submit" disabled={busy} className="btn-primary px-4 py-2 text-sm shrink-0">
          Add category
        </button>
      </form>
    </div>
  )
}

export default CategoryPanel
