import { Text, type TextProps } from 'react-native';

import { assistantTheme as theme } from '../theme';

type Props = TextProps & {
  variant?: keyof typeof theme.typography;
  tone?: 'primary' | 'secondary' | 'accent';
};

export function AssistantText({ variant = 'body', tone = 'primary', style, ...props }: Props) {
  const color = {
    primary: theme.colors.textPrimary,
    secondary: theme.colors.textSecondary,
    accent: theme.colors.primary,
  }[tone];

  return <Text {...props} style={[theme.typography[variant], { color }, style]} />;
}
