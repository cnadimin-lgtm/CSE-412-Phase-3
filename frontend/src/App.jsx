import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'

const STORAGE_KEY = 'sbudget_user'

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setUser(JSON.parse(raw))
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const onLoggedIn = (u) => {
    setUser(u)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
  }

  const onLogout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  if (!user) {
    return <Login onLoggedIn={onLoggedIn} />
  }

  return <Dashboard user={user} onLogout={onLogout} />
}

export default App
