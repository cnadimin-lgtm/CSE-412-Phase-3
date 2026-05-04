import React, { useState } from 'react'
import { userApi } from '../api/transactionApi'

const Signup = ({ onRegistered, onBackToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (!formData.username.trim() || !formData.password || !formData.email.trim()) {
        setError('Please fill in username, password, and email.')
        setLoading(false)
        return
      }
      const { data } = await userApi.register({
        username: formData.username.trim(),
        password: formData.password,
        email: formData.email.trim(),
      })
      onRegistered(data)
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Sign up failed'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 page-bg">
      <div className="w-full max-w-md panel p-8 rounded-xl shadow-lg border border-wine-700/40">
        <h1 className="text-2xl font-bold text-stone-100 mb-1">Create account</h1>
        <p className="text-stone-300 text-sm mb-6">
          Register with username, password, and email. You will be signed in after sign up.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-800/60 text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-200 mb-1" htmlFor="su-user">
              Username
            </label>
            <input
              id="su-user"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-wine-950/40 border border-wine-700/50 text-stone-100 placeholder:text-stone-300 focus:ring-2 focus:ring-rose-600/60 outline-none"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-200 mb-1" htmlFor="su-email">
              Email
            </label>
            <input
              id="su-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-wine-950/40 border border-wine-700/50 text-stone-100 placeholder:text-stone-300 focus:ring-2 focus:ring-rose-600/60 outline-none"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-200 mb-1" htmlFor="su-pass">
              Password
            </label>
            <input
              id="su-pass"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-wine-950/40 border border-wine-700/50 text-stone-100 placeholder:text-stone-300 focus:ring-2 focus:ring-rose-600/60 outline-none"
              autoComplete="new-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-semibold text-white bg-rose-800 hover:bg-rose-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-300">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-rose-300 hover:text-rose-200 font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}

export default Signup
