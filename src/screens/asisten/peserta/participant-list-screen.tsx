import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { getClassesByAssistant } from '@/lib/class-service';
import {
  addEnrollment,
  getEnrollmentsByClass,
  removeEnrollment,
} from '@/lib/enrollment-service';
import { formatShortDate } from '@/lib/praktikum-helpers';
import { tokens, useTheme, useThemedStyles, type Theme } from '@/theme';
import { type Enrollment, type PracticumClass, type User } from '@/types';

import { AssistantScreen } from '../components/assistant-screen';
import { AssistantText } from '../components/assistant-text';
import { AssistantTopBar } from '../components/assistant-top-bar';
import { ScheduleIcon } from '../components/schedule-icon';
import { ParticipantAddSheet } from './participant-add-sheet';
import { ParticipantRemoveSheet } from './participant-remove-sheet';

// Fallback sementara saat data mock masih memakai assistantId 'a1'.
const DEFAULT_ASSISTANT_ID = 'a1';

type Props = {
  initialClassId?: string;
  assistantId?: string;
  onBack?: () => void;
};

/** Layar pengelolaan daftar peserta (enrollments) per kelas untuk asisten. */
export default function ParticipantListScreen({
  initialClassId,
  assistantId = DEFAULT_ASSISTANT_ID,
  onBack,
}: Props) {
  const theme = useTheme();
  const styles = useThemedStyles(gaya);
  const [classes, setClasses] = useState<PracticumClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(initialClassId ?? null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Enrollment | null>(null);

  const selectedClass = classes.find(item => item.id === selectedClassId) ?? null;

  const reloadAll = useCallback(async (targetClassId: string | null) => {
    setLoading(true);
    setLoadError(null);
    try {
      const classList = await getClassesByAssistant(assistantId);
      setClasses(classList);
      const activeId =
        targetClassId && classList.some(item => item.id === targetClassId)
          ? targetClassId
          : classList[0]?.id ?? null;
      setSelectedClassId(activeId);

      if (activeId) {
        const list = await getEnrollmentsByClass(activeId);
        setEnrollments(list);
      } else {
        setEnrollments([]);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Gagal memuat data peserta.');
    } finally {
      setLoading(false);
    }
  }, [assistantId]);

  useEffect(() => {
    let active = true;
    getClassesByAssistant(assistantId)
      .then(async classList => {
        if (!active) return;
        setClasses(classList);
        const activeId =
          initialClassId && classList.some(item => item.id === initialClassId)
            ? initialClassId
            : classList[0]?.id ?? null;
        setSelectedClassId(activeId);

        if (!activeId) {
          setEnrollments([]);
          setLoading(false);
          return;
        }

        const list = await getEnrollmentsByClass(activeId);
        if (!active) return;
        setEnrollments(list);
        setLoadError(null);
        setLoading(false);
      })
      .catch(err => {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : 'Gagal memuat data peserta.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [assistantId, initialClassId]);

  async function handleSelectClass(classId: string) {
    if (classId === selectedClassId) return;
    setSelectedClassId(classId);
    setNotice(null);
    setLoading(true);
    setLoadError(null);
    try {
      const list = await getEnrollmentsByClass(classId);
      setEnrollments(list);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Gagal memuat peserta kelas.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddParticipant(user: User) {
    if (!selectedClass) return;
    await addEnrollment(
      {
        classId: selectedClass.id,
        userId: user.id,
        userName: user.name,
      },
      assistantId
    );
    setNotice({
      type: 'success',
      text: `${user.name} berhasil ditambahkan ke ${selectedClass.name}.`,
    });
    const list = await getEnrollmentsByClass(selectedClass.id);
    setEnrollments(list);
  }

  async function handleRemoveConfirm() {
    if (!removeTarget || !selectedClass) return;
    const removedName = removeTarget.userName;
    await removeEnrollment(removeTarget.id, assistantId);
    setNotice({
      type: 'success',
      text: `${removedName} dikeluarkan dari ${selectedClass.name}.`,
    });
    const list = await getEnrollmentsByClass(selectedClass.id);
    setEnrollments(list);
  }

  return (
    <AssistantScreen
      header={onBack ? <AssistantTopBar onBack={onBack} title="Peserta Kelas" /> : undefined}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <AssistantText variant="pageTitle" accessibilityRole="header" style={styles.heroTitle}>
            Peserta Kelas
          </AssistantText>
          <AssistantText variant="caption" style={styles.heroSubtitle}>
            {selectedClass ? `${enrollments.length} praktikan terdaftar` : 'Belum ada kelas'}
          </AssistantText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tambah peserta"
          disabled={!selectedClass}
          onPress={() => {
            setNotice(null);
            setShowAddSheet(true);
          }}
          style={({ pressed }) => [
            styles.addButton,
            !selectedClass && styles.disabled,
            pressed && selectedClass && styles.pressed,
          ]}>
          <ScheduleIcon name="plus" size={16} tintColor={theme.colors.onPrimary} />
          <AssistantText variant="label" style={styles.addLabel}>Tambah</AssistantText>
        </Pressable>
      </View>

      {classes.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.classTabsViewport}
          contentContainerStyle={styles.classTabs}>
          {classes.map(item => {
            const active = item.id === selectedClassId;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => void handleSelectClass(item.id)}
                style={({ pressed }) => [
                  styles.classTab,
                  active && styles.classTabActive,
                  pressed && styles.pressed,
                ]}>
                <AssistantText style={[styles.classTabText, active && styles.white]}>
                  {item.name}
                </AssistantText>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {notice && (
        <View
          accessibilityLiveRegion="polite"
          style={[styles.notice, notice.type === 'error' ? styles.noticeError : styles.noticeSuccess]}>
          <AssistantText
            variant="caption"
            style={[styles.noticeText, notice.type === 'error' ? styles.errorText : styles.successText]}>
            {notice.text}
          </AssistantText>
          <Pressable accessibilityRole="button" onPress={() => setNotice(null)}>
            <AssistantText variant="caption" tone="secondary">Tutup</AssistantText>
          </Pressable>
        </View>
      )}

      {loading && (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <AssistantText variant="caption" tone="secondary">Memuat daftar peserta...</AssistantText>
        </View>
      )}

      {!loading && loadError && (
        <View style={styles.stateCard}>
          <AssistantText style={styles.stateTitle}>Gagal memuat peserta</AssistantText>
          <AssistantText tone="secondary" style={styles.centerText}>{loadError}</AssistantText>
          <Pressable
            accessibilityRole="button"
            onPress={() => void reloadAll(selectedClassId)}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <AssistantText variant="label" style={styles.white}>Coba lagi</AssistantText>
          </Pressable>
        </View>
      )}

      {!loading && !loadError && !selectedClass && (
        <View style={styles.stateCard}>
          <View style={styles.emptyIcon}>
            <ScheduleIcon name="users" size={32} tintColor={theme.colors.primary} />
          </View>
          <AssistantText style={styles.stateTitle}>Belum ada kelas</AssistantText>
          <AssistantText tone="secondary" style={styles.centerText}>
            Buat kelas terlebih dahulu sebelum menambahkan peserta praktikum.
          </AssistantText>
        </View>
      )}

      {!loading && !loadError && selectedClass && enrollments.length === 0 && (
        <View style={styles.stateCard}>
          <View style={styles.emptyIcon}>
            <ScheduleIcon name="users" size={32} tintColor={theme.colors.primary} />
          </View>
          <AssistantText style={styles.stateTitle}>Belum ada peserta</AssistantText>
          <AssistantText tone="secondary" style={styles.centerText}>
            Tambahkan praktikan ke kelas {selectedClass.name} agar sesi tampil di jadwal mereka.
          </AssistantText>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowAddSheet(true)}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <AssistantText variant="label" style={styles.white}>Tambah peserta pertama</AssistantText>
          </Pressable>
        </View>
      )}

      {!loading && !loadError && selectedClass && enrollments.length > 0 && (
        <View style={styles.list}>
          {enrollments.map(item => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardInfo}>
                <AssistantText style={styles.cardTitle}>{item.userName}</AssistantText>
                <AssistantText variant="caption" tone="secondary">
                  ID: {item.userId} | Terdaftar {formatShortDate(item.enrolledAt)}
                </AssistantText>
              </View>

              <Pressable
                testID={`peserta-hapus-${item.id}`}
                accessibilityRole="button"
                onPress={() => {
                  setNotice(null);
                  setRemoveTarget(item);
                }}
                style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}>
                <AssistantText variant="caption" style={styles.removeText}>Hapus</AssistantText>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {showAddSheet && selectedClass && (
        <ParticipantAddSheet
          className={selectedClass.name}
          enrolledUserIds={enrollments.map(item => item.userId)}
          onCancel={() => setShowAddSheet(false)}
          onSubmit={handleAddParticipant}
        />
      )}

      {removeTarget && selectedClass && (
        <ParticipantRemoveSheet
          enrollment={removeTarget}
          className={selectedClass.name}
          onCancel={() => setRemoveTarget(null)}
          onConfirm={handleRemoveConfirm}
        />
      )}
    </AssistantScreen>
  );
}

const gaya = (theme: Theme) => StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  titleBlock: { flex: 1, gap: 2 },
  heroTitle: { color: theme.colors.onHero },
  heroSubtitle: { color: theme.colors.heroSoft },
  addButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: tokens.radius.pill,
    backgroundColor: theme.colors.primaryFill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addLabel: { color: theme.colors.onPrimary, fontSize: 13 },
  disabled: { opacity: 0.5 },
  classTabsViewport: { marginHorizontal: -tokens.spacing.page, flexGrow: 0 },
  classTabs: { flexDirection: 'row', gap: 8, paddingHorizontal: tokens.spacing.page, paddingBottom: 2 },
  classTab: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: tokens.radius.pill,
    backgroundColor: theme.colors.glassMuted,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classTabActive: { backgroundColor: theme.colors.primaryFill, borderColor: theme.colors.primaryFill },
  classTabText: { fontSize: 13, fontFamily: tokens.fonts.semibold, color: theme.colors.textSecondary },
  white: { color: theme.colors.onPrimary },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
  },
  noticeSuccess: { backgroundColor: theme.colors.successSoft, borderColor: theme.colors.success },
  noticeError: { backgroundColor: theme.colors.errorSoft, borderColor: theme.colors.error },
  noticeText: { flex: 1, fontFamily: tokens.fonts.medium },
  successText: { color: theme.colors.success },
  errorText: { color: theme.colors.error },
  centerBox: { paddingVertical: 48, alignItems: 'center', gap: 12 },
  stateCard: {
    padding: 24,
    borderRadius: tokens.radius.card,
    backgroundColor: theme.colors.glassSurface,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: { fontSize: 19, lineHeight: 25, fontFamily: tokens.fonts.bold, textAlign: 'center' },
  centerText: { textAlign: 'center' },
  primaryButton: {
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: tokens.radius.control,
    backgroundColor: theme.colors.primaryFill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  list: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
    borderRadius: tokens.radius.card,
    backgroundColor: theme.colors.glassSurface,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  cardInfo: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 16, lineHeight: 22, fontFamily: tokens.fonts.semibold },
  removeButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: tokens.radius.pill,
    backgroundColor: theme.colors.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { fontFamily: tokens.fonts.semibold, color: theme.colors.error },
  pressed: { opacity: 0.7 },
});
