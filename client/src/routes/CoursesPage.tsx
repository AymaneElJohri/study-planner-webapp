import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

type Course = { id: number; name: string }

export default function CoursesPage() {
  const { session, loading } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [myCourses, setMyCourses] = useState<Course[]>([])

  useEffect(() => {
    api.get<Course[]>('/courses').then(setCourses).catch(() => setCourses([]))
  }, [])

  useEffect(() => {
    if (!session?.userId) return
    api.get<Course[]>(`/user/courses?userId=${session.userId}`).then(setMyCourses).catch(() => setMyCourses([]))
  }, [session?.userId])

  const myIds = useMemo(() => new Set(myCourses.map(c => c.id)), [myCourses])

  async function addCourse(courseId: number) {
    if (!session?.userId) return
    await api.post('/user/course', { userId: session.userId, courseId })
    const updated = await api.get<Course[]>(`/user/courses?userId=${session.userId}`)
    setMyCourses(updated)
  }

  async function removeCourse(courseId: number) {
    if (!session?.userId) return
    await api.delete('/user/course', { userId: session.userId, courseId })
    const updated = await api.get<Course[]>(`/user/courses?userId=${session.userId}`)
    setMyCourses(updated)
  }

  if (loading) return <p>Loading…</p>
  if (!session?.loggedIn) return <p>Please log in.</p>

  return (
    <section className="card">
      <h2>Courses</h2>
      <ul className="simple-list" style={{ marginTop: 8 }}>
        {courses.map(c => (
          <li className="row" key={c.id}>
            <span>{c.name}</span>
            {myIds.has(c.id) ? (
              <button className="btn btn-ghost" onClick={() => removeCourse(c.id)}>Remove</button>
            ) : (
              <button className="btn" onClick={() => addCourse(c.id)}>Add</button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
