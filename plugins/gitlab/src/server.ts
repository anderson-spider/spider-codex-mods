import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { configure } from './config'
import { createServer } from './mcp'

async function main() {
  if (process.argv[2] === 'configure') {
    if (process.argv.length !== 3) throw new Error('Usage: GITLAB_PLUGINS_TOKENS=<host=token pairs> node dist/server.mjs configure')
    await configure(process.env.GITLAB_PLUGINS_TOKENS)
    console.error('GitLab personal configuration saved.')
    return
  }
  await createServer().connect(new StdioServerTransport())
}
main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1 })
