import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/** Keep static HTML and the first hydration render on the same color scheme. */
export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const colorScheme = useRNColorScheme();
  return hasHydrated ? colorScheme : 'light';
}
