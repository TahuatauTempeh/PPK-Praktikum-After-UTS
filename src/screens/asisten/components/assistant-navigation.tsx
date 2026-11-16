import { useEffect, useRef, useState } from 'react';
import { BlurView } from 'expo-blur';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { INDICATOR_SLIDE } from '@/constants/tab-transition';
import { useBlurTarget } from '@/context/blur-target';
import { useReportTabBarInset } from '@/context/tab-bar-inset';
import { tokens, useTheme } from '@/theme';
import { AssistantText } from './assistant-text';
import { ScheduleIcon, type ScheduleIconName } from './schedule-icon';

export type AssistantTab = 'asisten' | 'admin' | 'profile';

type Props = { active: AssistantTab; showAdmin: boolean; onNavigate: (tab: AssistantTab) => void };

const navigationRadius = tokens.radius.panel;
const navigationPadding = 6;
const tabRadius = navigationRadius - navigationPadding;
const LABEL: Record<AssistantTab, string> = { asisten: 'Asisten', admin: 'Admin', profile: 'Profil' };

const iconFor = (tab: AssistantTab, selected: boolean): ScheduleIconName => {
  if (tab === 'asisten') return selected ? 'home' : 'homeInactive';
  if (tab === 'admin') return selected ? 'usersPrimary' : 'usersInactive';
  return selected ? 'profile' : 'profileInactive';
};

export function AssistantNavigation({ active, showAdmin, onNavigate }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reportHeight = useReportTabBarInset();
  const blurTarget = useBlurTarget();
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
      toValue: target, ...INDICATOR_SLIDE, useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [index, offset, tabWidth, tabGap]);

  const blurReady = Platform.OS !== 'android' || (Number(Platform.Version) >= 31 && blurTarget !== null);

  return (
    <View
      pointerEvents="box-none"
      onLayout={reportHeight}
      style={[styles.dock, { paddingBottom: insets.bottom + 10 }]}
    >
      <View style={[styles.shadow, { boxShadow: theme.colors.shadow }]}>
        <View
          style={[styles.navigation, { borderColor: theme.colors.glassBorder }]}
          accessibilityRole="tablist"
        >
          <BlurView
            accessible={false}
            pointerEvents="none"
            intensity={60}
            tint={theme.scheme === 'dark' ? 'dark' : 'light'}
            blurMethod={Platform.OS === 'android' && blurReady ? 'dimezisBlurViewSdk31Plus' : undefined}
            blurTarget={Platform.OS === 'android' && blurReady ? blurTarget ?? undefined : undefined}
            style={StyleSheet.absoluteFill}
          />
          <View
            accessible={false}
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: theme.colors.navSurface, opacity: blurReady ? 0.35 : 1 },
            ]}
          />
          <View style={[styles.tabs, { gap: tabGap }]}>
            {tabWidth !== null && (
              <Animated.View pointerEvents="none" accessible={false} style={[styles.indicator, {
                width: tabWidth,
                backgroundColor: theme.colors.primarySoft,
                transform: [{ translateX: offset }],
              }]} />
            )}
            {tabs.map(destination => {
              const selected = active === destination;
              const tint = selected ? theme.colors.primary : theme.colors.iconMuted;
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
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  dock: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 10 },
  shadow: { width: '90%', maxWidth: 552, alignSelf: 'center', borderRadius: navigationRadius },
  navigation: { paddingHorizontal: navigationPadding, paddingVertical: navigationPadding, borderWidth: 1, borderRadius: navigationRadius, overflow: 'hidden' },
  tabs: { flexDirection: 'row', position: 'relative' },
  indicator: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: tabRadius },
  tab: { flex: 1, minHeight: 60, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: tabRadius },
  tabLabel: { fontSize: 11, lineHeight: 16 },
  bold: { fontFamily: tokens.fonts.bold },
  pressed: { opacity: 0.7 },
});
