/**
 * Kolom tanggal yang dibuka sebagai dialog kalender Material 3 (dipakai Android).
 * Diekspor lewat date-field.tsx; iOS dan web punya berkas sendiri.
 */

import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/theme';

import { formatSessionDate } from '../session-format';
import { AssistantText } from './assistant-text';
import { dateKeTanggal, tanggalKeDate, tanggalValid, type DateFieldProps } from './date-field-utils';
import { ScheduleIcon } from './schedule-icon';

export function DateFieldDialog({
  value,
  onChange,
  accessibilityLabel,
  disabled = false,
  style,
  testID,
}: DateFieldProps) {
  const theme = useTheme();
  const [terbuka, setTerbuka] = useState(false);
  const adaTanggal = tanggalValid(value);
  const teks = adaTanggal ? formatSessionDate(value) : 'Pilih tanggal';

  return (
    <>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityLabel}, ${adaTanggal ? teks : 'belum dipilih'}`}
        accessibilityHint="Ketuk untuk memilih tanggal"
        accessibilityState={{ disabled, expanded: terbuka }}
        disabled={disabled}
        onPress={() => setTerbuka(true)}
        style={({ pressed }) => [style, styles.isi, pressed && styles.ditekan]}>
        {/* Nonaktif memakai warna sekunder, bukan opacity, supaya teks tetap terbaca (DESIGN.md 8.4). */}
        <AssistantText tone={disabled || !adaTanggal ? 'secondary' : 'primary'} style={styles.nilai}>
          {teks}
        </AssistantText>
        <ScheduleIcon name="calendar" size={18} tintColor={theme.colors.textSecondary} />
      </Pressable>

      {/* Dialog terbuka saat dipasang; dilepas lagi setelah memilih atau batal. */}
      {terbuka ? (
        <DateTimePicker
          mode="date"
          presentation="dialog"
          value={tanggalKeDate(value)}
          // `primary`, bukan `primaryFill`: aksen ini juga mewarnai teks tombol dialog (lolos AA).
          accentColor={theme.colors.primary}
          themeVariant={theme.scheme}
          positiveButton={{ label: 'Pilih' }}
          negativeButton={{ label: 'Batal' }}
          onValueChange={(_event, tanggal) => {
            setTerbuka(false);
            onChange(dateKeTanggal(tanggal));
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
