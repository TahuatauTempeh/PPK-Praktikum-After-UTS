#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const PRD_PATH = path.join(ROOT, 'PRD.md');
const COVERAGE_PATH = path.join(__dirname, 'coverage.md');
const MANUAL_PATH = path.join(__dirname, 'manual-checklist.md');
const MANIFEST_PATH = path.join(ROOT, 'e2e', 'android', 'manifest.tsv');
const FLOWS_DIR = path.join(ROOT, 'e2e', 'android', 'flows');
const PLAYWRIGHT_CONFIG = path.join(ROOT, 'e2e', 'web', 'playwright.config.ts');

const TIERS = new Set(['critical', 'uat', 'manual', 'rules', 'ci']);
const PLATFORMS = new Set(['web', 'android', 'manual', 'rules', 'ci']);
const FINAL_STATUS = new Set(['covered', 'manual', 'rules', 'ci', 'blocked']);

function extractPrdIds(text) {
  const ids = new Set();
  for (const match of text.matchAll(/UAT-(?:LAB|ATT|MAP|NOT|DEV|REG)-\d{2}/g)) {
    ids.add(match[0]);
  }
  return [...ids].sort();
}

function parseCoverage(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!/^\|\s*UAT-/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells.length !== 6) {
      throw new Error(`Baris coverage harus 6 kolom: ${line}`);
    }
    const [id, summary, tier, platform, evidence, status] = cells;
    rows.push({ id, summary, tier, platform, evidence, status });
  }
  return rows;
}

function parseManualIds(text) {
  return new Set(
    [...text.matchAll(/UAT-(?:LAB|ATT|MAP|NOT|DEV|REG)-\d{2}/g)].map((match) => match[0]),
  );
}

function parseManifest(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.startsWith('#'))
    .map((line) => {
      const [name, tier, lon, lat, email] = line.split('\t');
      return { name, tier, lon, lat, email };
    });
}

function parseYamlTags(text) {
  // Maestro menaruh metadata di atas pemisah `---`, bukan di frontmatter.
  const header = text.split(/\r?\n---\r?\n/)[0];
  const lines = header.split(/\r?\n/);
  const start = lines.findIndex((line) => /^tags:\s*$/.test(line));
  if (start < 0) return [];
  const tags = [];
  for (const line of lines.slice(start + 1)) {
    const match = line.match(/^\s*-\s*(\S+)\s*$/);
    if (!match) break;
    tags.push(match[1]);
  }
  return tags;
}

function collectSpecs(suites, parentFile = '') {
  const specs = [];
  for (const suite of suites ?? []) {
    const file = suite.file ?? parentFile;
    for (const spec of suite.specs ?? []) {
      specs.push({
        title: spec.title,
        tags: spec.tags ?? [],
        file: spec.file ?? file,
      });
    }
    specs.push(...collectSpecs(suite.suites ?? [], file));
  }
  return specs;
}

function readPlaywrightSpecs() {
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const raw = execFileSync(
    npx,
    [
      'playwright',
      'test',
      '--config',
      PLAYWRIGHT_CONFIG,
      '--project=full',
      '--list',
      '--reporter=json',
    ],
    {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  const start = raw.indexOf('{');
  if (start < 0) throw new Error('Output Playwright bukan JSON.');
  return collectSpecs(JSON.parse(raw.slice(start)).suites ?? []);
}

function normalizeEvidence(value) {
  const [file, ...rest] = value.split('::');
  const title = rest.join('::');
  if (!file || !title) return null;
  const short = file.replace(/^e2e\/web\/specs\//, '').replace(/^specs\//, '');
  return `${short}::${title}`;
}

function flowNameFromEvidence(value) {
  const [file] = value.split('::');
  return file.replace(/^e2e\/android\/flows\//, '').replace(/\.yaml$/, '');
}

function validate({
  prdIds,
  rows,
  specs,
  manifest,
  yamlTags,
  manualIds,
  strict = false,
}) {
  const errors = [];
  const seen = new Set();

  for (const row of rows) {
    if (seen.has(row.id)) errors.push(`duplikat: ${row.id}`);
    seen.add(row.id);
    if (!TIERS.has(row.tier)) errors.push(`${row.id}: tier tidak valid (${row.tier})`);
    if (!PLATFORMS.has(row.platform)) {
      errors.push(`${row.id}: platform tidak valid (${row.platform})`);
    }
    if (!row.status) errors.push(`${row.id}: status kosong`);
  }

  for (const id of prdIds) {
    if (!seen.has(id)) errors.push(`hilang: ${id}`);
  }
  for (const row of rows) {
    if (!prdIds.includes(row.id)) errors.push(`tidak ada di PRD: ${row.id}`);
  }

  const specByKey = new Map(
    specs.map((spec) => [`${spec.file}::${spec.title}`, spec]),
  );
  for (const spec of specs) {
    const tierTags = spec.tags.filter((tag) => tag === 'critical' || tag === 'uat');
    if (tierTags.length !== 1) {
      errors.push(`test tanpa tepat satu tag tier: ${spec.file}::${spec.title}`);
    }
  }

  for (const row of rows) {
    if (row.status === 'pending' && !strict) continue;

    if (strict && !FINAL_STATUS.has(row.status)) {
      errors.push(`${row.id}: status belum final (${row.status})`);
    }

    if (row.platform === 'web') {
      const key = normalizeEvidence(row.evidence);
      const spec = key ? specByKey.get(key) : undefined;
      if (!spec) {
        errors.push(`${row.id}: bukti web tidak ditemukan (${row.evidence})`);
      } else if (!spec.tags.includes(row.tier)) {
        errors.push(`${row.id}: tier ${row.tier} != tag ${spec.tags.join(',')}`);
      }
    }

    if (row.platform === 'android') {
      const name = flowNameFromEvidence(row.evidence);
      const manifestRow = manifest.find((item) => item.name === name);
      if (!manifestRow) {
        errors.push(`${row.id}: flow tidak ada di manifest (${name})`);
      } else {
        if (row.tier !== manifestRow.tier) {
          errors.push(`${row.id}: tier ${row.tier} != manifest ${manifestRow.tier}`);
        }
        const tags = yamlTags.get(name) ?? [];
        const tierTags = tags.filter((tag) => tag === 'critical' || tag === 'uat');
        if (tierTags.length !== 1) {
          errors.push(`${name}: YAML harus punya tepat satu tag critical/uat`);
        } else if (tierTags[0] !== manifestRow.tier) {
          errors.push(`${name}: tier manifest ${manifestRow.tier} != tag ${tierTags[0]}`);
        }
      }
    }

    if (row.platform === 'manual' && !manualIds.has(row.id)) {
      errors.push(`${row.id}: tidak ada di manual-checklist.md`);
    }

    if ((row.platform === 'rules' || row.platform === 'ci') && !row.evidence) {
      errors.push(`${row.id}: bukti ${row.platform} kosong`);
    }
  }

  for (const item of manifest) {
    const file = path.join(FLOWS_DIR, `${item.name}.yaml`);
    if (!fs.existsSync(file)) {
      errors.push(`manifest tanpa flow: ${item.name}`);
      continue;
    }
    const tags = yamlTags.get(item.name) ?? [];
    const tierTags = tags.filter((tag) => tag === 'critical' || tag === 'uat');
    if (tierTags.length !== 1) {
      errors.push(`${item.name}: YAML harus punya tepat satu tag critical/uat`);
    } else if (tierTags[0] !== item.tier) {
      errors.push(`${item.name}: tier manifest ${item.tier} != tag ${tierTags[0]}`);
    }
  }

  return errors;
}

function main() {
  const strict = process.argv.includes('--strict');
  const prdIds = extractPrdIds(fs.readFileSync(PRD_PATH, 'utf8'));
  const rows = parseCoverage(fs.readFileSync(COVERAGE_PATH, 'utf8'));
  const manualIds = parseManualIds(fs.readFileSync(MANUAL_PATH, 'utf8'));
  const manifest = parseManifest(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const yamlTags = new Map(
    fs
      .readdirSync(FLOWS_DIR)
      .filter((file) => file.endsWith('.yaml'))
      .map((file) => [
        file.replace(/\.yaml$/, ''),
        parseYamlTags(fs.readFileSync(path.join(FLOWS_DIR, file), 'utf8')),
      ]),
  );

  const specs = readPlaywrightSpecs();
  const errors = validate({ prdIds, rows, specs, manifest, yamlTags, manualIds, strict });

  if (prdIds.length !== 65) {
    errors.push(`PRD harus memuat 65 ID, ditemukan ${prdIds.length}`);
  }
  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log(`UAT coverage valid: ${rows.length} baris, ${specs.length} spec Playwright.`);
}

if (require.main === module) main();

module.exports = {
  collectSpecs,
  extractPrdIds,
  parseCoverage,
  parseManifest,
  parseYamlTags,
  validate,
};
