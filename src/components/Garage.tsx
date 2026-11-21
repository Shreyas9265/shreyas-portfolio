import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import SpotlightCard from './reactbits/SpotlightCard';
import { profile, projects } from '../data/profile';
import { prefersReducedMotion } from '../lib/motion';

/** Every project in one grid, for visitors who skipped the drive. */
export default function Garage() {
  const root = useRef<HTMLElement>(null);
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.utils.toArray<HTMLElement>('.bay').forEach((el, i) =>
      gsap.fromTo(el, { y: 28 }, { y: 0, duration: 0.7, delay: (i % 3) * 0.08, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 95%', once: true } }));
  }, { scope: root });
  return (
    <section ref={root} id="garage" className="relative z-10 border-t border-line bg-bg/85 py-20 backdrop-blur-md">
      <div className="wrap">
        <div className="mb-7 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="display m-0 text-[clamp(28px,4vw,42px)] leading-none">The garage</h2>
          <a href={profile.github} target="_blank" rel="noopener" className="font-mono text-[13px] text-muted no-underline hover:text-lane">all {projects.length} projects · GitHub ↗</a>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-3">
          {projects.map((p) => (
            <SpotlightCard key={p.title} theme="dark" spotlightColor="rgba(242, 194, 48, 0.22)"
              className="bay grid h-full content-start gap-1.5 !rounded-xl !p-[18px]"
              style={{ '--spotlight-card-surface': 'var(--surface)', '--spotlight-card-border': 'var(--line)', '--spotlight-card-shadow': 'none' } as React.CSSProperties}>
              <div className="flex items-center justify-between gap-2">
                <em className="font-mono text-xs not-italic text-accent">{p.when}</em>
                {p.live && <span className="font-mono text-[11px] uppercase tracking-[.08em] text-ok">● Live</span>}
              </div>
              <strong className="text-base font-semibold text-ink">{p.title}</strong>
              <span className="text-sm leading-normal text-muted">{p.text}</span>
              <div className="mt-1 flex gap-4 text-sm font-semibold">
                {p.live && <a href={p.live} target="_blank" rel="noopener" className="text-ink no-underline hover:text-accent">Live ↗</a>}
                {p.code && <a href={p.code} target="_blank" rel="noopener" className="text-ink no-underline hover:text-accent">Code ↗</a>}
              </div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}
