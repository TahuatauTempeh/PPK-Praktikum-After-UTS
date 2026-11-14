import { Pressable, StyleSheet, View } from 'react-native';

import {
  useAssistantStyles,
  useAssistantTheme,
  type AssistantTheme,
} from '../theme';
import { AssistantText } from './assistant-text';
import { ScheduleIcon } from './schedule-icon';

type Props = { onBack: () => void; title?: string };

/** Tombol kembali untuk Jadwal dan Rekap, di luar area gulir. */
export function AssistantTopBar({ onBack, title }: Props) {
  const theme = useAssistantTheme();
  const styles = useAssistantStyles(gaya);

  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Kembali"
        onPress={onBack}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
      >
        <ScheduleIcon name="backPrimary" size={20} tintColor={theme.colors.iconPrimary} />
      </Pressable>
      {title ? (
        <AssistantText variant="label" accessibilityRole="header" style={styles.title}>
          {title}
        </AssistantText>
      ) : null}
    </View>
  );
}

const gaya = (theme: AssistantTheme) => StyleSheet.create({
  bar: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.glassCard,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderRadius: 16,
    boxShadow: theme.colors.shadowSmall,
  },
  title: { flexShrink: 1, color: theme.colors.surface },
  pressed: { opacity: 0.6 },
});
