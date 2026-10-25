import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const args = process.argv.slice(2)
const installed = args[0] === '--installed'
if (installed) args.shift()
const [name, input = '{}'] = args
if (!name) throw new Error('Usage: node scripts/mcp-call.mjs [--installed] <tool|list> [JSON arguments]')
const manifest = JSON.parse(await readFile('plugins/comfyui-local/plugin.json', 'utf8'))
const root = installed ? join(homedir(), '.codex/plugins/cache/spider-codex-mods/comfyui-local', manifest.version) : resolve('plugins/comfyui-local')
const client = new Client({ name: 'spider-codex-mods-smoke', version: '0.1.0' })
try {
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [join(root, 'dist/server.mjs')], cwd: root, stderr: 'inherit' }))
  const result = name === 'list' ? await client.listTools() : await client.callTool({ name, arguments: JSON.parse(input) }, undefined, { timeout: 660_000 })
  console.log(JSON.stringify(result, null, 2))
  if (result.isError) process.exitCode = 1
} finally {
  await client.close()
}
