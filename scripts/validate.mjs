import assert from 'node:assert/strict'
import { readFile, readdir, stat } from 'node:fs/promises'
import { resolve, relative, join } from 'node:path'
const json = async file => JSON.parse(await readFile(file, 'utf8'))
const catalog = await json('.agents/plugins/marketplace.json')
assert.equal(catalog.name, 'spider-codex-mods')
const names = new Set()
for (const entry of catalog.plugins) {
  assert(!names.has(entry.name), `Duplicate plugin: ${entry.name}`)
  names.add(entry.name)
  assert.equal(entry.source.source, 'local')
  assert(entry.source.path.startsWith('./plugins/'))
  const root = resolve(entry.source.path)
  assert(!relative(resolve('plugins'), root).startsWith('..'))
  const manifest = await json(join(root, 'plugin.json'))
  assert.equal(manifest.name, entry.name)
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/)
  assert.equal(manifest.license, 'MIT')
  for (const icon of [manifest.extensions['com.openai'].interface.logo, manifest.extensions['com.openai'].interface.composerIcon]) {
    assert(icon.startsWith('./assets/'))
    const file = resolve(root, icon)
    assert(!relative(join(root, 'assets'), file).startsWith('..'))
    assert((await stat(file)).isFile())
  }
  const mcp = await json(join(root, 'mcp.json'))
  for (const server of Object.values(mcp.mcpServers)) {
    assert.deepEqual(Object.keys(server).sort(), ['args', 'command', 'cwd', 'type'])
    assert.equal(server.type, 'stdio')
    assert.equal(server.command, 'node')
    assert.equal(server.cwd, '${PLUGIN_ROOT}')
    assert(server.args[0].startsWith('${PLUGIN_ROOT}/dist/'))
    const file = resolve(root, server.args[0].replace('${PLUGIN_ROOT}/', ''))
    assert(!relative(root, file).startsWith('..'))
    assert((await stat(file)).isFile())
  }
  for (const skill of await readdir(join(root, 'skills'))) {
    const content = await readFile(join(root, 'skills', skill, 'SKILL.md'), 'utf8')
    assert.match(content, /^---\nname: [\w-]+\ndescription: .+\n---/)
    assert(!/claude-code|\$ARGUMENTS|\/comfyui-local:|url` plugin option/.test(content), `Claude-specific instruction in ${skill}`)
  }
  await stat(join(root, 'dist', 'THIRD-PARTY-NOTICES.txt'))
}
assert.deepEqual((await readdir('plugins')).sort(), [...names].sort())
console.log('Marketplace, manifests, skills and bundled files validated.')
