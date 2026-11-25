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

function sessionData(status, date, overrides = {}) {
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
    ...overrides,
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

/** Rentang jam WIB yang sedang berjalan, agar panel "Sekarang" deterministik. */
function currentTimeRange(now = new Date()) {
  const format = (offsetMinutes) => {
    const date = new Date(now.getTime() + offsetMinutes * 60_000);
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  };
  return { startTime: format(-30), endTime: format(60) };
}

function tomorrowWIB(now = new Date()) {
  const date = new Date(now.getTime() + 24 * 60 * 60_000);
  return todayWIB(date);
}

async function resetEmulator(projectId) {
  const { firestoreHost, authHost } = requireEmulatorEnv();
  await clearEmulator(
    firestoreHost,
    `/emulator/v1/projects/${projectId}/databases/(default)/documents`,
  );
  await clearEmulator(authHost, `/emulator/v1/projects/${projectId}/accounts`);
}

function labData(overrides = {}) {
  return {
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
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

async function seedFull(db, auth, now = new Date()) {
  const base = await seedBaseline(db, auth, now);
  const date = base.date;
  const tomorrow = tomorrowWIB(now);
  const range = currentTimeRange(now);

  const extraUsers = [
    {
      uid: IDS.users.admin,
      email: 'admin@test.local',
      name: 'Admin E2E',
      nim: 'ADM',
      role: 'asisten',
      isAdmin: true,
    },
    {
      uid: IDS.users.praktikan3,
      email: 'praktikan3@test.local',
      name: 'Praktikan Tiga',
      nim: '003',
      role: 'praktikan',
    },
  ];
  for (const user of extraUsers) await upsertUser(auth, user);

  const batch = db.batch();
  for (const user of extraUsers) {
    batch.set(db.collection('users').doc(user.uid), {
      name: user.name,
      nim: user.nim,
      email: user.email,
      role: user.role,
      isAdmin: Boolean(user.isAdmin),
      createdAt: now,
      updatedAt: now,
    });
  }

  batch.set(db.collection('classes').doc(IDS.classes.b), {
    name: 'IF-3B E2E',
    assistantId: IDS.users.asisten,
    createdAt: now,
    updatedAt: now,
  });
  batch.set(db.collection('enrollments').doc(`${IDS.classes.b}_${IDS.users.praktikan2}`), {
    classId: IDS.classes.b,
    userId: IDS.users.praktikan2,
    userName: 'Praktikan Dua',
    enrolledAt: now,
  });

  batch.set(db.collection('laboratories').doc(IDS.labs.b), {
    ...labData({ name: 'Lab B E2E', code: 'E2E-B', room: 'B101' }),
  });
  batch.set(db.collection('laboratories').doc(IDS.labs.inactive), {
    ...labData({ name: 'Lab C Nonaktif', code: 'E2E-C', room: 'C101', isActive: false }),
  });

  batch.set(
    db.collection('sessions').doc(IDS.sessions.scheduled),
    sessionData('scheduled', date, { title: 'Sesi Scheduled', startTime: '10:00', endTime: '12:00' }),
  );
  batch.set(
    db.collection('sessions').doc(IDS.sessions.scheduledNoLab),
    sessionData('scheduled', date, { title: 'Sesi Tanpa Lab', laboratoryId: '' }),
  );
  batch.set(
    db.collection('sessions').doc(IDS.sessions.tomorrow),
    sessionData('scheduled', tomorrow, {
      title: 'Sesi Besok',
      classId: IDS.classes.a,
      laboratoryId: IDS.labs.a,
      startTime: '08:00',
      endTime: '09:40',
    }),
  );
  batch.set(
    db.collection('sessions').doc(IDS.sessions.openNoLab),
    sessionData('open', date, { title: 'Sesi Open Tanpa Lab', laboratoryId: '' }),
  );
  batch.set(
    db.collection('sessions').doc(IDS.sessions.openInactiveLab),
    sessionData('open', date, {
      title: 'Sesi Open Lab Nonaktif',
      laboratoryId: IDS.labs.inactive,
    }),
  );
  for (const key of [
    'openDuplicate',
    'openAccuracy',
    'openRealtime',
    'openRecap',
    'openPermission',
  ]) {
    batch.set(
      db.collection('sessions').doc(IDS.sessions[key]),
      sessionData('open', date, {
        title: `Sesi ${key}`,
        ...(key === 'openRealtime' ? range : {}),
      }),
    );
  }
  batch.set(
    db.collection('sessions').doc(IDS.sessions.openKesan),
    sessionData('closed', date, { title: 'Sesi openKesan' }),
  );

  batch.set(
    db.collection('attendance').doc(`${IDS.sessions.openDuplicate}_${IDS.users.praktikan1}`),
    {
      sessionId: IDS.sessions.openDuplicate,
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
    },
  );
  for (const praktikan of [
    { uid: IDS.users.praktikan1, name: 'Praktikan Satu', nim: '001' },
    { uid: IDS.users.praktikan2, name: 'Praktikan Dua', nim: '002' },
  ]) {
    batch.set(
      db.collection('attendance').doc(`${IDS.sessions.openKesan}_${praktikan.uid}`),
      {
        sessionId: IDS.sessions.openKesan,
        userId: praktikan.uid,
        userName: praktikan.name,
        userNim: praktikan.nim,
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
      },
    );
  }

  batch.set(
    db.collection('permissionRequests').doc('e2e-permission-pending'),
    {
      sessionId: IDS.sessions.openRecap,
      userId: IDS.users.praktikan3,
      userName: 'Praktikan Tiga',
      reason: 'Sakit dan perlu istirahat (seed).',
      aiLabel: 'netral',
      status: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      createdAt: now,
    },
  );
  batch.set(
    db.collection('permissionRequests').doc('e2e-permission-approved'),
    {
      sessionId: IDS.sessions.closed,
      userId: IDS.users.praktikan2,
      userName: 'Praktikan Dua',
      reason: 'Kegiatan lomba di luar kampus.',
      aiLabel: 'positif',
      status: 'approved',
      reviewedBy: IDS.users.asisten,
      reviewedAt: now,
      createdAt: now,
    },
  );
  batch.set(
    db.collection('permissionRequests').doc('e2e-permission-rejected'),
    {
      sessionId: IDS.sessions.closed,
      userId: IDS.users.praktikan1,
      userName: 'Praktikan Satu',
      reason: 'Alasan yang tidak dapat diverifikasi.',
      aiLabel: 'negatif',
      status: 'rejected',
      reviewedBy: IDS.users.asisten,
      reviewedAt: now,
      createdAt: now,
    },
  );
  batch.set(
    db.collection('kesanPesan').doc(`${IDS.sessions.openKesan}_${IDS.users.praktikan2}`),
    {
      sessionId: IDS.sessions.openKesan,
      classId: IDS.classes.a,
      userId: IDS.users.praktikan2,
      userName: 'Praktikan Dua',
      text: 'Praktikum berjalan jelas dan asisten membantu.',
      aiLabel: 'positif',
      aiConfidence: 0.9,
      createdAt: now,
    },
  );
  for (const [id, action, collection, docId] of [
    ['e2e-audit-session-open', 'UPDATE', 'sessions', IDS.sessions.scheduled],
    ['e2e-audit-role', 'UPDATE', 'users', IDS.users.praktikan3],
  ]) {
    batch.set(db.collection('auditLogs').doc(id), {
      action,
      collection,
      docId,
      actorUid: IDS.users.asisten,
      actorRole: 'asisten',
      before: null,
      after: null,
      timestamp: now,
    });
  }

  await batch.commit();
  return { ...base, users: [...base.users, ...extraUsers], date, tomorrow };
}

async function createScenario(db, _auth, {
  prefix,
  now = new Date(),
  date = todayWIB(now),
} = {}) {
  void _auth; // auth disiapkan untuk skenario yang butuh user unik
  if (!prefix) throw new Error('prefix skenario wajib diisi');
  const range = currentTimeRange(now);
  const tomorrow = tomorrowWIB(now);
  const id = (suffix) => `${prefix}-${suffix}`;
  const scenario = {
    prefix,
    date,
    classId: id('class'),
    labId: id('lab'),
    secondLabId: id('lab-2'),
    inactiveLabId: id('lab-off'),
    openSessionId: id('session-open'),
    scheduledSessionId: id('session-scheduled'),
    scheduledNoLabSessionId: id('session-scheduled-nolab'),
    closedSessionId: id('session-closed'),
    noLabSessionId: id('session-nolab'),
    inactiveLabSessionId: id('session-inactive-lab'),
    paths: [],
  };

  const batch = db.batch();
  const track = (collection, docId, data) => {
    batch.set(db.collection(collection).doc(docId), data);
    scenario.paths.push(`${collection}/${docId}`);
  };

  track('laboratories', scenario.labId, labData({ name: `Lab ${prefix}`, code: 'UAT' }));
  track('laboratories', scenario.secondLabId, labData({
    name: `Lab ${prefix} 2`,
    code: 'UAT-2',
    room: 'B101',
  }));
  track('laboratories', scenario.inactiveLabId, labData({
    name: `Lab ${prefix} Off`,
    code: 'UAT-OFF',
    isActive: false,
  }));
  track('classes', scenario.classId, {
    name: `Kelas ${prefix}`,
    assistantId: IDS.users.asisten,
    createdAt: now,
    updatedAt: now,
  });
  track('enrollments', `${scenario.classId}_${IDS.users.praktikan1}`, {
    classId: scenario.classId,
    userId: IDS.users.praktikan1,
    userName: 'Praktikan Satu',
    enrolledAt: now,
  });

  const session = (status, overrides = {}) => ({
    classId: scenario.classId,
    laboratoryId: scenario.labId,
    title: `Sesi ${prefix}`,
    date,
    startTime: range.startTime,
    endTime: range.endTime,
    room: 'A201',
    assistantId: IDS.users.asisten,
    assistantName: 'Asisten Satu',
    status,
    ...overrides,
  });

  track('sessions', scenario.openSessionId, session('open'));
  track('sessions', scenario.scheduledSessionId, session('scheduled', {
    title: `Sesi ${prefix} Terjadwal`,
    date: tomorrow,
    startTime: '08:00',
    endTime: '10:00',
  }));
  track('sessions', scenario.scheduledNoLabSessionId, session('scheduled', {
    title: `Sesi ${prefix} Tanpa Lab`,
    date: tomorrow,
    startTime: '10:00',
    endTime: '12:00',
    laboratoryId: '',
  }));
  track('sessions', scenario.closedSessionId, session('closed'));
  track('sessions', scenario.noLabSessionId, session('open', { laboratoryId: '' }));
  track('sessions', scenario.inactiveLabSessionId, session('open', {
    laboratoryId: scenario.inactiveLabId,
  }));

  await batch.commit();
  return scenario;
}

async function cleanupScenario(db, scenario) {
  if (!scenario?.prefix) return;
  const sessionIds = [
    scenario.openSessionId,
    scenario.scheduledSessionId,
    scenario.scheduledNoLabSessionId,
    scenario.closedSessionId,
    scenario.noLabSessionId,
    scenario.inactiveLabSessionId,
  ].filter(Boolean);

  // Test menulis attendance, permission, dan kesan lewat helper; dokumen itu
  // tidak ada di scenario.paths. Hapus berdasarkan sessionId sebelum sesi.
  for (const collection of ['attendance', 'permissionRequests', 'kesanPesan']) {
    for (const sessionId of sessionIds) {
      const snapshot = await db
        .collection(collection)
        .where('sessionId', '==', sessionId)
        .get();
      if (snapshot.empty) continue;
      const batch = db.batch();
      for (const doc of snapshot.docs) batch.delete(doc.ref);
      await batch.commit();
    }
  }

  if (!scenario.paths?.length) return;
  for (let index = 0; index < scenario.paths.length; index += 400) {
    const batch = db.batch();
    for (const item of scenario.paths.slice(index, index + 400)) {
      const [collection, docId] = item.split('/');
      batch.delete(db.collection(collection).doc(docId));
    }
    await batch.commit();
  }
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
  currentTimeRange,
  tomorrowWIB,
  resetEmulator,
  seedFull,
  createScenario,
  cleanupScenario,
  labData,
};
