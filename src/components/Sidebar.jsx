import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useAlert } from './AlertDialog'

export default function Sidebar() {
  const { state, dispatch } = useAppContext()
  const { user, logout, login } = useAuth()
  const theme = state.settings.theme
  const { showAlert } = useAlert()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button className="hamburger" onClick={() => setOpen(!open)}>{open ? '✕' : '☰'}</button>
      <div className={`sidebar-overlay ${open ? 'active' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-logo">FinTrack</div>
      <nav className="sidebar-nav">
        <NavLink to="/" onClick={() => setOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          <span>Overview</span>
        </NavLink>
        <NavLink to="/income" onClick={() => setOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2v20M17 7l-5-5-5 5"/></svg>
          <span>Income</span>
        </NavLink>
        <NavLink to="/expenses" onClick={() => setOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22V2M7 17l5 5 5-5"/></svg>
          <span>Expenses</span>
        </NavLink>
        <NavLink to="/recurring" onClick={() => setOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
          <span>Subscriptions</span>
        </NavLink>
        <NavLink to="/categories" onClick={() => setOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <span>Spending Plan</span>
        </NavLink>
      </nav>
      <div className="sidebar-bottom">
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.75rem' }}>
            <img src={user.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.displayName}</span>
          </div>
        )}
        <button className="theme-toggle" onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { theme: theme === 'dark' ? 'light' : 'dark' } })}>
          {theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
        </button>
        {user ? (
          <button className="theme-toggle" onClick={() => showAlert({ title: 'Sign out', message: 'Are you sure you want to sign out?', showCancel: true, confirmText: 'Sign out', onConfirm: logout })} style={{ marginTop: '0.5rem' }}>🚪 Sign out</button>
        ) : (
          <button className="theme-toggle" onClick={login} style={{ marginTop: '0.5rem' }}>🔑 Sign in</button>
        )}
      </div>
    </aside>
    </>
  )
}
