import { Pressable, StyleSheet, View } from 'react-native';

import { assistantTheme as theme } from '../theme';
import { AssistantText } from './assistant-text';
import { ScheduleIcon, type ScheduleIconName } from './schedule-icon';

type Props = { title: string; icon: ScheduleIconName; onPress: () => void };

/** Block menu hub Asisten: ikon dalam lingkaran dan nama menu, tanpa elemen lain. */
export function MenuBlock({ title, icon, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.block, pressed && styles.pressed]}
    >
      <View style={styles.iconCircle}>
        <ScheduleIcon name={icon} size={20} />
      </View>
      <AssistantText style={styles.label} numberOfLines={2}>
        {title}
      </AssistantText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: {
    width: '100%',
    minHeight: 104,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    borderRadius: theme.radius.block,
    boxShadow: '0 8px 28px rgba(30,65,125,0.07)',
  },
  iconCircle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primarySoft,
  },
  label: {
    fontSize: 12.5,
    lineHeight: 16,
    fontFamily: theme.fonts.semibold,
    textAlign: 'center',
  },
  pressed: { opacity: 0.72 },
});
