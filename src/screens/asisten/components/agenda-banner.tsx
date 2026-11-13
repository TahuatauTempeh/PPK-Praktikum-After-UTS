import { Pressable, StyleSheet, View } from 'react-native';

import { assistantTheme as theme } from '../theme';
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
 * AgendaBanner: ringkasan tanggal dan jumlah sesi. Dipakai Beranda (dapat ditekan,
 * menampilkan sesi berikutnya dan CTA) dan Jadwal (tanpa CTA).
 */
export function AgendaBanner({
  date, sessions, onPress, ctaLabel = 'Lihat jadwal', showNextSession = false,
}: Props) {
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
      <View pointerEvents="none" accessible={false} style={styles.calendarWatermark}>
        <ScheduleIcon name="calendarWhite" size={126} />
      </View>
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
            Berikutnya {nextSession.startTime.replace(':', '.')} — {formatPraktikumName(nextSession)}
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

  if (!interactive) {
    return <View style={styles.dayBanner}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${fullDate}, ${daySessions.length} sesi terjadwal, ${openCount} dibuka`}
      onPress={onPress}
      style={({ pressed }) => [styles.dayBanner, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dayBanner: {
    overflow: 'hidden',
    padding: 22,
    gap: 18,
    backgroundColor: theme.colors.glassHero,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: theme.radius.banner,
  },
  bannerHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  bannerEyebrow: {
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 1.8,
    fontFamily: theme.fonts.semibold,
    color: '#EDF3FF',
  },
  calendarWatermark: { position: 'absolute', top: -12, right: -16, opacity: 0.12 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  day: {
    fontSize: 58,
    lineHeight: 64,
    letterSpacing: -3,
    fontFamily: theme.fonts.bold,
    color: theme.colors.surface,
    fontVariant: ['tabular-nums'],
  },
  dateDetails: { gap: 3, flex: 1, minWidth: 100 },
  weekday: { fontSize: 21, lineHeight: 28, fontFamily: theme.fonts.semibold, color: theme.colors.surface },
  month: { fontSize: 13, lineHeight: 20, color: '#EDF3FF' },
  todayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: theme.radius.pill,
  },
  todayLabel: { color: theme.colors.surface, fontSize: 11, lineHeight: 16, fontFamily: theme.fonts.semibold },
  bannerFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.16)',
  },
  sessionSummary: { fontSize: 12, lineHeight: 18, fontFamily: theme.fonts.medium, color: theme.colors.surface },
  openSummary: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#DDF59A' },
  openLabel: { fontSize: 12, lineHeight: 18, color: '#FFFFFF' },
  divider: { height: 1, marginTop: 7, backgroundColor: 'rgba(255,255,255,0.18)' },
  nextSession: { fontSize: 12, lineHeight: 16, color: 'rgba(255,255,255,0.8)' },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 3 },
  ctaLabel: { fontSize: 13, lineHeight: 18, fontFamily: theme.fonts.semibold, color: theme.colors.surface },
  pressed: { opacity: 0.78 },
});
