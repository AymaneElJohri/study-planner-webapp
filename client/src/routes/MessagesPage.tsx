import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

type Message = { id: number; sender_id: number; receiver_id: number; content: string; timestamp: string }

export default function MessagesPage() {
  const { session } = useAuth()
  const [receiverId, setReceiverId] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')

  async function load() {
    if (!session?.userId || !receiverId) return
    const data = await api.get<Message[]>(`/messages?userId=${session.userId}&receiverId=${receiverId}`)
    setMessages(data)
  }

  useEffect(() => { load() }, [receiverId, session?.userId])

  async function send() {
    if (!session?.userId || !receiverId || !input.trim()) return
    await api.post('/messages', { userId: session.userId, receiverId: Number(receiverId), content: input })
    setInput('')
    await load()
  }

  return (
    <div>
      <h2>Messages</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input placeholder="Receiver ID" value={receiverId} onChange={(e) => setReceiverId(e.target.value)} />
        <button onClick={load}>Load</button>
      </div>
      <ul>
        {messages.map(m => (
          <li key={m.id}>
            <b>{m.sender_id === session?.userId ? 'You' : m.sender_id}:</b> {m.content}
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: 8 }}>
        <input placeholder="Type a message" value={input} onChange={(e) => setInput(e.target.value)} />
        <button onClick={send}>Send</button>
      </div>
    </div>
  )
}
