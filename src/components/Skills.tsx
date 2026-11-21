import { skills } from '../data/profile';

export default function Skills() {
  return (
    <section id="hood" className="relative z-10 border-t border-line bg-bg/90 py-20 backdrop-blur-md">
      <div className="wrap">
        <div className="mb-7 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="display m-0 text-[clamp(28px,4vw,42px)] leading-none">Under the hood</h2>
          <span className="font-mono text-[13px] text-muted">tools I reach for</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-7">
          {skills.map((s) => (
            <div key={s.group}>
              <h3 className="mb-3 mt-0 font-mono text-xs font-semibold uppercase tracking-[.12em] text-accent">{s.group}</h3>
              <ul className="m-0 flex list-none flex-wrap gap-[7px] p-0">
                {s.items.map((i) => <li key={i} className="rounded-full border border-line bg-surface px-[11px] transition-colors hover:border-lane hover:text-lane py-[5px] text-sm">{i}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
