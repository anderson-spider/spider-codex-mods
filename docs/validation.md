# Validation

## Automated

`npm run check` covers lint, TypeScript, compile-time schema assertions, reproducible bundled output, catalog and skill metadata, API behavior with fake servers, configuration isolation, MCP protocol calls, local HTTP/curl transfers, and a standalone stdio server copied outside the checkout without node_modules.

GitHub Actions runs the same checks on Linux and macOS with Node 24 and rejects changes to committed bundles after rebuilding. Automated tests never install or remove packs or restart a real ComfyUI server.

## Live verification — 2026-10-25

Codex CLI 0.164.0 accepted the portable manifests, registered the local marketplace and installed ComfyUI Local. The installed MCP successfully listed tools, read server status, discovered models and nodes, read a workflow template, submitted an image workflow, polled it to completion and downloaded the PNG into an absolute task output directory. The downloaded image was visually inspected.

Generation used an existing self-hosted ComfyUI installation. No models or packs were installed, and the server was not restarted. Personal configuration and generated media are excluded from the public repository.

The desktop plugin picker and activation in a fresh desktop conversation have not been visually verified: the available computer-use tool refuses access to the Codex application. CLI installation and direct calls to the installed MCP do not establish that UI result. Restart the desktop app or open a fresh local chat to verify plugin and skill visibility.

Remote marketplace installation and CI results are recorded after publication.
