import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import {
  createClass,
  deleteClass,
  getClassesByAssistant,
  updateClass,
} from '@/lib/class-service';
import { formatShortDate } from '@/lib/praktikum-helpers';
import { tokens, useTheme, useThemedStyles, type Theme } from '@/theme';
import { type PracticumClass } from '@/types';

import { AssistantScreen } from '../components/assistant-screen';
import { AssistantText } from '../components/assistant-text';
import { AssistantTopBar } from '../components/assistant-top-bar';
import { ScheduleIcon } from '../components/schedule-icon';
import { ClassDeleteSheet } from './class-delete-sheet';
import { ClassFormSheet } from './class-form-sheet';

// Fallback sementara saat data mock masih memakai assistantId 'a1'.
const DEFAULT_ASSISTANT_ID = 'a1';

type Props = {
  assistantId?: string;
  onBack?: () => void;
  onOpenParticipants?: (classId: string) => void;
};

type FormSheetState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; item: PracticumClass };

/** Layar daftar & pengelolaan kelas praktikum untuk asisten. */
export default function ClassListScreen({
  assistantId = DEFAULT_ASSISTANT_ID,
  onBack,
  onOpenParticipants,
}: Props) {
  const theme = useTheme();
  const styles = useThemedStyles(gaya);
  const [classes, setClasses] = useState<PracticumClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formState, setFormState] = useState<FormSheetState>({ mode: 'closed' });
  const [deleteTarget, setDeleteTarget] = useState<PracticumClass | null>(null);

  const reloadClasses = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getClassesByAssistant(assistantId);
      setClasses(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Gagal memuat daftar kelas.');
    } finally {
      setLoading(false);
    }
  }, [assistantId]);

  useEffect(() => {
    let active = true;
    getClassesByAssistant(assistantId)
      .then(data => {
        if (!active) return;
        setClasses(data);
        setLoadError(null);
        setLoading(false);
      })
      .catch(err => {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : 'Gagal memuat daftar kelas.');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [assistantId]);

  async function handleFormSubmit(values: { name: string; description: string }) {
    if (formState.mode === 'edit') {
      await updateClass(formState.item.id, values, assistantId);
      setNotice({ type: 'success', text: `Kelas "${values.name}" berhasil diperbarui.` });
    } else {
      await createClass({ ...values, assistantId });
      setNotice({ type: 'success', text: `Kelas "${values.name}" berhasil dibuat.` });
    }
    await reloadClasses();
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const deletedName = deleteTarget.name;
    await deleteClass(deleteTarget.id, assistantId);
    setNotice({ type: 'success', text: `Kelas "${deletedName}" berhasil dihapus.` });
    await reloadClasses();
  }

  return (
    <AssistantScreen
      header={onBack ? <AssistantTopBar onBack={onBack} title="Kelola Kelas" /> : undefined}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <AssistantText variant="pageTitle" accessibilityRole="header" style={styles.heroTitle}>
            Kelola Kelas
          </AssistantText>
          <AssistantText variant="caption" style={styles.heroSubtitle}>
            {classes.length} kelas aktif
          </AssistantText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tambah kelas"
          onPress={() => {
            setNotice(null);
            setFormState({ mode: 'create' });
          }}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
          <ScheduleIcon name="plus" size={16} tintColor={theme.colors.onPrimary} />
          <AssistantText variant="label" style={styles.addLabel}>Tambah</AssistantText>
        </Pressable>
      </View>

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
          <AssistantText variant="caption" tone="secondary">Memuat daftar kelas...</AssistantText>
        </View>
      )}

      {!loading && loadError && (
        <View style={styles.stateCard}>
          <AssistantText style={styles.stateTitle}>Gagal memuat data</AssistantText>
          <AssistantText tone="secondary" style={styles.centerText}>{loadError}</AssistantText>
          <Pressable
            accessibilityRole="button"
            onPress={() => void reloadClasses()}
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
            Tambahkan kelas praktikum pertama untuk mulai mengatur peserta dan sesi.
          </AssistantText>
          <Pressable
            accessibilityRole="button"
            onPress={() => setFormState({ mode: 'create' })}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <AssistantText variant="label" style={styles.white}>Tambah kelas pertama</AssistantText>
          </Pressable>
        </View>
      )}

      {!loading && !loadError && classes.length > 0 && (
        <View style={styles.list}>
          {classes.map(item => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeading}>
                  <AssistantText style={styles.cardTitle}>{item.name}</AssistantText>
                  <AssistantText variant="caption" tone="secondary">
                    Dibuat {formatShortDate(item.createdAt)}
                  </AssistantText>
                </View>
              </View>

              <AssistantText tone="secondary" style={styles.cardDesc}>
                {item.description || 'Belum ada deskripsi.'}
              </AssistantText>

              <View style={styles.cardActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onOpenParticipants?.(item.id)}
                  style={({ pressed }) => [styles.chipButton, styles.chipPrimary, pressed && styles.pressed]}>
                  <ScheduleIcon name="users" size={14} tintColor={theme.colors.primary} />
                  <AssistantText variant="caption" tone="accent" style={styles.chipPrimaryText}>
                    Peserta
                  </AssistantText>
                </Pressable>

                <View style={styles.rightActions}>
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
            </View>
          ))}
        </View>
      )}

      {formState.mode !== 'closed' && (
        <ClassFormSheet
          initialClass={formState.mode === 'edit' ? formState.item : null}
          onCancel={() => setFormState({ mode: 'closed' })}
          onSubmit={handleFormSubmit}
        />
      )}

      {deleteTarget && (
        <ClassDeleteSheet
          targetClass={deleteTarget}
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
  white: { color: theme.colors.onPrimary },
  list: { gap: 14 },
  card: {
    padding: 18,
    borderRadius: tokens.radius.card,
    backgroundColor: theme.colors.glassSurface,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  cardHeading: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 17, lineHeight: 23, fontFamily: tokens.fonts.bold },
  cardDesc: { fontSize: 13, lineHeight: 20 },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.hairline,
  },
  rightActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chipButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: tokens.radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipPrimary: { backgroundColor: theme.colors.primarySoft },
  chipPrimaryText: { fontFamily: tokens.fonts.semibold },
  chipNeutral: { backgroundColor: theme.colors.neutralSoft },
  chipNeutralText: { fontFamily: tokens.fonts.semibold, color: theme.colors.textPrimary },
  chipDanger: { backgroundColor: theme.colors.errorSoft },
  chipDangerText: { fontFamily: tokens.fonts.semibold, color: theme.colors.error },
  pressed: { opacity: 0.7 },
});
