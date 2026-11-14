import { Text, type TextProps } from 'react-native';

import { tokens, useTheme } from '@/theme';

type Props = TextProps & {
  variant?: keyof typeof tokens.typography;
  tone?: 'primary' | 'secondary' | 'accent';
};

export function AssistantText({ variant = 'body', tone = 'primary', style, ...props }: Props) {
  const theme = useTheme();
  const color = {
    primary: theme.colors.textPrimary,
    secondary: theme.colors.textSecondary,
    accent: theme.colors.primary,
  }[tone];

  return <Text {...props} style={[tokens.typography[variant], { color }, style]} />;
}
