import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useMood } from '../mood'
import { Toggle } from './kit'

const ROWS: [number, string, string][] = [[1, 'ana', '喜欢燕麦拿铁'], [2, 'ana', '周三有面试'], [3, 'ana', '在学韩语'], [4, 'bea', '对花生过敏'], [5, 'bea', '住在 Bloor St'], [6, 'bea', '12 月去东京']]

export function RlsLab() {
  const mood = useMood()
  const [rls, setRls] = useState(true)
  const [where, setWhere] = useState(false)
  const [role, setRole] = useState<'app' | 'owner'>('app')
  const [who, setWho] = useState<'ana' | 'bea' | 'none'>('ana')
  const bypass = role === 'owner'
  const vis = ROWS.map((r) => {
    let ok = true
    if (rls && !bypass) ok = who !== 'none' && r[1] === who
    if (where) ok = ok && who !== 'none' && r[1] === who
    return ok
  })
  const leakRow = (i: number) => vis[i] && (who === 'none' || ROWS[i][1] !== who)
  const leak = ROWS.some((_, i) => leakRow(i))
  const n = vis.filter(Boolean).length
  const [cls, msg] = leak
    ? ['bad', bypass && rls ? '泄漏：表的 owner 默认绕过 RLS（除非 FORCE ROW LEVEL SECURITY）。应用要用单独的、没有 BYPASSRLS 的角色连接。' : '泄漏：没有 RLS，只要应用代码少写一个 WHERE，所有人的记忆都会被查出来。']
    : n === 0
      ? ['warn', '一行都没有：请求没执行 SET LOCAL，current_setting(…, true) 返回 NULL，policy 判断为假。安全，但功能坏了；测试要能抓到这种情况。']
      : ['good', rls && !bypass ? (where ? '安全：RLS 和 WHERE 双重保护。' : '安全：应用没写 WHERE，RLS 照样只放行自己的行。这就是兜底。') : '暂时安全，靠的是应用代码里的 WHERE。换一个忘写 WHERE 的查询就会漏。']
  useEffect(() => { mood(leak ? 'error' : n === 0 ? 'needs-input' : 'done') }, [leak, n]) // eslint-disable-line react-hooks/exhaustive-deps

  const sql = [
    rls ? 'ALTER TABLE memories ENABLE ROW LEVEL SECURITY;' : '-- RLS 没开',
    rls ? "CREATE POLICY own_rows ON memories\n  USING (user_id = current_setting('app.user_id', true));" : null,
    '',
    `-- 连接角色：${bypass ? 'memories 表的 owner（默认绕过 RLS）' : 'app_user（不是 owner，没有 BYPASSRLS）'}`,
    'BEGIN;',
    who === 'none' ? '-- 忘了 SET LOCAL app.user_id' : `SET LOCAL app.user_id = '${who}';`,
    `SELECT * FROM memories${where ? (who === 'none' ? ' WHERE user_id = NULL' : ` WHERE user_id = '${who}'`) : ''};`,
    'COMMIT;',
  ].filter((x) => x !== null).join('\n')

  return (
    <div className="two">
      <div className="col">
        <div className="panel">
          <h3>开关</h3>
          <Toggle id="r-rls" label="开启 RLS" checked={rls} onChange={setRls} />
          <Toggle id="r-where" label="应用代码写了 WHERE user_id = ?" checked={where} onChange={setWhere} />
          <label className="ctl" htmlFor="r-role">连接角色
            <select id="r-role" value={role} onChange={(e) => setRole(e.target.value as 'app' | 'owner')}><option value="app">app_user</option><option value="owner">表的 owner</option></select>
          </label>
          <label className="ctl" htmlFor="r-who">当前请求的用户
            <select id="r-who" value={who} onChange={(e) => setWho(e.target.value as 'ana' | 'bea' | 'none')}><option value="ana">ana</option><option value="bea">bea</option><option value="none">忘了 SET LOCAL</option></select>
          </label>
        </div>
        <AnimatePresence mode="wait"><motion.div key={msg} className={`verdict ${cls}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{msg}</motion.div></AnimatePresence>
        <span className="kicker">SELECT 返回的行（红色 = 不该看到）</span>
        <div className="col" style={{ gap: 6 }}>
          {ROWS.map((r, i) => (
            <motion.div key={r[0]} className={`rrow${leakRow(i) ? ' leak' : ''}`} animate={{ opacity: vis[i] ? 1 : 0.22, x: vis[i] ? 0 : 14, scale: leakRow(i) ? [1, 1.02, 1] : 1 }} transition={{ duration: 0.3, delay: i * 0.03 }}>
              <span className="num">{r[0]}</span><span>{r[1]}</span><span style={{ textDecoration: vis[i] ? 'none' : 'line-through' }}>{r[2]}</span>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="col">
        <h3>实际执行的 SQL</h3>
        <pre className="log">{sql}</pre>
        <p className="small muted">连接池里的连接会被复用，所以用 SET LOCAL（只在当前事务内有效），不用 SET，否则上一个用户的值会留给下一个请求。</p>
      </div>
    </div>
  )
}
