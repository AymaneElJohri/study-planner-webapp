import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import LoginPage from './routes/LoginPage.tsx'
import RegisterPage from './routes/RegisterPage.tsx'
import DashboardPage from './routes/DashboardPage.tsx'
import CoursesPage from './routes/CoursesPage.tsx'
import MessagesPage from './routes/MessagesPage.tsx'
import FriendsPage from './routes/FriendsPage.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'login', element: <LoginPage /> },
  { path: 'register', element: <RegisterPage /> },
      { path: 'courses', element: <CoursesPage /> },
      { path: 'messages', element: <MessagesPage /> },
  { path: 'friends', element: <FriendsPage /> },
    ],
  },
])

export default router
