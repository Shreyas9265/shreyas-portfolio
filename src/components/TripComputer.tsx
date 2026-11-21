import { useEffect, useState } from 'react';
import CountUp from './reactbits/CountUp';
import SpotlightCard from './reactbits/SpotlightCard';
import { PROGRESS_EVENT } from '../lib/motion';

const fuel = ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'REST APIs'];

export default function TripComputer() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const on = (e: Event) => setPct((e as CustomEvent<number>).detail);
    window.addEventListener(PROGRESS_EVENT, on);
    return () => window.removeEventListener(PROGRESS_EVENT, on);
  }, []);

  return (
    <SpotlightCard
      theme="dark"
      spotlightColor="rgba(242, 194, 48, 0.22)"
      className="trip grid gap-[18px] !rounded-[18px] !p-[22px] font-mono shadow-[0_30px_60px_-36px_rgba(0,0,0,.55)]"
      style={{ '--spotlight-card-surface': 'var(--panel)', '--spotlight-card-border': 'var(--panel-line)', color: 'var(--panel-ink)' } as React.CSSProperties}
      aria-label="Career summary"
    >
      <header className="flex items-center justify-between text-[11px] uppercase tracking-[.14em] text-panel-dim">
        <span>Trip computer</span><b className="font-semibold text-lane">● Engine on</b>
      </header>
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { to: 2023, from: 1990, label: 'Departed', sep: '' },
          { to: 4, from: 0, label: 'Roles', sep: '' },
          { to: 19, from: 0, label: 'Repos', sep: '' },
        ].map((r) => (
          <div key={r.label} className="grid gap-0.5 rounded-[10px] border border-panel-line p-3">
            <CountUp to={r.to} from={r.from} separator={r.sep} duration={1.6} trigger="load"
              className="display text-[clamp(22px,3vw,30px)] leading-none text-white tabular-nums" />
            <span className="text-[10.5px] uppercase tracking-[.1em] text-panel-dim">{r.label}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-2 text-[11px] uppercase tracking-[.1em] text-panel-dim">
        Running on
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {fuel.map((f) => <li key={f} className="rounded-md bg-[#1d2026] px-2.5 py-1 text-[12.5px] normal-case tracking-normal text-panel-ink">{f}</li>)}
        </ul>
      </div>
      <div className="grid gap-1.5 text-[11px] uppercase tracking-[.1em] text-panel-dim">
        <span>Route progress · <b className="text-panel-ink">{pct}%</b></span>
        <div className="h-1.5 overflow-hidden rounded bg-[#23262d]">
          <i className="block h-full bg-[linear-gradient(90deg,var(--lane),var(--car))] transition-[width] duration-200" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </SpotlightCard>
  );
}
