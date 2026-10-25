import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { configure } from './config.js'
import { createServer } from './mcp.js'

async function main() {
  if (process.argv[2] === 'configure') {
    if (process.argv.length !== 4) throw new Error('Usage: node dist/server.mjs configure <ComfyUI origin>')
    await configure(process.argv[3]!)
    console.error('ComfyUI Local configured. Configuration is read on every tool call.')
    return
  }
  await createServer().connect(new StdioServerTransport())
}
main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1 })
