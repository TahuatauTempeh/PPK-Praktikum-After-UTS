/**
 * StatusLabel: label status sesi. Status selalu berupa teks, titik dan warna hanya penguat.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fonts, typography, useTheme } from '@/theme';
import { SessionStatus } from '@/types';

export const STATUS_LABEL: Record<SessionStatus, string> = {
  scheduled: 'Belum dibuka',
  open: 'Dibuka',
  closed: 'Ditutup',
};

export function StatusLabel({ status }: { status: SessionStatus }) {
  const theme = useTheme();
  const aktif = status === 'open';
  const warnaTeks = aktif ? theme.colors.onLime : theme.colors.textSecondary;

  return (
    <View style={[styles.label, { backgroundColor: aktif ? theme.colors.lime : theme.colors.softSurface }]}>
      <View style={[styles.titik, { backgroundColor: warnaTeks }]} />
      <Text style={[typography.tiny, styles.teks, { color: warnaTeks }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  titik: { width: 5, height: 5, borderRadius: 3 },
  teks: { fontFamily: fonts.semibold },
});
