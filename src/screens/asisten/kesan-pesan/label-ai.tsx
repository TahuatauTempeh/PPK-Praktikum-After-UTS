/**
 * Badge label AI untuk satu kesan pesan. Status selalu berupa teks; warna hanya penguat.
 * Pasangan warna memakai kombinasi yang sudah lolos audit kontras DESIGN.md 8.7 dan 9.
 */

import { StyleSheet, View } from 'react-native';

import type { AiLabel } from '@/lib/ai-service';
import { teksLabelAi } from '@/screens/shared/sentimen';
import { tokens, useTheme } from '@/theme';

import { AssistantText } from '../components/assistant-text';

export function LabelAi({ label }: { label: AiLabel | null }) {
  const theme = useTheme();
  const warna =
    label === 'positif'
      ? { latar: theme.colors.successSoft, teks: theme.colors.success }
      : label === 'negatif'
        ? { latar: theme.colors.errorSoft, teks: theme.colors.error }
        : { latar: theme.colors.neutralSoft, teks: theme.colors.textSecondary };

  return (
    <View
      accessibilityLabel={`Analisis AI: ${teksLabelAi(label)}`}
      style={[styles.badge, { backgroundColor: warna.latar }]}
    >
      <AssistantText variant="caption" style={[styles.teks, { color: warna.teks }]}>
        {teksLabelAi(label)}
      </AssistantText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: tokens.radius.pill,
  },
  teks: { fontFamily: tokens.fonts.semibold },
});
