import { motion } from 'motion/react'
import type { LabId } from '../data/lessons'

/** One line drawing per lab, drawn in on hover (pathLength), on the tarot face. */
const PATHS: Record<LabId, string[]> = {
  lru: ['M10 30h18M38 30h18M66 30h18', 'M28 24l10 6-10 6M56 24l10 6-10 6', 'M10 60h74', 'M20 52v16M47 52v16M74 52v16'],
  loop: ['M47 14a33 33 0 1 1-0.1 0', 'M47 14l8-6M47 14l8 6', 'M47 47m-6 0a6 6 0 1 0 12 0a6 6 0 1 0-12 0'],
  graph: ['M14 47h14M50 47h14', 'M28 40h22v14H28zM64 40h18v14H64z', 'M73 40c0-22-34-22-34 0', 'M39 54v20h34'],
  hybrid: ['M14 20h30M14 32h22M14 44h26', 'M54 20h26M54 32h30M54 44h18', 'M29 52l18 22 18-22', 'M47 74v10'],
  rls: ['M20 22h54v52H20z', 'M20 40h54M20 58h54', 'M38 22v52', 'M80 64l-8 8M72 64l8 8'],
  sse: ['M12 30h70', 'M12 50h70', 'M12 70h70', 'M30 26l6 4-6 4M52 46l6 4-6 4M70 66l6 4-6 4'],
  evals: ['M14 76V18M14 76h70', 'M20 66l16-14 14 6 16-22 14-10', 'M80 26m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0'],
  mcp: ['M18 18v62M76 18v62', 'M18 30h58M76 44H18M18 58h58M76 72H18', 'M70 27l6 3-6 3M24 41l-6 3 6 3'],
  voice: ['M14 47h6M26 35v24M34 25v44M42 39v16M50 21v52M58 33v28M66 41v12M74 31v32M82 47h0'],
  durable: ['M14 47h16M38 47h16M62 47h16', 'M30 40h8v14h-8zM54 40h8v14h-8zM78 40h8v14h-8z', 'M44 24l8 10M52 24l-8 10', 'M18 70c20 10 40 10 60 0'],
  injection: ['M14 24h26v18H14z', 'M54 52h26v18H54z', 'M40 33c20 0 27 8 27 19', 'M28 42v20h20', 'M24 30h6'],
  aws: ['M20 30h20v14H20zM56 30h20v14H56zM38 64h20v14H38z', 'M40 37h16M30 44l14 20M66 44L52 64'],
  reach: ['M12 47h22', 'M34 40h14v14H34z', 'M48 47c12 0 12-22 26-22M48 47h26M48 47c12 0 12 22 26 22', 'M74 25h8M74 47h8M74 69h8', 'M80 21l4 4-4 4'],
}

export function Glyph({ lab, on }: { lab: LabId; on: boolean }) {
  return (
    <svg viewBox="0 0 94 94" aria-hidden="true">
      {PATHS[lab].map((d, i) => (
        <motion.path key={i} d={d} className="gl" initial={false} animate={{ pathLength: on ? [0, 1] : 1, opacity: on ? 1 : 0.55 }} transition={{ duration: on ? 0.9 : 0.3, delay: on ? i * 0.12 : 0, ease: 'easeInOut' }} />
      ))}
    </svg>
  )
}
