import assert from 'node:assert/strict'
import test from 'node:test'
import eslintConfig from '../eslint.config.js'
import viteConfig from '../vite.config.js'

test('Vite config registers the React plugin', () => {
  assert.ok(viteConfig.plugins.some((plugin) => plugin.name.includes('react')))
})

test('ESLint config includes browser globals', () => {
  const browserGlobals = eslintConfig
    .map((config) => config.languageOptions?.globals)
    .find((globals) => globals?.window && globals?.document)

  assert.ok(browserGlobals)
})
