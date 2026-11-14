import { Text, type TextProps } from 'react-native';

import { assistantTokens, useAssistantTheme } from '../theme';

type Props = TextProps & {
  variant?: keyof typeof assistantTokens.typography;
  tone?: 'primary' | 'secondary' | 'accent';
};

export function AssistantText({ variant = 'body', tone = 'primary', style, ...props }: Props) {
  const theme = useAssistantTheme();
  const color = {
    primary: theme.colors.textPrimary,
    secondary: theme.colors.textSecondary,
    accent: theme.colors.primary,
  }[tone];

  return <Text {...props} style={[assistantTokens.typography[variant], { color }, style]} />;
}
