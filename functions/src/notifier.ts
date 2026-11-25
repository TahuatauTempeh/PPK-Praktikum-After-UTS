/**
 * Worker notifier untuk deployment di luar Cloud Functions (Heroku).
 *
 * Firestore trigger digantikan oleh `onSnapshot`. Baseline dokumen disimpan di
 * `notificationState/{collection}` agar worker bisa membentuk before/after dan
 * melanjutkan pemrosesan setelah restart.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';

import {
  handlePermissionReviewed,
  handleSessionUpdated,
  type SendPushMessages,
} from './notification-handlers';
import { sendExpoPushMessages } from './notification-helpers';
import {
  buildUpdateEvent,
  entryFromSnapshot,
  isPermissionChangeNotifiable,
  isSessionChangeNotifiable,
  normalizerFor,
  parseBaseline,
  removeBaselineEntry,
  serializeBaseline,
  setBaselineEntry,
  type BaselineEntry,
  type BaselineState,
  type NotificationCollection,
  type Normalizer,
} from './notification-state';

export interface NotifierLogger {
  info(message: string, meta?: unknown): void;
  error(message: string, error?: unknown): void;
}

export interface NotifierHandlers {
  sessions?: typeof handleSessionUpdated;
  permissionRequests?: typeof handlePermissionReviewed;
}

export interface SnapshotChange {
  type: 'added' | 'modified' | 'removed';
  doc: {
    id: string;
    data(): Record<string, unknown> | undefined;
    updateTime?: {
      toDate(): Date;
    };
  };
}

export interface SnapshotBatch {
  docChanges(): SnapshotChange[];
}

export interface NotificationNotifierOptions {
  db: Firestore;
  send?: SendPushMessages;
  handlers?: NotifierHandlers;
  logger?: NotifierLogger;
  stateCollection?: string;
  heartbeatMs?: number;
  retryMs?: number;
}

const COLLECTIONS: NotificationCollection[] = ['sessions', 'permissionRequests'];
const DEFAULT_STATE_COLLECTION = 'notificationState';
const DEFAULT_HEARTBEAT_MS = 60_000;
const DEFAULT_RETRY_MS = 5_000;

const defaultLogger: NotifierLogger = {
  info(message, meta) {
    if (meta === undefined) console.log(message);
    else console.log(message, meta);
  },
  error(message, error) {
    if (error === undefined) console.error(message);
    else console.error(message, error);
  },
};

function initialState(): Record<NotificationCollection, BaselineState> {
  return {
    sessions: { docs: {} },
    permissionRequests: { docs: {} },
  };
}

export class NotificationNotifier {
  private readonly db: Firestore;
  private readonly send: SendPushMessages;
  private readonly handlers: Required<NotifierHandlers>;
  private readonly logger: NotifierLogger;
  private readonly stateCollection: string;
  private readonly heartbeatMs: number;
  private readonly retryMs: number;

  private states = initialState();
  private unsubscribers: Array<() => void> = [];
  private reconnectTimers = new Set<ReturnType<typeof setTimeout>>();
  private queue: Promise<void> = Promise.resolve();
  private heartbeat: ReturnType<typeof setInterval> | undefined;
  private stopped = false;
  private started = false;

  constructor(options: NotificationNotifierOptions) {
    this.db = options.db;
    this.send = options.send ?? sendExpoPushMessages;
    this.handlers = {
      sessions: options.handlers?.sessions ?? handleSessionUpdated,
      permissionRequests: options.handlers?.permissionRequests ?? handlePermissionReviewed,
    };
    this.logger = options.logger ?? defaultLogger;
    this.stateCollection = options.stateCollection ?? DEFAULT_STATE_COLLECTION;
    this.heartbeatMs = options.heartbeatMs ?? DEFAULT_HEARTBEAT_MS;
    this.retryMs = options.retryMs ?? DEFAULT_RETRY_MS;
  }

  /** Memuat baseline untuk kedua koleksi. Aman dipanggil sekali sebelum start. */
  async initialize(): Promise<void> {
    for (const collection of COLLECTIONS) {
      this.states[collection] = await this.loadState(collection);
    }
  }

  /** Memasang listener dan heartbeat. */
  async start(): Promise<void> {
    if (this.started) return;

    this.stopped = false;
    await this.initialize();
    this.attach('sessions');
    this.attach('permissionRequests');
    this.startHeartbeat();
    this.started = true;
    this.logger.info('[notifier] worker aktif');
  }

  /** Melepas listener, timer, dan menunggu antrean selesai. */
  async stop(): Promise<void> {
    if (this.stopped && !this.started) return;

    this.stopped = true;

    for (const unsubscribe of this.unsubscribers) {
      try {
        unsubscribe();
      } catch {
        // Listener sudah tertutup; tidak perlu menghentikan shutdown.
      }
    }
    this.unsubscribers = [];

    for (const timer of this.reconnectTimers) {
      clearTimeout(timer);
    }
    this.reconnectTimers.clear();

    if (this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = undefined;
    }

    await this.queue.catch(() => undefined);
    this.started = false;
    this.logger.info('[notifier] worker berhenti');
  }

  /**
   * Memproses satu batch perubahan. Diekspor publik agar bisa diuji tanpa
   * memasang listener Firestore.
   */
  async processChanges(
    collection: NotificationCollection,
    changes: readonly SnapshotChange[]
  ): Promise<void> {
    if (changes.length === 0) return;

    const normalize = normalizerFor(collection);
    let state = this.states[collection];

    for (const change of changes) {
      const doc = change.doc;

      if (change.type === 'removed') {
        state = removeBaselineEntry(state, doc.id);
        continue;
      }

      const before = state.docs[doc.id];
      if (before) {
        await this.dispatch(collection, before, doc, normalize);
      }

      state = setBaselineEntry(state, doc.id, entryFromSnapshot(doc, normalize));
    }

    this.states[collection] = state;
    await this.persistStateSafely(collection, state);
  }

  private async dispatch(
    collection: NotificationCollection,
    before: BaselineEntry,
    after: SnapshotChange['doc'],
    normalize: Normalizer
  ): Promise<void> {
    const afterData = normalize(after.data() ?? {});

    if (collection === 'sessions') {
      if (!isSessionChangeNotifiable(before.data, afterData)) return;

      const event = buildUpdateEvent(
        before,
        after,
        { sessionId: after.id },
        normalize
      );

      try {
        await this.handlers.sessions(this.db, event, this.send);
      } catch (error) {
        this.logger.error(`[notifier] handler sessions gagal untuk ${after.id}`, error);
      }
      return;
    }

    if (!isPermissionChangeNotifiable(before.data, afterData)) return;

    const event = buildUpdateEvent(
      before,
      after,
      { requestId: after.id },
      normalize
    );

    try {
      await this.handlers.permissionRequests(this.db, event, this.send);
    } catch (error) {
      this.logger.error(
        `[notifier] handler permissionRequests gagal untuk ${after.id}`,
        error
      );
    }
  }

  private async loadState(collection: NotificationCollection): Promise<BaselineState> {
    const normalize = normalizerFor(collection);
    const stateRef = this.db.collection(this.stateCollection).doc(collection);
    const stateSnapshot = await stateRef.get();

    if (stateSnapshot.exists) {
      return parseBaseline(stateSnapshot.data(), normalize);
    }

    const current = await this.db.collection(collection).get();
    const docs: Record<string, BaselineEntry> = {};

    for (const doc of current.docs) {
      docs[doc.id] = entryFromSnapshot(doc, normalize);
    }

    const state: BaselineState = { docs };
    await this.persistState(collection, state);
    return state;
  }

  private async persistState(
    collection: NotificationCollection,
    state: BaselineState
  ): Promise<void> {
    await this.db.collection(this.stateCollection).doc(collection).set({
      docs: serializeBaseline(state).docs,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  private async persistStateSafely(
    collection: NotificationCollection,
    state: BaselineState
  ): Promise<void> {
    try {
      await this.persistState(collection, state);
    } catch (error) {
      this.logger.error(`[notifier] gagal menyimpan baseline ${collection}`, error);
    }
  }

  private enqueue(collection: NotificationCollection, changes: readonly SnapshotChange[]): void {
    if (changes.length === 0) return;

    this.queue = this.queue
      .then(() => this.processChanges(collection, changes))
      .catch((error) => {
        this.logger.error(`[notifier] batch ${collection} gagal`, error);
      });
  }

  private attach(collection: NotificationCollection): void {
    let unsubscribe: (() => void) | undefined;

    const connect = () => {
      if (this.stopped) return;

      unsubscribe = this.db.collection(collection).onSnapshot(
        (snapshot) => this.enqueue(collection, snapshot.docChanges()),
        (error) => {
          this.logger.error(`[notifier] listener ${collection} gagal`, error);
          unsubscribe?.();
          unsubscribe = undefined;

          if (this.stopped) return;

          const timer = setTimeout(() => {
            this.reconnectTimers.delete(timer);
            connect();
          }, this.retryMs);
          this.reconnectTimers.add(timer);
        }
      );

      if (unsubscribe) this.unsubscribers.push(unsubscribe);
    };

    connect();
  }

  private startHeartbeat(): void {
    if (this.heartbeatMs <= 0) return;

    this.heartbeat = setInterval(() => {
      void this.writeHeartbeat();
    }, this.heartbeatMs);
  }

  private async writeHeartbeat(): Promise<void> {
    try {
      await this.db.collection(this.stateCollection).doc('heartbeat').set(
        {
          at: FieldValue.serverTimestamp(),
          pid: process.pid,
        },
        { merge: true }
      );
    } catch (error) {
      this.logger.error('[notifier] gagal menulis heartbeat', error);
    }
  }
}
