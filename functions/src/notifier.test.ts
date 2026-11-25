import type { Firestore } from 'firebase-admin/firestore';

import {
  handlePermissionReviewed,
  handleSessionUpdated,
} from './notification-handlers';
import type { FirestoreUpdateEvent } from './notification-handlers';
import { NotificationNotifier, type SnapshotChange } from './notifier';

type Data = Record<string, unknown>;

const UPDATE_TIME = {
  toDate: () => new Date('2026-11-25T01:00:00.000Z'),
};

class FakeDb {
  readonly stateDocs = new Map<string, Data>();
  readonly collectionDocs = new Map<string, Map<string, { data: Data; updateTime: typeof UPDATE_TIME }>>();
  readonly writes: Array<{ collection: string; id: string; data: Data }> = [];

  collection(name: string) {
    if (name === 'notificationState') {
      return {
        doc: (id: string) => ({
          get: async () => ({
            exists: this.stateDocs.has(id),
            data: () => this.stateDocs.get(id),
          }),
          set: async (data: Data) => {
            this.stateDocs.set(id, data);
            this.writes.push({ collection: name, id, data });
          },
        }),
      };
    }

    return {
      get: async () => ({
        docs: Array.from(this.collectionDocs.get(name)?.entries() ?? []).map(
          ([id, entry]) => ({
            id,
            data: () => entry.data,
            updateTime: entry.updateTime,
          })
        ),
      }),
      onSnapshot: () => () => undefined,
    };
  }
}

function change(
  type: SnapshotChange['type'],
  id: string,
  data: Data,
  updateTime = UPDATE_TIME
): SnapshotChange {
  return {
    type,
    doc: {
      id,
      data: () => data,
      updateTime,
    },
  };
}

function sessionData(overrides: Data = {}): Data {
  return {
    status: 'scheduled',
    classId: 'class-1',
    title: 'Basis Data',
    date: '2026-11-25',
    startTime: '08:00',
    endTime: '09:40',
    room: 'Lab A201',
    laboratoryId: 'lab-a',
    ...overrides,
  };
}

function makeNotifier(db: FakeDb) {
  const sessionsMock = jest.fn(async (...args: unknown[]) => {
    void args;
    return undefined;
  });
  const permissionsMock = jest.fn(async (...args: unknown[]) => {
    void args;
    return undefined;
  });
  const logger = {
    info: jest.fn(),
    error: jest.fn(),
  };
  const notifier = new NotificationNotifier({
    db: db as unknown as Firestore,
    send: jest.fn(),
    handlers: {
      sessions: sessionsMock as unknown as typeof handleSessionUpdated,
      permissionRequests: permissionsMock as unknown as typeof handlePermissionReviewed,
    },
    logger,
    heartbeatMs: 0,
  });

  return { notifier, sessionsMock, permissionsMock, logger };
}

describe('NotificationNotifier', () => {
  it('mengirim event sesi dibuka dari baseline dan memperbarui baseline', async () => {
    const db = new FakeDb();
    db.stateDocs.set('sessions', {
      docs: {
        'session-1': {
          data: sessionData(),
          updateTime: '2026-11-25T00:00:00.000Z',
        },
      },
    });
    const { notifier, sessionsMock } = makeNotifier(db);

    await notifier.initialize();
    await notifier.processChanges('sessions', [
      change('modified', 'session-1', sessionData({ status: 'open' })),
    ]);

    expect(sessionsMock).toHaveBeenCalledTimes(1);
    const event = sessionsMock.mock.calls[0][1] as FirestoreUpdateEvent<{ sessionId: string }>;
    expect(event.params).toEqual({ sessionId: 'session-1' });
    expect(event.data?.before.data()?.status).toBe('scheduled');
    expect(event.data?.after.data()?.status).toBe('open');
    expect(event.data?.after.data()?.date).toBe('2026-11-25');

    const saved = db.stateDocs.get('sessions') as {
      docs: Record<string, { data: Data; updateTime: string | null }>;
    };
    expect(saved.docs['session-1'].data.status).toBe('open');
    expect(saved.docs['session-1'].updateTime).toBe('2026-11-25T01:00:00.000Z');
  });

  it('tidak memanggil handler untuk dokumen baru tanpa baseline', async () => {
    const db = new FakeDb();
    db.stateDocs.set('sessions', { docs: {} });
    const { notifier, sessionsMock } = makeNotifier(db);

    await notifier.initialize();
    await notifier.processChanges('sessions', [
      change('added', 'session-baru', sessionData({ status: 'open' })),
    ]);

    expect(sessionsMock).not.toHaveBeenCalled();
    const saved = db.stateDocs.get('sessions') as {
      docs: Record<string, { data: Data }>;
    };
    expect(saved.docs['session-baru'].data.status).toBe('open');
  });

  it('tidak memanggil handler bila perubahan sesi tidak relevan', async () => {
    const db = new FakeDb();
    db.stateDocs.set('sessions', {
      docs: {
        'session-1': {
          data: sessionData({ status: 'open' }),
          updateTime: '2026-11-25T00:00:00.000Z',
        },
      },
    });
    const { notifier, sessionsMock } = makeNotifier(db);

    await notifier.initialize();
    await notifier.processChanges('sessions', [
      change('modified', 'session-1', sessionData({ status: 'open' })),
    ]);

    expect(sessionsMock).not.toHaveBeenCalled();
  });

  it('menghapus dokumen dari baseline saat listener melaporkan removed', async () => {
    const db = new FakeDb();
    db.stateDocs.set('sessions', {
      docs: {
        'session-1': {
          data: sessionData(),
          updateTime: '2026-11-25T00:00:00.000Z',
        },
      },
    });
    const { notifier, sessionsMock } = makeNotifier(db);

    await notifier.initialize();
    await notifier.processChanges('sessions', [
      change('removed', 'session-1', sessionData()),
    ]);

    expect(sessionsMock).not.toHaveBeenCalled();
    const saved = db.stateDocs.get('sessions') as { docs: Record<string, unknown> };
    expect(saved.docs['session-1']).toBeUndefined();
  });

  it('memproses keputusan izin dan memakai handler permissionRequests', async () => {
    const db = new FakeDb();
    db.stateDocs.set('permissionRequests', {
      docs: {
        'request-1': {
          data: {
            status: 'pending',
            userId: 'p1',
            sessionId: 'session-1',
            reviewNote: null,
          },
          updateTime: '2026-11-25T00:00:00.000Z',
        },
      },
    });
    const { notifier, permissionsMock } = makeNotifier(db);

    await notifier.initialize();
    await notifier.processChanges('permissionRequests', [
      change('modified', 'request-1', {
        status: 'approved',
        userId: 'p1',
        sessionId: 'session-1',
        reviewNote: null,
      }),
    ]);

    expect(permissionsMock).toHaveBeenCalledTimes(1);
    const event = permissionsMock.mock.calls[0][1] as FirestoreUpdateEvent<{ requestId: string }>;
    expect(event.params).toEqual({ requestId: 'request-1' });
    expect(event.data?.before.data()?.status).toBe('pending');
    expect(event.data?.after.data()?.status).toBe('approved');
  });

  it('mencatat error handler tetapi tetap memperbarui baseline', async () => {
    const db = new FakeDb();
    db.stateDocs.set('sessions', {
      docs: {
        'session-1': {
          data: sessionData(),
          updateTime: '2026-11-25T00:00:00.000Z',
        },
      },
    });
    const sessionsMock = jest.fn(async () => {
      throw new Error('push gagal');
    });
    const logger = { info: jest.fn(), error: jest.fn() };
    const notifier = new NotificationNotifier({
      db: db as unknown as Firestore,
      send: jest.fn(),
      handlers: {
        sessions: sessionsMock as unknown as typeof handleSessionUpdated,
        permissionRequests: jest.fn() as unknown as typeof handlePermissionReviewed,
      },
      logger,
      heartbeatMs: 0,
    });

    await notifier.initialize();
    await expect(
      notifier.processChanges('sessions', [
        change('modified', 'session-1', sessionData({ status: 'open' })),
      ])
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('handler sessions gagal'),
      expect.any(Error)
    );
    const saved = db.stateDocs.get('sessions') as {
      docs: Record<string, { data: Data }>;
    };
    expect(saved.docs['session-1'].data.status).toBe('open');
  });

  it('membuat baseline awal dari dokumen yang sudah ada bila state belum tersedia', async () => {
    const db = new FakeDb();
    db.collectionDocs.set(
      'sessions',
      new Map([
        ['session-1', { data: sessionData({ status: 'open' }), updateTime: UPDATE_TIME }],
      ])
    );
    const { notifier, sessionsMock } = makeNotifier(db);

    await notifier.initialize();

    expect(sessionsMock).not.toHaveBeenCalled();
    const saved = db.stateDocs.get('sessions') as {
      docs: Record<string, { data: Data; updateTime: string | null }>;
    };
    expect(saved.docs['session-1'].data.status).toBe('open');
    expect(saved.docs['session-1'].updateTime).toBe('2026-11-25T01:00:00.000Z');
  });
});
