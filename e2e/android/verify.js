const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const PROJECT_ID = process.env.GCLOUD_PROJECT ?? 'demo-ppk-e2e';
const TIER = process.env.TIER ?? 'critical';
const app = initializeApp({ projectId: PROJECT_ID }, 'e2e-verify');
const db = getFirestore(app);
const run = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '.run', 'run.json'), 'utf8'));
const manifestPath = process.env.MANIFEST
  ? path.resolve(process.env.MANIFEST)
  : path.join(__dirname, 'manifest.tsv');
const manifest = fs
  .readFileSync(manifestPath, 'utf8')
  .split(/\r?\n/)
  .filter((line) => line.trim() && !line.startsWith('#'))
  .map((line) => {
    const [name, tier] = line.split('\t');
    return { name, tier };
  });

async function verifyCritical() {
  const success = await db.doc('attendance/e2e-session-open_e2e-praktikan1').get();
  assert.ok(success.exists, 'attendance sukses tidak ditemukan');
  const data = success.data();
  assert.equal(data.sessionId, 'e2e-session-open');
  assert.equal(data.userId, 'e2e-praktikan1');
  assert.equal(data.userName, 'Praktikan Satu');
  assert.equal(data.userNim, '001');
  assert.equal(data.radiusMeters, 100);
  assert.equal(data.laboratoryId, 'e2e-lab');
  assert.equal(data.mocked, false);
  assert.equal(data.source, 'location');
  assert.ok(data.accuracyMeters <= 100, `accuracy ${data.accuracyMeters}`);
  assert.ok(data.distanceMeters <= 100, `distance ${data.distanceMeters}`);
  assert.ok(Math.abs(data.latitude - -7.0519) < 0.001, `latitude ${data.latitude}`);
  assert.ok(Math.abs(data.longitude - 110.4383) < 0.001, `longitude ${data.longitude}`);
  assert.ok(data.recordedAt, 'recordedAt kosong');

  const outside = await db.doc('attendance/e2e-session-open-out_e2e-praktikan2').get();
  assert.equal(outside.exists, false, 'attendance luar radius tidak boleh ada');

  const seeded = await db.doc('attendance/e2e-session-closed_e2e-praktikan1').get();
  assert.ok(seeded.exists, 'attendance seed sesi tertutup hilang');
}

async function verifyUat(name) {
  const flow = run.flows[name] ?? {};
  const attendanceId = `${flow.sessionId}_e2e-praktikan1`;

  if (['izin-lokasi-ditolak', 'izin-lokasi-dicabut', 'layanan-lokasi-mati'].includes(name)) {
    assert.equal((await db.doc(`attendance/${attendanceId}`).get()).exists, false);
  }

  if (name === 'sesi-tanpa-lab') {
    const session = await db.doc(`sessions/${flow.sessionId}`).get();
    assert.equal(session.data()?.status, 'scheduled');
    assert.equal(session.data()?.laboratoryId, '');
  }

  if (name === 'izin-native') {
    const snapshot = await db
      .collection('permissionRequests')
      .where('reason', '==', flow.reason)
      .get();
    assert.equal(snapshot.size, 1, 'izin native tidak tercatat');
    assert.equal(snapshot.docs[0].data().status, 'pending');
  }

  if (name === 'kesan-pesan-native') {
    const kesan = await db.doc(`kesanPesan/${attendanceId}`).get();
    assert.ok(kesan.exists, 'kesan pesan native tidak tercatat');
    assert.equal(kesan.data()?.text, 'Kesan dari flow native Android.');
  }
}

async function main() {
  const names = new Set(manifest.map((item) => item.name));

  // Manifest perangkat tidak memuat flow presensi radius karena lokasi mock
  // ditolak aplikasi. Verifikasi critical hanya dijalankan bila flow itu ada.
  if (names.has('presensi-dalam-radius')) {
    await verifyCritical();
  }

  for (const row of manifest) {
    await verifyUat(row.name);
  }

  console.log(`Verifikasi E2E Android lulus (${TIER}, ${manifestPath})`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
