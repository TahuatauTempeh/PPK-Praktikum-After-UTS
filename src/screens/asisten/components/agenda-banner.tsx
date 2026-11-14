import { Pressable, StyleSheet, View } from 'react-native';

import { HeroCard } from '@/screens/shared/components/hero-card';

import {
  tokens,
  useThemedStyles,
  useTheme,
  type Theme,
} from '@/theme';
import { formatPraktikumName } from '../session-format';
import { type AssistantSession } from '../schedule-data';
import { AssistantText } from './assistant-text';
import { ScheduleIcon } from './schedule-icon';

type Props = {
  date: string;
  sessions: readonly AssistantSession[];
  onPress?: () => void;
  ctaLabel?: string;
  showNextSession?: boolean;
};

/**
 * AgendaBanner: ringkasan tanggal dan jumlah sesi. Dipakai hub Asisten (dapat ditekan,
 * menampilkan sesi berikutnya dan CTA) dan Jadwal (tanpa CTA).
 */
export function AgendaBanner({
  date, sessions, onPress, ctaLabel = 'Lihat jadwal', showNextSession = false,
}: Props) {
  const theme = useTheme();
  const styles = useThemedStyles(gaya);
  const daySessions = sessions
    .filter(session => session.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const openCount = daySessions.filter(session => session.status === 'open').length;
  const nextSession = daySessions.find(
    session => session.status === 'pending' || session.status === 'open',
  );

  const activeDate = new Date(`${date}T00:00:00+07:00`);
  const dateOptions = { timeZone: 'Asia/Jakarta' } as const;
  const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    ...dateOptions, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const fullDate = dateFormatter.format(activeDate);
  const today = fullDate === dateFormatter.format(new Date());
  const interactive = !!onPress;

  const content = (
    <>
      <View style={styles.bannerHeading}>
        <AssistantText style={styles.bannerEyebrow}>AGENDA PRAKTIKUM</AssistantText>
      </View>
      <View style={styles.dateRow} accessibilityLabel={fullDate}>
        <AssistantText style={styles.day}>
          {new Intl.DateTimeFormat('id-ID', { ...dateOptions, day: '2-digit' }).format(activeDate)}
        </AssistantText>
        <View style={styles.dateDetails}>
          <AssistantText style={styles.weekday}>
            {new Intl.DateTimeFormat('id-ID', { ...dateOptions, weekday: 'long' }).format(activeDate)}
          </AssistantText>
          <AssistantText style={styles.month}>
            {new Intl.DateTimeFormat('id-ID', { ...dateOptions, month: 'long', year: 'numeric' }).format(activeDate)}
          </AssistantText>
        </View>
        {today && (
          <View style={styles.todayBadge}>
            <AssistantText style={styles.todayLabel}>Hari ini</AssistantText>
          </View>
        )}
      </View>
      <View style={styles.bannerFooter}>
        <AssistantText style={styles.sessionSummary}>{daySessions.length} sesi terjadwal</AssistantText>
        <View style={styles.openSummary}>
          <View style={styles.liveDot} />
          <AssistantText style={styles.openLabel}>{openCount} dibuka</AssistantText>
        </View>
      </View>
      {showNextSession && nextSession ? (
        <>
          <View style={styles.divider} />
          <AssistantText style={styles.nextSession}>
            Berikutnya {nextSession.startTime.replace(':', '.')} | {formatPraktikumName(nextSession)}
          </AssistantText>
        </>
      ) : null}
      {showNextSession && onPress ? (
        <View style={styles.cta}>
          <AssistantText style={styles.ctaLabel}>{ctaLabel}</AssistantText>
          <ScheduleIcon name="arrowWhite" size={16} />
        </View>
      ) : null}
    </>
  );

  const card = (
    <HeroCard
      backgroundColor={theme.colors.glassHero}
      watermark={<ScheduleIcon name="calendarWhite" size={126} />}
      padding={22}
      gap={18}
    >
      {content}
    </HeroCard>
  );

  if (!interactive) {
    return card;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${fullDate}, ${daySessions.length} sesi terjadwal, ${openCount} dibuka`}
      onPress={onPress}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      {card}
    </Pressable>
  );
}

const gaya = (theme: Theme) => StyleSheet.create({
  bannerHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  bannerEyebrow: {
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 1.8,
    fontFamily: tokens.fonts.semibold,
    color: theme.colors.heroSoft,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  day: {
    fontSize: 58,
    lineHeight: 64,
    letterSpacing: -3,
    fontFamily: tokens.fonts.bold,
    color: theme.colors.onHero,
    fontVariant: ['tabular-nums'],
  },
  dateDetails: { gap: 3, flex: 1, minWidth: 100 },
  weekday: { fontSize: 21, lineHeight: 28, fontFamily: tokens.fonts.semibold, color: theme.colors.onHero },
  month: { fontSize: 13, lineHeight: 20, color: theme.colors.heroSoft },
  todayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: theme.colors.heroWash,
    borderRadius: tokens.radius.pill,
  },
  todayLabel: { color: theme.colors.onHero, fontSize: 11, lineHeight: 16, fontFamily: tokens.fonts.semibold },
  bannerFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: theme.colors.heroLine,
  },
  sessionSummary: { fontSize: 12, lineHeight: 18, fontFamily: tokens.fonts.medium, color: theme.colors.onHero },
  openSummary: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.lime },
  openLabel: { fontSize: 12, lineHeight: 18, color: theme.colors.onHero },
  divider: { height: 1, backgroundColor: theme.colors.heroLine },
  nextSession: { fontSize: 12, lineHeight: 16, color: theme.colors.heroMuted },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 3 },
  ctaLabel: { fontSize: 13, lineHeight: 18, fontFamily: tokens.fonts.semibold, color: theme.colors.onHero },
  pressed: { opacity: 0.78 },
});
