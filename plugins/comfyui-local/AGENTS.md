# ComfyUI Local

Independent port of the Spider Claude Mods plugin. `src/api.ts` owns ComfyUI HTTP behavior; `src/tools.ts` declares JSON schemas checked against `src/inputs.ts`; `src/dispatch.ts` maps tools to API functions. `src/mcp.ts` handles MCP and input validation, `src/host.ts` owns local IO, and `src/config.ts` is the only server configuration source. `src/server.ts` is the stdio/configuration entrypoint.

Run root `npm run check`. API tests preserve the source plugin's fake-server cases. Configuration tests isolate the personal home through module injection. MCP tests exercise protocol validation, HTTP/curl roundtrips and the bundled server outside the checkout. Never make automated tests contact the user's server.

Only the personal configuration file can select the ComfyUI origin. Reject URL tool arguments and ignore project configuration and environment URL overrides. Keep stdout exclusive to MCP. Use direct process argv, not a shell. Local IO requires absolute paths: the MCP process works in its installation directory, not the task workspace. `get_output` requires an explicit absolute directory; oversized `get_workflow` responses without an absolute `file` fail with a path instruction instead of writing into the plugin cache.

Keep the source's workflow validation, overwrite opt-in and busy-queue restart protection. UI-format workflows and API-format prompts serve different endpoints. ComfyUI-Manager 4 is optional; its absence must not disable core tools. Manager mutations are tested with mocks, never automatically against a user's installation.

Skills discover models and nodes at runtime. Preserve Comfy-Org attribution in LICENSE.comfy-skills.txt. No hard-coded model filenames, Comfy Cloud or Claude-specific instructions. Keep metadata version and MCP server version synchronized. Rebuild and commit dist after source changes.
