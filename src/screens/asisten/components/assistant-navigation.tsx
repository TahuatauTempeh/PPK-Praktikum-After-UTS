import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';

import { assistantTheme as theme } from '../theme';
import { AssistantText } from './assistant-text';
import { ScheduleIcon } from './schedule-icon';

export type AssistantTab = 'home' | 'profile';

type Props = { active: AssistantTab; onHome?: () => void; onProfile?: () => void };
type Box = { x: number; y: number; width: number; height: number };

const tabs = ['home', 'profile'] as const;
const tabGap = 52;
const navigationRadius = theme.radius.panel;
const tabRadius = navigationRadius - theme.spacing.sm;
const indicatorSlide = { duration: 240, easing: Easing.out(Easing.cubic) };

export function AssistantNavigation({ active, onHome, onProfile }: Props) {
  const [track, setTrack] = useState<Box | null>(null);
  const [offset] = useState(() => new Animated.Value(0));
  const placed = useRef(false);
  const index = active === 'profile' ? 1 : 0;

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
  }, [index, offset, track]);

  return (
    <View style={styles.navigation} accessibilityRole="tablist">
      {track && (
        <Animated.View pointerEvents="none" accessible={false} style={[styles.indicator, {
          left: track.x, top: track.y, width: track.width, height: track.height,
          transform: [{ translateX: offset }],
        }]} />
      )}
      {tabs.map(destination => {
        const selected = active === destination;
        const onPress = destination === 'home' ? onHome : onProfile;
        const icon = destination === 'home'
          ? selected ? 'home' : 'homeInactive'
          : selected ? 'profile' : 'profileInactive';
        return (
          <Pressable key={destination} accessibilityRole="tab"
            accessibilityState={{ selected, disabled: !selected && !onPress }}
            disabled={!selected && !onPress} onPress={onPress}
            onLayout={destination === 'home' ? event => setTrack(event.nativeEvent.layout) : undefined}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
            <ScheduleIcon name={icon} size={22} />
            <AssistantText variant="caption" tone={selected ? 'accent' : 'secondary'} style={selected && styles.bold}>
              {destination === 'home' ? 'Beranda' : 'Profil'}
            </AssistantText>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  navigation: { flexDirection: 'row', gap: 52, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.sm, marginVertical: 10, backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: '#FFFFFF', borderRadius: navigationRadius, width: '90%', maxWidth: 552, alignSelf: 'center', boxShadow: '0 4px 24px rgba(30,65,125,0.08)' },
  indicator: { position: 'absolute', backgroundColor: '#DFE9FA', borderRadius: tabRadius },
  tab: { flex: 1, minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 6, borderRadius: tabRadius },
  bold: { fontFamily: theme.fonts.bold },
  pressed: { opacity: 0.7 },
});
