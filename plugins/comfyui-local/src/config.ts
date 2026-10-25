import { readFile, mkdir, writeFile, rename } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { randomUUID } from 'node:crypto'

export const configPath = () => join(homedir(), '.config', 'spider-codex-mods', 'comfyui-local.json')
export function checkUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('ComfyUI URL is missing.')
  const text = value.trim()
  const url = new URL(text)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname.replace(/\/+$/, '') || text.includes('?') || text.includes('#')) {
    throw new Error('ComfyUI URL must be an HTTP(S) origin without credentials, path, query or fragment.')
  }
  return url.origin
}

// Only this personal file is consulted. Project files, tool arguments and COMFYUI_URL cannot select a server.
export async function readConfig(): Promise<string> {
  try {
    const value: unknown = JSON.parse(await readFile(configPath(), 'utf8'))
    return checkUrl((value as { url?: unknown } | null)?.url)
  } catch {
    throw new Error('Configure comfyui-local with its setup skill. The personal ~/.config/spider-codex-mods/comfyui-local.json file is missing, unreadable or invalid.')
  }
}

export async function configure(value: string): Promise<void> {
  const url = checkUrl(value)
  const file = configPath()
  await mkdir(dirname(file), { recursive: true, mode: 0o700 })
  const temporary = `${file}.${randomUUID()}.tmp`
  await writeFile(temporary, JSON.stringify({ url }, null, 2) + '\n', { mode: 0o600 })
  await rename(temporary, file)
}
