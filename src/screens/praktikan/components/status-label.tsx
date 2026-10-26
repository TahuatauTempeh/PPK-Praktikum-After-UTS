/**
 * StatusLabel: label status sesi. Status selalu berupa teks, warna hanya penguat.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Tipe, usePraktikanTheme } from '@/screens/praktikan/theme';
import { SessionStatus } from '@/types';

export const STATUS_LABEL: Record<SessionStatus, string> = {
  scheduled: 'Belum dibuka',
  open: 'Dibuka',
  closed: 'Ditutup',
};

export function StatusLabel({ status }: { status: SessionStatus }) {
  const theme = usePraktikanTheme();
  const aktif = status === 'open';

  return (
    <View
      style={[styles.label, { backgroundColor: aktif ? theme.primarySoft : theme.neutralSoft }]}
    >
      <Text style={[Tipe.caption, styles.teks, { color: aktif ? theme.primary : theme.textSecondary }]}>
        {STATUS_LABEL[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  teks: {
    fontWeight: '600',
  },
});
