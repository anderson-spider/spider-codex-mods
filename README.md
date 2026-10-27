# Spider Codex Mods

A public marketplace of plugins for local Codex sessions, maintained by [anderson-spider](https://github.com/anderson-spider).

## Plugins

| Plugin | What it does |
| --- | --- |
| [ComfyUI Local](plugins/comfyui-local/README.md) | Generate images, video, audio and 3D on your own ComfyUI; manage jobs, workflows and custom node packs. |
| [GitLab](plugins/gitlab/README.md) | Work with merge requests, discussions, pipelines, jobs and labels on GitLab. |

## Install

Requires a local Codex client with plugin marketplaces, Node 24 or newer and curl on its PATH.

```sh
codex plugin marketplace add anderson-spider/spider-codex-mods
codex plugin add comfyui-local@spider-codex-mods
```

Start a new local chat or restart the desktop app, select the plugin and ask to run its setup skill. Provide your ComfyUI server origin. The configuration stays outside the repository. Then try: “Use ComfyUI Local to generate an illustration of a spider building a small robot.”

The plugin includes its MCP server and dependencies. Users do not run npm install or install a separate MCP service. It uses your existing ComfyUI installation; it does not install models or a server.

Install GitLab with `codex plugin add gitlab@spider-codex-mods` and configure its tokens as described in the [GitLab README](plugins/gitlab/README.md).

This GitHub marketplace is separate from the OpenAI public Plugin Directory. Desktop and CLI compatibility are recorded in [validation notes](docs/validation.md).

## Update

```sh
codex plugin marketplace upgrade spider-codex-mods
codex plugin add comfyui-local@spider-codex-mods
```

Start a new chat after updating. Personal configuration survives plugin updates.

## Develop

```sh
npm ci
npm run check
```

Source and tests use TypeScript. The build bundles runtime dependencies into each plugin's committed `dist/` directory and includes dependency licenses. Tests run without a real ComfyUI server, including a clean-package stdio test outside the checkout.

To test a local marketplace, use `codex plugin marketplace add /absolute/path/to/spider-codex-mods`. Follow [AGENTS.md](AGENTS.md) to add another independently versioned plugin.

## License and origin

MIT. ComfyUI Local is independently ported from [Spider Claude Mods](https://github.com/anderson-spider/spider-claude-mods). Its generation skills derive from Comfy-Org/comfy-skills; attribution is retained in the plugin. This project is not affiliated with OpenAI or Comfy Org.
