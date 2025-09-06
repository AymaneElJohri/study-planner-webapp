import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    }
  }

  if (loading) return <p>Loading…</p>
  if (session?.loggedIn) return <p>Already logged in as {session.userName}</p>

  return (
    <section className="card">
      <form onSubmit={onSubmit} className="form">
        <h2>Login</h2>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="form-actions">
          <button type="submit" className="btn">Login</button>
          {error && <span style={{ color: 'crimson' }}>{error}</span>}
        </div>
        <p style={{ color: 'var(--text-dim)' }}>
          Don't have an account?{' '}
          <Link to="/register" className="btn btn-ghost">Register here</Link>
        </p>
      </form>
    </section>
  )
}
