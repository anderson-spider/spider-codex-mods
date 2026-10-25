import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const state = vi.hoisted(() => ({ home: '' }))
vi.mock('node:os', async (original) => ({ ...await original<typeof import('node:os')>(), homedir: () => state.home }))
import { checkUrl, configure, configPath, readConfig } from '../src/config.js'

beforeEach(async () => { state.home = await mkdtemp(join(tmpdir(), 'comfy-config-')) })
afterEach(async () => { await rm(state.home, { recursive: true, force: true }); vi.unstubAllEnvs() })

test('validates origins and rejects credentials, paths, queries and fragments', () => {
  expect(checkUrl(' https://Comfy.Example.com/ ')).toBe('https://comfy.example.com')
  expect(checkUrl('http://comfy.local:8188')).toBe('http://comfy.local:8188')
  for (const bad of [undefined, '', 5, 'comfy.local', 'ftp://comfy.local', 'http://u:p@comfy.local', 'http://comfy.local/api', 'http://comfy.local/?', 'http://comfy.local/#']) expect(() => checkUrl(bad)).toThrow()
})
test('reads changes without restart and leaves valid config intact after rejected input', async () => {
  await expect(readConfig()).rejects.toThrow('setup skill')
  await configure('http://comfy.local:8188/')
  expect(await readConfig()).toBe('http://comfy.local:8188')
  await expect(configure('not a URL')).rejects.toThrow()
  expect(JSON.parse(await readFile(configPath(), 'utf8'))).toEqual({ url: 'http://comfy.local:8188' })
  await configure('https://other.example')
  expect(await readConfig()).toBe('https://other.example')
  await writeFile(configPath(), '{')
  await expect(readConfig()).rejects.toThrow('setup skill')
})
test('environment and project-style settings do not supply configuration', async () => {
  vi.stubEnv('COMFYUI_URL', 'http://untrusted.example')
  await mkdir(join(state.home, '.codex'))
  await writeFile(join(state.home, '.codex', 'config.toml'), 'url = "http://untrusted.example"')
  await expect(readConfig()).rejects.toThrow('setup skill')
  await configure('http://trusted.example')
  expect(await readConfig()).toBe('http://trusted.example')
})
