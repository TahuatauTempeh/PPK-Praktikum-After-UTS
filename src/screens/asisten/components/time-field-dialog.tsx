/**
 * Kolom jam yang dibuka sebagai dialog jam Material 3, format 24 jam (dipakai Android).
 * Diekspor lewat time-field.tsx; iOS dan web punya berkas sendiri.
 */

import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/theme';

import { AssistantText } from './assistant-text';
import { ScheduleIcon } from './schedule-icon';
import { dateKeJam, jamKeDate, jamValid, tampilJam, type TimeFieldProps } from './time-field-utils';

export function TimeFieldDialog({
  value,
  onChange,
  accessibilityLabel,
  disabled = false,
  style,
  testID,
}: TimeFieldProps) {
  const theme = useTheme();
  const [terbuka, setTerbuka] = useState(false);
  const adaJam = jamValid(value);
  const teks = adaJam ? tampilJam(value) : 'Pilih jam';

  return (
    <>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityLabel}, ${adaJam ? tampilJam(value) : 'belum dipilih'}`}
        accessibilityHint="Ketuk untuk memilih jam"
        accessibilityState={{ disabled, expanded: terbuka }}
        disabled={disabled}
        onPress={() => setTerbuka(true)}
        style={({ pressed }) => [style, styles.isi, pressed && styles.ditekan]}>
        {/* Nonaktif memakai warna sekunder, bukan opacity, supaya teks tetap terbaca (DESIGN.md 8.4). */}
        <AssistantText tone={disabled || !adaJam ? 'secondary' : 'primary'} style={styles.nilai}>
          {teks}
        </AssistantText>
        <ScheduleIcon name="clock" size={18} tintColor={theme.colors.textSecondary} />
      </Pressable>

      {/* Dialog terbuka saat dipasang; dilepas lagi setelah memilih atau batal. */}
      {terbuka ? (
        <DateTimePicker
          mode="time"
          presentation="dialog"
          is24Hour
          value={jamKeDate(value)}
          // `primary`, bukan `primaryFill`: aksen ini juga mewarnai teks tombol dialog (lolos AA).
          accentColor={theme.colors.primary}
          themeVariant={theme.scheme}
          positiveButton={{ label: 'Pilih' }}
          negativeButton={{ label: 'Batal' }}
          onValueChange={(_event, tanggal) => {
            setTerbuka(false);
            onChange(dateKeJam(tanggal));
          }}
          onDismiss={() => setTerbuka(false)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  isi: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  nilai: { fontSize: 14 },
  ditekan: { opacity: 0.75 },
});
