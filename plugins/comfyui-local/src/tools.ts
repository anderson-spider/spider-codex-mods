import { MANAGER_ACTIONS } from './api.js'
import { allOf, type SchemaFor } from './schema.js'
import type { Inputs } from './inputs.js'
import type { Tool } from '@modelcontextprotocol/sdk/types.js'
const LIMIT = { type: 'number', description: 'Results to show (default 20, at most 200).' } as const
const PROMPT_ID = 'The prompt_id that submit_workflow answered.'
const WORKFLOW_PATH = 'The workflow path relative to workflows/, subfolders allowed, such as "02 Pixel Art/Isometric building"; .json is added when missing.'

const definitions: Tool[] = [
{
      name: 'system_info',
      description: 'ComfyUI version, GPU and memory, queue counts, and whether ComfyUI-Manager is installed. Call it first to know what the server can run.',
      inputSchema: { type: 'object', properties: {} } satisfies SchemaFor<Inputs['mcp__comfyui-local__system_info']>,
    },
{
      name: 'search_nodes',
      description:
        'Search the nodes installed on the server (core and custom node packs) by words, with their category, pack, inputs (name: TYPE, ? when optional, = default) and outputs. Use the exact input names and class names in submit_workflow.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Words to find in the name, display name, description or category.' },
          category: { type: 'string', description: 'Category filter, such as "sampling", "loaders", "image/upscaling".' },
          pack: { type: 'string', description: 'Pack filter: "core" or part of a custom node pack folder name.' },
          input_type: { type: 'string', description: 'Only nodes taking this input type, such as IMAGE, LATENT, MODEL, CONDITIONING.' },
          output_type: { type: 'string', description: 'Only nodes producing this output type, such as IMAGE, LATENT, AUDIO.' },
          limit: LIMIT,
        },
      } satisfies SchemaFor<Inputs['mcp__comfyui-local__search_nodes']>,
    },
{
      name: 'search_models',
      description: 'List the model files on the server as folder/file (checkpoints, diffusion_models, loras, vae, text_encoders, upscale_models, ...). The file name is what the loader node takes.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Words to find in the folder or file name; empty lists everything.' },
          folder: { type: 'string', description: 'One model folder, such as checkpoints or loras.' },
          limit: LIMIT,
        },
      } satisfies SchemaFor<Inputs['mcp__comfyui-local__search_models']>,
    },
{
      name: 'search_templates',
      description: 'Search the workflow templates the server ships (core and node packs) by words, tag or model. Read one with get_template; it shows which nodes and models a task needs.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Words to find in the title, description, tags or models.' },
          tag: { type: 'string', description: 'Tag filter, such as "Text to Image", "Image to Video", "Upscale", "Audio", "3D".' },
          model: { type: 'string', description: 'Model filter, such as Flux, SDXL, Wan, LTX.' },
          limit: LIMIT,
        },
      } satisfies SchemaFor<Inputs['mcp__comfyui-local__search_templates']>,
    },
{
      name: 'get_template',
      description: 'The workflow JSON of one template, in UI format (nodes with type and widgets_values, links). Use it as the reference to build the API-format prompt for submit_workflow.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'The template name from search_templates.' },
          pack: { type: 'string', description: 'The pack from search_templates, for a node pack template; omit for a core one.' },
        },
        required: ['name'],
      } satisfies SchemaFor<Inputs['mcp__comfyui-local__get_template']>,
    },
{
      name: 'submit_workflow',
      description:
        'Queue an API-format workflow: an object mapping node ids to { "class_type", "inputs" }, where an input is a value or [from_node_id, output_index]. Include an output node (SaveImage, SaveAudio, SaveAnimatedWEBP, PreviewImage...) or nothing is retrievable. Answers the prompt_id to poll with get_job_status.',
      inputSchema: {
        type: 'object',
        properties: {
          workflow: { description: 'The API-format prompt as a JSON object, or that JSON as a string.' },
          client_id: { type: 'string', description: 'Optional client id recorded with the job.' },
        },
        required: ['workflow'],
      } satisfies SchemaFor<Inputs['mcp__comfyui-local__submit_workflow']>,
    },
{
      name: 'get_job_status',
      description: 'The state of a job: pending (with its place), running, completed (with its output files) or failed (with the node error). Poll every few seconds. Without prompt_id, the queue.',
      inputSchema: { type: 'object', properties: { prompt_id: { type: 'string', description: PROMPT_ID } } } satisfies SchemaFor<Inputs['mcp__comfyui-local__get_job_status']>,
    },
{
      name: 'cancel_job',
      description: 'Remove a pending job or interrupt a running one; without prompt_id, interrupt whatever runs (or, with clear_pending, empty the pending queue instead).',
      inputSchema: {
        type: 'object',
        properties: {
          prompt_id: { type: 'string', description: PROMPT_ID },
          clear_pending: { type: 'boolean', description: 'Delete every pending job (with no prompt_id, only that).' },
        },
      } satisfies SchemaFor<Inputs['mcp__comfyui-local__cancel_job']>,
    },
{
      name: 'upload_file',
      description: 'Upload a local image, video or audio file to the server input folder. Answers the name to put in a LoadImage (or LoadVideo, LoadAudio) node.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'An absolute local file path in the task workspace.' },
          subfolder: { type: 'string', description: 'A folder under the server input folder.' },
          overwrite: { type: 'boolean', description: 'Replace a file of the same name instead of renaming the upload.' },
        },
        required: ['path'],
      } satisfies SchemaFor<Inputs['mcp__comfyui-local__upload_file']>,
    },
{
      name: 'get_output',
      description: 'Download the output files of a completed job to comfyui-outputs/ (or directory) and answer their paths; display images using Markdown absolute file paths.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt_id: { type: 'string', description: PROMPT_ID },
          directory: { type: 'string', description: 'Absolute output directory in the task workspace. Required by this local MCP adapter.' },
          description: { type: 'string', description: 'A few words that name the files, such as "cat astronaut".' },
        },
        required: ['prompt_id'],
      } satisfies SchemaFor<Inputs['mcp__comfyui-local__get_output']>,
    },
{
      name: 'manager_packs',
      description: 'The custom node packs installed through ComfyUI-Manager, with version and state, the Manager version and its task queue.',
      inputSchema: {
        type: 'object',
        properties: { state: { type: 'string', enum: allOf<NonNullable<Inputs['mcp__comfyui-local__manager_packs']['state']>>()('enabled', 'disabled'), description: 'Only enabled or only disabled packs.' } },
      } satisfies SchemaFor<Inputs['mcp__comfyui-local__manager_packs']>,
    },
{
      name: 'manager_search_packs',
      description: 'Search the public Comfy Registry (api.comfy.org) for node packs to install: id, description, latest version and repository.',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Words to search.' }, limit: { type: 'number', description: 'Results to show (default 20, at most 50).' } },
        required: ['query'],
      } satisfies SchemaFor<Inputs['mcp__comfyui-local__manager_search_packs']>,
    },
{
      name: 'manager_task',
      description:
        'Queue a ComfyUI-Manager task on a node pack: install (a registry id from manager_search_packs), or update, uninstall, disable, enable or fix an installed pack (a folder or registry id from manager_packs). ComfyUI must be restarted afterwards (restart_server) for the nodes to change.',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: allOf<Inputs['mcp__comfyui-local__manager_task']['action']>()(...MANAGER_ACTIONS) },
          pack: { type: 'string', description: 'The registry id (install) or the installed pack folder or registry id from manager_packs (other actions).' },
          version: { type: 'string', description: 'For install: a version, "latest" (default) or "nightly" (needs repository). For update and fix: the current version.' },
          repository: { type: 'string', description: 'The GitHub URL, required for a nightly install.' },
        },
        required: ['action', 'pack'],
      } satisfies SchemaFor<Inputs['mcp__comfyui-local__manager_task']>,
    },
{
      name: 'restart_server',
      description:
        'Restart ComfyUI through ComfyUI-Manager to load node packs that manager_task installed, updated or removed, and wait until it answers again (up to 2 minutes). Refuses while a job runs or waits, since a restart kills it. Answers the time it took, the version and the packs that failed to import.',
      inputSchema: {
        type: 'object',
        properties: { force: { type: 'boolean', description: 'Restart even with jobs in the queue: the running one is killed and the pending ones are dropped.' } },
      } satisfies SchemaFor<Inputs['mcp__comfyui-local__restart_server']>,
    },
{
      name: 'save_workflow',
      description:
        "Save a UI-format workflow (nodes and links arrays, as the frontend saves it) to the user's workflow library, so it shows in the Workflows tab. Never an API-format prompt: that breaks the frontend's list; run those with submit_workflow. Refuses to replace an existing file unless overwrite.",
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: WORKFLOW_PATH },
          workflow: { description: 'The UI-format workflow as a JSON object, or that JSON as a string. Omit it when file is given.' },
          file: { type: 'string', description: 'Instead of workflow: a local JSON file to save, such as the one get_workflow wrote, using an absolute local path.' },
          overwrite: { type: 'boolean', description: 'Replace a workflow saved at the same path (default false).' },
        },
        required: ['path'],
      } satisfies SchemaFor<Inputs['mcp__comfyui-local__save_workflow']>,
    },
{
      name: 'list_workflows',
      description: "List the workflows saved in the user's library (the frontend's Workflows tab) with size and date. Check it before save_workflow to know whether a path is taken.",
      inputSchema: { type: 'object', properties: {} } satisfies SchemaFor<Inputs['mcp__comfyui-local__list_workflows']>,
    },
{
      name: 'get_workflow',
      description:
        "Read one saved workflow from the user's library as UI-format JSON, as the base to edit and save back with save_workflow and overwrite. One too large for an answer is written to a local file instead (comfyui-outputs/workflows/), to edit there and save back with save_workflow file.",
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: WORKFLOW_PATH },
          file: { type: 'string', description: 'Write the workflow, indented, to this local file instead of answering it, using an absolute local path.' },
        },
        required: ['path'],
      } satisfies SchemaFor<Inputs['mcp__comfyui-local__get_workflow']>,
    }
] satisfies Tool[]

export const tools: Tool[] = definitions.map(tool => ({ ...tool, inputSchema: { ...tool.inputSchema, additionalProperties: false } }))
