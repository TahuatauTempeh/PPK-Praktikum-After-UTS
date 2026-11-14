import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { getPraktikanCandidates } from '@/lib/enrollment-service';
import { type User } from '@/types';

import { AssistantSheet } from '../components/assistant-sheet';
import { AssistantText } from '../components/assistant-text';
import { ScheduleIcon } from '../components/schedule-icon';
import { assistantTheme as theme } from '../theme';

type Props = {
  className: string;
  enrolledUserIds: readonly string[];
  onCancel: () => void;
  onSubmit: (user: User) => Promise<void>;
};

/** Bottom sheet untuk memilih dan menambahkan praktikan ke dalam kelas. */
export function ParticipantAddSheet({ className, enrolledUserIds, onCancel, onSubmit }: Props) {
  const [candidates, setCandidates] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPraktikanCandidates()
      .then(list => {
        if (!active) return;
        setCandidates(list);
        setLoading(false);
      })
      .catch(err => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat daftar praktikan.');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const enrolledSet = useMemo(() => new Set(enrolledUserIds), [enrolledUserIds]);

  const available = useMemo(() => {
    const query = search.trim().toLowerCase();
    return candidates
      .filter(user => !enrolledSet.has(user.id))
      .filter(user =>
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.nim.toLowerCase().includes(query)
      );
  }, [candidates, enrolledSet, search]);

  const selectedUser = available.find(item => item.id === selectedId) ?? null;

  async function handleConfirm(closeSheet: (action?: () => void) => void) {
    if (submitting) return;
    if (!selectedUser) {
      setError('Pilih salah satu praktikan terlebih dahulu.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(selectedUser);
      closeSheet(onCancel);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambahkan peserta.');
      setSubmitting(false);
    }
  }

  return (
    <AssistantSheet onCancel={onCancel} onShow={() => {}}>
      {closeSheet => (
        <View style={styles.dialog} role="dialog" accessibilityViewIsModal accessibilityLabel="Tambah peserta">
          <View style={styles.header}>
            <View style={styles.icon}>
              <ScheduleIcon name="users" size={22} />
            </View>
            <View style={styles.heading}>
              <AssistantText style={styles.title} accessibilityRole="header">Tambah Peserta</AssistantText>
              <AssistantText variant="caption" tone="secondary">
                Kelas: {className}
              </AssistantText>
            </View>
          </View>

          {error && (
            <View style={styles.errorBox} accessibilityLiveRegion="polite">
              <ScheduleIcon name="formError" size={16} />
              <AssistantText variant="caption" style={styles.errorText}>{error}</AssistantText>
            </View>
          )}

          <TextInput
            value={search}
            onChangeText={value => {
              setSearch(value);
              if (error) setError(null);
            }}
            placeholder="Cari nama atau NIM praktikan..."
            placeholderTextColor={theme.colors.textSecondary}
            editable={!submitting}
            style={styles.searchInput}
            accessibilityLabel="Cari praktikan"
          />

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color={theme.colors.primary} />
              <AssistantText variant="caption" tone="secondary">Memuat daftar praktikan...</AssistantText>
            </View>
          ) : available.length === 0 ? (
            <View style={styles.emptyBox}>
              <AssistantText variant="caption" tone="secondary" style={styles.centerText}>
                {candidates.every(user => enrolledSet.has(user.id))
                  ? 'Semua praktikan sudah terdaftar di kelas ini.'
                  : 'Tidak ada praktikan yang cocok dengan pencarian.'}
              </AssistantText>
            </View>
          ) : (
            <View style={styles.candidateList}>
              {available.map(user => {
                const selected = user.id === selectedUser?.id;
                return (
                  <Pressable
                    key={user.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setSelectedId(user.id);
                      if (error) setError(null);
                    }}
                    style={({ pressed }) => [
                      styles.candidateRow,
                      selected && styles.candidateSelected,
                      pressed && styles.pressed,
                    ]}>
                    <View style={styles.candidateInfo}>
                      <AssistantText style={[styles.candidateName, selected && styles.selectedText]}>
                        {user.name}
                      </AssistantText>
                      <AssistantText variant="caption" tone="secondary">
                        NIM: {user.nim}
                      </AssistantText>
                    </View>
                    {selected && <ScheduleIcon name="formCheck" size={18} />}
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={submitting || !selectedUser}
              onPress={() => void handleConfirm(closeSheet)}
              style={({ pressed }) => [
                styles.button,
                styles.primary,
                (submitting || !selectedUser) && styles.disabled,
                pressed && !submitting && selectedUser && styles.pressed,
              ]}>
              <AssistantText variant="label" style={styles.white}>
                {submitting ? 'Menambahkan...' : 'Tambahkan ke kelas'}
              </AssistantText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={submitting}
              onPress={() => closeSheet(onCancel)}
              style={({ pressed }) => [styles.button, styles.cancel, pressed && styles.pressed]}>
              <AssistantText variant="label" tone="accent">Batal</AssistantText>
            </Pressable>
          </View>
        </View>
      )}
    </AssistantSheet>
  );
}

const styles = StyleSheet.create({
  dialog: { width: '100%', padding: 24, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { flex: 1, gap: 3 },
  title: { fontSize: 21, lineHeight: 28, fontFamily: theme.fonts.bold },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: theme.colors.errorSoft,
    borderWidth: 1,
    borderColor: '#F3C7CD',
  },
  errorText: { flex: 1, color: theme.colors.error, fontFamily: theme.fonts.medium },
  searchInput: {
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  centerBox: { paddingVertical: 24, alignItems: 'center', gap: 8 },
  emptyBox: {
    paddingVertical: 20,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.glassSurface,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  centerText: { textAlign: 'center' },
  candidateList: { gap: 8 },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  candidateSelected: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  candidateInfo: { flex: 1, gap: 2 },
  candidateName: { fontFamily: theme.fonts.semibold },
  selectedText: { color: theme.colors.primary },
  actions: { gap: 10, marginTop: 4 },
  button: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.control,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primary: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  cancel: { backgroundColor: theme.colors.glassSurface, borderColor: theme.colors.glassBorder },
  disabled: { opacity: 0.55 },
  white: { color: theme.colors.surface },
  pressed: { opacity: 0.7 },
});
