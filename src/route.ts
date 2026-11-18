import { useEffect, useState } from 'react'

/** Hash routes: `#/` the plan, `#/map` the skill map, `#/week` the week-1 checklist, `#/learn/<id>` one lesson. */
export type Route = { page: 'home' } | { page: 'map' } | { page: 'week' } | { page: 'lesson'; id: string }

function parse(hash: string): Route {
  const [, first, id] = decodeURIComponent(hash.replace(/^#/, '')).split('/')
  if (first === 'week') return { page: 'week' }
  if (first === 'map') return { page: 'map' }
  if (first === 'learn' && id) return { page: 'lesson', id }
  return { page: 'home' }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(location.hash))
  useEffect(() => {
    const on = () => setRoute(parse(location.hash))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export const lessonHref = (id: string) => `#/learn/${id}`
