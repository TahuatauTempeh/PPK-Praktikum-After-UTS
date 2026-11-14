import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { assistantTheme as theme } from './theme';
import { AgendaBanner } from './components/agenda-banner';
import { AssistantScreen } from './components/assistant-screen';
import { AssistantText } from './components/assistant-text';
import { MenuBlock } from './components/menu-block';
import { homeMenu } from './home-menu';
import { type AssistantSession } from './schedule-data';

type Props = {
  name: string;
  scheduleDate: string;
  sessions: readonly AssistantSession[];
};

/** Hub Asisten: sapaan, agenda hari aktif, dan menu Jadwal/Rekap. */
export function HomeScreen({ name, scheduleDate, sessions }: Props) {
  const dateLabel = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <AssistantScreen edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <AssistantText variant="greeting" tone="secondary">Selamat pagi, {name}</AssistantText>
        <AssistantText variant="pageTitle" accessibilityRole="header">Asisten</AssistantText>
        <AssistantText variant="caption" tone="secondary">{dateLabel}</AssistantText>
      </View>

      <AgendaBanner
        date={scheduleDate}
        sessions={sessions}
        showNextSession
        onPress={() => router.push('/asisten/jadwal')}
      />

      <View style={styles.menuSection}>
        <AssistantText style={styles.eyebrow}>MENU</AssistantText>
        <View style={styles.grid}>
          {homeMenu.map(item => (
            <MenuBlock
              key={item.id}
              title={item.title}
              icon={item.icon}
              onPress={() => router.push(item.href)}
            />
          ))}
        </View>
      </View>
    </AssistantScreen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 3 },
  menuSection: { gap: 12, marginTop: 6 },
  eyebrow: {
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 1.4,
    fontFamily: theme.fonts.semibold,
    color: theme.colors.textSecondary,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
