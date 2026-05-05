import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const ROOT = process.cwd()
const SRC = join(ROOT, "src")
const registryPath = join(SRC, "lib", "source-registry.ts")
const packagePath = join(ROOT, "package.json")
const registry = readFileSync(registryPath, "utf8")
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"))

function sourceBlocks(text) {
  return [...text.matchAll(/\{\n\s+id: "([^"]+)",[\s\S]*?\n\s+\}/g)].map((match) => ({
    id: match[1],
    block: match[0],
  }))
}

function stringValue(block, key) {
  return block.match(new RegExp(`${key}: "([^"]+)"`))?.[1] ?? null
}

function walkFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      walkFiles(path, files)
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(path)
    }
  }
  return files
}

const sources = sourceBlocks(registry)
assert.ok(sources.length >= 20, "source registry should contain the active public source inventory")

const ids = new Set()
const roles = new Map()
for (const source of sources) {
  assert.ok(!ids.has(source.id), `duplicate source id: ${source.id}`)
  ids.add(source.id)

  const status = stringValue(source.block, "sourceStatus")
  const role = stringValue(source.block, "evidenceRole")
  roles.set(source.id, role)

  assert.ok(status, `${source.id} is missing sourceStatus`)
  assert.ok(role, `${source.id} is missing evidenceRole`)
  assert.ok(["live", "mixed", "curated"].includes(status), `${source.id} has invalid sourceStatus: ${status}`)
  assert.ok(
    ["adoption-rate", "public-sector-system", "demand-signal", "proxy-signal", "context", "source-feed"].includes(role),
    `${source.id} has invalid evidenceRole: ${role}`
  )
}

assert.equal(roles.get("statcan-ai-adoption"), "adoption-rate", "only StatCan AI tables should be marked as an adoption-rate source")
assert.equal(roles.get("gov-ai-register"), "public-sector-system", "AI Register should be labelled as system evidence, not an adoption rate")
assert.equal(roles.get("canadabuys-tenders"), "demand-signal", "CanadaBuys should be labelled as a demand signal")
assert.equal(roles.get("contracts-over-10k"), "demand-signal", "Contracts over $10,000 should be labelled as a demand signal")
assert.equal(roles.get("google-trends"), "proxy-signal", "Google Trends should remain a proxy signal")
assert.equal(roles.get("github"), "proxy-signal", "GitHub should remain a proxy signal")
assert.equal(roles.get("huggingface"), "proxy-signal", "Hugging Face should remain a proxy signal")

const adoptionRateSources = [...roles.entries()].filter(([, role]) => role === "adoption-rate").map(([id]) => id)
assert.deepEqual(adoptionRateSources, ["statcan-ai-adoption"], "no proxy, procurement, or private source should be labelled as a direct adoption rate")

const filesWithStaleClaims = []
const filesWithMojibake = []
for (const file of walkFiles(SRC)) {
  const text = readFileSync(file, "utf8")
  if (/17\+ public data sources|zero fabricated data|Real-time Canadian AI intelligence/.test(text)) {
    filesWithStaleClaims.push(file.replace(`${ROOT}\\`, ""))
  }
  if (/[\u00c2\u00c3\u00e2]/.test(text)) {
    filesWithMojibake.push(file.replace(`${ROOT}\\`, ""))
  }
}

assert.deepEqual(filesWithStaleClaims, [], `stale source-count or generic intelligence claims found: ${filesWithStaleClaims.join(", ")}`)
assert.deepEqual(filesWithMojibake, [], `mojibake found in source files: ${filesWithMojibake.join(", ")}`)

const dependencies = {
  ...(packageJson.dependencies ?? {}),
  ...(packageJson.devDependencies ?? {}),
}
assert.ok(!dependencies["@vercel/kv"], "package.json should not depend on @vercel/kv; use Upstash Redis directly")
assert.ok(!dependencies["@vercel/postgres"], "package.json should not depend on @vercel/postgres")

console.log(`Source registry checks passed for ${sources.length} sources`)
