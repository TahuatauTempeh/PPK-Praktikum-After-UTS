const fs = require('node:fs');
const path = require('node:path');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const {
  IDS,
  requireEmulatorEnv,
  clearEmulator,
  getAdmin,
  seedBaseline,
} = require('./world');

const PROJECT_ID =
  process.env.GCLOUD_PROJECT ??
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ??
  'demo-ppk-e2e';

/**
 * Menerima `--suite=critical` maupun `--suite critical`.
 * Default `critical` supaya pemanggilan lama tanpa flag tetap berjalan.
 */
function parseSuite(argv) {
  const withEquals = argv.find((arg) => arg.startsWith('--suite='));
  if (withEquals) return withEquals.split('=')[1];
  const index = argv.indexOf('--suite');
  return index >= 0 ? argv[index + 1] : 'critical';
}

async function main() {
  const suite = parseSuite(process.argv.slice(2));
  if (suite !== 'critical') {
    throw new Error(`Suite ${suite} belum tersedia di Phase 1; gunakan --suite=critical.`);
  }
  if (!PROJECT_ID.startsWith('demo-')) {
    throw new Error(`Project E2E harus project demo-, bukan ${PROJECT_ID}.`);
  }
  const { firestoreHost, authHost } = requireEmulatorEnv();
  await clearEmulator(
    firestoreHost,
    `/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
  );
  await clearEmulator(authHost, `/emulator/v1/projects/${PROJECT_ID}/accounts`);

  const app = getAdmin(PROJECT_ID);
  const db = getFirestore(app);
  const auth = getAuth(app);
  const now = new Date();
  const runId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const result = await seedBaseline(db, auth, now);

  const runDir = path.resolve(__dirname, '..', '.run');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(
    path.join(runDir, 'run.json'),
    JSON.stringify(
      {
        runDate: result.date,
        runId,
        flows: {
          'presensi-dalam-radius': {
            sessionId: IDS.sessions.open,
            email: 'praktikan1@test.local',
          },
          'presensi-luar-radius': {
            sessionId: IDS.sessions.openOut,
            email: 'praktikan2@test.local',
          },
          'asisten-kehadiran': {
            sessionId: IDS.sessions.closed,
            email: 'asisten@test.local',
          },
        },
      },
      null,
      2,
    ),
  );
  console.log(
    `Seed selesai (critical): ${result.users.length} akun, runId=${runId}, date=${result.date}`,
  );
  await app.delete();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
