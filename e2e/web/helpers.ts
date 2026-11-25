import { expect, type Page } from '@playwright/test';
import { deleteApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import {
  getFirestore,
  type DocumentData,
  type Firestore,
} from 'firebase-admin/firestore';

export const E2E_PASSWORD = 'e2e-password';
const VERIFY_APP = 'e2e-verify';

let adminDb: Firestore | null = null;
let adminAuth: Auth | null = null;

export function getAdminDb(): Firestore {
  if (!adminDb) {
    const existing = getApps().find((app) => app.name === VERIFY_APP);
    const app = existing ?? initializeApp({ projectId: 'demo-ppk-e2e' }, VERIFY_APP);
    adminDb = getFirestore(app);
  }
  return adminDb;
}

export function getAdminAuth(): Auth {
  if (!adminAuth) {
    const existing = getApps().find((app) => app.name === VERIFY_APP);
    const app = existing ?? initializeApp({ projectId: 'demo-ppk-e2e' }, VERIFY_APP);
    adminAuth = getAuth(app);
  }
  return adminAuth;
}

export async function closeAdminDb(): Promise<void> {
  const apps = getApps().filter((app) => app.name === VERIFY_APP);
  await Promise.all(apps.map((app) => deleteApp(app)));
  adminDb = null;
  adminAuth = null;
}

export async function getDocByPath(path: string): Promise<DocumentData | null> {
  const snapshot = await getAdminDb().doc(path).get();
  return snapshot.data() ?? null;
}

export async function getClass(id: string) {
  return getDocByPath(`classes/${id}`);
}

export async function getClassByName(name: string) {
  const snapshot = await getAdminDb()
    .collection('classes')
    .where('name', '==', name)
    .get();
  const doc = snapshot.docs[0];
  return doc ? { id: doc.id, ...doc.data() } : null;
}

export async function getLab(id: string) {
  return getDocByPath(`laboratories/${id}`);
}

export async function getLabByName(name: string) {
  const snapshot = await getAdminDb()
    .collection('laboratories')
    .where('name', '==', name)
    .get();
  const doc = snapshot.docs[0];
  return doc ? { id: doc.id, ...doc.data() } : null;
}

export async function getSession(id: string) {
  return getDocByPath(`sessions/${id}`);
}

export async function getEnrollment(id: string) {
  return getDocByPath(`enrollments/${id}`);
}

export async function getKesan(sessionId: string, uid: string) {
  return getDocByPath(`kesanPesan/${sessionId}_${uid}`);
}

export async function getAuditLogs(collection: string, docId: string) {
  const snapshot = await getAdminDb()
    .collection('auditLogs')
    .where('collection', '==', collection)
    .get();
  return snapshot.docs
    .map((doc): DocumentData & { id: string } => ({ id: doc.id, ...doc.data() }))
    .filter((log) => log.docId === docId);
}

export async function setSessionStatus(sessionId: string, status: string) {
  await getAdminDb().collection('sessions').doc(sessionId).update({ status });
}

export async function setLabActive(labId: string, isActive: boolean) {
  await getAdminDb().collection('laboratories').doc(labId).update({ isActive });
}

export async function seedAttendance(
  sessionId: string,
  uid: string,
  overrides: Record<string, unknown> = {},
) {
  await getAdminDb()
    .collection('attendance')
    .doc(`${sessionId}_${uid}`)
    .set({
      sessionId,
      userId: uid,
      userName: 'Praktikan Satu',
      userNim: '001',
      recordedAt: new Date(),
      latitude: -7.0519,
      longitude: 110.4383,
      accuracyMeters: 10,
      distanceMeters: 0,
      radiusMeters: 100,
      laboratoryId: 'e2e-lab',
      locationVerifiedAt: new Date(),
      mocked: false,
      source: 'location',
      ...overrides,
    });
}

export async function register(
  page: Page,
  input: { name: string; nim: string; email: string; password?: string },
) {
  const password = input.password ?? E2E_PASSWORD;
  await page.goto('/register');
  await page.getByPlaceholder('Nama sesuai absen').fill(input.name);
  await page.getByPlaceholder('Contoh: 231511001').fill(input.nim);
  await page.getByPlaceholder('nama@email.com').fill(input.email);
  await page.getByPlaceholder('Minimal 6 karakter').fill(password);
  await page.getByPlaceholder('Ulangi password').fill(password);
  await page.getByRole('button', { name: 'Daftar' }).click();
}

export async function login(
  page: Page,
  email: string,
  password: string = E2E_PASSWORD,
): Promise<void> {
  await page.goto('/login');
  await page.getByPlaceholder('nama@email.com').fill(email);
  await page.getByPlaceholder('Minimal 6 karakter').fill(password);
  await page.getByRole('button', { name: 'Masuk' }).click();
}

export const loginAs = login;

export async function logout(page: Page): Promise<void> {
  await page.goto('/profil');
  await page.getByRole('button', { name: 'Keluar dari akun' }).click();
  await page.getByText('Ya', { exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
}

export async function waitForPraktikanHome(page: Page): Promise<void> {
  await expect(page.getByText('Daftar sesi')).toBeVisible();
}

export async function waitForAsistenHome(page: Page): Promise<void> {
  await expect(page.getByText('MENU', { exact: true })).toBeVisible();
}

export async function openPresensi(page: Page, sessionId: string): Promise<void> {
  await page.goto(`/praktikan/presensi/${sessionId}`);
  await expect(page.getByText('Presensi', { exact: true })).toBeVisible();
}

export async function deleteAttendance(
  sessionId: string,
  uid: string,
): Promise<void> {
  await getAdminDb().collection('attendance').doc(`${sessionId}_${uid}`).delete();
}

export async function getAttendance(
  sessionId: string,
  uid: string,
): Promise<DocumentData | null> {
  const snapshot = await getAdminDb()
    .collection('attendance')
    .doc(`${sessionId}_${uid}`)
    .get();
  return snapshot.data() ?? null;
}

export async function getSessionByTitle(
  title: string,
): Promise<(DocumentData & { id: string }) | null> {
  const snapshot = await getAdminDb()
    .collection('sessions')
    .where('title', '==', title)
    .get();
  return snapshot.docs[0]
    ? { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
    : null;
}

export async function getPermissionByReason(
  reason: string,
): Promise<DocumentData | undefined> {
  const snapshot = await getAdminDb()
    .collection('permissionRequests')
    .where('reason', '==', reason)
    .get();
  return snapshot.docs[0]?.data();
}
