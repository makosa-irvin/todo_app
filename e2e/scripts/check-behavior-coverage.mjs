import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const featuresDir = fileURLToPath(new URL('../features/', import.meta.url));
const testsDir = fileURLToPath(new URL('../tests/', import.meta.url));
const COVERAGE_THRESHOLD = 100;
const CASE_ID = /@(?<id>E2E-\d{3})\b/g;
const TEST_CASE_ID = /\[(?<id>E2E-\d{3})\]/g;

async function readMatchingFiles(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith(extension));

  return Promise.all(
    files.map(async (file) => ({
      name: file.name,
      content: await readFile(join(directory, file.name), 'utf8'),
    })),
  );
}

function collectTestIds(files) {
  const ids = [];
  for (const file of files) {
    for (const match of file.content.matchAll(TEST_CASE_ID)) {
      ids.push({ id: match.groups.id, file: file.name });
    }
  }
  return ids;
}

function collectScenarios(files) {
  const scenarios = [];

  for (const file of files) {
    const lines = file.content.split(/\r?\n/);
    let pendingId = null;

    for (const line of lines) {
      const tagMatch = line.match(/@(?<id>E2E-\d{3})\b/);
      if (tagMatch) pendingId = tagMatch.groups.id;

      const scenarioMatch = line.match(/^\s*Scenario(?: Outline)?:\s*(?<name>.+?)\s*$/);
      if (scenarioMatch && pendingId) {
        scenarios.push({ id: pendingId, name: scenarioMatch.groups.name, file: file.name });
        pendingId = null;
      }
    }
  }

  return scenarios;
}

function percent(covered, total) {
  return total === 0 ? 0 : (covered / total) * 100;
}

function pad(value, width, alignRight = false) {
  const text = String(value);
  return alignRight ? text.padStart(width) : text.padEnd(width);
}

function printCoverageTable(scenarios, implementedIds) {
  const rows = scenarios.map((scenario) => ({
    ...scenario,
    covered: implementedIds.has(scenario.id),
  }));

  const coveredCount = rows.filter(({ covered }) => covered).length;
  const coverage = percent(coveredCount, rows.length);
  const idWidth = Math.max(10, ...rows.map(({ id }) => id.length));
  const featureWidth = Math.max(24, ...rows.map(({ name }) => name.length));
  const statusWidth = 9;

  const divider = [
    '-'.repeat(idWidth),
    '-'.repeat(featureWidth),
    '-'.repeat(statusWidth),
  ].join('|');

  console.log(divider);
  console.log(
    [pad('Case ID', idWidth), pad('Behavior / Scenario', featureWidth), pad('Covered', statusWidth)].join('|'),
  );
  console.log(divider);

  for (const row of rows) {
    console.log(
      [pad(row.id, idWidth), pad(row.name, featureWidth), pad(row.covered ? 'Yes' : 'No', statusWidth)].join('|'),
    );
  }

  console.log(divider);
  console.log(
    [pad('All', idWidth), pad(`${coveredCount}/${rows.length} behaviors`, featureWidth), pad(`${coverage.toFixed(2)}%`, statusWidth)].join('|'),
  );
  console.log(divider);
}

const featureFiles = await readMatchingFiles(featuresDir, '.feature');
const testFiles = await readMatchingFiles(testsDir, '.spec.ts');
const scenarios = collectScenarios(featureFiles);
const implementedCases = collectTestIds(testFiles);

const requiredIds = new Set(scenarios.map(({ id }) => id));
const implementedIds = new Set(implementedCases.map(({ id }) => id));
const duplicates = implementedCases
  .map(({ id }) => id)
  .filter((id, index, all) => all.indexOf(id) !== index);
const missing = [...requiredIds].filter((id) => !implementedIds.has(id));
const unknown = [...implementedIds].filter((id) => !requiredIds.has(id));
const covered = [...requiredIds].filter((id) => implementedIds.has(id)).length;
const coverage = percent(covered, requiredIds.size);

console.log('\nBehavior coverage summary\n');
printCoverageTable(scenarios, implementedIds);
console.log(`\nCoverage threshold: ${COVERAGE_THRESHOLD}% behaviors`);

if (requiredIds.size === 0) {
  console.error('\nBehavior coverage gate failed: no tagged @E2E-### scenarios were found in the Gherkin feature files.');
  process.exit(1);
}

if (missing.length > 0) console.error(`Missing Playwright cases: ${missing.join(', ')}`);
if (unknown.length > 0) console.error(`Unknown Playwright case IDs: ${unknown.join(', ')}`);
if (duplicates.length > 0) console.error(`Duplicate Playwright case IDs: ${[...new Set(duplicates)].join(', ')}`);

if (coverage < COVERAGE_THRESHOLD || unknown.length > 0 || duplicates.length > 0) {
  console.error(
    `Behavior coverage gate failed: ${coverage.toFixed(2)}% coverage does not satisfy the ${COVERAGE_THRESHOLD}% requirement.`,
  );
  process.exit(1);
}

console.log(`Behavior coverage gate passed: ${coverage.toFixed(2)}% (${covered}/${requiredIds.size}).`);