import React, { useEffect, useState } from 'react'

const transactionTypes = [
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'INCOME', label: 'Income' },
]

const AddTransactionForm = ({
  uid,
  categories,
  onSubmit,
  onCancel,
  editingTransaction,
}) => {
  const [formData, setFormData] = useState({
    amount: '',
    categoryid: '',
    date: new Date().toISOString().split('T')[0],
    type: 'EXPENSE',
  })

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        amount: String(editingTransaction.amount),
        categoryid: editingTransaction.categoryid,
        date:
          typeof editingTransaction.date === 'string'
            ? editingTransaction.date.slice(0, 10)
            : new Date(editingTransaction.date).toISOString().split('T')[0],
        type: editingTransaction.type,
      })
      return
    }
    if (categories?.length) {
      setFormData((prev) => {
        const first = categories[0].categoryid
        const ids = categories.map((c) => Number(c.categoryid))
        const prevId = prev.categoryid === '' ? null : Number(prev.categoryid)
        const stillValid = prevId != null && ids.includes(prevId)
        return {
          ...prev,
          categoryid: stillValid ? prev.categoryid : first,
        }
      })
    }
  }, [editingTransaction, categories])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const amt = parseFloat(formData.amount)
    if (!formData.amount || Number.isNaN(amt) || amt <= 0) {
      alert('Please enter a valid amount greater than 0.')
      return
    }
    if (!formData.categoryid) {
      alert('Please select a category.')
      return
    }

    onSubmit({
      uid,
      categoryid: parseInt(formData.categoryid, 10),
      amount: amt,
      date: formData.date,
      type: formData.type,
    })
  }

  return (
    <div className="card-panel p-6 mb-6">
      <h2 className="text-xl font-bold text-stone-100 mb-4">
        {editingTransaction ? 'Edit transaction' : 'Add transaction'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-200 mb-1">
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
              max="99999999.99"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-200 mb-1">
              Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="input-field"
            >
              {transactionTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-200 mb-1">
              Category
            </label>
            <select
              name="categoryid"
              value={
                formData.categoryid === ''
                  ? ''
                  : String(formData.categoryid)
              }
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="">Select a category</option>
              {(categories || []).map((cat) => (
                <option key={cat.categoryid} value={String(cat.categoryid)}>
                  {cat.categoryname}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-200 mb-1">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
        </div>

        <p className="text-xs text-stone-300 leading-relaxed">
          New categories start at $0 balance: record an Income before an Expense. Use
          &quot;Set budget&quot; on the Categories list so the category appears in Budget
          buckets.
        </p>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary flex-1 py-2.5">
            {editingTransaction ? 'Save changes' : 'Add transaction'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-muted flex-1 py-2.5"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddTransactionForm
