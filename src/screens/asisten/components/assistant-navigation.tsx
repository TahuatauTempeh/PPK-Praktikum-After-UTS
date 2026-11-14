import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';

import { assistantTheme as theme } from '../theme';
import { AssistantText } from './assistant-text';
import { ScheduleIcon, type ScheduleIconName } from './schedule-icon';

export type AssistantTab = 'asisten' | 'admin' | 'profile';

type Props = { active: AssistantTab; showAdmin: boolean; onNavigate: (tab: AssistantTab) => void };
type Box = { x: number; y: number; width: number; height: number };

const navigationRadius = theme.radius.panel;
const tabRadius = navigationRadius - theme.spacing.sm;
const indicatorSlide = { duration: 240, easing: Easing.out(Easing.cubic) };
const LABEL: Record<AssistantTab, string> = { asisten: 'Asisten', admin: 'Admin', profile: 'Profil' };

const iconFor = (tab: AssistantTab, selected: boolean): ScheduleIconName => {
  if (tab === 'asisten') return selected ? 'home' : 'homeInactive';
  if (tab === 'admin') return 'users';
  return selected ? 'profile' : 'profileInactive';
};

export function AssistantNavigation({ active, showAdmin, onNavigate }: Props) {
  const [track, setTrack] = useState<Box | null>(null);
  const [offset] = useState(() => new Animated.Value(0));
  const placed = useRef(false);
  const tabs: AssistantTab[] = showAdmin ? ['asisten', 'admin', 'profile'] : ['asisten', 'profile'];
  const tabGap = showAdmin ? 12 : 52;
  const index = Math.max(0, tabs.indexOf(active));

  useEffect(() => {
    if (!track) return;
    const target = index * (track.width + tabGap);
    if (!placed.current) {
      placed.current = true;
      offset.setValue(target);
      return;
    }
    const animation = Animated.timing(offset, {
      toValue: target, ...indicatorSlide, useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [index, offset, track, tabGap]);

  return (
    <View style={[styles.navigation, { gap: tabGap }]} accessibilityRole="tablist">
      {track && (
        <Animated.View pointerEvents="none" accessible={false} style={[styles.indicator, {
          left: track.x, top: track.y, width: track.width, height: track.height,
          transform: [{ translateX: offset }],
        }]} />
      )}
      {tabs.map(destination => {
        const selected = active === destination;
        return (
          <Pressable key={destination} accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={LABEL[destination]}
            onPress={() => onNavigate(destination)}
            onLayout={destination === 'asisten' ? event => setTrack(event.nativeEvent.layout) : undefined}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
            <View style={[!selected && destination === 'admin' && styles.inactiveIcon]}>
              <ScheduleIcon name={iconFor(destination, selected)} size={22} />
            </View>
            <AssistantText variant="caption" tone={selected ? 'accent' : 'secondary'} style={selected && styles.bold}>
              {LABEL[destination]}
            </AssistantText>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  navigation: { flexDirection: 'row', paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.sm, marginVertical: 10, backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: '#FFFFFF', borderRadius: navigationRadius, width: '90%', maxWidth: 552, alignSelf: 'center', boxShadow: '0 4px 24px rgba(30,65,125,0.08)' },
  indicator: { position: 'absolute', backgroundColor: '#DFE9FA', borderRadius: tabRadius },
  tab: { flex: 1, minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 6, borderRadius: tabRadius },
  inactiveIcon: { opacity: 0.55 },
  bold: { fontFamily: theme.fonts.bold },
  pressed: { opacity: 0.7 },
});
