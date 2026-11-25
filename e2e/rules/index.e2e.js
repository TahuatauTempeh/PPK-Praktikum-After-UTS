const fs = require('fs');
const path = require('path');
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require('@firebase/rules-unit-testing');
const {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} = require('firebase/firestore');

const RULES = path.join(__dirname, '../../firestore.rules');
const EXPECTED_SCENARIOS = 20;
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
const [host, portText] = emulatorHost.split(':');
const port = Number(portText ?? 8080);

function validAttendance(sessionId, overrides = {}) {
  return {
    sessionId,
    userId: 'p1',
    userName: 'Praktikan Satu',
    userNim: '001',
    recordedAt: serverTimestamp(),
    latitude: -7.0519,
    longitude: 110.4383,
    accuracyMeters: 12,
    distanceMeters: 0,
    radiusMeters: 100,
    laboratoryId: 'lab-a',
    locationVerifiedAt: serverTimestamp(),
    mocked: false,
    source: 'location',
    ...overrides,
  };
}

(async () => {
  const testEnv = await initializeTestEnvironment({
    projectId: 'demo-ppk-rules',
    firestore: {
      host,
      port,
      rules: fs.readFileSync(RULES, 'utf8'),
    },
  });

  try {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      const users = [
        ['p1', { name: 'Praktikan Satu', nim: '001', role: 'praktikan', isAdmin: false }],
        ['p2', { name: 'Praktikan Dua', nim: '002', role: 'praktikan', isAdmin: false }],
        ['a1', { name: 'Asisten Satu', nim: 'A01', role: 'asisten', isAdmin: false }],
      ];
      for (const [uid, data] of users) {
        await setDoc(doc(db, 'users', uid), data);
      }

      await setDoc(doc(db, 'classes', 'c1'), { name: 'IF-3A', assistantId: 'a1' });
      await setDoc(doc(db, 'enrollments', 'c1_p1'), { classId: 'c1', userId: 'p1' });
      await setDoc(doc(db, 'enrollments', 'c1_p2'), { classId: 'c1', userId: 'p2' });
      await setDoc(doc(db, 'laboratories', 'lab-a'), {
        name: 'Lab A201',
        isActive: true,
        latitude: -7.0519,
        longitude: 110.4383,
        radiusMeters: 100,
      });
      await setDoc(doc(db, 'sessions', 's1'), {
        classId: 'c1', laboratoryId: 'lab-a', status: 'open',
      });
      await setDoc(doc(db, 'sessions', 's2'), {
        classId: 'c1', laboratoryId: 'lab-a', status: 'open',
      });
      await setDoc(doc(db, 'sessions', 's3'), {
        classId: 'c1', laboratoryId: 'lab-a', status: 'scheduled',
      });
      await setDoc(doc(db, 'sessions', 's4'), {
        classId: 'c2', laboratoryId: 'lab-a', status: 'open',
      });
      for (const id of ['s5', 's6', 's7', 's8', 's9']) {
        await setDoc(doc(db, 'sessions', id), {
          classId: 'c1', laboratoryId: 'lab-a', status: 'open',
        });
      }

      await setDoc(doc(db, 'attendance', 's1_p1'), {
        sessionId: 's1',
        userId: 'p1',
        userName: 'Praktikan Satu',
        userNim: '001',
      });
      await setDoc(doc(db, 'attendance', 's1_p2'), {
        sessionId: 's1',
        userId: 'p2',
        userName: 'Praktikan Dua',
        userNim: '002',
      });
      await setDoc(doc(db, 'notificationState', 'sessions'), { docs: {} });
    });

    const p1 = testEnv.authenticatedContext('p1').firestore();
    const a1 = testEnv.authenticatedContext('a1').firestore();

    const hasil = [];
    async function cek(name, fn) {
      try {
        await fn();
        hasil.push([name, 'PASS']);
      } catch (error) {
        hasil.push([name, `FAIL: ${error.code || error.message}`]);
      }
    }

    await cek('praktikan membaca presensinya sendiri', () =>
      assertSucceeds(getDoc(doc(p1, 'attendance', 's1_p1'))));
    await cek('praktikan tidak membaca presensi praktikan lain', () =>
      assertFails(getDoc(doc(p1, 'attendance', 's1_p2'))));
    await cek('asisten membaca presensi praktikan', () =>
      assertSucceeds(getDoc(doc(a1, 'attendance', 's1_p2'))));
    await cek('praktikan tidak membaca seluruh koleksi attendance', () =>
      assertFails(getDocs(collection(p1, 'attendance'))));
    await cek('praktikan membaca query miliknya sendiri', () =>
      assertSucceeds(getDocs(query(
        collection(p1, 'attendance'),
        where('userId', '==', 'p1')
      ))));
    await cek('asisten membaca seluruh koleksi attendance', () =>
      assertSucceeds(getDocs(collection(a1, 'attendance'))));

    await cek('praktikan membuat presensi valid di sesi open', () =>
      assertSucceeds(setDoc(doc(p1, 'attendance', 's2_p1'), validAttendance('s2'))));

    const tanpaJarak = validAttendance('s5');
    delete tanpaJarak.distanceMeters;
    await cek('create tanpa bukti lokasi ditolak', () =>
      assertFails(setDoc(doc(p1, 'attendance', 's5_p1'), tanpaJarak)));
    await cek('akurasi di atas 100 m ditolak', () =>
      assertFails(setDoc(doc(p1, 'attendance', 's6_p1'), validAttendance('s6', {
        accuracyMeters: 150,
      }))));
    await cek('mock location ditolak', () =>
      assertFails(setDoc(doc(p1, 'attendance', 's7_p1'), validAttendance('s7', {
        mocked: true,
      }))));
    await cek('jarak di luar radius ditolak', () =>
      assertFails(setDoc(doc(p1, 'attendance', 's8_p1'), validAttendance('s8', {
        distanceMeters: 150,
      }))));
    await cek('radius yang tidak sama dengan lab ditolak', () =>
      assertFails(setDoc(doc(p1, 'attendance', 's9_p1'), validAttendance('s9', {
        radiusMeters: 200,
      }))));
    await cek('create untuk user lain ditolak', () =>
      assertFails(setDoc(doc(p1, 'attendance', 's5_p2'), validAttendance('s5', {
        userId: 'p2',
      }))));
    await cek('create pada sesi scheduled ditolak', () =>
      assertFails(setDoc(doc(p1, 'attendance', 's3_p1'), validAttendance('s3'))));
    await cek('create tanpa enrollment ditolak', () =>
      assertFails(setDoc(doc(p1, 'attendance', 's4_p1'), validAttendance('s4'))));
    await cek('create ganda ditolak', () =>
      assertFails(setDoc(doc(p1, 'attendance', 's1_p1'), validAttendance('s1'))));
    await cek('praktikan tidak dapat mengubah presensi', () =>
      assertFails(updateDoc(doc(p1, 'attendance', 's1_p1'), {
        userName: 'Diubah',
      })));
    await cek('asisten dapat mengubah presensi', () =>
      assertSucceeds(updateDoc(doc(a1, 'attendance', 's1_p1'), {
        userName: 'Diubah Asisten',
      })));
    await cek('praktikan tidak membaca baseline notifikasi', () =>
      assertFails(getDoc(doc(p1, 'notificationState', 'sessions'))));
    await cek('asisten tidak menulis baseline notifikasi', () =>
      assertFails(setDoc(doc(a1, 'notificationState', 'sessions'), { docs: {} })));

    for (const [name, status] of hasil) {
      console.log(`${status}  ${name}`);
    }
    if (hasil.length !== EXPECTED_SCENARIOS) {
      console.error(
        `Expected ${EXPECTED_SCENARIOS} scenarios, ran ${hasil.length}`
      );
      process.exitCode = 1;
    }
    const gagal = hasil.filter(([, status]) => status.startsWith('FAIL'));
    if (gagal.length) process.exitCode = 1;
  } finally {
    await testEnv.cleanup();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
