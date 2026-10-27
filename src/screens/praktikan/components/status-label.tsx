/**
 * StatusLabel: label status sesi. Status selalu berupa teks, titik dan warna hanya penguat.
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
  const warnaTeks = aktif ? theme.teksLencanaBuka : theme.teksSekunder;

  return (
    <View style={[styles.label, { backgroundColor: aktif ? theme.lencanaBuka : theme.isiLembut }]}>
      <View style={[styles.titik, { backgroundColor: warnaTeks }]} />
      <Text style={[Tipe.kecil, styles.teks, { color: warnaTeks }]}>{STATUS_LABEL[status]}</Text>
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
  teks: { fontWeight: '600' },
});
