import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { getClassesByAssistant } from '@/lib/class-service';
import { listenLaboratories } from '@/lib/laboratory-service';
import { formatShortDate } from '@/lib/praktikum-helpers';
import {
  createSession,
  deleteSession,
  getSessionsByAssistant,
  getSessionsByClass,
  updateSession,
} from '@/lib/session-service';
import { tokens, useTheme, useThemedStyles, type Theme } from '@/theme';
import { type Laboratory, type PracticumClass, type PraktikumSession, type SessionStatus } from '@/types';

import { AssistantScreen } from '../components/assistant-screen';
import { AssistantText } from '../components/assistant-text';
import { AssistantTopBar } from '../components/assistant-top-bar';
import { ScheduleIcon } from '../components/schedule-icon';
import { SessionDeleteSheet } from './session-delete-sheet';
import { SessionFormSheet, type SessionFormValues } from './session-form-sheet';

// Fallback sementara saat data mock masih memakai assistantId 'a1'.
const DEFAULT_ASSISTANT_ID = 'a1';
const ALL_CLASSES_FILTER = 'all';

const STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: 'Dijadwalkan',
  open: 'Dibuka',
  closed: 'Ditutup',
};

type Props = {
  initialClassId?: string;
  assistantId?: string;
  onBack?: () => void;
};

type FormSheetState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; item: PraktikumSession };

/** Layar pengelolaan jadwal & sesi praktikum per kelas untuk asisten. */
export default function SessionManageListScreen({
  initialClassId,
  assistantId = DEFAULT_ASSISTANT_ID,
  onBack,
}: Props) {
  const theme = useTheme();
  const styles = useThemedStyles(gaya);
  const [classes, setClasses] = useState<PracticumClass[]>([]);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId ?? ALL_CLASSES_FILTER);
  const [sessions, setSessions] = useState<PraktikumSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formState, setFormState] = useState<FormSheetState>({ mode: 'closed' });
  const [deleteTarget, setDeleteTarget] = useState<PraktikumSession | null>(null);

  const classMap = useMemo(
    () => new Map(classes.map(item => [item.id, item.name])),
    [classes]
  );

  const labMap = useMemo(
    () => new Map(laboratories.map(item => [item.id, item])),
    [laboratories]
  );

  useEffect(
    () =>
      listenLaboratories(setLaboratories, message =>
        setNotice({ type: 'error', text: `Daftar laboratorium gagal dimuat: ${message}` })
      ),
    []
  );

  const fetchSessions = useCallback(
    async (filterId: string) => {
      return filterId === ALL_CLASSES_FILTER
        ? getSessionsByAssistant(assistantId)
        : getSessionsByClass(filterId);
    },
    [assistantId]
  );

  const reloadAll = useCallback(
    async (filterId: string) => {
      setLoading(true);
      setLoadError(null);
      try {
        const [classList, sessionList] = await Promise.all([
          getClassesByAssistant(assistantId),
          fetchSessions(filterId),
        ]);
        setClasses(classList);
        setSessions(sessionList);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Gagal memuat jadwal sesi.');
      } finally {
        setLoading(false);
      }
    },
    [assistantId, fetchSessions]
  );

  useEffect(() => {
    let active = true;
    Promise.all([getClassesByAssistant(assistantId), fetchSessions(selectedClassId)])
      .then(([classList, sessionList]) => {
        if (!active) return;
        setClasses(classList);
        setSessions(sessionList);
        setLoadError(null);
        setLoading(false);
      })
      .catch(err => {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : 'Gagal memuat jadwal sesi.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [assistantId, fetchSessions, selectedClassId]);

  async function handleFormSubmit(values: SessionFormValues) {
    if (formState.mode === 'edit') {
      await updateSession(formState.item.id, values, assistantId);
      setNotice({ type: 'success', text: `Sesi "${values.title}" berhasil diperbarui.` });
    } else {
      await createSession({ ...values, assistantId });
      setNotice({ type: 'success', text: `Sesi "${values.title}" berhasil dibuat.` });
    }
    await reloadAll(selectedClassId);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const deletedTitle = deleteTarget.title;
    await deleteSession(deleteTarget.id, assistantId);
    setNotice({ type: 'success', text: `Sesi "${deletedTitle}" berhasil dihapus.` });
    await reloadAll(selectedClassId);
  }

  return (
    <AssistantScreen
      header={onBack ? <AssistantTopBar onBack={onBack} title="Atur Jadwal Sesi" /> : undefined}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <AssistantText variant="pageTitle" accessibilityRole="header" style={styles.heroTitle}>
            Atur Jadwal Sesi
          </AssistantText>
          <AssistantText variant="caption" style={styles.heroSubtitle}>
            {sessions.length} sesi terdaftar
          </AssistantText>
        </View>

        <Pressable
          testID="sesi-tambah"
          accessibilityRole="button"
          accessibilityLabel="Tambah sesi"
          disabled={classes.length === 0}
          onPress={() => {
            setNotice(null);
            setFormState({ mode: 'create' });
          }}
          style={({ pressed }) => [
            styles.addButton,
            classes.length === 0 && styles.disabled,
            pressed && classes.length > 0 && styles.pressed,
          ]}>
          <ScheduleIcon name="plus" size={16} tintColor={theme.colors.onPrimary} />
          <AssistantText variant="label" style={styles.addLabel}>Tambah</AssistantText>
        </Pressable>
      </View>

      {classes.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterViewport}
          contentContainerStyle={styles.filterRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: selectedClassId === ALL_CLASSES_FILTER }}
            onPress={() => {
              setNotice(null);
              setSelectedClassId(ALL_CLASSES_FILTER);
            }}
            style={({ pressed }) => [
              styles.filterChip,
              selectedClassId === ALL_CLASSES_FILTER && styles.filterChipActive,
              pressed && styles.pressed,
            ]}>
            <AssistantText
              style={[
                styles.filterChipText,
                selectedClassId === ALL_CLASSES_FILTER && styles.white,
              ]}>
              Semua Kelas
            </AssistantText>
          </Pressable>

          {classes.map(item => {
            const selected = item.id === selectedClassId;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  setNotice(null);
                  setSelectedClassId(item.id);
                }}
                style={({ pressed }) => [
                  styles.filterChip,
                  selected && styles.filterChipActive,
                  pressed && styles.pressed,
                ]}>
                <AssistantText style={[styles.filterChipText, selected && styles.white]}>
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
          <AssistantText variant="caption" tone="secondary">Memuat jadwal sesi...</AssistantText>
        </View>
      )}

      {!loading && loadError && (
        <View style={styles.stateCard}>
          <AssistantText style={styles.stateTitle}>Gagal memuat sesi</AssistantText>
          <AssistantText tone="secondary" style={styles.centerText}>{loadError}</AssistantText>
          <Pressable
            accessibilityRole="button"
            onPress={() => void reloadAll(selectedClassId)}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <AssistantText variant="label" style={styles.white}>Coba lagi</AssistantText>
          </Pressable>
        </View>
      )}

      {!loading && !loadError && classes.length === 0 && (
        <View style={styles.stateCard}>
          <View style={styles.emptyIcon}>
            <ScheduleIcon name="calendarPlus" size={32} tintColor={theme.colors.primary} />
          </View>
          <AssistantText style={styles.stateTitle}>Belum ada kelas</AssistantText>
          <AssistantText tone="secondary" style={styles.centerText}>
            Buat kelas terlebih dahulu di Kelola Kelas sebelum membuat sesi praktikum.
          </AssistantText>
        </View>
      )}

      {!loading && !loadError && classes.length > 0 && sessions.length === 0 && (
        <View style={styles.stateCard}>
          <View style={styles.emptyIcon}>
            <ScheduleIcon name="calendarPlus" size={32} tintColor={theme.colors.primary} />
          </View>
          <AssistantText style={styles.stateTitle}>Belum ada sesi</AssistantText>
          <AssistantText tone="secondary" style={styles.centerText}>
            Tambahkan jadwal sesi praktikum untuk kelas ini.
          </AssistantText>
          <Pressable
            accessibilityRole="button"
            onPress={() => setFormState({ mode: 'create' })}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <AssistantText variant="label" style={styles.white}>Tambah sesi pertama</AssistantText>
          </Pressable>
        </View>
      )}

      {!loading && !loadError && classes.length > 0 && sessions.length > 0 && (
        <View style={styles.list}>
          {sessions.map(item => {
            const className = classMap.get(item.classId) ?? 'Kelas';
            const isOpen = item.status === 'open';
            const lab = item.laboratoryId ? labMap.get(item.laboratoryId) : undefined;
            const labMissing = !item.laboratoryId;
            return (
              <View key={item.id} style={[styles.card, isOpen && styles.openCard]}>
                <View style={styles.cardTopRow}>
                  <AssistantText variant="caption" tone="accent" style={styles.classBadgeText}>
                    {className}
                  </AssistantText>
                  <View style={[styles.statusBadge, isOpen && styles.openBadge]}>
                    <ScheduleIcon name={isOpen ? 'dotOpen' : 'dotNeutral'} size={5} />
                    <AssistantText
                      style={[styles.statusText, isOpen && styles.openStatusText]}
                      tone={isOpen ? 'accent' : 'secondary'}>
                      {STATUS_LABELS[item.status]}
                    </AssistantText>
                  </View>
                </View>

                <AssistantText style={styles.cardTitle}>{item.title}</AssistantText>

                <View style={styles.metaList}>
                  <View style={styles.metaItem}>
                    <ScheduleIcon name="calendarSmall" size={14} />
                    <AssistantText variant="caption" tone="secondary">
                      {formatShortDate(item.date)}
                    </AssistantText>
                  </View>
                  <View style={styles.metaItem}>
                    <ScheduleIcon name="clock" size={14} />
                    <AssistantText variant="caption" tone="secondary">
                      {item.startTime}–{item.endTime} WIB
                    </AssistantText>
                  </View>
                  <View style={styles.metaItem}>
                    <ScheduleIcon name="pin" size={14} />
                    <AssistantText variant="caption" tone="secondary">{item.room}</AssistantText>
                  </View>
                </View>

                {labMissing ? (
                  <AssistantText variant="caption" style={styles.labWarning}>
                    Laboratorium belum diatur
                  </AssistantText>
                ) : (
                  <AssistantText variant="caption" tone="secondary">
                    {lab
                      ? `Lab: ${lab.name}${lab.isActive ? '' : ' (nonaktif)'}`
                      : 'Lab: tidak ditemukan'}
                  </AssistantText>
                )}

                <View style={styles.cardActions}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setNotice(null);
                      setFormState({ mode: 'edit', item });
                    }}
                    style={({ pressed }) => [styles.chipButton, styles.chipNeutral, pressed && styles.pressed]}>
                    <AssistantText variant="caption" style={styles.chipNeutralText}>Edit</AssistantText>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setNotice(null);
                      setDeleteTarget(item);
                    }}
                    style={({ pressed }) => [styles.chipButton, styles.chipDanger, pressed && styles.pressed]}>
                    <AssistantText variant="caption" style={styles.chipDangerText}>Hapus</AssistantText>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {formState.mode !== 'closed' && (
        <SessionFormSheet
          classes={classes}
          laboratories={laboratories}
          initialClassId={selectedClassId === ALL_CLASSES_FILTER ? null : selectedClassId}
          initialSession={formState.mode === 'edit' ? formState.item : null}
          onCancel={() => setFormState({ mode: 'closed' })}
          onSubmit={handleFormSubmit}
        />
      )}

      {deleteTarget && (
        <SessionDeleteSheet
          targetSession={deleteTarget}
          className={classMap.get(deleteTarget.classId) ?? 'Kelas'}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
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
  filterViewport: { marginHorizontal: -tokens.spacing.page, flexGrow: 0 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: tokens.spacing.page, paddingBottom: 2 },
  filterChip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: tokens.radius.pill,
    backgroundColor: theme.colors.glassMuted,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: { backgroundColor: theme.colors.primaryFill, borderColor: theme.colors.primaryFill },
  filterChipText: { fontSize: 13, fontFamily: tokens.fonts.semibold, color: theme.colors.textSecondary },
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
  list: { gap: 14 },
  card: {
    padding: 18,
    borderRadius: tokens.radius.card,
    backgroundColor: theme.colors.glassSurface,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    gap: 10,
  },
  openCard: { backgroundColor: theme.colors.cardOpen, borderColor: theme.colors.glassBorder },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  classBadgeText: { fontFamily: tokens.fonts.semibold },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: tokens.radius.pill,
    backgroundColor: theme.colors.neutralSoft,
  },
  openBadge: { backgroundColor: theme.colors.lime },
  statusText: { fontSize: 11, fontFamily: tokens.fonts.semibold },
  openStatusText: { color: theme.colors.onLime },
  cardTitle: { fontSize: 17, lineHeight: 23, fontFamily: tokens.fonts.bold },
  metaList: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.hairline,
  },
  chipButton: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipNeutral: { backgroundColor: theme.colors.neutralSoft },
  chipNeutralText: { fontFamily: tokens.fonts.semibold, color: theme.colors.textPrimary },
  chipDanger: { backgroundColor: theme.colors.errorSoft },
  chipDangerText: { fontFamily: tokens.fonts.semibold, color: theme.colors.error },
  labWarning: { color: theme.colors.error, fontFamily: tokens.fonts.semibold },
  pressed: { opacity: 0.7 },
});
