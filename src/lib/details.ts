import { useSyncExternalStore } from 'react';
import type { Item } from '../data/profile';

/** Which billboard / card is open in the details panel. */
let current: Item | null = null;
const listeners = new Set<() => void>();
export const openDetails = (it: Item) => { current = it; listeners.forEach((f) => f()); };
export const closeDetails = () => { current = null; listeners.forEach((f) => f()); };
export const useDetails = () =>
  useSyncExternalStore((f) => { listeners.add(f); return () => { listeners.delete(f); }; }, () => current);
