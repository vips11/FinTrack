import { createContext, useContext, useState, useCallback } from 'react'

const AlertContext = createContext()

export function AlertProvider({ children }) {
  const [alert, setAlert] = useState(null)

  const showAlert = useCallback(({ title, message, onConfirm, confirmText = 'OK', showCancel = false }) => {
    setAlert({ title, message, onConfirm, confirmText, showCancel })
  }, [])

  const close = () => { setAlert(null) }

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alert && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360, textAlign: 'center' }}>
            {alert.title && <h3 style={{ marginBottom: '0.5rem' }}>{alert.title}</h3>}
            {alert.message && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{alert.message}</p>}
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              {alert.showCancel && <button className="btn btn-outline" onClick={close}>Cancel</button>}
              <button className="btn btn-primary" onClick={() => { if (alert.onConfirm) alert.onConfirm(); close() }}>{alert.confirmText}</button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  )
}

export const useAlert = () => useContext(AlertContext)
