export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const hasFinePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

/** Fired by the road with 0–100 so other parts of the page (trip computer) can follow along. */
export const PROGRESS_EVENT = 'route:progress';
