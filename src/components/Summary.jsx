import React from 'react'

const SummaryCard = ({ title, amount, subtext, icon, color }) => {
  return (
    <div className={`${color} rounded-lg shadow-md p-6 text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90 mb-1">{title}</p>
          <p className="text-3xl font-bold">${amount.toFixed(2)}</p>
          {subtext && <p className="text-xs opacity-75 mt-2">{subtext}</p>}
        </div>
        <div className="text-4xl opacity-50">{icon}</div>
      </div>
    </div>
  )
}

const Summary = ({ totalIncome, totalExpenses }) => {
  const balance = totalIncome - totalExpenses

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Financial Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Income"
          amount={totalIncome}
          subtext="Total money earned"
          icon="💰"
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        
        <SummaryCard
          title="Total Expenses"
          amount={totalExpenses}
          subtext="Total money spent"
          icon="💸"
          color="bg-gradient-to-br from-red-500 to-red-600"
        />
        
        <SummaryCard
          title="Balance"
          amount={balance}
          subtext={balance >= 0 ? "You're saving!" : "Over budget"}
          icon={balance >= 0 ? "✅" : "⚠️"}
          color={balance >= 0 ? "bg-gradient-to-br from-blue-500 to-blue-600" : "bg-gradient-to-br from-orange-500 to-orange-600"}
        />
      </div>
    </div>
  )
}

export default Summary
