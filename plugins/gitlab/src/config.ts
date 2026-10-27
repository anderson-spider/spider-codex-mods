import { readFile, mkdir, writeFile, rename, unlink } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { parseTokens } from './tokens'

export const configPath = () => join(homedir(), '.config', 'spider-codex-mods', 'gitlab.json')

export async function readConfig(): Promise<Map<string, string>> {
  let value: unknown
  try {
    value = (JSON.parse(await readFile(configPath(), 'utf8')) as { tokens?: unknown } | null)?.tokens
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw new Error('GitLab personal configuration is unreadable or invalid. Run the configuration utility again.', { cause: error })
    value = process.env.GITLAB_PLUGINS_TOKENS
  }
  const parsed = parseTokens(value)
  if (!parsed.tokens) throw new Error('Configure GitLab tokens in the personal configuration file or GITLAB_PLUGINS_TOKENS.')
  return parsed.tokens
}

export async function configure(value: unknown): Promise<void> {
  if (!parseTokens(value).tokens || typeof value !== 'string') throw new Error('GITLAB_PLUGINS_TOKENS must contain valid host=token pairs.')
  const file = configPath()
  await mkdir(dirname(file), { recursive: true, mode: 0o700 })
  const temp = `${file}.${randomUUID()}.tmp`
  try {
    await writeFile(temp, JSON.stringify({ tokens: value }) + '\n', { mode: 0o600, flag: 'wx' })
    await rename(temp, file)
  } finally { await unlink(temp).catch(() => {}) }
}
