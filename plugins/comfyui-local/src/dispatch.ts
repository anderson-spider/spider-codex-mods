import {
  cancelJob,
  getJobStatus,
  getOutput,
  getTemplate,
  getWorkflow,
  listWorkflows,
  managerPacks,
  restartServer,
  runManagerTask,
  saveWorkflow,
  searchModels,
  searchNodes,
  searchPacks,
  searchTemplates,
  submitWorkflow,
  systemInfo,
  uploadFile,
  type Clock,
  type Fetch,
  type Out,
  type ReadText,
  type Run,
  type WriteText,
} from './api.js'

export type Host = { fetch: Fetch; run: Run; exists: (path: string) => Promise<boolean>; read: ReadText; write: WriteText; clock: Clock; base: string }
export function dispatch(name: string, e: Record<string, unknown>, h: Host): Promise<Out> {
 switch (name) {
 case 'system_info': return systemInfo(h.fetch, h.base)
 case 'search_nodes': return searchNodes(h.fetch, h.base, e)
 case 'search_models': return searchModels(h.fetch, h.base, e)
 case 'search_templates': return searchTemplates(h.fetch, h.base, e)
 case 'get_template': return getTemplate(h.fetch, h.base, e)
 case 'submit_workflow': return submitWorkflow(h.fetch, h.base, e)
 case 'get_job_status': return getJobStatus(h.fetch, h.base, e)
 case 'cancel_job': return cancelJob(h.fetch, h.base, e)
 case 'upload_file': return uploadFile(h.run, h.exists, h.base, e)
 case 'get_output': return getOutput(h.fetch, h.run, h.base, e)
 case 'manager_packs': return managerPacks(h.fetch, h.base, e)
 case 'manager_search_packs': return searchPacks(h.fetch, e)
 case 'manager_task': return runManagerTask(h.fetch, h.base, e, `comfyui-local-${Date.now()}`)
 case 'restart_server': return restartServer(h.fetch, h.base, e, h.clock)
 case 'save_workflow': return saveWorkflow(h.fetch, h.read, h.base, e)
 case 'list_workflows': return listWorkflows(h.fetch, h.base)
 case 'get_workflow': return getWorkflow(h.fetch, h.write, h.base, e)
 default: return Promise.resolve({text: 'Unknown tool: '+name, isError: true})
 }
}
