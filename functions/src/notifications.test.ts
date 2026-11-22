import type { Firestore } from 'firebase-admin/firestore';

import type { ExpoPushMessage, PushResult } from './notification-helpers';
import {
  handlePermissionReviewed,
  handleSessionUpdated,
  type FirestoreUpdateEvent,
} from './notifications';

type Data = Record<string, unknown>;
type Snapshot = {
  exists: boolean;
  id: string;
  data: () => Data | undefined;
  updateTime: { toDate: () => Date };
  ref: unknown;
};

class FakeDb {
  readonly store = new Map<string, Map<string, Data>>();
  failEnrollments = false;

  constructor(seed: Record<string, Record<string, Data>> = {}) {
    for (const [collection, docs] of Object.entries(seed)) {
      this.store.set(collection, new Map(Object.entries(docs)));
    }
  }

  collection(name: string) {
    if (name === 'enrollments' && this.failEnrollments) {
      return {
        doc: (id: string) => this.docRef(name, id),
        where: () => ({
          get: async () => {
            throw new Error('enrollment read failed');
          },
        }),
      };
    }

    return {
      doc: (id: string) => this.docRef(name, id),
      where: (field: unknown, operator: string, value: unknown) =>
        this.query(name, field, operator, value),
    };
  }

  async runTransaction<T>(callback: (transaction: any) => Promise<T>): Promise<T> {
    const transaction = {
      get: async (ref: any) => ref.get(),
      set: (ref: any, data: Data, options?: { merge?: boolean }) => {
        void ref.set(data, options);
      },
    };

    return callback(transaction);
  }

  batch() {
    const operations: (() => Promise<void>)[] = [];

    return {
      update: (ref: any, data: Data) => {
        operations.push(() => ref.update(data));
      },
      commit: async () => {
        for (const operation of operations) {
          await operation();
        }
      },
    };
  }

  private docRef(name: string, id: string) {
    return {
      id,
      get: async () => this.snapshot(name, id),
      set: async (data: Data, options?: { merge?: boolean }) => {
        this.write(name, id, data, options?.merge === true);
      },
      update: async (data: Data) => {
        this.write(name, id, data, true);
      },
    };
  }

  private snapshot(name: string, id: string): Snapshot {
    const data = this.store.get(name)?.get(id);

    return {
      exists: data !== undefined,
      id,
      data: () => data,
      updateTime: { toDate: () => new Date('2026-11-24T00:00:00.000Z') },
      ref: this.docRef(name, id),
    };
  }

  private query(name: string, field: unknown, operator: string, value: unknown) {
    return {
      get: async () => {
        const entries = Array.from(this.store.get(name)?.entries() ?? []).filter(
          ([id, data]) => {
            if (typeof field !== 'string') {
              if (operator === 'in') {
                return Array.isArray(value) && value.includes(id);
              }
              return id === value;
            }

            const actual = data[field];
            if (operator === '==') return actual === value;
            if (operator === 'in') {
              return Array.isArray(value) && value.includes(actual);
            }
            return false;
          }
        );

        return {
          empty: entries.length === 0,
          docs: entries.map(([id, data]) => ({
            id,
            data: () => data,
            ref: this.docRef(name, id),
          })),
        };
      },
    };
  }

  private write(name: string, id: string, data: Data, merge: boolean) {
    if (!this.store.has(name)) {
      this.store.set(name, new Map());
    }

    const collection = this.store.get(name)!;
    const current = collection.get(id);
    collection.set(id, merge && current ? { ...current, ...data } : { ...data });
  }
}

function asFirestore(db: FakeDb): Firestore {
  return db as unknown as Firestore;
}

function sessionEvent(
  before: Data,
  after: Data,
  sessionId = 'session-1'
): FirestoreUpdateEvent<{ sessionId: string }> {
  return {
    data: {
      before: { data: () => before },
      after: { data: () => after },
    },
    params: { sessionId },
    time: '2026-11-24T00:00:00.000Z',
  };
}

function permissionEvent(
  before: Data,
  after: Data,
  requestId = 'request-1'
): FirestoreUpdateEvent<{ requestId: string }> {
  return {
    data: {
      before: { data: () => before },
      after: { data: () => after },
    },
    params: { requestId },
    time: '2026-11-24T00:00:00.000Z',
  };
}

function makeSender(result: PushResult = { successCount: 1, failureCount: 0, invalidTokens: [] }) {
  return jest.fn<Promise<PushResult>, [ExpoPushMessage[]]>().mockResolvedValue(result);
}

function sessionLog(db: FakeDb): Data | undefined {
  return Array.from(db.store.get('notificationLogs')?.values() ?? [])[0];
}

describe('notification triggers', () => {
  it('mengirim sesi dibuka ke praktikan terdaftar dan memuat kelas', async () => {
    const db = new FakeDb({
      classes: { 'class-1': { name: 'IF-3A' } },
      enrollments: { 'class-1_p1': { classId: 'class-1', userId: 'p1' } },
      users: { p1: { expoPushToken: 'ExponentPushToken[p1]' } },
    });
    const send = makeSender();
    const before = {
      status: 'scheduled',
      classId: 'class-1',
      title: 'Basis Data',
      date: '2026-11-24',
      startTime: '08:00',
      endTime: '10:00',
      room: 'Lab A201',
    };

    await handleSessionUpdated(
      asFirestore(db),
      sessionEvent(before, { ...before, status: 'open' }),
      send
    );

    expect(send).toHaveBeenCalledTimes(1);
    const messages = send.mock.calls[0][0];
    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(
      expect.objectContaining({
        to: 'ExponentPushToken[p1]',
        title: 'Sesi praktikum dibuka',
        body: expect.stringContaining('IF-3A'),
        data: expect.objectContaining({
          type: 'session-open',
          sessionId: 'session-1',
          url: '/praktikan/presensi/session-1',
        }),
      })
    );
    expect(sessionLog(db)?.status).toBe('sent');
  });

  it('tidak mengirim ulang untuk dokumen sesi yang sama', async () => {
    const db = new FakeDb({
      enrollments: { 'class-1_p1': { classId: 'class-1', userId: 'p1' } },
      users: { p1: { expoPushToken: 'ExponentPushToken[p1]' } },
    });
    const send = makeSender();
    const before = { status: 'scheduled', classId: 'class-1', title: 'Basis Data' };
    const after = { ...before, status: 'open' };

    await handleSessionUpdated(asFirestore(db), sessionEvent(before, after), send);
    await handleSessionUpdated(asFirestore(db), sessionEvent(before, after), send);

    expect(send).toHaveBeenCalledTimes(1);
    expect(db.store.get('notificationLogs')?.size).toBe(1);
  });

  it('mencatat skipped bila penerima belum punya token', async () => {
    const db = new FakeDb({
      enrollments: { 'class-1_p1': { classId: 'class-1', userId: 'p1' } },
      users: { p1: {} },
    });
    const send = makeSender();
    const before = { status: 'scheduled', classId: 'class-1', title: 'Basis Data' };

    await handleSessionUpdated(
      asFirestore(db),
      sessionEvent(before, { ...before, status: 'open' }),
      send
    );

    expect(send).not.toHaveBeenCalled();
    expect(sessionLog(db)?.status).toBe('skipped');
    expect(sessionLog(db)?.recipientIds).toEqual(['p1']);
  });

  it('mengirim izin disetujui ke pemilik izin dengan nama dan waktu sesi', async () => {
    const db = new FakeDb({
      users: { p1: { expoPushToken: 'ExponentPushToken[p1]' } },
      sessions: {
        'session-1': {
          title: 'Basis Data',
          date: '2026-11-24',
          startTime: '08:00',
          endTime: '10:00',
        },
      },
    });
    const send = makeSender();

    await handlePermissionReviewed(
      asFirestore(db),
      permissionEvent(
        { status: 'pending', userId: 'p1', sessionId: 'session-1' },
        {
          status: 'approved',
          userId: 'p1',
          sessionId: 'session-1',
          reviewNote: null,
        }
      ),
      send
    );

    expect(send).toHaveBeenCalledTimes(1);
    const messages = send.mock.calls[0][0];
    expect(messages[0]).toEqual(
      expect.objectContaining({
        to: 'ExponentPushToken[p1]',
        title: 'Izin disetujui',
        body: expect.stringContaining('08:00–10:00'),
        data: expect.objectContaining({
          type: 'permission-approved',
          permissionId: 'request-1',
          url: '/(praktikan)/izin',
        }),
      })
    );
    expect(sessionLog(db)?.status).toBe('sent');
  });

  it('mencatat failed dan melempar error bila query penerima gagal', async () => {
    const db = new FakeDb();
    db.failEnrollments = true;
    const send = makeSender();
    const before = { status: 'scheduled', classId: 'class-1', title: 'Basis Data' };

    await expect(
      handleSessionUpdated(
        asFirestore(db),
        sessionEvent(before, { ...before, status: 'open' }),
        send
      )
    ).rejects.toThrow('enrollment read failed');

    expect(send).not.toHaveBeenCalled();
    expect(sessionLog(db)?.status).toBe('failed');
    expect(sessionLog(db)?.error).toContain('enrollment read failed');
  });
});
