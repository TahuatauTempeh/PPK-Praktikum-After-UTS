import { Pressable, StyleSheet, View } from 'react-native';

import {
  assistantTokens,
  useAssistantStyles,
  useAssistantTheme,
  type AssistantTheme,
} from '../theme';
import { AssistantText } from './assistant-text';
import { ScheduleIcon, type ScheduleIconName } from './schedule-icon';

type Props = { title: string; icon: ScheduleIconName; onPress: () => void };

/** Block menu hub Asisten: ikon dalam lingkaran dan nama menu, tanpa elemen lain. */
export function MenuBlock({ title, icon, onPress }: Props) {
  const theme = useAssistantTheme();
  const styles = useAssistantStyles(gaya);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.block, pressed && styles.pressed]}
    >
      <View style={styles.iconCircle}>
        <ScheduleIcon name={icon} size={20} tintColor={theme.colors.iconPrimary} />
      </View>
      <AssistantText style={styles.label} numberOfLines={2}>
        {title}
      </AssistantText>
    </Pressable>
  );
}

const gaya = (theme: AssistantTheme) => StyleSheet.create({
  block: {
    width: '100%',
    minHeight: 104,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: theme.colors.glassCard,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderRadius: assistantTokens.radius.block,
    boxShadow: theme.colors.shadow,
  },
  iconCircle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: assistantTokens.radius.pill,
    backgroundColor: theme.colors.primarySoft,
  },
  label: {
    fontSize: 12.5,
    lineHeight: 16,
    fontFamily: assistantTokens.fonts.semibold,
    textAlign: 'center',
  },
  pressed: { opacity: 0.72 },
});
