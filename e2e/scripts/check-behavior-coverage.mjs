import { readFile, readdir } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
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

function collectIds(files, pattern) {
  const ids = [];

  for (const file of files) {
    for (const match of file.content.matchAll(pattern)) {
      ids.push({ id: match.groups.id, file: file.name });
    }
  }

  return ids;
}

function percent(covered, total) {
  return total === 0 ? 0 : (covered / total) * 100;
}

function pad(value, width, alignRight = false) {
  const text = String(value);
  return alignRight ? text.padStart(width) : text.padEnd(width);
}

function printCoverageTable(featureFiles, requiredCases, implementedIds) {
  const rows = featureFiles.map((feature) => {
    const requiredForFile = requiredCases.filter(({ file }) => file === feature.name);
    const coveredForFile = requiredForFile.filter(({ id }) => implementedIds.has(id));
    const uncovered = requiredForFile.filter(({ id }) => !implementedIds.has(id)).map(({ id }) => id);

    return {
      file: basename(feature.name, extname(feature.name)),
      coverage: percent(coveredForFile.length, requiredForFile.length),
      covered: coveredForFile.length,
      total: requiredForFile.length,
      uncovered,
    };
  });

  const allCovered = requiredCases.filter(({ id }) => implementedIds.has(id)).length;
  const allUncovered = requiredCases.filter(({ id }) => !implementedIds.has(id)).map(({ id }) => id);
  const allRow = {
    file: 'All features',
    coverage: percent(allCovered, requiredCases.length),
    covered: allCovered,
    total: requiredCases.length,
    uncovered: allUncovered,
  };

  const fileWidth = Math.max(12, ...rows.map(({ file }) => file.length), allRow.file.length);
  const covWidth = 10;
  const coveredWidth = 9;
  const totalWidth = 7;
  const uncoveredWidth = Math.max(18, ...rows.map(({ uncovered }) => (uncovered.join(', ') || '-').length));

  const divider = [
    '-'.repeat(fileWidth),
    '-'.repeat(covWidth),
    '-'.repeat(coveredWidth),
    '-'.repeat(totalWidth),
    '-'.repeat(uncoveredWidth),
  ].join('|');

  console.log(divider);
  console.log(
    [
      pad('Feature', fileWidth),
      pad('% Behaviors', covWidth, true),
      pad('Covered', coveredWidth, true),
      pad('Total', totalWidth, true),
      pad('Uncovered case IDs', uncoveredWidth),
    ].join('|'),
  );
  console.log(divider);

  for (const row of [...rows, allRow]) {
    console.log(
      [
        pad(row.file, fileWidth),
        pad(row.coverage.toFixed(2), covWidth, true),
        pad(row.covered, coveredWidth, true),
        pad(row.total, totalWidth, true),
        pad(row.uncovered.join(', ') || '-', uncoveredWidth),
      ].join('|'),
    );
  }

  console.log(divider);
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
const coverage = percent(covered, requiredIds.size);

console.log('\nBehavior coverage summary\n');
printCoverageTable(featureFiles, requiredCases, implementedIds);
console.log(`\nCoverage threshold: ${COVERAGE_THRESHOLD}% behaviors`);

if (requiredIds.size === 0) {
  console.error('\nBehavior coverage gate failed: no @E2E-### scenarios were found in the Gherkin feature files.');
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
