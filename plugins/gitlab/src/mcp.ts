import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import Ajv from 'ajv'
import { execFile } from 'node:child_process'
import { isAbsolute } from 'node:path'
import { promisify } from 'node:util'
import tools from './tools.json' with { type: 'json' }
import { gitlab, GitlabError } from './api'
import { comment } from './comments'
import { InputError, makeCtx } from './context'
import { errorText } from './errors'
import { jobLog } from './joblog'
import { label } from './labels'
import { mr } from './mr'
import { pipeline } from './pipelines'
import { currentBranch, locate, projectPath, sshHostname } from './remote'
import { readConfig } from './config'
import { user } from './users'

const execute = promisify(execFile)
const handlers = { gitlab_mr: mr, gitlab_mr_comment: comment, gitlab_pipeline: pipeline, gitlab_job_log: jobLog, gitlab_label: label, gitlab_user: user }
const ajv = new Ajv({ strict: false })
const validators = new Map(tools.map(tool => [tool.name, ajv.compile(tool.inputSchema)]))

export function createServer(loadConfig = readConfig) {
  const server = new Server({ name: 'gitlab', version: '0.1.2' }, { capabilities: { tools: {} } })
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }))
  server.setRequestHandler(CallToolRequestSchema, async request => {
    let token = ''
    const reply = (text: string, isError = false) => ({ content: [{ type: 'text' as const, text: token ? text.split(token).join('[token]') : text }], isError })
    try {
      const { name, arguments: input = {} } = request.params
      const validate = validators.get(name)
      if (!validate || !validate(input)) throw new Error(`Invalid tool or arguments: ${ajv.errorsText(validate?.errors)}`)
      const workspace = String(input.workspace)
      if (!isAbsolute(workspace)) throw new Error('workspace must be an absolute path to the current Git repository.')
      const run = async (command: string, args: string[], timeout: number) => {
        try { const result = await execute(command, args, { cwd: workspace, timeout, maxBuffer: 1024 * 1024 }); return { exitCode: 0, stdout: result.stdout } }
        catch { return { exitCode: 1, stdout: '' } }
      }
      const git = (args: string[]) => run('git', args, 10_000)
      const where = await locate(git)
      if ('error' in where) throw new Error(where.error)
      const tokens = await loadConfig()
      let host = where.host
      token = tokens.get(host) ?? ''
      if (!token && where.ssh) {
        const real = await sshHostname(args => run('ssh', args, 5_000), host)
        if (real) { host = real; token = tokens.get(host) ?? '' }
      }
      if (!token) throw new Error(`GitLab configuration has no token for ${host}.`)
      let project = where.project
      if (input.project !== undefined) {
        const named = typeof input.project === 'string' ? projectPath(input.project) : undefined
        if (!named) throw new Error(`project must be a project path on ${host} (group/project), not a URL.`)
        project = named
      }
      const api = gitlab(async (url, init) => {
        const response = await fetch(url, { ...init, redirect: 'error' })
        return { status: response.status, ok: response.ok, text: await response.text(), headers: Object.fromEntries(response.headers.entries()) }
      }, host, project, token)
      const clock = { now: () => Date.now(), sleep: (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)) }
      try {
        const handler = handlers[name as keyof typeof handlers]
        return reply(await handler(makeCtx(api, () => currentBranch(git), clock, project.toLowerCase() !== where.project.toLowerCase()), input))
      } catch (err) {
        if (err instanceof InputError) return reply(err.message, true)
        if (err instanceof GitlabError) return reply(errorText(err, project, host), true)
        throw err
      }
    } catch (err) { return reply(err instanceof Error ? err.message : String(err), true) }
  })
  return server
}
