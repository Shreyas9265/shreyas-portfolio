/** Shared, mutable drive state. Scroll writes targets; the render loop eases toward them. */
export const drive = {
  hero: 0,      // 0→1 as the hero scrolls away
  route: 0,     // 0→1 through the milestone section
  outro: 0,     // 0→1 as the garage section arrives
  g: 0,         // eased position along the route, in "stops" (0 = start line, n+1 = finish)
  speed: 0,     // eased mph for the HUD
  passed: -1,   // index of the last milestone passed
  ready: false,
  day: 0,       // target: 1 = day, 0 = night
  dayMix: 0,    // eased 0→1 for smooth sky changes
};

type Listener = () => void;
const listeners = new Set<Listener>();
export const onDrive = (fn: Listener) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const emitDrive = () => listeners.forEach((fn) => fn());
