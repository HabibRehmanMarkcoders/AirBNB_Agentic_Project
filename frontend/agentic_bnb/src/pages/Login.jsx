import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AirbnbLogo from '../components/AirbnbLogo'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await login({ email, password })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-atmosphere" aria-hidden="true" />
      <form className="auth-panel" onSubmit={handleSubmit}>
        <div className="auth-brand">
          <AirbnbLogo size={36} />
          <span>Air BNB</span>
        </div>
        <h1>Welcome back</h1>
        <p className="auth-sub">Sign in to continue planning your next stay.</p>

        {error ? <p className="auth-error">{error}</p> : null}

        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </label>

        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete="current-password"
          />
        </label>

        <button type="submit" className="auth-submit" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>

        <p className="auth-switch">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </form>
    </div>
  )
}
