import { StyleSheet, View } from 'react-native';

import { assistantTheme as theme } from '../theme';
import { AssistantText } from './assistant-text';

type Props = { greeting: string; title: string; initials: string; identityLabel: string };

export function AssistantHeader({ greeting, title, initials, identityLabel }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.heading}>
        <AssistantText variant="greeting" tone="secondary">{greeting}</AssistantText>
        <AssistantText variant="pageTitle" accessibilityRole="header">{title}</AssistantText>
      </View>
      <View style={styles.avatar} accessible accessibilityLabel={identityLabel}>
        <AssistantText variant="label" tone="accent" style={styles.initials}>
          {initials}
        </AssistantText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  heading: { flex: 1, gap: 7 },
  avatar: {
    minWidth: 46,
    minHeight: 46,
    padding: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontFamily: theme.fonts.bold },
});
