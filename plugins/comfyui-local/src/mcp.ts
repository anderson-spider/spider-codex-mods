import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import Ajv from 'ajv'
import manifest from '../plugin.json' with { type: 'json' }
import { tools } from './tools.js'
import { dispatch } from './dispatch.js'
import { createHost, absolutePath } from './host.js'
import { readConfig } from './config.js'

const ajv = new Ajv({ strict: false })
const validators = new Map(tools.map(tool => [tool.name, ajv.compile({ ...tool.inputSchema, additionalProperties: false })]))

export function createServer(loadConfig: () => Promise<string> = readConfig) {
  const server = new Server({ name: manifest.name, version: manifest.version }, { capabilities: { tools: {} } })
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }))
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const { name, arguments: input = {} } = request.params
      const validate = validators.get(name)
      if (!validate) throw new Error(`Unknown tool: ${name}`)
      if (!validate(input)) throw new Error(`Invalid arguments: ${ajv.errorsText(validate.errors)}`)
      const base = await loadConfig()
      if (name === 'get_output') {
        if (typeof input.directory !== 'string') throw new Error('Pass an absolute directory in the current task workspace to get_output.')
        absolutePath(input.directory)
      }
      if (name === 'upload_file') absolutePath(String(input.path))
      if ((name === 'get_workflow' || name === 'save_workflow') && typeof input.file === 'string') absolutePath(input.file)
      const result = await dispatch(name, input, createHost(base))
      return { content: [{ type: 'text', text: result.text }], isError: result.isError }
    } catch (error) {
      return { content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }], isError: true }
    }
  })
  return server
}
