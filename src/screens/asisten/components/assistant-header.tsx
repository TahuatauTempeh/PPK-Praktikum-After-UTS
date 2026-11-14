import { StyleSheet, View } from 'react-native';

import { assistantTokens, useAssistantStyles, type AssistantTheme } from '../theme';
import { AssistantText } from './assistant-text';

type Props = { greeting: string; title: string; initials: string; identityLabel: string };

export function AssistantHeader({ greeting, title, initials, identityLabel }: Props) {
  const styles = useAssistantStyles(gaya);

  return (
    <View style={styles.header}>
      <View style={styles.heading}>
        <AssistantText variant="greeting" tone="secondary" style={styles.greeting}>{greeting}</AssistantText>
        <AssistantText variant="pageTitle" accessibilityRole="header" style={styles.title}>{title}</AssistantText>
      </View>
      <View style={styles.avatar} accessible accessibilityLabel={identityLabel}>
        <AssistantText variant="label" tone="accent" style={styles.initials}>
          {initials}
        </AssistantText>
      </View>
    </View>
  );
}

const gaya = (theme: AssistantTheme) => StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  heading: { flex: 1, gap: 7 },
  greeting: { color: theme.colors.heroSoft },
  title: { color: theme.colors.surface },
  avatar: {
    minWidth: 46,
    minHeight: 46,
    padding: 10,
    borderRadius: assistantTokens.radius.pill,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontFamily: assistantTokens.fonts.bold },
});
