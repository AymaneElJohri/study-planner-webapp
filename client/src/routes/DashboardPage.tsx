import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

type Friend = { id: number; name: string; photo?: string | null }
type User = { id: number; first_name: string; last_name: string; email: string; photo?: string | null }

export default function DashboardPage() {
  const { session, loading, logout } = useAuth()
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
    <div>
      <h2>Welcome, {session.userName}</h2>
      <button onClick={logout}>Logout</button>
      {profile && (
        <div style={{ marginTop: 12 }}>
          <h3>Profile</h3>
          <div>Email: {profile.email}</div>
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        <h3>Friends</h3>
        <ul>
          {friends.map(f => (
            <li key={f.id}>{f.name}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
