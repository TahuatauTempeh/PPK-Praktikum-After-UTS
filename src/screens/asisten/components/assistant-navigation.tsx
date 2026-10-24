import { Pressable, StyleSheet, View } from 'react-native';

import { assistantTheme as theme } from '../theme';
import { AssistantText } from './assistant-text';
import { ScheduleIcon } from './schedule-icon';

type Props = { active: 'schedule' | 'recap'; onSchedule?: () => void; onRecap?: () => void };
export function AssistantNavigation({ active, onSchedule, onRecap }: Props) {
  return (
    <View style={styles.navigation} accessibilityRole="tablist">
      {(['schedule', 'recap'] as const).map(destination => {
        const selected = active === destination;
        const onPress = destination === 'schedule' ? onSchedule : onRecap;
        return (
          <Pressable key={destination} accessibilityRole="tab"
            accessibilityState={{ selected, disabled: !selected && !onPress }}
            disabled={!selected && !onPress} onPress={onPress}
            style={({ pressed }) => [styles.tab, selected && styles.selected, pressed && styles.pressed]}>
            <ScheduleIcon name={destination === 'schedule'
              ? selected ? 'calendar' : 'calendarInactive' : selected ? 'chartActive' : 'chart'} size={22} />
            <AssistantText variant="caption" tone={selected ? 'accent' : 'secondary'} style={selected && styles.bold}>
              {destination === 'schedule' ? 'Jadwal' : 'Rekap'}
            </AssistantText>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  navigation: { flexDirection: 'row', gap: 52, paddingHorizontal: 42, paddingTop: 8, paddingBottom: 10, backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border, width: '100%', maxWidth: 600, alignSelf: 'center' },
  tab: { flex: 1, minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 6, borderRadius: theme.radius.control },
  selected: { backgroundColor: theme.colors.primarySoft },
  bold: { fontFamily: theme.fonts.bold },
  pressed: { opacity: 0.7 },
});
