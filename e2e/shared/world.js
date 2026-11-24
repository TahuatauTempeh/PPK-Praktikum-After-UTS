const { initializeApp, getApps } = require('firebase-admin/app');

const IDS = require('./ids.json');
const PASSWORD = IDS.password;

/** Tanggal hari ini menurut WIB, format YYYY-MM-DD. */
function todayWIB(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const value = (type) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function requireEmulatorEnv() {
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (!firestoreHost || !authHost) {
    throw new Error(
      'FIRESTORE_EMULATOR_HOST/FIREBASE_AUTH_EMULATOR_HOST kosong. Jalankan lewat firebase emulators:exec.',
    );
  }
  return { firestoreHost, authHost };
}

async function clearEmulator(host, pathname) {
  const response = await fetch(`http://${host}${pathname}`, { method: 'DELETE' });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Reset emulator gagal: ${response.status} ${pathname}`);
  }
}

function getAdmin(projectId) {
  const existing = getApps().find((app) => app.name === 'e2e-world');
  return existing ?? initializeApp({ projectId }, 'e2e-world');
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

function sessionData(status, date) {
  return {
    classId: IDS.classes.a,
    laboratoryId: IDS.labs.a,
    title: 'Praktikum E2E',
    date,
    startTime: '08:00',
    endTime: '10:00',
    room: 'A201',
    assistantId: IDS.users.asisten,
    assistantName: 'Asisten Satu',
    status,
  };
}

async function seedBaseline(db, auth, now = new Date()) {
  const date = todayWIB(now);
  const users = [
    {
      uid: IDS.users.asisten,
      email: 'asisten@test.local',
      name: 'Asisten Satu',
      nim: 'A01',
      role: 'asisten',
    },
    {
      uid: IDS.users.praktikan1,
      email: 'praktikan1@test.local',
      name: 'Praktikan Satu',
      nim: '001',
      role: 'praktikan',
    },
    {
      uid: IDS.users.praktikan2,
      email: 'praktikan2@test.local',
      name: 'Praktikan Dua',
      nim: '002',
      role: 'praktikan',
    },
  ];
  for (const user of users) await upsertUser(auth, user);

  const batch = db.batch();
  for (const user of users) {
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
  batch.set(db.collection('classes').doc(IDS.classes.a), {
    name: 'IF-3A E2E',
    assistantId: IDS.users.asisten,
    createdAt: now,
    updatedAt: now,
  });
  for (const user of users.filter((item) => item.role === 'praktikan')) {
    batch.set(db.collection('enrollments').doc(`${IDS.classes.a}_${user.uid}`), {
      classId: IDS.classes.a,
      userId: user.uid,
      userName: user.name,
      enrolledAt: now,
    });
  }
  batch.set(db.collection('laboratories').doc(IDS.labs.a), {
    name: 'Lab E2E',
    code: 'E2E',
    building: 'Gedung A',
    floor: '1',
    room: 'A201',
    latitude: -7.0519,
    longitude: 110.4383,
    radiusMeters: 100,
    description: '',
    isActive: true,
    updatedBy: IDS.users.asisten,
    createdAt: now,
    updatedAt: now,
  });
  batch.set(db.collection('sessions').doc(IDS.sessions.open), sessionData('open', date));
  batch.set(db.collection('sessions').doc(IDS.sessions.openOut), sessionData('open', date));
  batch.set(db.collection('sessions').doc(IDS.sessions.closed), sessionData('closed', date));
  batch.set(db.collection('attendance').doc(`${IDS.sessions.closed}_${IDS.users.praktikan1}`), {
    sessionId: IDS.sessions.closed,
    userId: IDS.users.praktikan1,
    userName: 'Praktikan Satu',
    userNim: '001',
    recordedAt: now,
    latitude: -7.0519,
    longitude: 110.4383,
    accuracyMeters: 10,
    distanceMeters: 0,
    radiusMeters: 100,
    laboratoryId: IDS.labs.a,
    locationVerifiedAt: now,
    mocked: false,
    source: 'location',
  });
  await batch.commit();
  return { date, users };
}

module.exports = {
  IDS,
  PASSWORD,
  todayWIB,
  requireEmulatorEnv,
  clearEmulator,
  getAdmin,
  upsertUser,
  seedBaseline,
};
