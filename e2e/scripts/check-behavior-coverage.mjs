import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const featuresDir = new URL('../features/', import.meta.url);
const testsDir = new URL('../tests/', import.meta.url);
const CASE_ID = /@(?<id>E2E-\d{3})\b/g;
const TEST_CASE_ID = /\[(?<id>E2E-\d{3})\]/g;

async function readMatchingFiles(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith(extension));
  return Promise.all(files.map(async (file) => ({
    name: file.name,
    content: await readFile(join(directory.pathname, file.name), 'utf8'),
  })));
}

function collectIds(files, pattern) {
  const ids = [];
  for (const file of files) {
    for (const match of file.content.matchAll(pattern)) {
      ids.push({ id: match.groups.id, file: file.name });
    }
  }
  return ids;
}

const featureFiles = await readMatchingFiles(featuresDir, '.feature');
const testFiles = await readMatchingFiles(testsDir, '.spec.ts');
const requiredCases = collectIds(featureFiles, CASE_ID);
const implementedCases = collectIds(testFiles, TEST_CASE_ID);

const requiredIds = new Set(requiredCases.map(({ id }) => id));
const implementedIds = new Set(implementedCases.map(({ id }) => id));
const duplicates = implementedCases
  .map(({ id }) => id)
  .filter((id, index, all) => all.indexOf(id) !== index);
const missing = [...requiredIds].filter((id) => !implementedIds.has(id));
const unknown = [...implementedIds].filter((id) => !requiredIds.has(id));
const covered = [...requiredIds].filter((id) => implementedIds.has(id)).length;
const coverage = requiredIds.size === 0 ? 0 : (covered / requiredIds.size) * 100;

console.log(`Behavior coverage: ${covered}/${requiredIds.size} (${coverage.toFixed(1)}%)`);

if (requiredIds.size === 0) {
  console.error('Coverage gate failed: no @E2E-### scenarios were found in the Gherkin feature files.');
  process.exit(1);
}

if (missing.length > 0) console.error(`Missing Playwright cases: ${missing.join(', ')}`);
if (unknown.length > 0) console.error(`Unknown Playwright case IDs: ${unknown.join(', ')}`);
if (duplicates.length > 0) console.error(`Duplicate Playwright case IDs: ${[...new Set(duplicates)].join(', ')}`);

if (coverage < 100 || unknown.length > 0 || duplicates.length > 0) {
  console.error('Coverage gate failed. Every Gherkin behavior case must map to exactly one Playwright spec.');
  process.exit(1);
}

console.log('Behavior coverage gate passed.');
