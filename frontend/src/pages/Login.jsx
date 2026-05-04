import React, { useState } from 'react'
import { authApi } from '../api/transactionApi'

const Login = ({ onLoggedIn }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data } = await authApi.login({ username: username.trim(), password })
      onLoggedIn(data)
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Login failed'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 page-bg">
      <div className="w-full max-w-md panel p-8 rounded-xl shadow-lg border border-wine-700/40">
        <h1 className="text-2xl font-bold text-stone-100 mb-1">
          Student Budgeting
        </h1>
        <p className="text-stone-300 text-sm mb-6">
          Sign in to manage categories, low-balance floors, and transactions.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800/60 text-red-200 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-stone-200 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-wine-950/40 border border-wine-700/50 text-stone-100 placeholder:text-stone-300 focus:ring-2 focus:ring-rose-600/60 outline-none"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-200 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-wine-950/40 border border-wine-700/50 text-stone-100 placeholder:text-stone-300 focus:ring-2 focus:ring-rose-600/60 outline-none"
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-semibold text-white bg-rose-800 hover:bg-rose-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-xs text-stone-300">
          Demo: aryan / pass123 — more seed accounts are listed in README.md.
        </p>
      </div>
    </div>
  )
}

export default Login
