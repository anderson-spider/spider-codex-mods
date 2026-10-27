import { build } from 'esbuild'
import { writeFile, readFile, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
for (const plugin of ['comfyui-local', 'gitlab']) {
  const result = await build({
    entryPoints: [`plugins/${plugin}/src/server.ts`], outfile: `plugins/${plugin}/dist/server.mjs`,
    bundle: true, platform: 'node', target: 'node24', format: 'esm', packages: 'bundle',
    banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
    legalComments: 'eof', metafile: true,
  })
  await writeFile(`plugins/${plugin}/dist/dependencies.json`, JSON.stringify(Object.keys(result.metafile.inputs).filter(p => p.includes('node_modules/')).sort(), null, 2) + '\n')

  const packages = new Set()
  for (const input of Object.keys(result.metafile.inputs).filter(p => p.includes('node_modules/'))) {
    let dir = dirname(input)
    while (dir !== '.') {
      try {
        const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))
        if (pkg.name && pkg.version) { packages.add(dir); break }
      } catch { /* Continue up to the package root. */ }
      dir = dirname(dir)
    }
  }
  const notices = []
  for (const dir of [...packages].sort()) {
    const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))
    const licenses = (await readdir(dir)).filter(name => /^(license|licence|copying|notice)([.-]|$)/i.test(name))
    if (!licenses.length) throw new Error(`Missing license text for bundled dependency ${pkg.name}`)
    notices.push(`${pkg.name}@${pkg.version} (${pkg.license})`, ...await Promise.all(licenses.map(name => readFile(join(dir, name), 'utf8'))))
  }
  await writeFile(`plugins/${plugin}/dist/THIRD-PARTY-NOTICES.txt`, notices.join('\n\n') + '\n')
}
