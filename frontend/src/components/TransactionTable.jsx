import React, { useMemo } from 'react'

const displayType = (t) => {
  if (t === 'INCOME') return 'Income'
  if (t === 'EXPENSE') return 'Expense'
  return t
}

const TransactionTable = ({
  transactions,
  categories,
  onEdit,
  onDelete,
  isLoading,
}) => {
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const categoryMap = useMemo(() => {
    const map = {}
    ;(categories || []).forEach((cat) => {
      map[cat.categoryid] = cat.categoryname
    })
    return map
  }, [categories])

  const getCategoryNameFromID = (categoryID) =>
    categoryMap[categoryID] || 'Unknown'

  const typeStyle = (type) =>
    type === 'INCOME'
      ? 'bg-emerald-950/60 text-emerald-200 border border-emerald-800/40'
      : 'bg-rose-950/50 text-rose-200 border border-rose-900/40'

  if (isLoading) {
    return (
      <div className="card-panel p-6">
        <div className="flex justify-center items-center h-36">
          <div className="text-stone-300">Loading transactions…</div>
        </div>
      </div>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="card-panel p-6">
        <h2 className="text-xl font-bold text-stone-100 mb-3">
          Recent transactions
        </h2>
        <p className="text-stone-300 text-center py-8">
          No transactions yet. Add one using the button above.
        </p>
      </div>
    )
  }

  return (
    <div className="card-panel overflow-hidden">
      <div className="p-5 border-b border-wine-850/50">
        <h2 className="text-xl font-bold text-stone-100">Recent transactions</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-wine-950/60 border-b border-wine-850/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-stone-300">
                Date
              </th>
              <th className="px-4 py-3 text-left font-semibold text-stone-300">
                Category
              </th>
              <th className="px-4 py-3 text-right font-semibold text-stone-300">
                Amount
              </th>
              <th className="px-4 py-3 text-center font-semibold text-stone-300">
                Type
              </th>
              <th className="px-4 py-3 text-center font-semibold text-stone-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => {
              const categoryName = getCategoryNameFromID(transaction.categoryid)
              const typ = transaction.type
              return (
                <tr
                  key={transaction.txnid}
                  className="border-b border-wine-900/40 hover:bg-wine-950/30 transition-colors"
                >
                  <td className="px-4 py-3 text-stone-200 whitespace-nowrap">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-4 py-3 text-stone-100 font-medium">
                    {categoryName}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-stone-100">
                    {formatCurrency(Number(transaction.amount))}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${typeStyle(typ)}`}
                    >
                      {displayType(typ)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center flex-wrap">
                      <button
                        type="button"
                        onClick={() => onEdit(transaction)}
                        className="px-3 py-1 rounded-md text-xs font-medium bg-wine-850/80 hover:bg-wine-850 text-stone-100 border border-wine-700/50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              'Delete this transaction? This cannot be undone.',
                            )
                          ) {
                            onDelete(transaction.txnid)
                          }
                        }}
                        className="px-3 py-1 rounded-md text-xs font-medium bg-rose-950/70 hover:bg-rose-900 text-rose-100 border border-rose-900/50"
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
