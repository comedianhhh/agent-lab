import { createContext, useContext } from 'react'
import type { BotActivity } from 'bloub-react'

/** Labs tell the header's bloub what they're doing: thinking while an animation runs, done when it finishes. */
export const MoodContext = createContext<(a: BotActivity) => void>(() => {})
export const useMood = () => useContext(MoodContext)
