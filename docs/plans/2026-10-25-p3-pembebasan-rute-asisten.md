# Pembebasan Rute Asisten (P3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended), executing-plans, or dispatching-parallel-agents (for independent wave tasks) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pindahkan rute asisten ke `/asisten`, `/asisten/rekap`, dan `/asisten/sesi/[id]`, lalu cabut seluruh alur tambah sesi.

**Architecture:** Empat berkas rute dipindahkan dengan `git mv` ke bawah `src/app/asisten/`. Bar bawah buatan sendiri tetap dipakai, hanya literal path yang diganti. Sumber data tetap `AssistantPreviewProvider`; context bersama P1 menyusul. Alur tambah sesi dicabut lebih dulu supaya setiap commit tetap hijau.

**Tech Stack:** Expo SDK 58, Expo Router, React Native 0.88, TypeScript 6, typed routes.

## Global Constraints

- Jangan mengubah `src/app/_layout.tsx`. Itu milik Programmer 1.
- Jangan mengubah data dummy di `src/screens/asisten/schedule-data.ts` dan `recap-data.ts`.
- Satu-satunya sentuhan ke folder Programmer 1: menghapus `src/components/app-tabs.tsx` dan `src/components/app-tabs.web.tsx`.
- Tidak ada `Co-Authored-By` atau atribusi AI pada commit.
- Shell sesi ini zsh: kutip setiap path yang mengandung `[id]` atau `(tabs)`.
- Jalankan semua perintah dari akar repo.
- Typed routes wajib diregenerasi sebelum `tsc` saat rute dipindah atau ditambah. Saat hanya menghapus satu rute, entri lama yang tak terpakai tidak menggagalkan `tsc`, jadi regenerasi tidak wajib.
- Rute akhir yang benar: `/asisten`, `/asisten/rekap`, `/asisten/sesi/[id]`. Rute `/` dibiarkan kosong.
- Verifikasi memakai perintah nyata dari spec §7, bukan asumsi.

## Execution Order

- **Wave 1 (sequential):** Task 1 — cabut alur tambah sesi. Tidak ada blocker.
- **Wave 2 (sequential):** Task 2 — pindahkan rute. Blocked by Task 1.
- **Wave 3 (sequential):** Task 3 — smoke test native. Blocked by Task 2.

Tidak ada tugas paralel. Semua tugas menyentuh berkas yang sama atau bergantung pada hasil tugas sebelumnya.

## File Structure

| Berkas | Tanggung jawab setelah plan |
|---|---|
| `src/app/asisten/(tabs)/_layout.tsx` | Stack dan bar bawah; memetakan `/asisten` dan `/asisten/rekap` |
| `src/app/asisten/(tabs)/index.tsx` | Rute jadwal asisten; meneruskan `onManage` ke detail |
| `src/app/asisten/(tabs)/rekap.tsx` | Rute rekap; meneruskan `initialSessionId` dan `onDetail` |
| `src/app/asisten/sesi/[id].tsx` | Rute kelola sesi; `onRecap` dan fallback kembali ke `/asisten` |
| `src/screens/asisten/preview-session-provider.tsx` | Sumber data sementara; tanpa `addSession` |
| `src/screens/asisten/schedule-screen.tsx` | Jadwal asisten; tanpa tombol tambah sesi dan tanpa banner feedback |
| `src/components/app-tabs.tsx`, `app-tabs.web.tsx` | Dihapus; template mati yang memakai `href="/"` |
| `src/app/asisten/_layout.tsx` | Sengaja belum dibuat. Isinya nanti `RoleGuard('asisten')` yang butuh `SessionContext` P1 (spec §3 keputusan 6). |

---

### Task 1: Cabut alur tambah sesi

**Files:**
- Delete: `src/app/tambah-sesi.tsx`
- Delete: `src/screens/asisten/add-session-screen.tsx`
- Delete: `src/screens/asisten/session-form.ts`
- Delete: `src/screens/asisten/components/session-form-field.tsx`
- Delete: `src/screens/asisten/components/session-input-picker.tsx`
- Modify: `src/screens/asisten/preview-session-provider.tsx` (seluruh isi)
- Modify: `src/screens/asisten/schedule-screen.tsx:18-32,46-54,78-86,89-111,117-137`
- Modify: `src/app/(tabs)/index.tsx` (seluruh isi)

**Interfaces:**
- Consumes: `useAssistantSessions()` yang mengembalikan `{ scheduleDate, sessions, attendance, participants, openSession, closeSession }`.
- Produces: `ScheduleScreen` dengan props `{ sessions?, attendance?, date?, onManage? }`; `AssistantPreviewProvider` tanpa `addSession`.

**Blocked by:** None — can start immediately.

- [ ] **Step 1: Catat baseline**

Run:
```bash
git status --short
npx tsc --noEmit; echo "tsc=$?"
npx expo lint; echo "lint=$?"
```
Expected: `git status` hanya menampilkan `M rancangan-pembagian-tugas.md`. `tsc=0` dan `lint=0`.

- [ ] **Step 2: Hapus rute dan layar tambah sesi**

Run:
```bash
git rm 'src/app/tambah-sesi.tsx' \
  'src/screens/asisten/add-session-screen.tsx' \
  'src/screens/asisten/session-form.ts' \
  'src/screens/asisten/components/session-form-field.tsx' \
  'src/screens/asisten/components/session-input-picker.tsx'
```
Expected: lima baris `rm`.

- [ ] **Step 3: Tulis ulang provider tanpa `addSession`**

Isi `src/screens/asisten/preview-session-provider.tsx` menjadi:

```tsx
import { createContext, useContext, useState, type PropsWithChildren } from 'react';

import {
  type AssistantSession, type AssistantAttendance, type AssistantParticipant,
  previewSessions, previewAttendance, previewParticipants, previewDate,
} from './schedule-data';

type SessionSource = {
  scheduleDate: string;
  sessions: readonly AssistantSession[];
  attendance: readonly AssistantAttendance[];
  participants: readonly AssistantParticipant[];
  openSession: (id: string) => void;
  closeSession: (id: string) => void;
};
const PreviewSessionContext = createContext<SessionSource | null>(null);

/** Adapter demo sisi Asisten saja, bukan implementasi SessionContext bersama P1. */
export function AssistantPreviewProvider({ children }: PropsWithChildren) {
  const [sessions, setSessions] = useState(previewSessions);

  function openSession(id: string) {
    setSessions(current => current.map(session => session.id === id && session.status === 'pending'
      ? { ...session, status: 'open' } : session));
  }

  function closeSession(id: string) {
    const closedAt = new Date().toISOString();
    setSessions(current => current.map(session => session.id === id && session.status === 'open'
      ? { ...session, status: 'closed', closedAt, closedBy: 'Nadia' } : session));
  }

  return (
    <PreviewSessionContext.Provider value={{
      scheduleDate: previewDate, sessions, attendance: previewAttendance, participants: previewParticipants, openSession, closeSession,
    }}>
      {children}
    </PreviewSessionContext.Provider>
  );
}

export function useAssistantSessions() {
  const context = useContext(PreviewSessionContext);
  if (!context) throw new Error('AssistantPreviewProvider diperlukan untuk pratinjau Asisten.');
  return context;
}
```

- [ ] **Step 4: Buang prop dan UI tambah sesi dari `schedule-screen.tsx`**

Ganti blok tipe props (baris 18-25) menjadi:

```tsx
type Props = {
  sessions?: readonly AssistantSession[];
  attendance?: readonly AssistantAttendance[];
  date?: string;
  onManage?: (id: string) => void;
};
```

Ganti awal fungsi (baris 27-32) menjadi:

```tsx
export default function ScheduleScreen({
  sessions = previewSessions, attendance = previewAttendance, date = previewDate,
  onManage,
}: Props) {
  const [filter, setFilter] = useState<Filter>('all');
```

Hapus blok banner feedback (baris 49-54):

```tsx
      {feedback && !dismissed && <View style={styles.feedback}>
        <AssistantText tone="accent" accessibilityLiveRegion="polite" style={styles.feedbackText}>{feedback}</AssistantText>
        <Pressable accessibilityRole="button" accessibilityLabel="Tutup pesan" onPress={() => setDismissed(true)} style={styles.dismiss}>
          <AssistantText tone="accent">Tutup</AssistantText>
        </Pressable>
      </View>}
```

Ganti blok judul daftar (baris 78-86) menjadi:

```tsx
      <View style={styles.listHeading}>
        <AssistantText variant="sectionTitle" accessibilityRole="header">{today ? 'Sesi hari ini' : 'Sesi pada tanggal ini'}</AssistantText>
      </View>
```

Ganti blok empty state (baris 89-111) menjadi:

```tsx
        {visible.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><ScheduleIcon name="calendarPlus" size={34} /></View>
            <AssistantText style={styles.emptyTitle} accessibilityRole="header">
              {daySessions.length === 0 ? 'Jadwal masih kosong' : 'Tidak ada sesi untuk filter ini'}
            </AssistantText>
            {daySessions.length === 0 && (
              <AssistantText tone="secondary" style={styles.center}>
                Belum ada sesi praktikum yang dijadwalkan.
              </AssistantText>
            )}
            {daySessions.length > 0 && (
              <Pressable accessibilityRole="button" onPress={() => setFilter('all')} style={styles.reset}>
                <AssistantText variant="label" style={styles.white}>Tampilkan semua sesi</AssistantText>
              </Pressable>
            )}
          </View>
        )}
```

- [ ] **Step 5: Buang style yang tidak terpakai dari `schedule-screen.tsx`**

Hapus baris style berikut: `feedback`, `feedbackText`, `dismiss`, `add`, `addText`, `disabled`.
Sisakan `pressed`, `reset`, dan style lain. Setelah dihapus, objek `styles` dimulai dengan:

```tsx
const styles = StyleSheet.create({
  dayBanner: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 16, minHeight: 88, backgroundColor: theme.colors.primary, borderRadius: theme.radius.card },
```

- [ ] **Step 6: Tulis ulang rute jadwal tanpa parameter tambah sesi**

Isi `src/app/(tabs)/index.tsx` menjadi:

```tsx
import { router } from 'expo-router';

import { useAssistantSessions } from '@/screens/asisten/preview-session-provider';
import ScheduleScreen from '@/screens/asisten/schedule-screen';

export default function ScheduleRoute() {
  const { sessions, attendance, scheduleDate } = useAssistantSessions();
  return <ScheduleScreen sessions={sessions} attendance={attendance} date={scheduleDate}
    onManage={id => router.push({ pathname: '/sesi/[id]', params: { id } })} />;
}
```

- [ ] **Step 7: Jalankan penjaga isi**

Run:
```bash
rg -n --pcre2 "tambah-sesi|addSession|add-session-screen|session-form\b|session-input-picker|onAdd|SessionForm|emptySessionForm|validateSessionForm|createSession|sessionChoices" src; echo "guard1=$?"
git ls-files 'src/app/tambah-sesi.tsx' 'src/screens/asisten/add-session-screen.tsx' 'src/screens/asisten/session-form.ts' 'src/screens/asisten/components/session-form-field.tsx' 'src/screens/asisten/components/session-input-picker.tsx'; echo "guard3a=$?"
```
Expected: `guard1=1` (tidak ada hasil), `guard3a` tanpa daftar berkas.

- [ ] **Step 8: Typecheck dan lint**

Run:
```bash
npx tsc --noEmit; echo "tsc=$?"
npx expo lint; echo "lint=$?"
```
Expected: `tsc=0`, `lint=0`. Tidak perlu regenerasi typed routes karena tidak ada rute yang berpindah, hanya satu rute yang dihapus.

- [ ] **Step 9: Commit**

```bash
git add -A -- src
git commit -m "feat: revoke add session flow from assistant screens"
```

---

### Task 2: Pindahkan rute ke bawah `/asisten`

**Files:**
- Move: `src/app/(tabs)/index.tsx` → `src/app/asisten/(tabs)/index.tsx`
- Move: `src/app/(tabs)/rekap.tsx` → `src/app/asisten/(tabs)/rekap.tsx`
- Move: `src/app/(tabs)/_layout.tsx` → `src/app/asisten/(tabs)/_layout.tsx`
- Move: `src/app/sesi/[id].tsx` → `src/app/asisten/sesi/[id].tsx`
- Delete: `src/components/app-tabs.tsx`
- Delete: `src/components/app-tabs.web.tsx`

**Interfaces:**
- Consumes: `ScheduleScreen`, `RecapScreen`, `SessionScreen`, `AssistantNavigation` dengan signature yang sudah ada.
- Produces: rute `/asisten`, `/asisten/rekap`, `/asisten/sesi/[id]`.

**Blocked by:** Task 1.

- [ ] **Step 1: Pindahkan berkas**

Run:
```bash
mkdir -p 'src/app/asisten/(tabs)' 'src/app/asisten/sesi'
git mv -v 'src/app/(tabs)/index.tsx' 'src/app/asisten/(tabs)/index.tsx'
git mv -v 'src/app/(tabs)/rekap.tsx' 'src/app/asisten/(tabs)/rekap.tsx'
git mv -v 'src/app/(tabs)/_layout.tsx' 'src/app/asisten/(tabs)/_layout.tsx'
git mv -v 'src/app/sesi/[id].tsx' 'src/app/asisten/sesi/[id].tsx'
rmdir 'src/app/(tabs)' 'src/app/sesi'
```
Expected: empat baris berawalan `renamed:` karena `-v`, tanpa error glob, exit 0.

- [ ] **Step 2: Perbarui path di layout tab**

Isi `src/app/asisten/(tabs)/_layout.tsx` menjadi:

```tsx
import { router, Stack, usePathname } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AssistantNavigation, type AssistantTab } from '@/screens/asisten/components/assistant-navigation';
import { assistantTheme as theme } from '@/screens/asisten/theme';

const tabFromPath = (pathname: string): AssistantTab | null => {
  if (pathname === '/asisten/rekap') return 'recap';
  if (pathname === '/asisten') return 'schedule';
  return null;
};

export default function TabsLayout() {
  const pathname = usePathname();
  const current = tabFromPath(pathname);
  const [active, setActive] = useState<AssistantTab>(current ?? 'schedule');
  if (current && current !== active) setActive(current);

  const goTo = (tab: AssistantTab) => {
    if (tab === 'recap') router.navigate('/asisten/rekap');
    else router.dismissTo('/asisten');
  };

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }} />
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.bar}>
        <AssistantNavigation active={active}
          onSchedule={() => goTo('schedule')}
          onRecap={() => goTo('recap')} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  bar: { backgroundColor: theme.colors.background },
});
```

- [ ] **Step 3: Perbarui path di rute jadwal**

Isi `src/app/asisten/(tabs)/index.tsx` menjadi:

```tsx
import { router } from 'expo-router';

import { useAssistantSessions } from '@/screens/asisten/preview-session-provider';
import ScheduleScreen from '@/screens/asisten/schedule-screen';

export default function ScheduleRoute() {
  const { sessions, attendance, scheduleDate } = useAssistantSessions();
  return <ScheduleScreen sessions={sessions} attendance={attendance} date={scheduleDate}
    onManage={id => router.push({ pathname: '/asisten/sesi/[id]', params: { id } })} />;
}
```

- [ ] **Step 4: Perbarui path di rute rekap**

Isi `src/app/asisten/(tabs)/rekap.tsx` menjadi:

```tsx
import { router, useLocalSearchParams } from 'expo-router';

import RecapScreen from '@/screens/asisten/recap-screen';

export default function RecapRoute() {
  const { sesi } = useLocalSearchParams<{ sesi?: string }>();
  return <RecapScreen key={sesi ?? 'all'} initialSessionId={sesi}
    onSchedule={() => router.dismissTo('/asisten')}
    onDetail={id => router.push({ pathname: '/asisten/sesi/[id]', params: { id } })} />;
}
```

- [ ] **Step 5: Perbarui path di rute kelola sesi**

Isi `src/app/asisten/sesi/[id].tsx` menjadi:

```tsx
import { router, useLocalSearchParams } from 'expo-router';

import SessionScreen from '@/screens/asisten/session-screen';

export default function SessionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SessionScreen id={id}
    onRecap={sessionId => router.navigate({ pathname: '/asisten/rekap', params: { sesi: sessionId } })} onBack={() => {
    if (router.canGoBack()) router.back();
    else router.replace('/asisten');
  }} />;
}
```

- [ ] **Step 6: Hapus dua berkas template mati**

Run:
```bash
git rm 'src/components/app-tabs.tsx' 'src/components/app-tabs.web.tsx'
```
Expected: dua baris `rm`. Berkas ini tidak diimpor siapa pun, tetapi `app-tabs.web.tsx:24` memakai `href="/"` dan akan menggagalkan `tsc` setelah rute `/` hilang.

- [ ] **Step 7: Regenerasi typed routes**

Run:
```bash
timeout 45 env CI=1 npx expo start --web --port 8099 > /tmp/expo-typegen.log 2>&1
rg -o '/asisten[^"`|]*' .expo/types/router.d.ts | sort -u
```
Expected: keluaran memuat `/asisten`, `/asisten/rekap`, `/asisten/sesi/[id]`. Exit 124 dari `timeout` normal.

- [ ] **Step 8: Typecheck, lint, dan penjaga**

Run:
```bash
npx tsc --noEmit; echo "tsc=$?"
npx expo lint; echo "lint=$?"
rg -n --pcre2 "tambah-sesi|addSession|add-session-screen|session-form\b|session-input-picker|onAdd|SessionForm|emptySessionForm|validateSessionForm|createSession|sessionChoices" src; echo "guard1=$?"
rg -n "'/rekap'|'/sesi/|'/tambah-sesi'" src; echo "guard2=$?"
git ls-files 'src/app/(tabs)' 'src/app/sesi' 'src/app/tambah-sesi.tsx' 'src/screens/asisten/add-session-screen.tsx' 'src/screens/asisten/session-form.ts' 'src/screens/asisten/components/session-form-field.tsx' 'src/screens/asisten/components/session-input-picker.tsx' 'src/components/app-tabs.tsx' 'src/components/app-tabs.web.tsx'; echo "guard3=$?"
```
Expected: `tsc=0`, `lint=0`, `guard1=1`, `guard2=1`, dan `guard3` tanpa daftar berkas.

- [ ] **Step 9: Cek HTTP di web**

Run:
```bash
npx expo start --web --port 8099 > /tmp/expo-web.log 2>&1 &
sleep 20
for route in /asisten /asisten/rekap /asisten/sesi/web-04 /; do
  printf '%s ' "$route"
  curl -s -o /dev/null -w '%{http_code}\n' "http://127.0.0.1:8099$route"
done
```
Jangan memakai `path` sebagai nama variabel loop. Di zsh `path` adalah array dari `PATH`, sehingga `curl` tidak ditemukan dan loop tampak lolos tanpa keluaran.

Expected: tiga rute pertama menghasilkan `200`, `/` menghasilkan `404`. Status code adalah bukti yang dipakai: HTML dari dev server dirender di klien, jadi teks "Unmatched Route" tidak muncul lewat `curl` (sudah diuji pada 2026-10-25). Pemeriksaan tampilan dilakukan di Step 10 (browser) dan Task 3 (native). Hentikan server setelah selesai.

- [ ] **Step 10: Cek tampilan di browser (server dari Step 9 masih hidup)**

Chrome headless dipakai karena sudah terbukti merender layar Expo web (diuji pada 2026-10-25).

```bash
check_dom() {
  local name=$(echo "$1" | tr '/' '_')
  google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=9000 --dump-dom "http://127.0.0.1:8099$1" > "/tmp/p3-dom-$name.html" 2>/dev/null
  echo "$1 tabs=$(grep -c 'role="tablist"' "/tmp/p3-dom-$name.html")"
}
check_dom /asisten
check_dom /asisten/rekap
check_dom /asisten/sesi/web-04
grep -c 'Jadwal asisten' /tmp/p3-dom-_asisten.html
grep -c 'Rekap presensi' /tmp/p3-dom-_asisten_rekap.html
grep -c 'Kelola sesi' /tmp/p3-dom-_asisten_sesi_web-04.html
```
Expected: `/asisten tabs=1` dan `grep -c 'Jadwal asisten'` menghasilkan `1`; `/asisten/rekap tabs=1` dan `grep -c 'Rekap presensi'` menghasilkan `1`; `/asisten/sesi/web-04 tabs=0` dan `grep -c 'Kelola sesi'` menghasilkan `1`. `tabs=0` membuktikan bar bawah tidak tampil di layar kelola sesi. Catat angka yang benar-benar keluar; jangan menyatakan lulus bila `tabs` tidak sesuai.

- [ ] **Step 11: Commit**

```bash
git add -A -- src
git commit -m "feat: move assistant routes under /asisten"
```

---

### Task 3: Smoke test native tiga alur

**Files:**
- No file changes expected. If a flow fails, the fix belongs to Task 2's files, then re-run this task.

**Interfaces:**
- Consumes: rute final dari Task 2.
- Produces: bukti screenshot dan status lulus atau gagal per alur.

**Blocked by:** Task 2.

- [ ] **Step 1: Pastikan emulator siap**

Run:
```bash
adb devices
adb reverse tcp:8081 tcp:8081
```
Expected: satu baris `emulator-5554` dengan status `device`. Dev build `com.ppk.presensipraktikum` sudah terpasang.

Bila tidak ada emulator atau perangkat, hentikan Task 3. Laporkan langkah native belum dijalankan dan jangan nyatakan pekerjaan selesai (spec §7 langkah 9).

- [ ] **Step 2: Jalankan Metro untuk dev client**

Run:
```bash
ss -ltnp | rg ':8081' || true
lsof -ti tcp:8081 | xargs -r kill
sleep 2
npx expo start --dev-client --port 8081 > /tmp/expo-dev.log 2>&1 &
sleep 15
tail -5 /tmp/expo-dev.log
```
Expected: `ss` boleh menampilkan proses `expo run:android` lama pada port 8081; perintah `lsof` menghentikannya supaya Metro baru melayani kode saat ini. Metro siap tanpa error bundling.

- [ ] **Step 3: Buka jadwal asisten dan ambil bukti**

Run:
```bash
mkdir -p /tmp/p3-native
adb shell am start -W -a android.intent.action.VIEW -d 'presensipraktikum:///asisten' com.ppk.presensipraktikum
sleep 6
adb exec-out screencap -p > /tmp/p3-native/01-jadwal.png
```
Expected: layar judul "Jadwal asisten", bar bawah dengan tab Jadwal dan Rekap. Bila dev client membuka launcher, ketuk entri proyek di launcher lalu ulangi deep link.

- [ ] **Step 4: Alur A — tab Rekap lalu kembali ke Jadwal**

Ambil koordinat tab Rekap dengan salah satu cara:
```bash
adb shell uiautomator dump /sdcard/ui.xml >/dev/null && adb shell cat /sdcard/ui.xml | tr '<' '\n' | rg 'Rekap'
```
Bila XML tidak memuat teks, baca `/tmp/p3-native/01-jadwal.png` dan tentukan koordinat tab Rekap secara visual. Lalu:
```bash
before=$(adb shell pidof com.ppk.presensipraktikum)
adb shell input tap <X> <Y>
sleep 3
adb exec-out screencap -p > /tmp/p3-native/02-rekap.png
after=$(adb shell pidof com.ppk.presensipraktikum)
echo "before=$before after=$after"
```
Expected: layar rekap tampil, dan PID aplikasi sama dengan sebelum tap. Ini membuktikan `navigate('/asisten/rekap')` berjalan tanpa memuat ulang proses.

Ulangi tap pada tab Jadwal dengan pola yang sama:
```bash
before2=$(adb shell pidof com.ppk.presensipraktikum)
adb shell input tap <X2> <Y2>
sleep 3
adb exec-out screencap -p > /tmp/p3-native/03-kembali-jadwal.png
after2=$(adb shell pidof com.ppk.presensipraktikum)
echo "before2=$before2 after2=$after2"
```
Expected: kembali ke jadwal dan `before2` sama dengan `after2`. Ini bukti `dismissTo('/asisten')` bekerja tanpa memuat ulang proses.

- [ ] **Step 5: Alur B — kartu jadwal membuka detail (onManage)**

Mulai dari layar jadwal pada Step 3. Ketuk aksi pada kartu sesi `web-04` yang berlabel "Pantau sesi" karena sesinya berstatus Dibuka. Tentukan koordinat dengan pola yang sama seperti Step 4, lalu:
```bash
adb shell input tap <X3> <Y3>
sleep 3
adb exec-out screencap -p > /tmp/p3-native/04-detail-dari-kartu.png
```
Expected: judul "Kelola sesi" dan status Dibuka. Ini bukti `onManage` memakai path `/asisten/sesi/[id]`.

- [ ] **Step 6: Alur B2 — detail sesi tertutup lalu tombol Rekap (onRecap)**

Tidak ada sesi `closed` pada `previewDate` 2026-10-19: `web-03` bertanggal 2026-10-12 dan `web-02` 2026-10-05 (`schedule-data.ts:29,33`). Jadi detail sesi tertutup dibuka lewat deep link:
```bash
adb shell am start -W -a android.intent.action.VIEW -d 'presensipraktikum:///asisten/sesi/web-03' com.ppk.presensipraktikum
sleep 5
adb exec-out screencap -p > /tmp/p3-native/05-detail-tertutup.png
```
Expected: judul "Kelola sesi", status Ditutup, tombol footer "Lihat rekap sesi". Ketuk tombol itu, lalu simpan `/tmp/p3-native/06-rekap-dari-detail.png`.
Expected: layar rekap menampilkan sesi `web-03` sebagai pilihan awal. Ini bukti `navigate('/asisten/rekap')` membawa parameter `sesi`.

- [ ] **Step 7: Alur C — cold open detail lalu tombol kembali**

Run:
```bash
adb shell am force-stop com.ppk.presensipraktikum
adb shell am start -W -a android.intent.action.VIEW -d 'presensipraktikum:///asisten/sesi/web-04' com.ppk.presensipraktikum
sleep 6
adb exec-out screencap -p > /tmp/p3-native/07-detail-web04.png
```
Expected: detail sesi `web-04` tampil. Ketuk tombol kembali (label aksesibilitas "Kembali") lalu simpan `/tmp/p3-native/08-kembali-ke-jadwal.png`.
Expected: mendarat di `/asisten`, bukan layar kosong. Ini bukti fallback `replace('/asisten')` bekerja saat tidak ada riwayat.

- [ ] **Step 8: Baca dan laporkan bukti**

Baca setiap berkas `/tmp/p3-native/*.png` dengan pembaca gambar. Laporkan per alur: lulus atau gagal, dengan nama berkas bukti. Jangan menyatakan lulus tanpa melihat gambarnya.

- [ ] **Step 9: Ulangi penjaga dan typecheck terakhir**

Run:
```bash
npx tsc --noEmit; echo "tsc=$?"
npx expo lint; echo "lint=$?"
rg -n --pcre2 "tambah-sesi|addSession|add-session-screen|session-form\b|session-input-picker|onAdd" src; echo "guard1=$?"
git ls-files 'src/app/(tabs)' 'src/app/sesi' 'src/app/tambah-sesi.tsx' 'src/components/app-tabs.tsx' 'src/components/app-tabs.web.tsx'; echo "guard3=$?"
```
Expected: `tsc=0`, `lint=0`, `guard1=1`, `guard3` tanpa daftar berkas.

- [ ] **Step 10: Hentikan proses latar**

```bash
pkill -f "expo start --dev-client --port 8081"
pkill -f "expo start --web --port 8099"
```
Expected: kedua proses berhenti. `kill %1` tidak dipakai karena blok perintah baru tidak punya job table shell sebelumnya. Emulator boleh tetap hidup.
