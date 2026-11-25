import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';

export interface Scenario {
  prefix: string;
  date: string;
  classId: string;
  labId: string;
  secondLabId: string;
  inactiveLabId: string;
  openSessionId: string;
  scheduledSessionId: string;
  scheduledNoLabSessionId: string;
  closedSessionId: string;
  noLabSessionId: string;
  inactiveLabSessionId: string;
  paths: string[];
}

export function createScenario(
  db: Firestore,
  auth: Auth,
  options: { prefix: string; now?: Date; date?: string },
): Promise<Scenario>;

export function cleanupScenario(db: Firestore, scenario: Scenario): Promise<void>;

export function seedFull(
  db: Firestore,
  auth: Auth,
  now?: Date,
): Promise<{ date: string; tomorrow: string; users: unknown[] }>;

export function currentTimeRange(now?: Date): { startTime: string; endTime: string };
