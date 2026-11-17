import {
  Timestamp,
  addDoc,
  collection,
  doc,
  serverTimestamp,
  type WriteBatch,
} from 'firebase/firestore';

import type { Role } from '@/types';

import { getFirebaseAuth } from './auth';
import { COLLECTIONS, getDb } from './firestore';

interface AuditActor {
  uid: string;
  role: Role | null;
}

let currentActor: AuditActor | null = null;

export function setAuditActor(actor: AuditActor | null): void {
  currentActor = actor;
}

function resolveActor(): AuditActor | null {
  if (currentActor) return currentActor;

  try {
    const user = getFirebaseAuth().currentUser;
    return user ? { uid: user.uid, role: null } : null;
  } catch {
    return null;
  }
}

function stripUndefined<T>(value: T): T {
  if (value instanceof Timestamp) return value;

  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, stripUndefined(item)]);
    return Object.fromEntries(entries) as T;
  }

  return value;
}

function buildAuditPayload(
  action: string,
  collectionName: string,
  docId: string,
  before: unknown | null,
  after: unknown | null,
) {
  const actor = resolveActor();
  if (!actor) return null;

  return {
    action,
    collection: collectionName,
    docId,
    actorUid: actor.uid,
    actorRole: actor.role,
    before: stripUndefined(before ?? null),
    after: stripUndefined(after ?? null),
    timestamp: serverTimestamp(),
  };
}

export async function logAction(
  action: string,
  collectionName: string,
  docId: string,
  before: unknown | null,
  after: unknown | null,
): Promise<void> {
  const payload = buildAuditPayload(action, collectionName, docId, before, after);
  if (!payload) return;

  try {
    await addDoc(collection(getDb(), COLLECTIONS.auditLogs), payload);
  } catch (error) {
    console.warn('[audit] gagal mencatat aksi', error);
  }
}

export function logActionInBatch(
  batch: WriteBatch,
  action: string,
  collectionName: string,
  docId: string,
  before: unknown | null,
  after: unknown | null,
): void {
  const payload = buildAuditPayload(action, collectionName, docId, before, after);
  if (!payload) return;

  batch.set(doc(collection(getDb(), COLLECTIONS.auditLogs)), payload);
}
