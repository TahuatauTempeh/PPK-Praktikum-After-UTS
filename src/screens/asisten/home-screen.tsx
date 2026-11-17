import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { tokens, useThemedStyles, type Theme } from '@/theme';
import { AgendaBanner } from './components/agenda-banner';
import { AssistantScreen } from './components/assistant-screen';
import { AssistantText } from './components/assistant-text';
import { MenuBlock } from './components/menu-block';
import { homeMenu } from './home-menu';
import { type AssistantSession } from './schedule-data';
import { sapaanWIB } from './session-format';

type Props = {
  name: string;
  scheduleDate: string;
  sessions: readonly AssistantSession[];
};

const menuGap = 10;

/** Hub Asisten: sapaan, agenda hari aktif, dan menu Jadwal/Rekap. */
export function HomeScreen({ name, scheduleDate, sessions }: Props) {
  const styles = useThemedStyles(gaya);
  const firstName = name.trim().split(/\s+/)[0] || name;

  return (
    <AssistantScreen edges={['top', 'left', 'right']}>
      <AssistantText variant="pageTitle" accessibilityRole="header" style={styles.pageTitle}>
        {sapaanWIB()}, {firstName}
      </AssistantText>

      <AgendaBanner
        date={scheduleDate}
        sessions={sessions}
        showNextSession
        onPress={() => router.navigate('/asisten/jadwal')}
      />

      <View style={styles.menuSection}>
        <AssistantText style={styles.eyebrow}>MENU</AssistantText>
        <View style={styles.grid}>
          {homeMenu.map(item => (
            <View
              key={item.id}
              style={[
                styles.cell,
                { paddingHorizontal: menuGap / 2, paddingBottom: menuGap },
              ]}
            >
              <MenuBlock
                title={item.title}
                icon={item.icon}
                onPress={() => router.navigate(item.href)}
              />
            </View>
          ))}
        </View>
      </View>
    </AssistantScreen>
  );
}

const gaya = (theme: Theme) => StyleSheet.create({
  pageTitle: { color: theme.colors.onHero },
  menuSection: { gap: 12, marginTop: 6 },
  eyebrow: {
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 1.4,
    fontFamily: tokens.fonts.semibold,
    color: theme.colors.textSecondary,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -(menuGap / 2) },
  cell: { width: '33.333%' },
});
