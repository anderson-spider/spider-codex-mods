# ComfyUI Local

Generate images, video, audio and 3D on your self-hosted ComfyUI. Discover installed models and nodes, run jobs, transfer files, manage UI workflows and use ComfyUI-Manager. Requires ComfyUI 0.3 or newer; Manager tools require ComfyUI-Manager 4. Node 24+ and curl must be on the Codex process PATH.

## Setup

Install from the root marketplace instructions, start a new local chat and invoke this plugin's setup skill with your server's HTTP(S) origin. The bundled utility can also be run directly:

```sh
node /absolute/path/to/installed/plugin/dist/server.mjs configure http://comfy.local:8188
```

It writes `~/.config/spider-codex-mods/comfyui-local.json` with a `url` property. Missing or invalid configuration produces a setup error; tools remain discoverable. Each call reloads the file. No repository settings or COMFYUI_URL environment override is accepted. ComfyUI itself has no authentication configured by this plugin; use a trusted network.

## Skills

Select the plugin and ask to generate an image, video, audio or 3D asset; upscale an image; remove a background; search nodes, models or templates; or show help. Skills discover the server's actual models and node inputs before building a workflow. UI templates are references, not directly executable API prompts.

The MCP process starts in the plugin installation directory. Always supply absolute local paths, including `directory` for get_output and `file` for get_workflow. Choose the current task workspace as the output location. If a workflow is too large to return inline and no absolute file was supplied, the tool returns an instruction instead of writing into the cache.

## Tools

- `system_info`: ComfyUI version, GPU and VRAM, queue counts, Manager version.
- `search_nodes`: the installed nodes, core and custom, by words, `category`, `pack`, `input_type` or `output_type`, with each input's name, type and default and each output.
- `search_models`: the model files as `folder/file`, by words or one `folder` (checkpoints, diffusion_models, loras, vae, text_encoders, upscale_models, ...).
- `search_templates` and `get_template`: the workflow templates ComfyUI and its node packs ship, by words, `tag` or `model`; `get_template` returns one in the UI format (nodes, widgets, links) as the reference to build an API-format prompt.
- `submit_workflow`: queues an API-format prompt (node id to `class_type` and `inputs`) and answers the `prompt_id`, or the server's validation errors per node.
- `get_job_status`: pending (with its place), running, completed (with its output files) or failed (with the node error); without a `prompt_id`, the queue.
- `cancel_job`: removes a pending job, interrupts a running one, or clears the queue.
- `upload_file`: sends a local image, video or audio file to the server's input folder (or a `subfolder` of it) and answers the name a LoadImage node takes; `overwrite` replaces a file of the same name instead of renaming the upload.
- `get_output`: downloads a finished job's files into the absolute `directory` supplied by the caller named after `description`, and answers the paths.
- `manager_packs`, `manager_search_packs`, `manager_task`: the packs installed through ComfyUI-Manager with version, state and the recent task results, a search of the public [Comfy Registry](https://registry.comfy.org) for packs to install, and one queued task (install by registry id; update, uninstall, disable, enable or fix an installed pack by its folder or registry id). The result is reported when the task is quick, else `manager_packs` shows it; a quick task that fails, such as one the Manager's security level forbids, is reported as an error. ComfyUI must be restarted afterwards for the nodes to change (`restart_server`).
- `restart_server`: restarts ComfyUI through the Manager (`POST /v2/manager/reboot`), then polls `/system_stats` (every 2 seconds, the first after half a second when the connection dropped, for up to 2 minutes) and answers how long it took, the ComfyUI version and the node packs that failed to import. It counts as restarted only once a poll has found the server down, so an answer from a process that never restarted is reported as such. It refuses while a job runs or waits, since a restart kills the running job and drops the pending ones, unless `force`. The Manager allows it only at `security_level` middle or above (`user/__manager/config.ini`); a 403 says so. The server comes back by itself when ComfyUI runs in the foreground or under a service manager such as systemd, since the Manager re-executes the process in place; under comfy-cli the Manager exits and leaves comfy-cli a marker to start it again.
- `save_workflow`, `list_workflows`, `get_workflow`: the workflow library of the default user (`user/default/workflows/` on the server, the frontend's and the desktop app's Workflows tab) through `/api/userdata`. `save_workflow` takes a `path` relative to it (a leading `workflows/` is taken as that folder), subfolders allowed and `.json` added when missing, and a UI-format workflow (`nodes` and `links` arrays); it refuses `..`, absolute paths, `%`, colons and control characters in the path, and an API-format prompt, which inside `workflows/` breaks the frontend's list, and replaces an existing file only with `overwrite`. `list_workflows` answers each path with its size and date, and `get_workflow` one workflow's JSON as the base for an edit. A workflow too large for one answer, or any with `file`, is written indented to a local file instead (provide an absolute `file` path); edit it there and save it back with `save_workflow` and `file` in place of `workflow`. Converting an API-format prompt to the UI format needs the frontend's graph layout and is not done here.


## Privacy and permissions

Workflows and uploads go to the server selected in the personal configuration. HTTP redirects are refused. Pack search queries the public `api.comfy.org` registry with the search terms. Downloads and workflow exports write local files. The plugin does not change Codex tool approval policies or add its own confirmation prompts.

Manager actions can install Python dependencies, alter node packs or restart the server. Inspect pack requirements before installation: transitive dependencies can replace the server's torch or onnxruntime builds. Restart refuses busy queues unless force is explicitly requested. Core generation works without Manager.

## Development and attribution

Run `npm run check` from the repository root. API tests use fake servers; adapter tests use a local HTTP fixture; clean-package tests run the bundled MCP outside the checkout.

Independent port of Spider Claude Mods `comfyui-local` 0.3.1, source commit `d50fb7444ee7e8c29ebbcc8f7e137bbb4e5ed506`. The original repository is not a runtime dependency. Skills are adapted from Comfy-Org/comfy-skills under MIT; see LICENSE.comfy-skills.txt. Bundled dependency notices are in dist/THIRD-PARTY-NOTICES.txt. Not affiliated with or endorsed by Comfy Org.
