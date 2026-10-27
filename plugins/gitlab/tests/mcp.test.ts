import { afterEach, expect, test, vi } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { execFileSync } from 'node:child_process'
import { cp, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createServer } from '../src/mcp'
import { parseTokens } from '../src/tokens'

const cleanup: (() => Promise<unknown>)[] = []
afterEach(async () => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); for (const fn of cleanup.splice(0).reverse()) await fn() })
async function repository(host: string) {
  const dir = await mkdtemp(join(tmpdir(), 'gitlab-workspace-'))
  cleanup.push(() => rm(dir, { recursive: true, force: true }))
  execFileSync('git', ['init', '-q', dir])
  execFileSync('git', ['-C', dir, 'remote', 'add', 'origin', `https://${host}/group/repo.git`])
  return dir
}
async function connect() {
  const server = createServer(async () => parseTokens(process.env.GITLAB_PLUGINS_TOKENS).tokens!)
  const client = new Client({ name: 'test', version: '1' })
  const [a, b] = InMemoryTransport.createLinkedPair()
  await server.connect(a); await client.connect(b)
  cleanup.push(() => server.close(), () => client.close())
  return client
}
test('selects the workspace host token on every call and masks echoed secrets', async () => {
  const a = await repository('first.example')
  const b = await repository('second.example')
  vi.stubEnv('GITLAB_PLUGINS_TOKENS', 'first.example=secret-one,second.example=secret-two')
  const fetchMock = vi.fn(async (_url: string, init: RequestInit) => new Response(JSON.stringify({ id: 1, username: (init.headers as Record<string, string>)['PRIVATE-TOKEN'] }), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  const client = await connect()
  const responseA = await client.callTool({ name: 'gitlab_user', arguments: { workspace: a } })
  const responseB = await client.callTool({ name: 'gitlab_user', arguments: { workspace: b } })
  expect(JSON.stringify(responseA)).not.toContain('secret-one')
  expect(JSON.stringify(responseB)).not.toContain('secret-two')
  expect(JSON.stringify(responseB)).toContain('[token]')
  expect(fetchMock.mock.calls.map(([url, init]) => [url, (init.headers as Record<string, string>)['PRIVATE-TOKEN'], init.redirect])).toEqual([
    ['https://first.example/api/v4/user', 'secret-one', 'error'],
    ['https://second.example/api/v4/user', 'secret-two', 'error'],
  ])
  expect((await client.callTool({ name: 'gitlab_user', arguments: { workspace: '.' } })).isError).toBe(true)
  expect((await client.callTool({ name: 'gitlab_mr', arguments: { workspace: a, action: 'list', project: 'https://other.example/x/y' } })).isError).toBe(true)
  expect(fetchMock).toHaveBeenCalledTimes(2)
})
test('bundled server starts outside the checkout and validates its six tools', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'gitlab-installed-'))
  cleanup.push(() => rm(dir, { recursive: true, force: true }))
  await cp(resolve('plugins/gitlab/dist'), join(dir, 'dist'), { recursive: true })
  const client = new Client({ name: 'installed-test', version: '1' })
  const transport = new StdioClientTransport({ command: process.execPath, args: [join(dir, 'dist/server.mjs')], cwd: dir, stderr: 'pipe' })
  cleanup.push(() => client.close())
  await client.connect(transport)
  expect((await client.listTools()).tools.map(t => t.name)).toEqual(['gitlab_mr', 'gitlab_mr_comment', 'gitlab_pipeline', 'gitlab_job_log', 'gitlab_label', 'gitlab_user'])
  expect((await client.callTool({ name: 'gitlab_user', arguments: {} })).isError).toBe(true)
})
