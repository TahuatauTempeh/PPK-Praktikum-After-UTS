const assert = require('node:assert/strict');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const PROJECT_ID = process.env.GCLOUD_PROJECT ?? 'demo-ppk-e2e';
const TIER = process.env.TIER ?? 'critical';
const app = initializeApp({ projectId: PROJECT_ID }, 'e2e-verify');
const db = getFirestore(app);

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
  assert.ok(
    Math.abs(data.latitude - -7.0519) < 0.001,
    `latitude ${data.latitude}`,
  );
  assert.ok(
    Math.abs(data.longitude - 110.4383) < 0.001,
    `longitude ${data.longitude}`,
  );
  assert.ok(data.recordedAt, 'recordedAt kosong');

  const outside = await db
    .doc('attendance/e2e-session-open-out_e2e-praktikan2')
    .get();
  assert.equal(outside.exists, false, 'attendance luar radius tidak boleh ada');

  const seeded = await db
    .doc('attendance/e2e-session-closed_e2e-praktikan1')
    .get();
  assert.ok(seeded.exists, 'attendance seed sesi tertutup hilang');
}

async function main() {
  if (TIER === 'critical') {
    await verifyCritical();
  }
  console.log(`Verifikasi E2E Android lulus (${TIER})`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
