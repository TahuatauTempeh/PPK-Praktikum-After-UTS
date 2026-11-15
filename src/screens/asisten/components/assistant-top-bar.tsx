import { Pressable, StyleSheet, View } from 'react-native';

import {
  useThemedStyles,
  useTheme,
  type Theme,
} from '@/theme';
import { AssistantText } from './assistant-text';
import { ScheduleIcon } from './schedule-icon';

/** Tinggi isi header; padding atas 14 px ditambahkan AssistantSurface. */
export const ASSISTANT_TOP_BAR_HEIGHT = 44;

type Props = { onBack: () => void; title?: string };

/**
 * Tombol kembali dan judul untuk Jadwal dan Rekap. Latarnya transparan: panah
 * putih duduk langsung di atas gradien halaman, tanpa kotak kaca sendiri.
 */
export function AssistantTopBar({ onBack, title }: Props) {
  const theme = useTheme();
  const styles = useThemedStyles(gaya);

  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Kembali"
        onPress={onBack}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
      >
        <ScheduleIcon name="backPrimary" size={20} tintColor={theme.colors.onHero} />
      </Pressable>
      {title ? (
        <AssistantText variant="label" accessibilityRole="header" style={styles.title}>
          {title}
        </AssistantText>
      ) : null}
    </View>
  );
}

const gaya = (theme: Theme) => StyleSheet.create({
  bar: { minHeight: ASSISTANT_TOP_BAR_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: 8 },
  // 44 px area sentuh; geser -12 supaya panah rata dengan margin konten 24.
  back: {
    minWidth: 44,
    minHeight: 44,
    marginLeft: -12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { flexShrink: 1, color: theme.colors.onHero },
  pressed: { opacity: 0.6 },
});
