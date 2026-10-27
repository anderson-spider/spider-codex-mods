# GitLab

Port of the GitLab plugin in Spider Claude Mods. `src/` contains the GitLab operations and stdio MCP adapter; `tools.json` exposes the six source tool schemas. Every call requires an absolute workspace path. Read tokens from the personal GitLab configuration, falling back to `GITLAB_PLUGINS_TOKENS` only when the file is absent. Preserve same-host token isolation, output masking, merge and foreign-MR guards, and draft defaults. Never connect tests to a real GitLab. Run root `npm run check` and rebuild the distributable after changes.
