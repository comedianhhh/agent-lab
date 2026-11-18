import { BloubBot, stateForActivity, type BotActivity } from 'bloub-react'
import type { Route } from '../route'
import { useTheme } from '../theme'

export function Header({ activity, route }: { activity: BotActivity; route: Route }) {
  const theme = useTheme()
  return (
    <header className="top">
      <div className="who">
        <BloubBot size={40} state={stateForActivity(activity)} color={theme.ink} paper={theme.bg} follow className="bloub" label="bloub" />
        <a href="#/">
          <b>Agent Lab</b>
          <span>agent 工程学习路线</span>
        </a>
      </div>
      <nav aria-label="Primary">
        <a href="#/" aria-current={route.page === 'home' ? 'page' : undefined}>路线</a>
        <a href="#/map" aria-current={route.page === 'map' ? 'page' : undefined}>技能地图</a>
        <a href="#/week" aria-current={route.page === 'week' ? 'page' : undefined}>第 1 周</a>
        <a href="#/learn/langgraph" aria-current={route.page === 'lesson' ? 'page' : undefined}>课程</a>
      </nav>
    </header>
  )
}
