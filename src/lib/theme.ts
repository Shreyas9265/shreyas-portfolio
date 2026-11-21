import { useSyncExternalStore } from 'react';
import { drive } from '../three/store';

export type Theme = 'day' | 'night';
const KEY = 'sp-theme';

const read = (): Theme => {
  try { const v = localStorage.getItem(KEY); if (v === 'day' || v === 'night') return v; } catch { /* storage blocked */ }
  return 'night';
};

let theme: Theme = read();
const listeners = new Set<() => void>();

function apply() {
  document.documentElement.dataset.theme = theme === 'day' ? 'light' : 'dark';
  drive.day = theme === 'day' ? 1 : 0;
}
apply();
drive.dayMix = drive.day; // no fade on first load

export function setTheme(t: Theme) {
  theme = t; apply();
  try { localStorage.setItem(KEY, t); } catch { /* storage blocked */ }
  listeners.forEach((fn) => fn());
}

export const useTheme = () =>
  useSyncExternalStore((fn) => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => theme);
