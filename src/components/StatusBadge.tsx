/**
 * StatusBadge — Badge kecil berwarna sesuai status sesi.
 * - scheduled → kuning/warning
 * - open → hijau/success
 * - closed → merah/danger
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { SessionStatus } from '@/types';

interface StatusBadgeProps {
  status: SessionStatus;
}

const statusConfig: Record<SessionStatus, { label: string; colorKey: 'warning' | 'success' | 'danger'; bgKey: 'warningLight' | 'successLight' | 'dangerLight' }> = {
  scheduled: { label: 'Terjadwal', colorKey: 'warning', bgKey: 'warningLight' },
  open: { label: 'Dibuka', colorKey: 'success', bgKey: 'successLight' },
  closed: { label: 'Ditutup', colorKey: 'danger', bgKey: 'dangerLight' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const theme = useTheme();
  const config = statusConfig[status];

  return (
    <View style={[styles.badge, { backgroundColor: theme[config.bgKey] }]}>
      <View style={[styles.dot, { backgroundColor: theme[config.colorKey] }]} />
      <Text style={[styles.text, { color: theme[config.colorKey] }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
