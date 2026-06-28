import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { useAppContext } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useAlert } from './AlertDialog'

export function LinkedAccounts() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])

  useEffect(() => {
    if (!user) return
    api.raw('/plaid/accounts').then((data) => {
      if (Array.isArray(data)) setAccounts(data)
    })
  }, [])

  if (accounts.length === 0) return null

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div className="card-header"><h3>Linked Banks</h3></div>
      {accounts.map((a) => (
        <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', fontSize: '0.8rem' }}>
          <span>🏦 {a.institutionName || 'Bank'}</span>
          <span style={{ color: 'var(--text-muted)' }}>{new Date(a.createdAt).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  )
}

export default function PlaidLinkButton() {
  const { user } = useAuth()
  const { showAlert } = useAlert()
  const [syncing, setSyncing] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const { dispatch } = useAppContext()

  if (!user) return null

  const reloadTransactions = async () => {
    const transactions = await api.getTransactions()
    if (Array.isArray(transactions)) {
      dispatch({ type: 'SET_DATA', payload: { transactions } })
    }
  }

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const data = await api.raw('/plaid/create-link-token', { method: 'POST' })
      console.log('Link token response:', data)
      const link_token = data?.link_token
      if (!link_token) { console.error('No link token'); setConnecting(false); return }

      const handler = window.Plaid.create({
        token: link_token,
        onSuccess: async (public_token, metadata) => {
          console.log('Plaid onSuccess, exchanging token...')
          const result = await api.raw('/plaid/exchange-token', { method: 'POST', body: JSON.stringify({ public_token, metadata }) })
          console.log('Exchange result:', result)
          showAlert({ title: '✅ Bank Connected', message: 'Your bank has been linked. Click Sync to import transactions.' })
          setConnecting(false)
        },
        onExit: (err) => { console.log('Plaid exit:', err); setConnecting(false) },
      })
      handler.open()
    } catch (err) {
      console.error('Connect error:', err)
      setConnecting(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const result = await api.raw('/plaid/sync', { method: 'POST' })
      const transactions = await api.getTransactions()
      if (Array.isArray(transactions)) dispatch({ type: 'SET_DATA', payload: { transactions } })
      showAlert({ title: result?.success ? '✅ Synced' : '❌ Failed', message: result?.success ? 'Transactions have been synced.' : 'Sync failed. Try again.' })
    } catch (err) {
      console.error('Sync error:', err)
      showAlert({ title: '❌ Error', message: 'Sync failed. Please try again.' })
    }
    setSyncing(false)
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button className="btn btn-primary" onClick={handleConnect} disabled={connecting}>
        {connecting ? '🏦 Complete bank login in popup...' : '🏦 Connect Bank'}
      </button>
      <button className="btn btn-outline" onClick={handleSync} disabled={syncing}>
        {syncing ? '⏳ Syncing...' : '🔄 Sync'}
      </button>
    </div>
  )
}
