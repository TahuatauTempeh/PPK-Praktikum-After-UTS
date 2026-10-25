/**
 * SessionCard — Kartu info sesi praktikum.
 * Menampilkan: judul, mata kuliah, tanggal, waktu, ruangan, dan StatusBadge.
 * Mendukung onPress untuk navigasi ke detail.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/StatusBadge';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Session } from '@/types';

interface SessionCardProps {
  session: Session;
  onPress?: () => void;
}

export function SessionCard({ session, onPress }: SessionCardProps) {
  const theme = useTheme();

  const formattedDate = new Date(session.date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {session.title}
        </Text>
        <StatusBadge status={session.status} />
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailIcon]}>📚</Text>
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>
            {session.course}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailIcon]}>📅</Text>
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>
            {formattedDate}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailIcon]}>🕐</Text>
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>
            {session.time}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailIcon]}>📍</Text>
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>
            {session.room}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  details: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIcon: {
    fontSize: 14,
    width: 20,
    textAlign: 'center',
  },
  detailText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
