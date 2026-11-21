import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { chapters, sideOf, slots } from '../data/profile';
import { drive } from '../three/store';
import { prefersReducedMotion } from '../lib/motion';
import SmoothLink from './SmoothLink';
import StopCard from './StopCard';
import Magnet from './reactbits/Magnet';
import FinishCard from './FinishCard';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** One screen of scroll per stretch of road. Scroll progress here is what drives the car. */
export default function DriveSection() {
  const root = useRef<HTMLElement>(null);
  useGSAP(() => {
    ScrollTrigger.create({ trigger: document.getElementById('scene'), start: 'top top', end: 'bottom top', onUpdate: (s) => { drive.hero = s.progress; } });
    ScrollTrigger.create({ trigger: root.current, start: 'top top', end: 'bottom bottom', onUpdate: (s) => { drive.route = s.progress; } });
    ScrollTrigger.create({ trigger: document.getElementById('garage'), start: 'top bottom', end: 'top 30%', onUpdate: (s) => { drive.outro = s.progress; } });
    if (prefersReducedMotion()) return;
    const reach = window.innerWidth < 640 ? 0.35 : 1;
    gsap.utils.toArray<HTMLElement>('.stop-card').forEach((card) => {
      const dir = card.dataset.side === 'l' ? -1 : 1;
      gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 95%', end: 'bottom 5%', scrub: 0.6 } })
        .fromTo(card, { x: 70 * dir * reach, rotateY: -18 * dir, rotateX: 8, opacity: 0.35, scale: 0.94 }, { x: 0, rotateY: 0, rotateX: 0, opacity: 1, scale: 1, ease: 'power2.out', duration: 0.35 })
        .to(card, { opacity: 1, duration: 0.3 })
        .to(card, { x: -40 * dir * reach, rotateY: 12 * dir, opacity: 0.35, scale: 0.96, ease: 'power2.in', duration: 0.35 });
      card.querySelectorAll('[data-pop]').forEach((el, i) =>
        gsap.fromTo(el, { y: 14 }, { y: 0, ease: 'back.out(3)', duration: 0.5, delay: i * 0.04, scrollTrigger: { trigger: card, start: 'top 70%', toggleActions: 'play none none reverse' } }));
    });
    gsap.utils.toArray<HTMLElement>('.chapter-head').forEach((h) =>
      gsap.fromTo(h, { y: 30, letterSpacing: '0.3em' }, { y: 0, letterSpacing: '0em', ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 90%', end: 'top 50%', scrub: 0.5 } }));
  }, { scope: root });

  let count = 0;
  const totals = Object.fromEntries(chapters.map((c) => [c.name, slots.filter((s) => s.chapter === c.name).reduce((n, s) => n + s.items.length, 0)]));

  return (
    <section ref={root} id="route" aria-label="Career road trip, in order" className="pointer-events-none relative z-10 overflow-x-clip">
      <ol className="m-0 list-none p-0 [perspective:1200px]">
        {slots.map((slot, si) => {
          const firstOfChapter = si === 0 || slots[si - 1].chapter !== slot.chapter;
          if (firstOfChapter) count = 0;
          const ch = chapters.findIndex((c) => c.name === slot.chapter);
          const pair = slot.items.length === 2;
          return (
            <li key={si} className="wrap relative flex min-h-[100svh] flex-col justify-end gap-4 pb-28 sm:justify-center sm:pb-0">
              {firstOfChapter && (
                <div className="chapter-head pointer-events-auto absolute left-0 right-0 top-[11vh] wrap">
                  <p className="m-0 font-mono text-xs uppercase tracking-[.2em] text-lane">Exit {ch + 1}</p>
                  <h2 className="display m-0 text-[clamp(28px,4.2vw,52px)] leading-[.9] text-ink [text-shadow:0_6px_40px_rgba(0,0,0,.6)]">{slot.chapter}</h2>
                  <p className="m-0 mt-1.5 text-sm text-muted">{chapters[ch].blurb}</p>
                </div>
              )}
              <div className={`flex w-full flex-col gap-4 ${pair ? 'sm:flex-row sm:justify-between' : sideOf(si, 0, 1) === 'l' ? 'items-start' : 'items-end'}`}>
                {slot.items.map((it, ii) => {
                  count += 1;
                  return <StopCard key={it.title} it={it} side={sideOf(si, ii, slot.items.length)} index={count} total={totals[slot.chapter]} project={slot.chapter === 'Projects'} />;
                })}
              </div>
            </li>
          );
        })}
        <li className="wrap flex min-h-[100svh] items-center justify-start">
          <FinishCard />
        </li>
      </ol>
    </section>
  );
}
