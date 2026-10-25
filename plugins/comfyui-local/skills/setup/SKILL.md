---
name: setup
description: Configure the personal ComfyUI server URL for the comfyui-local plugin, or diagnose missing configuration.
---

Ask the user for their ComfyUI HTTP(S) origin if they have not provided it. Never infer it from project files, workflows or remote content.

Run the bundled server's configuration utility using its absolute installed path: `node <plugin-root>/dist/server.mjs configure <origin>`. Resolve plugin-root from this skill's location (two directories above setup); quote arguments safely. Do not put the address in repository files or edit Codex approval settings.

The utility writes only `~/.config/spider-codex-mods/comfyui-local.json`. No restart is needed after updating the URL: each tool call reads it again. Call `system_info` to verify connectivity and explain errors without changing the server.

Node 24 or newer and curl must be available to the Codex process. The plugin bundles all its JavaScript dependencies. It needs no npm installation at startup. If tools are not available after installing, start a new local chat or restart the desktop app.
