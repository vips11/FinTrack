import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { formatCurrency, getCurrentMonth, getMonthLabel, shiftMonth } from '../utils/helpers'
import { getCategoryBudgetStatuses, getOverallBudgetForMonth } from '../services/budgetService'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import MonthPicker from '../components/MonthPicker'
import PlaidLinkButton, { LinkedAccounts } from '../components/PlaidLinkButton'
import SyncButton from '../components/SyncButton'
import EmptyState from '../components/EmptyState'

export default function Dashboard() {
  const { state } = useAppContext()
  const navigate = useNavigate()
  const [month, setMonth] = useState(getCurrentMonth())

  const monthTx = state.transactions.filter((t) => t.date.startsWith(month))
  const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const budget = getOverallBudgetForMonth(month, state.monthlyBudgets, state.settings)
  const categoryStatuses = getCategoryBudgetStatuses(state.transactions, state.categories, month, state.monthlyBudgets)
  const totalBudget = state.categories.reduce((s, c) => s + (c.budget || 0), 0) || budget

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const m = shiftMonth(month, i - 5)
    const txs = state.transactions.filter((t) => t.date.startsWith(m))
    const inc = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const exp = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return {
      month: monthNames[Number(m.slice(5)) - 1],
      'This month': exp,
      'Last month': inc,
      Income: inc,
      Expenses: exp,
    }
  })

  const recentTx = monthTx.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)
  const getCat = (id) => state.categories.find((c) => c.id === id)
  const catEmojis = { 'Food & Dining': '🛒', 'Transport': '🚗', 'Entertainment': '🎬', 'Utilities': '🏠', 'Shopping': '🛍️', 'Health': '💊' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <MonthPicker month={month} setMonth={setMonth} transactions={monthTx} />
        <PlaidLinkButton />
      </div>

      <LinkedAccounts />

      {state.transactions.length === 0 && state.categories.length === 0 && (
        <div className="card">
          <EmptyState icon="📊" title="Welcome to FinTrack!" message="Start by adding your first expense or connecting your bank." action="Add Expense" onAction={() => navigate('/expenses')} />
        </div>
      )}

      {(state.transactions.length > 0 || state.categories.length > 0) && <>
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3>Total budgets</h3>
          </div>
          <div className="summary-stat" style={{ marginBottom: '1.25rem' }}>
            <div className="value">{formatCurrency(totalBudget)}</div>
          </div>

          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Allocation</p>
          <div className="allocation-bar">
            {categoryStatuses.filter(c => c.budget > 0).map((c) => (
              <div key={c._id || c.id} className="allocation-segment" style={{ width: `${(c.budget / totalBudget) * 100}%`, background: c.color }}>
                <span className="alloc-tooltip">{c.name}: {formatCurrency(c.budget)}</span>
              </div>
            ))}
          </div>

          {categoryStatuses.filter(c => c.budget > 0 || c.spent > 0).map((c) => {
            const remaining = c.budget - c.spent
            const overBudget = remaining < 0
            return (
            <div className="budget-row" key={c._id || c.id} onClick={() => navigate(`/categories/${c.id}`)}>
              <div className="budget-row-icon">{catEmojis[c.name] || '📂'}</div>
              <div className="budget-row-color" style={{ background: c.color }} />
              <div className="budget-row-info">
                <div className="name">{c.name}</div>
                <div className="spent">{formatCurrency(c.spent)} spent</div>
              </div>
              <div className="budget-row-right">
                <div className="amount" style={{ color: overBudget ? 'var(--red)' : undefined }}>{overBudget ? '–' : ''}{formatCurrency(Math.abs(remaining))} ({c.percent.toFixed(0)}%)</div>
                <div className="budget-label">Budget {formatCurrency(c.budget)}</div>
              </div>
            </div>
            )
          })}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Spending this month</h3>
          </div>
          <div className="summary-stat" style={{ marginBottom: '1rem' }}>
            <div className="value" style={{ color: 'var(--red)' }}>{formatCurrency(expenses)}</div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e8772e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#e8772e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: '#888' }} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} tick={{ fill: '#888' }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.72rem' }} />
              <Area type="linear" dataKey="This month" stroke="#e8772e" strokeWidth={2} fill="url(#gradSpend)" dot={{ r: 3 }} />
              <Area type="linear" dataKey="Last month" stroke="#888888" strokeWidth={1.5} strokeDasharray="5 5" fill="none" dot={false} />
            </AreaChart>
          </ResponsiveContainer>

          <h4 style={{ fontSize: '0.85rem', margin: '1.5rem 0 0.5rem', color: 'var(--text-muted)' }}>Income vs Expenses</h4>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: '#888' }} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} tick={{ fill: '#888' }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.72rem' }} />
              <Area type="linear" dataKey="Income" stroke="var(--green)" strokeWidth={2} fill="none" dot={{ r: 3 }} />
              <Area type="linear" dataKey="Expenses" stroke="var(--red)" strokeWidth={2} fill="none" dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3>💳 Transactions</h3>
            <span className="see-all" onClick={() => navigate('/expenses')}>See all ›</span>
          </div>
          {recentTx.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No transactions this month.</p>}
          {recentTx.map((t) => {
            const cat = getCat(t.categoryId)
            return (
              <div className="tx-row" key={t._id || t.id} onClick={() => navigate(t.type === 'income' ? '/income' : '/expenses')}>
                <div className="tx-icon">{catEmojis[cat?.name] || (t.type === 'income' ? '💵' : '📦')}</div>
                <div className="tx-info">
                  <div className="name">{t.note || cat?.name || 'Transaction'}</div>
                </div>
                {cat && <span className="tx-badge">{cat.name}</span>}
                {!cat && t.type === 'income' && <span className="tx-badge">Income</span>}
                {!cat && t.type === 'expense' && <span className="tx-badge">Uncategorized</span>}
                <div className="tx-right">
                  <div className={`amount ${t.type}`}>{t.type === 'expense' ? '–' : ''}{formatCurrency(t.amount)}</div>
                  <div className="date">{t.date.slice(5)}</div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>🔄 Recurring</h3>
            <span className="see-all" onClick={() => navigate('/recurring')}>See all ›</span>
          </div>
          {state.recurring.slice(0, 4).map((r) => {
            const cat = getCat(r.categoryId)
            return (
              <div className="rec-row" key={r._id || r.id}>
                <div className="tx-icon">{catEmojis[cat?.name] || '📅'}</div>
                <div className="rec-info">
                  <div className="name">{r.name}</div>
                </div>
                <div className="rec-right">
                  <span className="freq-badge">{r.frequency.charAt(0).toUpperCase() + r.frequency.slice(1)}</span>
                  <span className="amount">{formatCurrency(r.amount)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      </>}
    </div>
  )
}
