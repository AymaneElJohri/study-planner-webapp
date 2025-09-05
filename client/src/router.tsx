import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import LoginPage from './routes/LoginPage.tsx'
import DashboardPage from './routes/DashboardPage.tsx'
import CoursesPage from './routes/CoursesPage.tsx'
import MessagesPage from './routes/MessagesPage.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'courses', element: <CoursesPage /> },
      { path: 'messages', element: <MessagesPage /> },
    ],
  },
])

export default router
