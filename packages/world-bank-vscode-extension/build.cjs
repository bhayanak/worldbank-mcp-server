const esbuild = require('esbuild')
const path = require('path')

async function build() {
  // 1. Bundle extension entry point (CJS, external vscode)
  await esbuild.build({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    outfile: 'dist/extension.js',
    external: ['vscode'],
    format: 'cjs',
    platform: 'node',
    target: 'node18',
    sourcemap: true,
    minify: false,
  })
  console.log('Extension built: dist/extension.js')

  // 2. Bundle server entry point (CJS, fully self-contained)
  const serverEntry = path.resolve(__dirname, '..', 'world-bank-server', 'src', 'index.ts')
  await esbuild.build({
    entryPoints: [serverEntry],
    bundle: true,
    outfile: 'dist/server.js',
    format: 'cjs',
    platform: 'node',
    target: 'node18',
    sourcemap: true,
    minify: false,
    banner: {
      js: '#!/usr/bin/env node',
    },
  })
  console.log('Server built: dist/server.js')
}

build()
  .then(() => {
    console.log('Build complete.')
  })
  .catch((err) => {
    console.error('Build failed:', err)
    process.exit(1)
  })
