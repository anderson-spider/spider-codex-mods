const TOKEN = /^[\x21-\x2b\x2d-\x3c\x3e-\x7e]{1,512}$/
const HOST = /^[a-z0-9.-]+(:\d{1,5})?$/

/** The host-to-token map of the environment variable: pairs separated by commas or whitespace. Any malformed pair refuses the whole value. */
export function parseTokens(value: unknown): { tokens: Map<string, string>; off?: undefined } | { tokens?: undefined; off: 'no-tokens' | 'bad-tokens' } {
  if (value === undefined || value === null) return { off: 'no-tokens' }
  if (typeof value !== 'string') return { off: 'bad-tokens' }
  const pairs = value.split(/[\s,]+/).filter(Boolean)
  if (pairs.length === 0) return { off: 'no-tokens' }
  const tokens = new Map<string, string>()
  for (const pair of pairs) {
    const at = pair.indexOf('=')
    const host = pair.slice(0, at).toLowerCase()
    const token = pair.slice(at + 1)
    if (at <= 0 || !HOST.test(host) || !TOKEN.test(token) || tokens.has(host)) return { off: 'bad-tokens' }
    tokens.set(host, token)
  }
  return { tokens }
}
