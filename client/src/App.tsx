import { NavLink, Outlet } from 'react-router-dom'
import './App.css'

export default function App() {
  return (
    <div>
      <nav style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #eee' }}>
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/courses">Courses</NavLink>
        <NavLink to="/messages">Messages</NavLink>
        <NavLink to="/login" style={{ marginLeft: 'auto' }}>Login</NavLink>
      </nav>
      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </div>
  )
}
