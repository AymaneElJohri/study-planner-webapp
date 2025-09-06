import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

type Message = { id: number; sender_id: number; receiver_id: number; content: string; timestamp: string }
type Friend = { id: number; name: string; photo?: string | null }
type Conversation = { contact_id: number; contact_name: string }

export default function MessagesPage() {
  const { session } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [friends, setFriends] = useState<Friend[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  // hover handled via CSS classes

  // Load sidebar lists
  useEffect(() => {
    if (!session?.userId) return
    ;(async () => {
      let fr: Friend[] = []
      let conv: Conversation[] = []
      try {
        fr = await api.get<Friend[]>(`/friends?userId=${session.userId}`)
      } catch (_) {
        fr = [] // if unauthorized, keep going with conversations only
      }
      try {
        conv = await api.get<Conversation[]>(`/conversations?userId=${session.userId}`)
      } catch (_) {
        conv = []
      }
      setFriends(fr)
      setConversations(conv)

      // Build sidebar union so we still show partners even if /friends fails
      const map = new Map<number, { id: number; name: string; isConv: boolean }>()
      for (const c of conv) map.set(c.contact_id, { id: c.contact_id, name: c.contact_name, isConv: true })
      for (const f of fr) {
        map.set(f.id, { id: f.id, name: f.name, isConv: map.get(f.id)?.isConv ?? false })
      }
      const sidebar = Array.from(map.values())

      // Deep link: ?to=123, else first available
      const to = searchParams.get('to')
      if (to) setSelectedId(Number(to))
      else if (!selectedId && sidebar.length > 0) setSelectedId(sidebar[0].id)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.userId])

  // Load messages when selection changes or conversations refresh
  useEffect(() => {
    if (!session?.userId || !selectedId) return
    api.get<Message[]>(`/messages?userId=${Number(session.userId)}&receiverId=${Number(selectedId)}`)
      .then(setMessages)
  }, [selectedId, session?.userId, conversations.length])

  // Sidebar list: union of friends and conversation contacts, conv-first ordering
  const sidebarList = useMemo(() => {
    const convIds = new Set(conversations.map(c => c.contact_id))
    const convMap = new Map<number, string>()
    for (const c of conversations) convMap.set(c.contact_id, c.contact_name)
    const friendMap = new Map<number, string>()
    for (const f of friends) friendMap.set(f.id, f.name)
    const ids = new Set<number>([...convIds, ...friends.map(f => f.id)])
    const items = Array.from(ids).map(id => ({ id, name: convMap.get(id) || friendMap.get(id) || `User ${id}`, isConv: convIds.has(id) }))
    items.sort((a, b) => Number(b.isConv) - Number(a.isConv))
    return items
  }, [friends, conversations])

  const selectedName = useMemo(() => {
    if (!selectedId) return ''
    const bySidebar = sidebarList.find(i => i.id === selectedId)?.name
    if (bySidebar) return bySidebar
    const byConv = conversations.find(c => c.contact_id === selectedId)?.contact_name
    if (byConv) return byConv
    const byFriend = friends.find(f => f.id === selectedId)?.name
    return byFriend || `User ${selectedId}`
  }, [selectedId, sidebarList, conversations, friends])

  const friendIds = useMemo(() => new Set(friends.map(f => f.id)), [friends])
  const canMessage = selectedId ? friendIds.has(selectedId) : false

  function selectFriend(id: number) {
  setSelectedId(Number(id))
    setSearchParams(prev => {
      const p = new URLSearchParams(prev)
      p.set('to', String(id))
      return p
    })
  }

  async function send() {
    if (!session?.userId || !selectedId || !input.trim()) return
  await api.post('/messages', { userId: Number(session.userId), receiverId: Number(selectedId), content: input })
    setInput('')
    const data = await api.get<Message[]>(`/messages?userId=${session.userId}&receiverId=${selectedId}`)
    setMessages(data)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
      <aside className="sidebar">
        <h3 style={{ marginTop: 0 }}>Friends</h3>
        <ul className="list">
          {sidebarList.map(f => (
      <li key={f.id}>
              <button
                onClick={() => selectFriend(f.id)}
                aria-current={selectedId === f.id ? 'page' : undefined}
                className={`chat-select ${selectedId === f.id ? 'active' : ''}`}
              >
        {f.name}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <section>
        {selectedId ? (
          <div className="card">
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Chat with {selectedName}</h3>
            <ul className="chat">
              {messages.map(m => (
                <li key={m.id}>
                  <b>{m.sender_id === session?.userId ? 'You' : (selectedName || 'Them')}:</b> {m.content}
                </li>
              ))}
            </ul>
            {!canMessage && (
              <div className="muted" style={{ marginBottom: 8 }}>Je kunt alleen berichten sturen naar vrienden.</div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder={canMessage ? 'Type a message' : 'Je bent geen vrienden'} value={input} onChange={(e) => setInput(e.target.value)} disabled={!canMessage} className="btn ghost" style={{ flex: 1, background: '#0f1629', border: '1px solid var(--border)' }} />
              <button onClick={send} disabled={!canMessage || !input.trim()} className={`btn ${canMessage ? 'primary' : ''}`}>Send</button>
            </div>
          </div>
        ) : (
          <p>Select a friend to view your conversation.</p>
        )}
      </section>
    </div>
  )
}
