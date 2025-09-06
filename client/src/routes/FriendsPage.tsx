import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

type Classmate = { id: number; name: string; photo?: string | null; program?: string | null }
type Friend = { id: number; name: string; photo?: string | null }
type Outgoing = { id: number; sender_id: number; receiver_id: number; status: 'pending' | 'accepted' | 'rejected' }
type Incoming = { requestId: number; id: number; name: string; photo?: string | null }

export default function FriendsPage() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [classmates, setClassmates] = useState<Classmate[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [outgoing, setOutgoing] = useState<Outgoing[]>([])
  const [incoming, setIncoming] = useState<Incoming[]>([])
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set())
  const [busyReqIds, setBusyReqIds] = useState<Set<number>>(new Set())

  async function loadAll() {
    if (!session?.userId) return
    const [cm, fr, out, inc] = await Promise.all([
      api.get<Classmate[]>(`/classmates?userId=${session.userId}`),
      api.get<Friend[]>(`/friends?userId=${session.userId}`),
      api.get<Outgoing[]>(`/outgoing-requests?userId=${session.userId}`),
      api.get<Incoming[]>(`/friend-requests?userId=${session.userId}`),
    ])
    setClassmates(cm)
    setFriends(fr)
    setOutgoing(out)
    setIncoming(inc)
  }

  useEffect(() => { loadAll() }, [session?.userId])

  const friendIds = useMemo(() => new Set(friends.map(f => f.id)), [friends])
  const outgoingIds = useMemo(() => new Set(outgoing.map(o => o.receiver_id)), [outgoing])

  async function addFriend(receiverId: number) {
    if (!session?.userId) return
    setBusyIds(new Set(busyIds).add(receiverId))
    try {
      await api.post('/friend-request', { senderId: session.userId, receiverId })
      const out = await api.get<Outgoing[]>(`/outgoing-requests?userId=${session.userId}`)
      setOutgoing(out)
    } finally {
      setBusyIds(prev => {
        const n = new Set(prev)
        n.delete(receiverId)
        return n
      })
    }
  }

  function messageFriend(id: number) {
    navigate(`/messages?to=${id}`)
  }

  async function respondToRequest(requestId: number, status: 'accepted' | 'rejected') {
    if (!session?.userId) return
    setBusyReqIds(new Set(busyReqIds).add(requestId))
    try {
      await api.put(`/friend-request/${requestId}`, { status })
      // Reload related lists
      const [fr, inc, out] = await Promise.all([
        api.get<Friend[]>(`/friends?userId=${session.userId}`),
        api.get<Incoming[]>(`/friend-requests?userId=${session.userId}`),
        api.get<Outgoing[]>(`/outgoing-requests?userId=${session.userId}`),
      ])
      setFriends(fr)
      setIncoming(inc)
      setOutgoing(out)
    } finally {
      setBusyReqIds(prev => { const n = new Set(prev); n.delete(requestId); return n })
    }
  }

  if (loading) return <p>Loading…</p>
  if (!session?.loggedIn) return <p>Please log in.</p>

  return (
    <div>
      {incoming.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>Requests</h3>
          <ul className="list">
            {incoming.map(r => (
              <li key={r.requestId} className="item">
                {r.photo ? (
                  <img src={r.photo} alt={r.name} className="avatar" style={{ width: 36, height: 36 }} />
                ) : (
                  <div className="avatar" style={{ width: 36, height: 36 }} />
                )}
                <div style={{ flex: 1 }}>{r.name}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn primary" onClick={() => respondToRequest(r.requestId, 'accepted')} disabled={busyReqIds.has(r.requestId)}>Accept</button>
                  <button className="btn" onClick={() => respondToRequest(r.requestId, 'rejected')} disabled={busyReqIds.has(r.requestId)}>Reject</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid-2">
        <section>
          <h2>Friends</h2>
          {friends.length === 0 ? (
            <div className="muted">Nog geen vrienden.</div>
          ) : (
            <ul className="list">
              {friends.map(f => (
                <li key={f.id} className="item">
                  {f.photo ? (
                    <img src={f.photo} alt={f.name} className="avatar" />
                  ) : (
                    <div className="avatar" />
                  )}
                  <div style={{ flex: 1, fontWeight: 600 }}>{f.name}</div>
                  <button className="btn" onClick={() => messageFriend(f.id)}>Message</button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2>Classmates</h2>
          <ul className="list">
            {classmates.map((c) => {
              const isFriend = friendIds.has(c.id)
              const isPending = outgoingIds.has(c.id)
              return (
                <li key={c.id} className="item">
                  {c.photo ? (
                    <img src={c.photo} alt={c.name} className="avatar" />
                  ) : (
                    <div className="avatar" />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    {c.program && <div className="muted" style={{ fontSize: 12 }}>{c.program}</div>}
                  </div>
                  {isFriend ? (
                    <>
                      <button className="btn" disabled>Friends</button>
                      <button className="btn" style={{ marginLeft: 8 }} onClick={() => messageFriend(c.id)}>Message</button>
                    </>
                  ) : isPending ? (
                    <button className="btn" disabled>Requested</button>
                  ) : (
                    <button className="btn primary" onClick={() => addFriend(c.id)} disabled={busyIds.has(c.id)}>Add friend</button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}
