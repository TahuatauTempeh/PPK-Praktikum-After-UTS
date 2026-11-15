/**
 * Ref `BlurTargetView` milik layar tab yang sedang fokus.
 *
 * Bottom bar mengapung di luar scene, jadi blur Android tidak bisa menebak
 * konten di belakangnya sendiri. Layar mendaftarkan targetnya saat fokus, lalu
 * `BlurView` di bar memakai ref itu lewat prop `blurTarget`.
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ComponentRef, PropsWithChildren, RefObject } from 'react';
import type { View } from 'react-native';

export type BlurTarget = RefObject<ComponentRef<typeof View> | null>;

type BlurTargetValue = {
  target: BlurTarget | null;
  report: (target: BlurTarget | null) => void;
};

const BlurTargetContext = createContext<BlurTargetValue | null>(null);

export function BlurTargetProvider({ children }: PropsWithChildren) {
  const [target, setTarget] = useState<BlurTarget | null>(null);

  const report = useCallback((next: BlurTarget | null) => {
    setTarget((current) => (current === next ? current : next));
  }, []);

  const value = useMemo(() => ({ target, report }), [target, report]);

  return <BlurTargetContext.Provider value={value}>{children}</BlurTargetContext.Provider>;
}

/** Target layar aktif; null di luar grup tab atau sebelum layar terpasang. */
export function useBlurTarget(): BlurTarget | null {
  return useContext(BlurTargetContext)?.target ?? null;
}

const noop = () => {};

/** Dipakai layar untuk melaporkan `BlurTargetView` miliknya saat fokus. */
export function useReportBlurTarget(): (target: BlurTarget | null) => void {
  return useContext(BlurTargetContext)?.report ?? noop;
}
