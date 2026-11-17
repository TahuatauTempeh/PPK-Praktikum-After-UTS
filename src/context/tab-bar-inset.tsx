/**
 * Tinggi bottom bar yang mengapung, dibagikan dari layout tab ke layar.
 *
 * Bar mengapung di atas konten, jadi area gulir perlu padding bawah sebesar
 * tingginya. Angkanya diukur dari `onLayout` bar (termasuk safe area bawah),
 * bukan dihitung ulang di tiap layar; `TAB_BAR_HEIGHT` hanya nilai awal supaya
 * frame pertama sudah benar. Di luar grup tab nilainya 0.
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { LayoutChangeEvent } from 'react-native';

/** 74 kapsul (60 tab + 12 padding + 2 border) + 20 margin vertikal. */
export const TAB_BAR_HEIGHT = 94;

type TabBarInsetValue = {
  inset: number;
  report: (height: number) => void;
};

const TabBarInsetContext = createContext<TabBarInsetValue | null>(null);

export function TabBarInsetProvider({ children }: PropsWithChildren) {
  const [inset, setInset] = useState(TAB_BAR_HEIGHT);

  const report = useCallback((height: number) => {
    if (!Number.isFinite(height) || height <= 0) return;
    setInset((current) => (Math.abs(current - height) < 0.5 ? current : height));
  }, []);

  const value = useMemo(() => ({ inset, report }), [inset, report]);

  return <TabBarInsetContext.Provider value={value}>{children}</TabBarInsetContext.Provider>;
}

/** Tinggi bar termasuk safe area bawah; 0 saat layar tidak punya bottom bar. */
export function useTabBarInset(): number {
  return useContext(TabBarInsetContext)?.inset ?? 0;
}

/** Dipakai bar untuk melaporkan tingginya ke layar di dalam grup tab. */
export function useReportTabBarInset(): (event: LayoutChangeEvent) => void {
  const context = useContext(TabBarInsetContext);
  return useCallback(
    (event: LayoutChangeEvent) => context?.report(event.nativeEvent.layout.height),
    [context]
  );
}
