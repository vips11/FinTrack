import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { createCategory } from '../utils/models'
import { formatCurrency, getCurrentMonth, getMonthLabel } from '../utils/helpers'
import { getCategoryBudgetForMonth, getOverallBudgetForMonth } from '../services/budgetService'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import MonthPicker from '../components/MonthPicker'

const COLORS = ['#7b61ff', '#5b8def', '#2d9f5f', '#d94452', '#e5a52e', '#00b8d9', '#e84393', '#a29bfe', '#2ed573', '#ffc048']

export default function Categories() {
  const { state, dispatch } = useAppContext()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [budgetValue, setBudgetValue] = useState('')
  const [form, setForm] = useState({ name: '', color: COLORS[0], budget: '' })
  const [editBudget, setEditBudget] = useState(null)
  const [month, setMonth] = useState(getCurrentMonth())

  const overallBudget = getOverallBudgetForMonth(month, state.monthlyBudgets, state.settings)

  // Pie chart data — spending per category this month
  const pieData = state.categories.map((cat) => {
    const spent = state.transactions
      .filter((t) => t.type === 'expense' && t.categoryId === cat.id && t.date.startsWith(month))
      .reduce((s, t) => s + t.amount, 0)
    return { name: cat.name, value: spent, color: cat.color }
  }).filter((d) => d.value > 0)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name) return
    dispatch({ type: 'ADD_CATEGORY', payload: createCategory(form) })
    setForm({ name: '', color: COLORS[0], budget: '' })
    setShowForm(false)
  }

  const handleBudgetSave = (cat) => {
    dispatch({ type: 'SET_MONTHLY_BUDGET', payload: { month, categoryId: cat.id, budget: Number(editBudget.value) } })
    setEditBudget(null)
  }

  const handleOverallBudgetSave = (e) => {
    e.preventDefault()
    dispatch({ type: 'SET_MONTHLY_OVERALL_BUDGET', payload: { month, budget: Number(budgetValue) } })
    setShowBudgetModal(false)
  }

  return (
    <div>
      <div className="page-header">
        <h1>Spending Plan</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Category</button>
      </div>

      <MonthPicker month={month} setMonth={setMonth} transactions={state.transactions.filter(t => t.type === 'expense' && t.date.startsWith(month))} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h3>Spending Breakdown</h3>
          </div>
          {pieData.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No spending data this month.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" activeIndex={-1}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.72rem' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3>Budget Allocation</h3>
            <button className="btn btn-outline" style={{ fontSize: '0.7rem', padding: '0.3rem 0.7rem' }} onClick={() => { setBudgetValue(overallBudget || ''); setShowBudgetModal(true) }}>
              {overallBudget ? 'Change' : 'Set Budget'}
            </button>
          </div>
          {(() => {
            const totalAllocated = state.categories.reduce((s, c) => s + getCategoryBudgetForMonth(c, month, state.monthlyBudgets), 0)
            const overallB = overallBudget || totalAllocated
            const unallocated = Math.max(overallB - totalAllocated, 0)
            const budgetPieData = [
              ...state.categories.filter(c => getCategoryBudgetForMonth(c, month, state.monthlyBudgets) > 0).map(c => ({ name: c.name, value: getCategoryBudgetForMonth(c, month, state.monthlyBudgets), color: c.color })),
              ...(unallocated > 0 ? [{ name: 'Unallocated', value: unallocated, color: '#e0e0e0' }] : []),
            ]
            return budgetPieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={budgetPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value" activeIndex={-1}>
                      {budgetPieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.8rem', textAlign: 'center' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600 }}>Total Budget</div>
                    <div style={{ fontWeight: 700 }}>{formatCurrency(overallB)}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600 }}>Allocated</div>
                    <div style={{ fontWeight: 700, color: 'var(--purple)' }}>{formatCurrency(totalAllocated)}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600 }}>Unallocated</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{formatCurrency(unallocated)}</div>
                  </div>
                </div>
              </>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Set category budgets to see allocation.</p>
            )
          })()}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>All Categories</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th style={{ textAlign: 'right' }}>Budget</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {state.categories.length === 0 && (
              <tr><td colSpan="3" style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>No categories yet.</td></tr>
            )}
            {state.categories.map((cat) => (
              <tr key={cat._id || cat.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/categories/${cat._id || cat.id}`)}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: 4, height: 28, borderRadius: 2, background: cat.color }} />
                    <span className="table-name">{cat.name}</span>
                  </div>
                </td>
                <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                  {editBudget !== null && editBudget.id === cat.id ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleBudgetSave(cat) }} style={{ display: 'inline-flex', gap: '0.3rem' }}>
                      <input type="number" style={{ width: 80, padding: '0.3rem 0.5rem', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.8rem', background: 'var(--bg)', color: 'var(--text)' }} value={editBudget.value} onChange={(e) => setEditBudget({ ...editBudget, value: e.target.value })} autoFocus />
                      <button type="submit" className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}>Save</button>
                    </form>
                  ) : (
                    <button className="btn btn-outline" style={{ fontSize: '0.7rem', padding: '0.3rem 0.7rem' }} onClick={() => setEditBudget({ id: cat.id, value: getCategoryBudgetForMonth(cat, month, state.monthlyBudgets) || '' })}>
                      {getCategoryBudgetForMonth(cat, month, state.monthlyBudgets) ? formatCurrency(getCategoryBudgetForMonth(cat, month, state.monthlyBudgets)) : 'Set'}
                    </button>
                  )}
                </td>
                <td onClick={(e) => e.stopPropagation()}><button className="del-btn always" onClick={() => dispatch({ type: 'DELETE_CATEGORY', payload: cat.id })}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Category Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Category</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" placeholder="e.g. Food, Transport" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
              </div>
              <div className="form-group">
                <label>Color</label>
                <div className="color-options">
                  {COLORS.map((c) => (
                    <div key={c} className={`color-swatch ${form.color === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => setForm({ ...form, color: c })} />
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Monthly Budget (optional)</label>
                <input type="number" step="1" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Overall Budget Modal */}
      {showBudgetModal && (
        <div className="modal-overlay" onClick={() => setShowBudgetModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Set Monthly Budget</h3>
            <form onSubmit={handleOverallBudgetSave}>
              <div className="form-group">
                <label>Amount</label>
                <input type="number" step="1" value={budgetValue} onChange={(e) => setBudgetValue(e.target.value)} placeholder="e.g. 3000" required autoFocus />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowBudgetModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
