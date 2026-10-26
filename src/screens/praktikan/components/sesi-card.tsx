/**
 * SesiCard: kartu sesi di jadwal praktikan.
 * Kartu sesi yang sedang dibuka diberi garis aksen dan ajakan presensi sebagai titik fokus layar.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatJamWIB, formatTanggal } from '@/screens/praktikan/format';
import { STATUS_LABEL, StatusLabel } from '@/screens/praktikan/components/status-label';
import { Tipe, usePraktikanTheme } from '@/screens/praktikan/theme';
import { AttendanceRecord, Session } from '@/types';

interface SesiCardProps {
  session: Session;
  record?: AttendanceRecord;
  sorot?: boolean;
  onPress: () => void;
}

export function SesiCard({ session, record, sorot = false, onPress }: SesiCardProps) {
  const theme = usePraktikanTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${session.title}, ${STATUS_LABEL[session.status]}`}
      style={({ pressed }) => [
        styles.kartu,
        {
          backgroundColor: theme.surface,
          borderColor: sorot ? theme.primary : theme.border,
          borderWidth: sorot ? 1.5 : 1,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.baris}>
        <StatusLabel status={session.status} />
        {record ? (
          <Text style={[Tipe.caption, styles.hadir, { color: theme.success }]}>
            Hadir pukul {formatJamWIB(record.timestamp)} WIB
          </Text>
        ) : null}
      </View>

      <Text style={[Tipe.cardTitle, { color: theme.text }]}>{session.title}</Text>

      <View style={styles.meta}>
        <Text style={[Tipe.body, { color: theme.textSecondary }]}>{formatTanggal(session.date)}</Text>
        <Text style={[Tipe.body, { color: theme.textSecondary }]}>
          {session.time} WIB, {session.room}
        </Text>
      </View>

      {sorot && !record ? (
        <Text style={[Tipe.label, { color: theme.primary }]}>Ketuk untuk mencatat kehadiran</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  kartu: {
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  baris: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  hadir: {
    fontWeight: '600',
  },
  meta: {
    gap: 2,
  },
});
