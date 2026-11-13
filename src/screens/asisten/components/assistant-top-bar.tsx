import { Pressable, StyleSheet, View } from 'react-native';

import { AssistantText } from './assistant-text';
import { ScheduleIcon } from './schedule-icon';

type Props = { onBack: () => void; title?: string };

/** Tombol kembali untuk Jadwal dan Rekap, di luar area gulir. */
export function AssistantTopBar({ onBack, title }: Props) {
  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Kembali"
        onPress={onBack}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
      >
        <ScheduleIcon name="backPrimary" size={20} />
      </Pressable>
      {title ? (
        <AssistantText variant="label" accessibilityRole="header" style={styles.title}>
          {title}
        </AssistantText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  title: { flexShrink: 1 },
  pressed: { opacity: 0.6 },
});
