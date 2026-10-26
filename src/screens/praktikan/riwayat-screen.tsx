/**
 * Riwayat Kehadiran: catatan presensi milik user yang sedang masuk (UC-05).
 */

import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/context/session-context';
import { useUserPraktikan } from '@/screens/praktikan/guard';
import { formatJamWIB, formatTanggal } from '@/screens/praktikan/format';
import { bukaDetailSesi } from '@/screens/praktikan/navigasi';
import { ownHistory } from '@/screens/praktikan/selectors';
import { LebarKonten, Tipe, usePraktikanTheme } from '@/screens/praktikan/theme';

export default function RiwayatScreen() {
  const theme = usePraktikanTheme();
  const currentUser = useUserPraktikan();
  const { sessions, attendance } = useSession().state;

  const riwayat = useMemo(
    () => ownHistory(sessions, attendance, currentUser?.id),
    [sessions, attendance, currentUser?.id]
  );

  if (!currentUser) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={riwayat}
        keyExtractor={(item) => item.record.id}
        contentContainerStyle={styles.isi}
        ListHeaderComponent={
          riwayat.length > 0 ? (
            <Text style={[Tipe.body, styles.ringkasan, { color: theme.textSecondary }]}>
              {riwayat.length} kehadiran tercatat atas nama {currentUser.name}
            </Text>
          ) : undefined
        }
        ListEmptyComponent={
          <EmptyState
            icon=""
            title="Belum ada catatan kehadiran"
            subtitle="Catatan akan muncul di sini setelah kamu melakukan presensi di sebuah sesi."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => bukaDetailSesi(item.session.id)}
            accessibilityRole="button"
            accessibilityLabel={`${item.session.title}, hadir pukul ${formatJamWIB(item.record.timestamp)} WIB`}
            style={({ pressed }) => [
              styles.baris,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[Tipe.label, { color: theme.text }]}>{item.session.title}</Text>
            <Text style={[Tipe.body, { color: theme.textSecondary }]}>
              {formatTanggal(item.session.date)}
            </Text>
            <Text style={[Tipe.body, styles.hadir, { color: theme.success }]}>
              Hadir pukul {formatJamWIB(item.record.timestamp)} WIB
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  isi: {
    flexGrow: 1,
    width: '100%',
    maxWidth: LebarKonten,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: 12,
  },
  ringkasan: {
    marginBottom: 4,
  },
  baris: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 2,
  },
  hadir: {
    fontWeight: '600',
    marginTop: 4,
  },
});
