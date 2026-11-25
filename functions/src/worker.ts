/**
 * Entrypoint worker notifikasi untuk Heroku.
 *
 * Deploy sebagai worker dyno:
 *   worker: node lib/worker.js
 *
 * Environment:
 *   FIREBASE_SERVICE_ACCOUNT_JSON  Service account (JSON mentah atau base64)
 *   FIREBASE_PROJECT_ID            Opsional; dipakai saat emulator
 *   FIRESTORE_EMULATOR_HOST        Opsional; untuk pengujian lokal
 *   NOTIFICATION_DRY_RUN           `true` untuk log pesan tanpa mengirim push
 *   NOTIFICATION_HEARTBEAT_MS      Interval heartbeat (default 60000; 0 = mati)
 */

import { cert, deleteApp, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import type { SendPushMessages } from './notification-handlers';
import { NotificationNotifier } from './notifier';

function envInt(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

function readServiceAccount(raw: string): Record<string, unknown> {
  const text = raw.trim().startsWith('{')
    ? raw
    : Buffer.from(raw, 'base64').toString('utf8');
  const parsed: unknown = JSON.parse(text);

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON bukan objek service account yang valid.');
  }

  return parsed as Record<string, unknown>;
}

function dryRunSender(): SendPushMessages {
  return async (messages) => {
    for (const message of messages) {
      console.log('[notifier] dry-run push', {
        to: message.to,
        title: message.title,
        data: message.data,
      });
    }

    return {
      successCount: messages.length,
      failureCount: 0,
      invalidTokens: [],
    };
  };
}

export async function main(): Promise<void> {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
  let app: App;

  if (emulatorHost) {
    app = initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID ?? 'demo-ppk-notifier',
    });
  } else {
    const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!rawServiceAccount) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_JSON wajib diisi (JSON mentah atau base64).'
      );
    }

    app = initializeApp({
      credential: cert(readServiceAccount(rawServiceAccount) as never),
    });
  }

  const db = getFirestore(app);
  const notifier = new NotificationNotifier({
    db,
    send: process.env.NOTIFICATION_DRY_RUN === 'true' ? dryRunSender() : undefined,
    heartbeatMs: envInt('NOTIFICATION_HEARTBEAT_MS', 60_000),
  });

  await notifier.start();

  let shuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`[notifier] menerima ${signal}; menutup worker`);
    try {
      await notifier.stop();
    } finally {
      await deleteApp(app);
      process.exit(0);
    }
  };

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[notifier] gagal start', error);
    process.exit(1);
  });
}
