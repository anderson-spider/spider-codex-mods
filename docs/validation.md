# Validation

## Automated

`npm run check` covers lint, TypeScript, compile-time schema assertions, reproducible bundled output, catalog and skill metadata, API behavior with fake servers, configuration isolation, MCP protocol calls, local HTTP/curl transfers, and a standalone stdio server copied outside the checkout without node_modules.

GitHub Actions runs the same checks on Linux and macOS with Node 24 and rejects changes to committed bundles after rebuilding. Automated tests never install or remove packs or restart a real ComfyUI server.

## Live verification — 2026-10-25

Codex CLI 0.164.0 accepted the portable manifests, registered the local marketplace and installed ComfyUI Local. The installed MCP successfully listed tools, read server status, discovered models and nodes, read a workflow template, submitted an image workflow, polled it to completion and downloaded the PNG into an absolute task output directory. The downloaded image was visually inspected.

Generation used an existing self-hosted ComfyUI installation. No models or packs were installed, and the server was not restarted. Personal configuration and generated media are excluded from the public repository.

The desktop plugin picker and activation in a fresh desktop conversation have not been visually verified: the available computer-use tool refuses access to the Codex application. CLI installation and direct calls to the installed MCP do not establish that UI result. Restart the desktop app or open a fresh local chat to verify plugin and skill visibility.

The public GitHub marketplace was added using `codex plugin marketplace add anderson-spider/spider-codex-mods`. Reinstalling from that Git source produced a bundle identical to the checked source build. The remotely installed MCP retrieved the completed job and downloaded its image successfully.

Continuous check results: [GitHub Actions](https://github.com/anderson-spider/spider-codex-mods/actions/workflows/ci.yml).

## GitLab port — 2026-10-27

Codex CLI 0.164.0 registered the local marketplace and installed GitLab 0.1.0 into an isolated Codex home. Automated tests exercise the bundled MCP server outside the checkout, workspace-specific host and token selection, output masking, and the ported GitLab operations against fake APIs. No real GitLab instance was contacted. Desktop activation and token propagation from the desktop environment have not been verified.

Live read-only verification on 2026-10-27: the bundled GitLab MCP server, launched from the Codex desktop task executor with its inherited environment, successfully called `gitlab_user` and listed merge requests across projects on a configured GitLab host. A temporary Git repository supplied the remote. No GitLab data was changed. The desktop task executor contained `GITLAB_PLUGINS_TOKENS`, but the GitLab plugin was not installed in the active desktop profile; this does not verify the desktop plugin manager's MCP launch or activation.

The personal configuration flow was also tested against a real GitLab using a temporary home: after saving tokens to the file, `gitlab_user` succeeded with `GITLAB_PLUGINS_TOKENS` removed from the server environment. The installed desktop plugin was not retested with the file.
