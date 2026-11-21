import type { Item } from '../data/profile';
import { openDetails } from '../lib/details';

/** Glass card that floats beside its billboard. */
export default function StopCard({ it, side, index, total, project }: { it: Item; side: 'l' | 'r'; index: number; total: number; project: boolean }) {
  return (
    <article data-side={side} className="stop-card glass pointer-events-auto grid w-full max-w-[340px] gap-2 rounded-2xl p-4 sm:p-5 [transform-style:preserve-3d]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] text-panel-dim">{String(index).padStart(2, '0')}/{String(total).padStart(2, '0')}</span>
        <span data-pop className="sign-date">{it.when}</span>
        <span data-pop className={`font-mono text-[11px] uppercase tracking-[.12em] ${project ? 'text-accent' : 'text-muted'}`}>{it.kind}</span>
        {it.live && <span data-pop className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[.08em] text-ok before:size-[7px] before:animate-pulse before:rounded-full before:bg-current before:content-['']">Live</span>}
      </div>
      <h3 className="m-0 font-display text-[clamp(17px,1.6vw,20px)] font-extrabold leading-tight text-ink [font-stretch:112%] [text-wrap:balance]">{it.title}</h3>
      {it.where && <p className="m-0 text-[13px] font-semibold text-ink">{it.where}</p>}
      {it.text && <p className="m-0 text-[13px] leading-snug text-muted">{it.text}</p>}
      {it.chips && (
        <ul className="m-0 mt-1 flex list-none flex-wrap gap-1.5 p-0">
          {it.chips.map((c) => <li data-pop key={c} className="rounded-md bg-accent-soft px-1.5 py-px font-mono text-[11px] text-accent">{c}</li>)}
        </ul>
      )}
      {(
        <div className="mt-1 flex flex-wrap items-center gap-3 text-[13px] font-semibold">
          <button type="button" onClick={() => openDetails(it)} className="cursor-pointer rounded-lg border border-line bg-surface px-2.5 py-1 text-[13px] font-semibold text-ink hover:border-accent hover:text-accent">{it.code ? "What's inside" : 'Details'} →</button>
          {it.live && <a href={it.live} target="_blank" rel="noopener" className="border-b-[1.5px] border-line pb-px text-ink no-underline hover:border-accent hover:text-accent">Open live app ↗</a>}
          {it.code && <a href={it.code} target="_blank" rel="noopener" className="border-b-[1.5px] border-line pb-px text-ink no-underline hover:border-accent hover:text-accent">Code ↗</a>}
        </div>
      )}
    </article>
  );
}
