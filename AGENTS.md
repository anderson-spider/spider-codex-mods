# Spider Codex Mods

Public marketplace of independent Codex plugins. Documentation, code comments, commits and product messages are in English. Conversations follow the user's language preferences.

All commits must follow Conventional Commits: `<type>[optional scope]: <description>` (for example, `chore: add ai-memory project configuration`). Use the same format for PR titles and squash commit messages.

## Development

Use Node 24 or newer, `npm ci`, then `npm run check`. This runs lint, typecheck, build, tests and catalog validation. Commit the reproducible plugin `dist/` artifacts so installation needs no package manager or checkout dependencies. CI verifies rebuilding leaves them unchanged. Keep all required runtime dependencies bundled and their license notices included.

Each plugin owns its source, tests, skills, manifest, README and AGENTS.md. Read its guidance before changing it. Bump its version when changing shipped files. Never commit personal configuration, generated media, server addresses or credentials. Keep tasks and CI independent of a real ComfyUI server.

## Adding a plugin

Create `plugins/<name>/` with a portable `plugin.json`, skills and optional `mcp.json`; register it in `.agents/plugins/marketplace.json`. Include usage, prerequisites, configuration and privacy documentation, tests and any required licenses. Add runtime entrypoints to `scripts/build.mjs` and extend `scripts/validate.mjs` for the new plugin's requirements. Test the installed package outside the repository. Do not copy Claude-specific hooks, slash command syntax or userConfig declarations.

## Publishing

Use the public GitHub repository marketplace. The OpenAI public directory is a separate distribution channel and is not part of the current workflow. Check installation using the actual installed Codex CLI and document verified behavior. Follow the parent personal Git rules.
