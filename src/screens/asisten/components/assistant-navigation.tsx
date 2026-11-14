import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';

import { usePraktikanTheme } from '@/screens/praktikan/theme';

import { tokens } from '@/theme';
import { AssistantText } from './assistant-text';
import { ScheduleIcon, type ScheduleIconName } from './schedule-icon';

export type AssistantTab = 'asisten' | 'admin' | 'profile';

type Props = { active: AssistantTab; showAdmin: boolean; onNavigate: (tab: AssistantTab) => void };

const navigationRadius = tokens.radius.panel;
const navigationPadding = 6;
const tabRadius = navigationRadius - navigationPadding;
const indicatorSlide = { duration: 240, easing: Easing.out(Easing.cubic) };
const LABEL: Record<AssistantTab, string> = { asisten: 'Asisten', admin: 'Admin', profile: 'Profil' };

const iconFor = (tab: AssistantTab, selected: boolean): ScheduleIconName => {
  if (tab === 'asisten') return selected ? 'home' : 'homeInactive';
  if (tab === 'admin') return selected ? 'usersPrimary' : 'usersInactive';
  return selected ? 'profile' : 'profileInactive';
};

export function AssistantNavigation({ active, showAdmin, onNavigate }: Props) {
  const barTheme = usePraktikanTheme();
  const [tabWidth, setTabWidth] = useState<number | null>(null);
  const [offset] = useState(() => new Animated.Value(0));
  const placed = useRef(false);
  const tabs: AssistantTab[] = showAdmin ? ['asisten', 'admin', 'profile'] : ['asisten', 'profile'];
  const tabGap = showAdmin ? 12 : 52;
  const index = Math.max(0, tabs.indexOf(active));

  useEffect(() => {
    if (!tabWidth) return;
    const target = index * (tabWidth + tabGap);
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
  }, [index, offset, tabWidth, tabGap]);

  return (
    <View
      style={[
        styles.navigation,
        {
          backgroundColor: barTheme.navLatar,
          borderColor: barTheme.garisKartu,
          boxShadow: barTheme.bayang,
        },
      ]}
      accessibilityRole="tablist"
    >
      <View style={[styles.tabs, { gap: tabGap }]}>
        {tabWidth !== null && (
          <Animated.View pointerEvents="none" accessible={false} style={[styles.indicator, {
            width: tabWidth,
            backgroundColor: barTheme.navAktif,
            transform: [{ translateX: offset }],
          }]} />
        )}
        {tabs.map(destination => {
          const selected = active === destination;
          const tint = selected ? barTheme.aksen : barTheme.ikonNonaktif;
          return (
            <Pressable key={destination} accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={LABEL[destination]}
              onPress={() => onNavigate(destination)}
              onLayout={destination === 'asisten'
                ? event => setTabWidth(event.nativeEvent.layout.width)
                : undefined}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
              <ScheduleIcon name={iconFor(destination, selected)} size={18} tintColor={tint} />
              <AssistantText
                variant="caption"
                tone={selected ? 'accent' : 'secondary'}
                style={[styles.tabLabel, { color: tint }, selected && styles.bold]}
              >
                {LABEL[destination]}
              </AssistantText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  navigation: { paddingHorizontal: navigationPadding, paddingVertical: navigationPadding, marginVertical: 10, borderWidth: 1, borderRadius: navigationRadius, width: '90%', maxWidth: 552, alignSelf: 'center' },
  tabs: { flexDirection: 'row', position: 'relative' },
  indicator: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: tabRadius },
  tab: { flex: 1, minHeight: 60, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: tabRadius },
  tabLabel: { fontSize: 11, lineHeight: 16 },
  bold: { fontFamily: tokens.fonts.bold },
  pressed: { opacity: 0.7 },
});
