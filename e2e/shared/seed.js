const fs = require('node:fs');
const path = require('node:path');

const {
  IDS,
  resetEmulator,
  getAdmin,
  seedBaseline,
  seedFull,
} = require('./world');

const PROJECT_ID =
  process.env.GCLOUD_PROJECT ??
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ??
  'demo-ppk-e2e';

const SUITES = new Set(['critical', 'full']);

/**
 * Menerima `--suite=full` maupun `--suite full`.
 * Default `critical` supaya pemanggilan lama tanpa flag tetap berjalan.
 */
function parseSuite(argv) {
  const withEquals = argv.find((arg) => arg.startsWith('--suite='));
  const index = argv.indexOf('--suite');
  const value = withEquals
    ? withEquals.split('=')[1]
    : index >= 0
      ? argv[index + 1] ?? 'critical'
      : 'critical';
  if (!SUITES.has(value)) {
    throw new Error(`Suite ${value} tidak dikenal; gunakan critical atau full.`);
  }
  return value;
}

function criticalFlows() {
  return {
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
  };
}

function fullFlows() {
  return {
    ...criticalFlows(),
    'izin-lokasi-ditolak': {
      sessionId: IDS.sessions.openAccuracy,
      email: 'praktikan1@test.local',
    },
    'izin-lokasi-dicabut': {
      sessionId: IDS.sessions.openAccuracy,
      email: 'praktikan1@test.local',
    },
    'layanan-lokasi-mati': {
      sessionId: IDS.sessions.openAccuracy,
      email: 'praktikan1@test.local',
    },
    'sesi-tanpa-lab': {
      sessionId: IDS.sessions.scheduledNoLab,
      email: 'asisten@test.local',
    },
    'izin-native': {
      sessionId: IDS.sessions.openPermission,
      email: 'praktikan1@test.local',
      reason: 'Sakit dan perlu istirahat untuk flow native.',
    },
    'kesan-pesan-native': {
      sessionId: IDS.sessions.openKesan,
      email: 'praktikan1@test.local',
    },
  };
}

function buildRunJson({ runDate, runId, suite }) {
  return {
    runDate,
    runId,
    flows: suite === 'full' ? fullFlows() : criticalFlows(),
  };
}

async function main() {
  // Dimuat lazy agar `require('./seed')` di unit test tidak memuat SDK Admin.
  const { getFirestore } = require('firebase-admin/firestore');
  const { getAuth } = require('firebase-admin/auth');
  const suite = parseSuite(process.argv.slice(2));
  if (!PROJECT_ID.startsWith('demo-')) {
    throw new Error(`Project E2E harus project demo-, bukan ${PROJECT_ID}.`);
  }
  await resetEmulator(PROJECT_ID);

  const app = getAdmin(PROJECT_ID);
  const db = getFirestore(app);
  const auth = getAuth(app);
  const now = new Date();
  const runId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const result = suite === 'full'
    ? await seedFull(db, auth, now)
    : await seedBaseline(db, auth, now);

  const runDir = path.resolve(__dirname, '..', '.run');
  fs.mkdirSync(runDir, { recursive: true });
  const payload = buildRunJson({ runDate: result.date, runId, suite });
  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify(payload, null, 2));
  console.log(
    `Seed selesai (${suite}): ${result.users.length} akun, runId=${runId}, date=${result.date}`,
  );
  await app.delete();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

module.exports = { buildRunJson, parseSuite };
