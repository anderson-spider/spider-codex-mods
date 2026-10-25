import { afterEach, expect, test } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { createServer as httpServer } from 'node:http'
import { mkdtemp, cp, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createServer } from '../src/mcp.js'

const cleanup: (() => Promise<unknown>)[] = []
afterEach(async () => { for (const fn of cleanup.splice(0).reverse()) await fn() })
async function connect(loadConfig: () => Promise<string>) {
  const server = createServer(loadConfig)
  const client = new Client({ name: 'test', version: '1' })
  const [a, b] = InMemoryTransport.createLinkedPair()
  await server.connect(a)
  await client.connect(b)
  cleanup.push(() => server.close(), () => client.close())
  return client
}
test('discovers every tool without configuration and returns actionable errors', async () => {
  const client = await connect(async () => { throw new Error('Use the setup skill') })
  const { tools } = await client.listTools()
  expect(tools.map(t => t.name)).toContain('restart_server')
  expect(tools.map(t => t.name)).toContain('get_workflow')
  expect(await client.callTool({ name: 'system_info' })).toMatchObject({ isError: true, content: [{ type: 'text', text: 'Use the setup skill' }] })
  expect(await client.callTool({ name: 'unknown' })).toMatchObject({ isError: true })
  expect(await client.callTool({ name: 'submit_workflow', arguments: {} })).toMatchObject({ isError: true })
  expect(await client.callTool({ name: 'system_info', arguments: { url: 'http://other.example' } })).toMatchObject({ isError: true })
})
test('runs submission, status, download and upload through a real HTTP adapter', async () => {
  const requests: string[] = []
  const server = httpServer((req, res) => {
    requests.push(`${req.method} ${req.url}`)
    res.setHeader('Content-Type', 'application/json')
    if (req.url === '/prompt') res.end(JSON.stringify({ prompt_id: '11111111-2222-4333-8444-555555555555' }))
    else if (req.url === '/history/11111111-2222-4333-8444-555555555555') res.end(JSON.stringify({ '11111111-2222-4333-8444-555555555555': { status: { completed: true, status_str: 'success' }, outputs: { '1': { images: [{ filename: 'result.png', subfolder: '', type: 'output' }] } } } }))
    else if (req.url?.startsWith('/view?')) { res.setHeader('Content-Type', 'image/png'); res.end('test image bytes') }
    else if (req.url === '/upload/image') { req.resume(); req.on('end', () => res.end(JSON.stringify({ name: 'result.png', subfolder: '', type: 'input' }))) }
    else if (req.url === '/queue') res.end(JSON.stringify({ queue_running: [], queue_pending: [] }))
    else { res.statusCode = 404; res.end('{}') }
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  cleanup.push(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())))
  const address = server.address() as { port: number }
  const client = await connect(async () => `http://127.0.0.1:${address.port}`)
  const dir = await mkdtemp(join(tmpdir(), 'comfy-output-'))
  cleanup.push(() => rm(dir, { recursive: true, force: true }))
  const submitted = await client.callTool({ name: 'submit_workflow', arguments: { workflow: { '1': { class_type: 'SaveImage', inputs: {} } } } })
  expect(submitted.isError).toBe(false)
  const status = await client.callTool({ name: 'get_job_status', arguments: { prompt_id: '11111111-2222-4333-8444-555555555555' } })
  expect(JSON.stringify(status)).toContain('completed')
  const result = await client.callTool({ name: 'get_output', arguments: { prompt_id: '11111111-2222-4333-8444-555555555555', directory: dir, description: 'test' } })
  expect(result.isError).toBe(false)
  const { readdir } = await import('node:fs/promises')
  const files = await readdir(dir)
  expect(await readFile(join(dir, files[0]!), 'utf8')).toBe('test image bytes')
  expect((await client.callTool({ name: 'upload_file', arguments: { path: join(dir, files[0]!) } })).isError).toBe(false)
  expect(requests).toContain('POST /prompt')
  expect(requests).toContain('POST /upload/image')
  expect((await client.callTool({ name: 'get_output', arguments: { prompt_id: '11111111-2222-4333-8444-555555555555' } })).isError).toBe(true)
  expect((await client.callTool({ name: 'upload_file', arguments: { path: 'relative.png' } })).isError).toBe(true)
})
test('bundled server works outside checkout without node_modules and stdout stays valid MCP', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'comfy-installed-'))
  cleanup.push(() => rm(dir, { recursive: true, force: true }))
  await cp(resolve('plugins/comfyui-local/dist'), join(dir, 'dist'), { recursive: true })
  const transport = new StdioClientTransport({ command: process.execPath, args: [join(dir, 'dist', 'server.mjs')], cwd: dir, stderr: 'pipe' })
  let stderr = ''
  transport.stderr?.on('data', chunk => { stderr += chunk.toString() })
  const client = new Client({ name: 'clean-install', version: '1' })
  cleanup.push(() => client.close())
  await client.connect(transport)
  expect((await client.listTools()).tools.map(t => t.name)).toContain('submit_workflow')
  expect((await client.callTool({ name: 'save_workflow', arguments: { path: 42 } })).isError).toBe(true)
  expect(stderr).toBe('')
})
