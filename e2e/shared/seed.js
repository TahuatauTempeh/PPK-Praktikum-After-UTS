const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

const PROJECT_ID =
  process.env.GCLOUD_PROJECT ??
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ??
  'demo-ppk-e2e';
const PASSWORD = 'e2e-password';

const USERS = [
  {
    uid: 'e2e-asisten',
    email: 'asisten@test.local',
    name: 'Asisten Satu',
    nim: 'A01',
    role: 'asisten',
  },
  {
    uid: 'e2e-praktikan1',
    email: 'praktikan1@test.local',
    name: 'Praktikan Satu',
    nim: '001',
    role: 'praktikan',
  },
  {
    uid: 'e2e-praktikan2',
    email: 'praktikan2@test.local',
    name: 'Praktikan Dua',
    nim: '002',
    role: 'praktikan',
  },
];

function requireEmulatorEnv() {
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;

  if (!firestoreHost) {
    throw new Error('FIRESTORE_EMULATOR_HOST kosong. Jalankan lewat firebase emulators:exec.');
  }
  if (!authHost) {
    throw new Error('FIREBASE_AUTH_EMULATOR_HOST kosong. Jalankan lewat firebase emulators:exec.');
  }
  if (!PROJECT_ID.startsWith('demo-')) {
    throw new Error(`Project E2E harus project demo-, bukan ${PROJECT_ID}.`);
  }

  return { firestoreHost, authHost };
}

async function clearEmulator(host, path) {
  const response = await fetch(`http://${host}${path}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(
      `Gagal reset ${path}: ${response.status} ${await response.text()}`,
    );
  }
}

function todayWIB() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const value = (type) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

async function upsertUser(auth, user) {
  const payload = {
    email: user.email,
    password: PASSWORD,
    displayName: user.name,
    emailVerified: true,
  };

  try {
    await auth.getUser(user.uid);
    await auth.updateUser(user.uid, payload);
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;
    await auth.createUser({ uid: user.uid, ...payload });
  }
}

function sessionData(status, now) {
  return {
    classId: 'e2e-class',
    laboratoryId: 'e2e-lab',
    title: 'Praktikum E2E',
    date: todayWIB(),
    startTime: '08:00',
    endTime: '10:00',
    room: 'A201',
    assistantId: 'e2e-asisten',
    assistantName: 'Asisten Satu',
    status,
    createdAt: now,
  };
}

async function main() {
  const { firestoreHost, authHost } = requireEmulatorEnv();
  const app = initializeApp({ projectId: PROJECT_ID }, 'e2e-seed');
  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    await clearEmulator(
      firestoreHost,
      `/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    );
    await clearEmulator(
      authHost,
      `/emulator/v1/projects/${PROJECT_ID}/accounts`,
    );

    for (const user of USERS) {
      await upsertUser(auth, user);
    }

    const now = Timestamp.now();
    const batch = db.batch();

    for (const user of USERS) {
      batch.set(db.collection('users').doc(user.uid), {
        name: user.name,
        nim: user.nim,
        email: user.email,
        role: user.role,
        isAdmin: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    batch.set(db.collection('classes').doc('e2e-class'), {
      name: 'IF-3A E2E',
      assistantId: 'e2e-asisten',
      createdAt: now,
      updatedAt: now,
    });

    for (const user of USERS.filter((item) => item.role === 'praktikan')) {
      batch.set(db.collection('enrollments').doc(`e2e-class_${user.uid}`), {
        classId: 'e2e-class',
        userId: user.uid,
        userName: user.name,
        enrolledAt: now,
      });
    }

    batch.set(db.collection('laboratories').doc('e2e-lab'), {
      name: 'Lab E2E',
      code: 'E2E',
      building: 'Gedung E2E',
      floor: '1',
      room: 'A201',
      latitude: -7.0519,
      longitude: 110.4383,
      radiusMeters: 100,
      description: '',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      updatedBy: 'e2e-asisten',
    });

    batch.set(
      db.collection('sessions').doc('e2e-session-open'),
      sessionData('open', now),
    );
    batch.set(
      db.collection('sessions').doc('e2e-session-open-out'),
      sessionData('open', now),
    );
    batch.set(
      db.collection('sessions').doc('e2e-session-closed'),
      sessionData('closed', now),
    );

    batch.set(
      db.collection('attendance').doc('e2e-session-closed_e2e-praktikan1'),
      {
        sessionId: 'e2e-session-closed',
        userId: 'e2e-praktikan1',
        userName: 'Praktikan Satu',
        userNim: '001',
        recordedAt: now,
        latitude: -7.0519,
        longitude: 110.4383,
        accuracyMeters: 10,
        distanceMeters: 0,
        radiusMeters: 100,
        laboratoryId: 'e2e-lab',
        locationVerifiedAt: now,
        mocked: false,
        source: 'location',
      },
    );

    await batch.commit();
    console.log(
      `Seed selesai: ${USERS.length} akun, 1 kelas, 2 enrollment, 1 lab, 3 sesi, 1 attendance.`,
    );
  } finally {
    await deleteApp(app);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
