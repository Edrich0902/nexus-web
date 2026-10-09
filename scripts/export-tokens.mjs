#!/usr/bin/env node
/**
 * Exports src/design/tokens.ts as JSON for non-web clients (nexus-mobile runs
 * tool/gen_tokens.dart over it). Relies on Node's built-in TypeScript type
 * stripping, so tokens.ts must stay free of runtime-only TS syntax (enums etc.).
 *
 *   npm run tokens:export                 -> ../nexus-mobile/tool/tokens.json
 *   node scripts/export-tokens.mjs out.json
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const tokens = await import(resolve(here, '../src/design/tokens.ts'))

const payload = {
  $schema: 'nexus-tokens/v1',
  brand: tokens.brand,
  sections: tokens.sections,
  moments: tokens.moments,
  accents: tokens.accents,
  fonts: tokens.fonts,
  type: tokens.type,
  space: tokens.space,
  radius: tokens.radius,
  motion: tokens.motion,
  breakpoints: tokens.breakpoints,
}

const out = resolve(process.cwd(), process.argv[2] ?? '../nexus-mobile/tool/tokens.json')
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(payload, null, 2) + '\n')
console.log(`tokens -> ${out}`)
