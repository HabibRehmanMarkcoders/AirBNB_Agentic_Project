import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AirbnbLogo from '../components/AirbnbLogo'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { user, signup } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    try {
      signup({ name, email, password })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
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
        <h1>Join Air BNB</h1>
        <p className="auth-sub">Create an account and start chatting about stays.</p>

        {error ? <p className="auth-error">{error}</p> : null}

        <label className="auth-field">
          <span>Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            autoComplete="name"
          />
        </label>

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
            placeholder="At least 6 characters"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>

        <button type="submit" className="auth-submit">
          Sign up
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  )
}
