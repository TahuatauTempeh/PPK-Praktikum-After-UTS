import { expect, test } from '../fixtures';
import { getDocByPath } from '../helpers';

test('[harness] skenario per test terisolasi', { tag: '@uat' }, async ({ scenario }) => {
  expect(await getDocByPath(`classes/${scenario.classId}`)).not.toBeNull();
  expect(await getDocByPath(`laboratories/${scenario.labId}`)).not.toBeNull();
  expect(await getDocByPath(`sessions/${scenario.openSessionId}`)).not.toBeNull();
  expect(await getDocByPath(`sessions/${scenario.noLabSessionId}`)).not.toBeNull();
});
