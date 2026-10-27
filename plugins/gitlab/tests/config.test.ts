import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const state = vi.hoisted(() => ({ home: '' }))
vi.mock('node:os', async original => ({ ...await original<typeof import('node:os')>(), homedir: () => state.home }))
import { configure, configPath, readConfig } from '../src/config'

beforeEach(async () => { state.home = await mkdtemp(join(tmpdir(), 'gitlab-config-')); vi.stubEnv('GITLAB_PLUGINS_TOKENS', '') })
afterEach(async () => { await rm(state.home, { recursive: true, force: true }); vi.unstubAllEnvs() })

test('stores multiple tokens privately, reads updates and preserves the file after invalid input', async () => {
  await configure('first.example=one,second.example=two')
  expect((await stat(configPath())).mode & 0o777).toBe(0o600)
  expect((await readConfig()).get('second.example')).toBe('two')
  await expect(configure('invalid')).rejects.toThrow()
  expect(JSON.parse(await readFile(configPath(), 'utf8')).tokens).toBe('first.example=one,second.example=two')
  await configure('first.example=changed')
  expect((await readConfig()).get('first.example')).toBe('changed')
})
test('uses environment only when no personal file exists and fails closed on malformed files', async () => {
  vi.stubEnv('GITLAB_PLUGINS_TOKENS', 'host.example=env')
  expect((await readConfig()).get('host.example')).toBe('env')
  await configure('host.example=file')
  expect((await readConfig()).get('host.example')).toBe('file')
  await writeFile(configPath(), '{')
  await expect(readConfig()).rejects.toThrow('unreadable or invalid')
})
