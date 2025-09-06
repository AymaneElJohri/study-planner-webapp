import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

type Program = { id: number; name: string }

export default function RegisterPage() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [programs, setPrograms] = useState<Program[]>([])
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [programId, setProgramId] = useState('')
  const [hobbies, setHobbies] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get<Program[]>('/programs').then(setPrograms).catch(() => setPrograms([]))
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('firstName', firstName)
      fd.append('lastName', lastName)
      fd.append('age', age)
      fd.append('email', email)
      fd.append('password', password)
      fd.append('programId', programId)
      fd.append('hobbies', hobbies)
      if (photo) fd.append('photo', photo)

      const res = await api.post<{ success: boolean; userId: number }>('/register', fd)
      if (res.success) {
        await refresh()
        navigate('/')
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="card">
      <form onSubmit={onSubmit} className="form">
        <h2>Register</h2>
        <input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        <input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        <input placeholder="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} required />
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <select value={programId} onChange={(e) => setProgramId(e.target.value)} required>
          <option value="">Select a program</option>
          {programs.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <input placeholder="Hobbies (comma separated)" value={hobbies} onChange={(e) => setHobbies(e.target.value)} />
        <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
        <div className="form-actions">
          <button type="submit" className="btn" disabled={submitting}>{submitting ? 'Submitting…' : 'Create account'}</button>
          {error && <span style={{ color: 'crimson' }}>{error}</span>}
        </div>
      </form>
    </section>
  )
}
