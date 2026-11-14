import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

export const authStyles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  form: {
    gap: Spacing.three,
  },
  formError: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  button: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  link: {
    fontSize: 14,
    fontWeight: '700',
  },
});
