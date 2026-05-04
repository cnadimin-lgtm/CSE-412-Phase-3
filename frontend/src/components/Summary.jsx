import React from 'react'

const SummaryCard = ({ title, amount, subtext, variant }) => {
  const styles = {
    income: 'from-emerald-900/90 to-emerald-950/90 border-emerald-800/40',
    expense: 'from-rose-900/85 to-wine-950/90 border-rose-900/40',
    balance: 'from-indigo-950/85 to-wine-950/90 border-indigo-900/40',
  }

  return (
    <div
      className={`rounded-xl border p-5 text-stone-50 bg-gradient-to-br shadow-inner ${styles[variant]}`}
    >
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide opacity-85 mb-1">{title}</p>
        <p className="text-2xl md:text-3xl font-bold truncate">
          ${amount.toFixed(2)}
        </p>
        {subtext && (
          <p className="text-xs opacity-75 mt-2">{subtext}</p>
        )}
      </div>
    </div>
  )
}

const Summary = ({ totalIncome, totalExpenses }) => {
  const balance = totalIncome - totalExpenses

  return (
    <div className="card-panel p-6 mb-6">
      <h2 className="text-xl font-bold text-stone-100 mb-4">Financial summary</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Total income"
          amount={totalIncome}
          subtext="Money added to buckets"
          variant="income"
        />

        <SummaryCard
          title="Total expenses"
          amount={totalExpenses}
          subtext="Money spent from buckets"
          variant="expense"
        />

        <SummaryCard
          title="Net (income - expense)"
          amount={balance}
          subtext={balance >= 0 ? 'Across all categories' : 'Review spending'}
          variant="balance"
        />
      </div>
    </div>
  )
}

export default Summary
