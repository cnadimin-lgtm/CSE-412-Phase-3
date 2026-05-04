import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Signup from './pages/Signup'

const STORAGE_KEY = 'sbudget_user'

function App() {
  const [user, setUser] = useState(null)
  const [authScreen, setAuthScreen] = useState('login')

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
    setAuthScreen('login')
  }

  const onLogout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  if (!user) {
    if (authScreen === 'signup') {
      return (
        <Signup
          onRegistered={onLoggedIn}
          onBackToLogin={() => setAuthScreen('login')}
        />
      )
    }
    return (
      <Login
        onLoggedIn={onLoggedIn}
        onSignupClick={() => setAuthScreen('signup')}
      />
    )
  }

  return <Dashboard user={user} onLogout={onLogout} />
}

export default App
