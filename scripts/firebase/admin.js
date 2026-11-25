#!/usr/bin/env node
'use strict';

/**
 * Alat admin untuk project Firebase produksi (bukan emulator).
 *
 * Perintah:
 *   node scripts/firebase/admin.js inspect
 *   node scripts/firebase/admin.js backup
 *   node scripts/firebase/admin.js reset --confirm <projectId>
 *   node scripts/firebase/admin.js seed --class-name "<nama kelas>" --confirm <projectId>
 *   node scripts/firebase/admin.js verify
 *
 * Kredensial: GOOGLE_APPLICATION_CREDENTIALS harus menunjuk ke service account
 * key (Firebase Console -> Project settings -> Service accounts). Key tidak
 * boleh disimpan di dalam repo.
 *
 * Perintah reset dan seed bersifat merusak dan selalu meminta --confirm yang
 * nilainya harus sama dengan project id. Project demo- ditolak di sini; project
 * demo hanya boleh disentuh lewat e2e/shared/seed.js.
 */

const fs = require('node:fs');
const path = require('node:path');

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const ROOT = path.resolve(__dirname, '../..');
const DEFAULT_PROJECT_ID = 'praktikum-ppk-3';
const BACKUP_ROOT =
  process.env.PPK_BACKUP_DIR ?? path.join(process.env.HOME ?? '.', 'ppk-backups');

const KEEP_LABS = ['Lab B', 'Lab C', 'Lab D'];

// ─── Argumen dan lingkungan ──────────────────────────────────────────────────

function loadEnv() {
  try {
    process.loadEnvFile(path.join(ROOT, '.env'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const flags = {};
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith('--')) throw new Error(`Argumen tidak dikenal: ${token}`);
    const key = token.slice(2);
    const next = rest[i + 1];
    if (!next || next.startsWith('--')) {
      flags[key] = true;
    } else {
      flags[key] = next;
      i += 1;
    }
  }
  return { command, flags };
}

function resolveConfig(flags) {
  const projectId =
    flags.project ?? process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? DEFAULT_PROJECT_ID;
  const keyPath = flags.key ?? process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!keyPath) {
    throw new Error(
      'GOOGLE_APPLICATION_CREDENTIALS belum diisi. Arahkan ke service account key di luar repo.',
    );
  }
  if (!fs.existsSync(keyPath)) throw new Error(`Service account key tidak ditemukan: ${keyPath}`);

  const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  if (credentials.type !== 'service_account') {
    throw new Error('File kredensial bukan service account key.');
  }
  if (credentials.project_id !== projectId) {
    throw new Error(
      `Key milik project ${credentials.project_id}, bukan ${projectId}. Hentikan.`,
    );
  }

  return { projectId, credentials };
}

function initAdmin(credentials, projectId) {
  return initializeApp({ credential: cert(credentials), projectId }, `ppk-admin-${Date.now()}`);
}

function requireDestructiveConfirmation(flags, projectId) {
  if (projectId.startsWith('demo-')) {
    throw new Error('Project demo- ditolak. Gunakan e2e/shared/seed.js untuk emulator.');
  }
  if (flags.confirm !== projectId) {
    throw new Error(
      `Perintah ini menghapus/menulis data nyata. Tambahkan --confirm ${projectId} bila yakin.`,
    );
  }
}

// ─── Serialisasi ─────────────────────────────────────────────────────────────

function encode(value) {
  if (value instanceof Timestamp) {
    return {
      __type: 'timestamp',
      seconds: value.seconds,
      nanoseconds: value.nanoseconds,
      iso: value.toDate().toISOString(),
    };
  }
  if (Array.isArray(value)) return value.map(encode);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encode(v)]));
  }
  return value;
}

function decode(value) {
  if (value && typeof value === 'object') {
    if (value.__type === 'timestamp') {
      return new Timestamp(value.seconds, value.nanoseconds);
    }
    if (Array.isArray(value)) return value.map(decode);
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, decode(v)]));
  }
  return value;
}

function authUserSummary(user) {
  return {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    disabled: user.disabled,
    emailVerified: user.emailVerified,
    providers: user.providerData.map((provider) => provider.providerId),
    createdAt: user.metadata.creationTime ?? null,
    lastSignInAt: user.metadata.lastSignInTime ?? null,
    customClaims: user.customClaims ?? null,
  };
}

// ─── Utilitas waktu WIB ──────────────────────────────────────────────────────

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

function tomorrowWIB(now = new Date()) {
  return todayWIB(new Date(now.getTime() + 24 * 60 * 60 * 1000));
}

function timeRangeWIB(now, offsetStartMinutes, offsetEndMinutes) {
  const format = (offset) =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(now.getTime() + offset * 60 * 1000));
  return { startTime: format(offsetStartMinutes), endTime: format(offsetEndMinutes) };
}

// ─── Perintah: inspect ──────────────────────────────────────────────────────

async function inspect(db, auth) {
  console.log('=== JUMLAH DOKUMEN ===');
  const collections = await db.listCollections();
  for (const col of [...collections].sort((a, b) => a.id.localeCompare(b.id))) {
    const count = (await col.count().get()).data().count;
    console.log(`${col.id.padEnd(22)} ${count}`);
  }

  console.log('\n=== LABORATORIUM ===');
  for (const doc of (await db.collection('laboratories').get()).docs) {
    const data = doc.data();
    console.log(
      JSON.stringify({
        id: doc.id,
        name: data.name,
        code: data.code,
        room: data.room,
        latitude: data.latitude,
        longitude: data.longitude,
        radiusMeters: data.radiusMeters,
        isActive: data.isActive,
      }),
    );
  }

  console.log('\n=== AKUN AUTH ===');
  let pageToken;
  let total = 0;
  do {
    const page = await auth.listUsers(1000, pageToken);
    for (const user of page.users) {
      console.log(JSON.stringify({ uid: user.uid, email: user.email, disabled: user.disabled }));
    }
    total += page.users.length;
    pageToken = page.pageToken;
  } while (pageToken);
  console.log(`total akun: ${total}`);
}

// ─── Perintah: backup ───────────────────────────────────────────────────────

async function backup(db, auth, projectId) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(BACKUP_ROOT, projectId, stamp);
  fs.mkdirSync(dir, { recursive: true });

  const manifest = {
    projectId,
    createdAt: new Date().toISOString(),
    collections: {},
    authUsers: 0,
  };

  for (const col of await db.listCollections()) {
    const snapshot = await col.get();
    const rows = snapshot.docs.map((doc) => ({ id: doc.id, data: encode(doc.data()) }));
    fs.writeFileSync(path.join(dir, `${col.id}.json`), JSON.stringify(rows, null, 2));
    manifest.collections[col.id] = rows.length;
  }

  const users = [];
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    users.push(...page.users.map(authUserSummary));
    pageToken = page.pageToken;
  } while (pageToken);
  fs.writeFileSync(path.join(dir, 'auth-users.json'), JSON.stringify(users, null, 2));
  manifest.authUsers = users.length;

  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return { dir, manifest };
}

// ─── Perintah: reset ────────────────────────────────────────────────────────

async function reset(db, auth) {
  const deleted = {};

  for (const col of await db.listCollections()) {
    const count = (await col.count().get()).data().count;
    await db.recursiveDelete(col);
    deleted[col.id] = count;
  }

  const uids = [];
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    uids.push(...page.users.map((user) => user.uid));
    pageToken = page.pageToken;
  } while (pageToken);

  let deletedAuth = 0;
  for (let i = 0; i < uids.length; i += 1000) {
    const result = await auth.deleteUsers(uids.slice(i, i + 1000));
    deletedAuth += result.successCount;
    if (result.failureCount > 0) {
      throw new Error(
        `Gagal menghapus ${result.failureCount} akun Auth: ${JSON.stringify(result.errors)}`,
      );
    }
  }

  const remainingDocs = (await db.listCollections()).length;
  const remainingAuth = (await auth.listUsers(1)).users.length;

  return { deleted, deletedAuth, remainingDocs, remainingAuth };
}

// ─── Perintah: seed ─────────────────────────────────────────────────────────

function findLatestBackup(projectId) {
  const base = path.join(BACKUP_ROOT, projectId);
  if (!fs.existsSync(base)) throw new Error(`Folder backup tidak ada: ${base}`);
  const entries = fs
    .readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  if (entries.length === 0) throw new Error(`Belum ada backup di ${base}`);
  return path.join(base, entries[entries.length - 1]);
}

function loadLabs(backupDir) {
  const file = path.join(backupDir, 'laboratories.json');
  if (!fs.existsSync(file)) throw new Error(`File backup lab tidak ada: ${file}`);
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  const selected = rows
    .filter((row) => KEEP_LABS.includes(row.data?.name))
    .map((row) => ({ id: row.id, data: decode(row.data) }));
  const missing = KEEP_LABS.filter((name) => !selected.some((row) => row.data?.name === name));
  if (missing.length > 0) {
    throw new Error(`Lab berikut tidak ditemukan di backup: ${missing.join(', ')}`);
  }
  return selected;
}

function countName(labs, name) {
  const lab = labs.find((row) => row.data?.name === name);
  if (!lab) throw new Error(`Lab ${name} tidak ada di backup`);
  return lab;
}

async function seed(db, auth, { projectId, classLabel, backupDir }) {
  const password = process.env.TESTING_PASSWORD;
  if (!password) throw new Error('TESTING_PASSWORD kosong. Isi di .env sebelum seed.');

  const labsBackup = loadLabs(backupDir);
  const now = new Date();
  const dateToday = todayWIB(now);
  const dateTomorrow = tomorrowWIB(now);
  const openRange = timeRangeWIB(now, -30, 60);

  const accounts = [
    {
      email: 'asisten-admin@test.com',
      name: 'Admin Praktikum',
      nim: 'ADM-01',
      role: 'asisten',
      isAdmin: true,
    },
    {
      email: 'asisten@test.com',
      name: 'Asisten Praktikum',
      nim: 'A-01',
      role: 'asisten',
      isAdmin: false,
    },
    {
      email: 'praktikan@test.com',
      name: 'Praktikan Contoh',
      nim: '231511001',
      role: 'praktikan',
      isAdmin: false,
    },
  ];

  const created = [];
  for (const account of accounts) {
    const user = await auth.createUser({
      email: account.email,
      password,
      displayName: account.name,
      emailVerified: true,
    });
    created.push({ ...account, uid: user.uid });
  }

  const admin = created.find((user) => user.isAdmin);
  const assistant = created.find((user) => !user.isAdmin && user.role === 'asisten');
  const praktikan = created.find((user) => user.role === 'praktikan');

  const labD = countName(labsBackup, 'Lab D');
  const labB = countName(labsBackup, 'Lab B');

  const classId = 'ppk-class-1';
  const sessions = {
    open: 'ppk-session-open',
    closed: 'ppk-session-closed',
    scheduled: 'ppk-session-scheduled',
  };
  const attendanceId = `${sessions.closed}_${praktikan.uid}`;

  const batch = db.batch();

  for (const account of created) {
    batch.set(db.collection('users').doc(account.uid), {
      name: account.name,
      nim: account.nim,
      email: account.email,
      role: account.role,
      isAdmin: account.isAdmin,
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const row of labsBackup) {
    const original = row.data;
    batch.set(db.collection('laboratories').doc(row.id), {
      name: original.name,
      code: original.code,
      building: original.building ?? '',
      floor: original.floor ?? '',
      room: original.room ?? '',
      latitude: original.latitude,
      longitude: original.longitude,
      radiusMeters: original.radiusMeters,
      description: original.description ?? '',
      isActive: original.isActive === true,
      createdAt: original.createdAt ?? now,
      updatedAt: now,
      updatedBy: assistant.uid,
    });
  }

  batch.set(db.collection('classes').doc(classId), {
    name: classLabel,
    description: 'Kelas praktikum Pengembangan Platform Khusus.',
    assistantId: assistant.uid,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(db.collection('enrollments').doc(`${classId}_${praktikan.uid}`), {
    classId,
    userId: praktikan.uid,
    userName: praktikan.name,
    enrolledAt: now,
  });

  batch.set(db.collection('sessions').doc(sessions.open), {
    classId,
    title: 'Pertemuan 3: Integrasi Firebase',
    date: dateToday,
    startTime: openRange.startTime,
    endTime: openRange.endTime,
    room: labD.data.room,
    assistantId: assistant.uid,
    assistantName: assistant.name,
    status: 'open',
    laboratoryId: labD.id,
    createdAt: now,
  });

  batch.set(db.collection('sessions').doc(sessions.closed), {
    classId,
    title: 'Pertemuan 2: Komponen dan Navigasi',
    date: dateToday,
    startTime: '08:00',
    endTime: '10:00',
    room: labD.data.room,
    assistantId: assistant.uid,
    assistantName: assistant.name,
    status: 'closed',
    laboratoryId: labD.id,
    createdAt: now,
  });

  batch.set(db.collection('sessions').doc(sessions.scheduled), {
    classId,
    title: 'Pertemuan 4: Pengujian dan Rilis',
    date: dateTomorrow,
    startTime: '08:00',
    endTime: '10:00',
    room: labB.data.room,
    assistantId: assistant.uid,
    assistantName: assistant.name,
    status: 'scheduled',
    laboratoryId: labB.id,
    createdAt: now,
  });

  batch.set(db.collection('attendance').doc(attendanceId), {
    sessionId: sessions.closed,
    userId: praktikan.uid,
    userName: praktikan.name,
    userNim: praktikan.nim,
    recordedAt: now,
    latitude: labD.data.latitude,
    longitude: labD.data.longitude,
    accuracyMeters: 10,
    distanceMeters: 0,
    radiusMeters: labD.data.radiusMeters,
    laboratoryId: labD.id,
    locationVerifiedAt: now,
    mocked: false,
    source: 'location',
  });

  batch.set(db.collection('permissionRequests').doc('ppk-permission-pending'), {
    sessionId: sessions.scheduled,
    userId: praktikan.uid,
    userName: praktikan.name,
    reason: 'Ada kegiatan lomba di luar kampus pada jam praktikum.',
    aiLabel: 'netral',
    aiConfidence: 0.62,
    status: 'pending',
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
    createdAt: now,
  });

  batch.set(db.collection('kesanPesan').doc(attendanceId), {
    sessionId: sessions.closed,
    classId,
    userId: praktikan.uid,
    userName: praktikan.name,
    text: 'Materi jelas dan asisten membantu saat praktikum berlangsung.',
    aiLabel: 'positif',
    aiConfidence: 0.91,
    createdAt: now,
  });

  const auditEntries = [
    {
      action: 'CREATE',
      collection: 'classes',
      docId: classId,
      actorUid: assistant.uid,
      actorRole: 'asisten',
      before: null,
      after: { name: classLabel },
    },
    {
      action: 'CREATE',
      collection: 'sessions',
      docId: sessions.open,
      actorUid: assistant.uid,
      actorRole: 'asisten',
      before: null,
      after: { title: 'Pertemuan 3: Integrasi Firebase' },
    },
    {
      action: 'UPDATE',
      collection: 'sessions',
      docId: sessions.open,
      actorUid: assistant.uid,
      actorRole: 'asisten',
      before: { status: 'scheduled' },
      after: { status: 'open' },
    },
  ];
  auditEntries.forEach((entry, index) => {
    batch.set(db.collection('auditLogs').doc(), {
      ...entry,
      timestamp: new Date(now.getTime() - (auditEntries.length - index) * 60 * 1000),
    });
  });

  await batch.commit();

  return {
    projectId,
    classId,
    classLabel,
    accounts: created.map(({ email, role, isAdmin }) => ({ email, role, isAdmin })),
    labs: labsBackup.map((row) => ({ id: row.id, name: row.data.name })),
    sessions,
    attendanceId,
  };
}

// ─── Perintah: verify ───────────────────────────────────────────────────────

async function verify(db, auth) {
  const problems = [];

  const collections = await db.listCollections();
  const counts = {};
  for (const col of collections) {
    counts[col.id] = (await col.count().get()).data().count;
  }

  const users = await db.collection('users').get();
  const roles = users.docs.map((doc) => doc.data().role);
  if (users.size !== 3) problems.push(`users berisi ${users.size} dokumen, seharusnya 3`);
  if (!users.docs.some((doc) => doc.data().isAdmin === true)) problems.push('tidak ada admin');
  if (roles.filter((role) => role === 'asisten').length !== 2) problems.push('asisten bukan 2');

  const labs = await db.collection('laboratories').get();
  if (labs.size !== 3) problems.push(`laboratories berisi ${labs.size} dokumen, seharusnya 3`);
  const activeLabs = new Set(
    labs.docs.filter((doc) => doc.data().isActive === true).map((doc) => doc.id),
  );

  const sessions = await db.collection('sessions').get();
  for (const doc of sessions.docs) {
    const session = doc.data();
    if (!activeLabs.has(session.laboratoryId)) {
      problems.push(`sesi ${doc.id} merujuk lab tidak aktif/tidak ada: ${session.laboratoryId}`);
    }
    if (!['scheduled', 'open', 'closed'].includes(session.status)) {
      problems.push(`sesi ${doc.id} status tidak valid: ${session.status}`);
    }
  }

  const enrollments = await db.collection('enrollments').get();
  const praktikan = users.docs.find((doc) => doc.data().role === 'praktikan');
  if (!praktikan) {
    problems.push('tidak ada praktikan');
  } else {
    const enrolled = enrollments.docs.some(
      (doc) =>
        doc.id === `${doc.data().classId}_${praktikan.id}` && doc.data().userId === praktikan.id,
    );
    if (!enrolled) problems.push('praktikan tidak terdaftar di kelas');
  }

  const attendance = await db.collection('attendance').get();
  for (const doc of attendance.docs) {
    const record = doc.data();
    if (!doc.id.startsWith(`${record.sessionId}_${record.userId}`)) {
      problems.push(`ID attendance tidak sesuai pola: ${doc.id}`);
    }
  }

  const kesan = await db.collection('kesanPesan').get();
  for (const doc of kesan.docs) {
    const record = doc.data();
    if (!doc.id.startsWith(`${record.sessionId}_${record.userId}`)) {
      problems.push(`ID kesanPesan tidak sesuai pola: ${doc.id}`);
    }
  }

  const authUsers = [];
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    authUsers.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);
  if (authUsers.length !== 3) problems.push(`Auth berisi ${authUsers.length} akun, seharusnya 3`);

  const emails = new Set(authUsers.map((user) => user.email));
  for (const expected of [
    'asisten-admin@test.com',
    'asisten@test.com',
    'praktikan@test.com',
  ]) {
    if (!emails.has(expected)) problems.push(`akun Auth ${expected} tidak ada`);
  }

  console.log('=== JUMLAH DOKUMEN ===');
  for (const [id, count] of Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))) {
    console.log(`${id.padEnd(22)} ${count}`);
  }
  console.log(`\nAuth akun: ${authUsers.length}`);
  console.log(`Sesi: ${sessions.size}, presensi: ${attendance.size}, kesan: ${kesan.size}`);

  if (problems.length > 0) {
    console.log('\n=== MASALAH ===');
    problems.forEach((problem) => console.log(`- ${problem}`));
    return false;
  }
  console.log('\nVerifikasi lolos: semua referensi konsisten.');
  return true;
}

// ─── Entry point ────────────────────────────────────────────────────────────

async function main() {
  loadEnv();
  const { command, flags } = parseArgs(process.argv.slice(2));
  if (!command) {
    console.log('Perintah: inspect | backup | reset | seed | verify');
    process.exit(1);
  }

  const { projectId, credentials } = resolveConfig(flags);
  const app = initAdmin(credentials, projectId);
  const db = getFirestore(app);
  const auth = getAuth(app);

  try {
    if (command === 'inspect') {
      await inspect(db, auth);
    } else if (command === 'backup') {
      const result = await backup(db, auth, projectId);
      console.log(`Backup tersimpan: ${result.dir}`);
      console.log(JSON.stringify(result.manifest, null, 2));
    } else if (command === 'reset') {
      requireDestructiveConfirmation(flags, projectId);
      const result = await reset(db, auth);
      console.log(JSON.stringify(result, null, 2));
    } else if (command === 'seed') {
      requireDestructiveConfirmation(flags, projectId);
      if (!flags['class-name']) {
        throw new Error('Tambahkan --class-name "<mata kuliah> <kode lab>".');
      }
      const backupDir = flags.backup ? path.resolve(flags.backup) : findLatestBackup(projectId);
      const result = await seed(db, auth, {
        projectId,
        classLabel: flags['class-name'],
        backupDir,
      });
      console.log(JSON.stringify(result, null, 2));
    } else if (command === 'verify') {
      const ok = await verify(db, auth);
      if (!ok) process.exitCode = 1;
    } else {
      throw new Error(`Perintah tidak dikenal: ${command}`);
    }
  } finally {
    await app.delete();
  }
}

main().catch((error) => {
  console.error(`GAGAL: ${error.message}`);
  process.exit(1);
});
