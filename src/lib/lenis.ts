import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './motion';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

/** Smooth scrolling, driven by GSAP's ticker so ScrollTrigger and the car stay in sync. */
export function startLenis() {
  if (lenis || prefersReducedMotion()) return () => {};
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, touchMultiplier: 1.4, smoothWheel: true, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (t: number) => lenis?.raf(t * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => { gsap.ticker.remove(tick); lenis?.destroy(); lenis = null; };
}

export function scrollToHash(hash: string) {
  const target = hash === '#top' ? 0 : (document.querySelector(hash) as HTMLElement | null);
  if (target === null) return;
  if (lenis) lenis.scrollTo(target, { offset: -64 });
  else if (typeof target === 'number') window.scrollTo({ top: 0, behavior: 'smooth' });
  else target.scrollIntoView({ behavior: 'smooth' });
}

export const pauseScroll = () => lenis?.stop();
export const resumeScroll = () => lenis?.start();
