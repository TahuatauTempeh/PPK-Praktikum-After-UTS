import fs from 'node:fs';
import path from 'node:path';
import { test as base, expect } from '@playwright/test';

import {
  cleanupScenario,
  createScenario,
  type Scenario,
} from '../shared/world';
import { closeAdminDb, getAdminAuth, getAdminDb } from './helpers';

interface RunState {
  runId: string;
  runDate: string;
}

const runPath = path.resolve(process.cwd(), 'e2e/.run/run.json');
const run: RunState = fs.existsSync(runPath)
  ? JSON.parse(fs.readFileSync(runPath, 'utf8'))
  : { runId: 'local', runDate: new Date().toISOString().slice(0, 10) };

export const test = base.extend<{ scenario: Scenario }>({
  // eslint-disable-next-line no-empty-pattern -- Playwright fixture tanpa dependensi.
  scenario: async ({}, use, testInfo) => {
    const file = testInfo.file.split(/[\\/]/).pop()?.replace(/\.e2e\.ts$/, '') ?? 'spec';
    const slug = testInfo.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
    const scenario = await createScenario(getAdminDb(), getAdminAuth(), {
      prefix: `w-${run.runId}-${file}-${slug}`,
      now: new Date(),
      date: run.runDate,
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks -- callback fixture Playwright, bukan React hook.
    await use(scenario);
    await cleanupScenario(getAdminDb(), scenario);
    await closeAdminDb();
  },
});

export { expect };
