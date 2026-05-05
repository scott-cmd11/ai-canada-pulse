import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const ROOT = process.cwd()

function readSource(path) {
  return readFileSync(join(ROOT, path), "utf8")
}

function parseCsvFixture(csv) {
  const [headerLine, ...rows] = csv.trim().split("\n")
  const headers = headerLine.split(",")
  return rows.map((row) => Object.fromEntries(row.split(",").map((value, index) => [headers[index], value])))
}

function normalizeStatCanValue(response) {
  assert.equal(response.status, "SUCCESS", "StatCan fixture should mimic a successful WDS row")
  assert.ok(response.object?.coordinate, "StatCan fixture should keep the table coordinate")
  assert.ok(response.object?.vectorDataPoint?.length, "StatCan fixture should contain at least one vector data point")

  const latest = response.object.vectorDataPoint.at(-1)
  return {
    coordinate: response.object.coordinate,
    period: latest.refPer,
    value: Number(latest.value),
  }
}

function selectLatestCsvResource(resources) {
  return resources
    .filter((resource) => resource.format?.toUpperCase() === "CSV" || resource.url?.toLowerCase().endsWith(".csv"))
    .sort((a, b) => {
      const bTime = Date.parse(b.last_modified ?? b.created ?? "")
      const aTime = Date.parse(a.last_modified ?? a.created ?? "")
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime)
    })[0]
}

function classifySignal(text) {
  const lower = text.toLowerCase()
  const groups = []
  if (/\b(ai|artificial intelligence|machine learning|generative ai|llm)\b/.test(lower)) {
    groups.push("AI")
  }
  if (/\b(cloud|data platform|analytics|data lake|warehouse)\b/.test(lower)) {
    groups.push("Cloud and data")
  }
  if (/\b(automation|workflow|robotic process)\b/.test(lower)) {
    groups.push("Automation")
  }
  return groups
}

const statcan = normalizeStatCanValue({
  status: "SUCCESS",
  object: {
    coordinate: "1.1.1.0.0.0.0.0.0.0",
    vectorDataPoint: [
      { refPer: "2025-04", value: "14.5" },
    ],
  },
})
assert.deepEqual(statcan, {
  coordinate: "1.1.1.0.0.0.0.0.0.0",
  period: "2025-04",
  value: 14.5,
})

const registryResource = selectLatestCsvResource([
  { name: "gc-ai-register-03-26.csv", format: "CSV", url: "https://example.test/march.csv", last_modified: "2026-03-31T00:00:00" },
  { name: "metadata", format: "JSON", url: "https://example.test/meta.json", last_modified: "2026-04-01T00:00:00" },
  { name: "gc-ai-register-04-26.csv", format: "CSV", url: "https://example.test/april.csv", last_modified: "2026-04-30T00:00:00" },
])
assert.equal(registryResource.url, "https://example.test/april.csv")

const registryRows = parseCsvFixture(
  `ai_register_id,name_ai_system_en,government_organization,ai_system_status_en,ai_system_primary_users_en\n1,Case triage,Department A,In production,Employees\n`
)
assert.equal(registryRows[0].name_ai_system_en, "Case triage")

assert.deepEqual(
  classifySignal("Artificial intelligence analytics platform with cloud automation services"),
  ["AI", "Cloud and data", "Automation"]
)

const statcanClient = readSource("src/lib/statcan-sdmx-client.ts")
for (const tableId of ["33101004", "33101045", "33101047", "33101048"]) {
  assert.ok(statcanClient.includes(tableId), `StatCan adoption client is missing table ${tableId}`)
}
for (const pid of ["3310100401", "3310104501", "3310104701", "3310104801"]) {
  assert.ok(statcanClient.includes(pid), `StatCan adoption client is missing source URL PID ${pid}`)
}

const registryClient = readSource("src/lib/gov-ai-registry-client.ts")
assert.ok(
  registryClient.includes("fcbc0200-79ba-4fa4-94a6-00e32facea6b"),
  "Government of Canada AI Register CKAN package id is missing"
)
assert.ok(
  !registryClient.includes("gc-ai-register-04-26.csv"),
  "Government of Canada AI Register should discover the latest CSV instead of hardcoding a dated resource"
)

const procurementClient = readSource("src/lib/procurement-demand-client.ts")
for (const id of [
  "6abd20d4-7a1c-4b38-baa2-9525d0bb2fd2",
  "d8f85d91-7dec-4fd1-8055-483b77225d8b",
  "fac950c0-00d5-4ec1-a4d3-9cbebf98a305",
]) {
  assert.ok(procurementClient.includes(id), `Procurement demand client is missing source id ${id}`)
}
for (const label of ["Artificial intelligence", "Automation", "Cloud and data"]) {
  assert.ok(procurementClient.includes(label), `Procurement demand classifier is missing ${label}`)
}

console.log("Adoption source fixture checks passed")
