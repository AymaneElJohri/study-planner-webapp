import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

type Friend = { id: number; name: string; photo?: string | null }
type User = { id: number; first_name: string; last_name: string; email: string; photo?: string | null }

export default function DashboardPage() {
  const { session, loading } = useAuth()
  const [friends, setFriends] = useState<Friend[]>([])
  const [profile, setProfile] = useState<User | null>(null)

  useEffect(() => {
    if (!session?.loggedIn || !session.userId) return
    api.get<Friend[]>(`/friends?userId=${session.userId}`).then(setFriends).catch(() => setFriends([]))
    api.get<User>(`/profile?userId=${session.userId}`).then(setProfile).catch(() => setProfile(null))
  }, [session])

  if (loading) return <p>Loading…</p>
  if (!session?.loggedIn) return <p>Please log in.</p>

  return (
    <div className="grid-2">
      <section className="card">
        <h2>Welcome, {session.userName}</h2>
        {profile && (
          <div style={{ marginTop: 8 }}>
            <div style={{ color: 'var(--text-dim)' }}>Email</div>
            <div>{profile.email}</div>
          </div>
        )}
      </section>
      <section className="card">
        <h3>Your friends</h3>
        {friends.length === 0 ? (
          <p style={{ color: 'var(--text-dim)' }}>No friends yet. Find classmates in the Friends page.</p>
        ) : (
          <ul className="simple-list" style={{ marginTop: 8 }}>
            {friends.map(f => (
              <li className="row" key={f.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="avatar" />
                  <span>{f.name}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
