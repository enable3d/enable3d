const loggerCache: Map<string, number> = new Map()
const LOG_LIMIT = 5

export const logger = (msg: string, error = false) => {
  if (!loggerCache.has(msg)) {
    loggerCache.set(msg, 1)
  } else {
    const count = loggerCache.get(msg)
    if (typeof count === 'undefined') return
    if (count >= LOG_LIMIT) return
    loggerCache.set(msg, count + 1)
  }

  if (error) console.error(`%c [enable3d] ${msg} `, 'background: #222; color: #bada55')
  else console.warn(`%c [enable3d] ${msg} `, 'background: #222; color: #bada55')
}
