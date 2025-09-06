import { NavLink, Outlet } from 'react-router-dom'
import './App.css'
import { useAuth } from './context/AuthContext'

export default function App() {
  const { session, logout } = useAuth()
  return (
    <div>
      <nav className="app-nav">
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/courses">Courses</NavLink>
        <NavLink to="/messages">Messages</NavLink>
        <NavLink to="/friends">Friends</NavLink>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {session?.loggedIn ? (
            <>
              <span style={{ color: 'var(--text-dim)' }}>Hi, {session.userName}</span>
              <button className="btn btn-ghost" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </div>
      </nav>
      <main className="container">
        <Outlet />
      </main>
    </div>
  )
}
