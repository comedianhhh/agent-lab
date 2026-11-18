import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { BotActivity } from 'bloub-react'
import { Header } from './components/Header'
import { Home } from './components/Home'
import { LessonPage } from './components/Lesson'
import { SkillMap } from './components/SkillMap'
import { Week } from './components/Week'
import { LESSONS } from './data/lessons'
import { MoodContext } from './mood'
import { useRoute } from './route'

export default function App() {
  const route = useRoute()
  const [activity, setActivity] = useState<BotActivity>('idle')
  const rest = useRef<number>(0)

  // a lab's mood lasts a moment, then the bot settles back to idle
  const mood = (a: BotActivity) => {
    setActivity(a)
    clearTimeout(rest.current)
    if (a !== 'idle') rest.current = window.setTimeout(() => setActivity('idle'), a === 'thinking' || a === 'working' ? 4000 : 2200)
  }

  const key = route.page === 'lesson' ? `l-${route.id}` : route.page
  const first = useRef(true)
  useEffect(() => {
    if (!first.current) window.scrollTo(0, 0)
    first.current = false
    const l = route.page === 'lesson' && LESSONS.find((x) => x.id === route.id)
    document.title = l ? `${l.title} · Agent Lab` : route.page === 'week' ? '第 1 周 · Agent Lab' : route.page === 'map' ? '技能地图 · Agent Lab' : 'Agent Lab'
  }, [key, route])

  return (
    <MoodContext.Provider value={mood}>
      <div className="page">
        <Header activity={activity} route={route} />
        {/* enter-only: an exit animation that stalls (background tab) must never hold the old page on screen */}
        <motion.main key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}>
          {route.page === 'home' ? <Home /> : route.page === 'map' ? <SkillMap /> : route.page === 'week' ? <Week /> : <LessonPage id={route.id} />}
        </motion.main>
        <footer>
          <span>Agent Lab · 2026-11 → 2027-01</span>
          <span>资料链接 2026-10-31 逐个打开核对过 · 标"示意"的数字只用来演示原理</span>
        </footer>
      </div>
    </MoodContext.Provider>
  )
}
