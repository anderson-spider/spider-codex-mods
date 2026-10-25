import { execFile } from 'node:child_process'
import { access, readFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import type { Host } from './dispatch.js'

export function absolutePath(file: string): string {
  if (!isAbsolute(file)) throw new Error('Use an absolute local path in the current task workspace, not the plugin installation directory.')
  return file
}

export function createHost(base: string): Host {
  return {
    base,
    fetch: async (url, init) => {
      const response = await fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(30_000) })
      return { status: response.status, ok: response.ok, text: await response.text() }
    },
    run: (argv, init) => new Promise((resolve, reject) => {
      const [command, ...args] = argv
      if (!command) return reject(new Error('Missing executable'))
      execFile(command, args, { timeout: init?.timeoutMs ?? 30_000, maxBuffer: 4 * 1024 * 1024, windowsHide: true }, (error, stdout, stderr) => {
        if (error && typeof error.code !== 'number') return reject(error)
        resolve({ exitCode: typeof error?.code === 'number' ? error.code : 0, stdout, stderr })
      })
    }),
    exists: async (file) => { absolutePath(file); return access(file).then(() => true, () => false) },
    read: (file) => readFile(absolutePath(file), 'utf8'),
    write: async (file, text) => { absolutePath(file); await mkdir(dirname(file), { recursive: true }); await writeFile(file, text) },
    clock: { now: async () => Date.now(), sleep: async (ms) => { await setTimeout(ms) } },
  }
}
