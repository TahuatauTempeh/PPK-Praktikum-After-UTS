/**
 * Jadwal Praktikan: daftar sesi dari SessionContext (UC-02).
 * Sesi yang sedang dibuka ditaruh paling atas karena itu yang perlu ditindak praktikan.
 */

import React, { useMemo } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/context/session-context';
import { useUserPraktikan } from '@/screens/praktikan/guard';
import { SesiCard } from '@/screens/praktikan/components/sesi-card';
import { bukaDetailSesi } from '@/screens/praktikan/navigasi';
import { findOwnAttendance, groupSessions } from '@/screens/praktikan/selectors';
import { LebarKonten, Tipe, usePraktikanTheme } from '@/screens/praktikan/theme';

export default function JadwalScreen() {
  const theme = usePraktikanTheme();
  const currentUser = useUserPraktikan();
  const { sessions, attendance } = useSession().state;

  const sections = useMemo(() => {
    const grup = groupSessions(sessions);
    return [
      { key: 'open', title: 'Sedang dibuka', data: grup.open },
      { key: 'upcoming', title: 'Akan datang', data: grup.upcoming },
      { key: 'done', title: 'Selesai', data: grup.done },
    ].filter((section) => section.data.length > 0);
  }, [sessions]);

  if (!currentUser) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(session) => session.id}
        contentContainerStyle={styles.isi}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <Text style={[Tipe.body, { color: theme.textSecondary }]}>
            Masuk sebagai {currentUser.name}
          </Text>
        }
        ListEmptyComponent={
          <EmptyState
            icon=""
            title="Belum ada jadwal praktikum"
            subtitle="Sesi akan tampil di sini setelah dijadwalkan."
          />
        }
        renderSectionHeader={({ section }) => (
          <Text
            accessibilityRole="header"
            style={[Tipe.sectionTitle, styles.judulBagian, { color: theme.text }]}
          >
            {section.title}
          </Text>
        )}
        renderItem={({ item, section }) => (
          <View style={styles.item}>
            <SesiCard
              session={item}
              record={findOwnAttendance(attendance, item.id, currentUser.id)}
              sorot={section.key === 'open'}
              onPress={() => bukaDetailSesi(item.id)}
            />
          </View>
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
  },
  judulBagian: {
    marginTop: 18,
    marginBottom: 8,
  },
  item: {
    marginBottom: 12,
  },
});
