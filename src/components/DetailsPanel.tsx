import { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { gsap } from 'gsap';
import { closeDetails, useDetails } from '../lib/details';
import { pauseScroll, resumeScroll } from '../lib/lenis';
import { profile, type Item } from '../data/profile';

type Repo = {
  owner: string; name: string; branch: string; description?: string; stars: number; forks: number; updated: string;
  topics: string[]; languages: [string, number][]; files: { name: string; type: string }[]; readme: string;
};

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5', Java: '#b07219', Kotlin: '#A97BFF', PHP: '#4F5D95',
  CSS: '#663399', HTML: '#e34c26', SCSS: '#c6538c', 'Jupyter Notebook': '#DA5B0B', Shell: '#89e051', Dockerfile: '#384d54',
};

const cache = new Map<string, Promise<Repo>>();

function parseRepo(url?: string) {
  const m = url?.match(/github\.com\/([^/]+)\/([^/#?]+)/);
  return m ? { owner: m[1], name: m[2] } : null;
}

async function loadRepo(owner: string, name: string): Promise<Repo> {
  const api = `https://api.github.com/repos/${owner}/${name}`;
  const json = (u: string) => fetch(u).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); });
  const meta = await json(api);
  const [langs, files, readme] = await Promise.all([
    json(`${api}/languages`).catch(() => ({})),
    json(`${api}/contents`).catch(() => []),
    fetch(`${api}/readme`, { headers: { Accept: 'application/vnd.github.raw' } }).then((r) => (r.ok ? r.text() : '')).catch(() => ''),
  ]);
  return {
    owner, name, branch: meta.default_branch, description: meta.description ?? undefined, stars: meta.stargazers_count, forks: meta.forks_count,
    updated: meta.pushed_at, topics: meta.topics ?? [], languages: Object.entries(langs as Record<string, number>).sort((a, b) => b[1] - a[1]),
    files: (Array.isArray(files) ? files : []).map((f: { name: string; type: string }) => ({ name: f.name, type: f.type }))
      .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1)),
    readme,
  };
}

/** Pull the bullet list under a README heading like "Features" or "Key features" (up to 8 items). */
function readmeFeatures(md: string) {
  const lines = md.split('\n');
  const start = lines.findIndex((l) => /^#{1,4}\s.*(feature|what it does|highlights|capabilit)/i.test(l));
  if (start < 0) return [];
  const out: string[] = [];
  for (const l of lines.slice(start + 1)) {
    if (/^#{1,4}\s/.test(l)) break;
    const m = l.match(/^[-*+]\s+(.*)/); // top-level bullets only
    if (m) out.push(m[1].replace(/\*\*|__|`/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/^[\p{Extended_Pictographic}\s]+/u, '').trim());
    if (out.length >= 8) break;
  }
  return out.filter(Boolean);
}

/** Render README Markdown safely, pointing relative images and links at GitHub. */
function renderReadme(r: Repo) {
  const html = DOMPurify.sanitize(marked.parse(r.readme, { async: false }) as string);
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') ?? '';
    if (src && !/^(https?:|data:)/.test(src)) img.src = `https://raw.githubusercontent.com/${r.owner}/${r.name}/${r.branch}/${src.replace(/^\.?\//, '')}`;
    img.loading = 'lazy';
  });
  doc.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href') ?? '';
    if (href && !/^(https?:|mailto:|#)/.test(href)) a.href = `https://github.com/${r.owner}/${r.name}/blob/${r.branch}/${href.replace(/^\.?\//, '')}`;
    a.target = '_blank'; a.rel = 'noopener';
  });
  return doc.body.innerHTML;
}

/** Slide-in panel with everything inside a project: README, languages, files, stats and links. */
export default function DetailsPanel() {
  const item = useDetails();
  const [shown, setShown] = useState<Item | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (item) {
      setShown(item); pauseScroll();
      requestAnimationFrame(() => {
        gsap.fromTo(panel.current, { xPercent: 100 }, { xPercent: 0, duration: 0.55, ease: 'power3.out' });
        gsap.fromTo(backdrop.current, { opacity: 0 }, { opacity: 1, duration: 0.4 });
        closeBtn.current?.focus();
      });
    } else if (shown) {
      gsap.to(panel.current, { xPercent: 100, duration: 0.4, ease: 'power3.in' });
      gsap.to(backdrop.current, { opacity: 0, duration: 0.35, onComplete: () => { setShown(null); resumeScroll(); } });
    }
  }, [item]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!shown) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDetails(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shown]);

  if (!shown) return null;
  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={`${shown.title} details`}>
      <div ref={backdrop} className="absolute inset-0 bg-black/45 backdrop-blur-[3px]" onClick={closeDetails} />
      <div ref={panel} className="absolute inset-y-0 right-0 flex w-full max-w-[600px] flex-col border-l border-line bg-bg shadow-[-30px_0_80px_-30px_rgba(0,0,0,.6)]">
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 pb-4 pt-[max(20px,env(safe-area-inset-top))]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="sign-date">{shown.when}</span>
              <span className="font-mono text-[11px] uppercase tracking-[.12em] text-accent">{shown.kind}</span>
              {shown.live && <span className="font-mono text-[11px] uppercase tracking-[.08em] text-ok">● Live</span>}
            </div>
            <h2 className="display mt-2 text-[clamp(26px,4vw,36px)] leading-none text-ink [text-wrap:balance]">{shown.title}</h2>
            {shown.where && <p className="m-0 mt-1 font-semibold text-ink">{shown.where}</p>}
            <LinkRow it={shown} />
          </div>
          <button ref={closeBtn} type="button" onClick={closeDetails} aria-label="Close details"
            className="grid size-10 flex-none cursor-pointer place-items-center rounded-full border border-line bg-surface text-xl text-ink hover:border-accent">×</button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5" data-lenis-prevent>
          <div className="grid gap-6">
            {shown.text && <Section title="Overview"><p className="m-0 text-[15px] leading-relaxed text-muted">{shown.text}</p></Section>}
            {shown.points && shown.points.length > 0 && (
              <Section title={shown.code || shown.live ? 'Highlights' : 'What I did'}>
                <ul className="m-0 grid gap-2.5 p-0">
                  {shown.points.map((p) => (
                    <li key={p} className="flex gap-3 text-[15px] leading-relaxed text-ink">
                      <span className="mt-[9px] size-1.5 flex-none rounded-full bg-accent" aria-hidden="true" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
            {shown.chips && (
              <Section title={shown.code ? 'Tech stack' : 'Skills'}>
                <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                  {shown.chips.map((c) => <li key={c} className="rounded-md bg-accent-soft px-2 py-0.5 font-mono text-xs text-accent">{c}</li>)}
                </ul>
              </Section>
            )}
            {parseRepo(shown.code) ? <RepoDetails url={shown.code!} /> : (
              <p className="m-0 text-sm text-muted">Full history, recommendations and more on my <a className="text-accent" href={profile.linkedin} target="_blank" rel="noopener">LinkedIn profile ↗</a>.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2.5 mt-0 font-mono text-xs uppercase tracking-[.14em] text-muted">{title}</h3>
      {children}
    </section>
  );
}

/** Live app, GitHub and LinkedIn buttons right under the title. */
function LinkRow({ it }: { it: Item }) {
  const linkedinOnly = !it.live && !it.code;
  return (
    <div className="mt-3.5 flex flex-wrap gap-2">
      {it.live && <a className="btn btn-primary !px-3.5 !py-2 text-sm" href={it.live} target="_blank" rel="noopener">● Open live app ↗</a>}
      {it.code && <a className="btn !px-3.5 !py-2 text-sm" href={it.code} target="_blank" rel="noopener">View code on GitHub ↗</a>}
      {it.code && !it.live && <span className="self-center font-mono text-[11px] uppercase tracking-[.1em] text-muted">Live demo coming soon</span>}
      {linkedinOnly && <a className="btn !px-3.5 !py-2 text-sm" href={profile.linkedin} target="_blank" rel="noopener">View on LinkedIn ↗</a>}
    </div>
  );
}

function RepoDetails({ url }: { url: string }) {
  const id = parseRepo(url)!;
  const key = `${id.owner}/${id.name}`;
  const [repo, setRepo] = useState<Repo | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    setRepo(null); setError(false);
    if (!cache.has(key)) cache.set(key, loadRepo(id.owner, id.name));
    cache.get(key)!.then((r) => { if (alive) setRepo(r); }).catch(() => { cache.delete(key); if (alive) setError(true); });
    return () => { alive = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return (
    <div className="rounded-xl border border-line bg-surface p-4 text-sm text-muted">
      GitHub didn't answer just now (it limits how often a browser can ask). The full project is one click away below.
    </div>
  );
  if (!repo) return (
    <div className="grid gap-3" aria-busy="true" aria-label="Loading project from GitHub">
      {[70, 100, 90, 60].map((w, i) => <div key={i} className="h-3.5 animate-pulse rounded bg-line" style={{ width: `${w}%` }} />)}
    </div>
  );
  const total = repo.languages.reduce((n, [, b]) => n + b, 0) || 1;
  const features = readmeFeatures(repo.readme);
  const updated = new Date(repo.updated).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  return (
    <div className="grid gap-6">
      {features.length > 0 && (
        <section>
          <h3 className="mb-2.5 mt-0 font-mono text-xs uppercase tracking-[.14em] text-muted">Key features <span className="normal-case tracking-normal">· from the README</span></h3>
          <ul className="m-0 grid gap-2 p-0">
            {features.map((f) => (
              <li key={f} className="flex gap-3 text-[14.5px] leading-relaxed text-ink">
                <span className="mt-[3px] grid size-4 flex-none place-items-center rounded bg-ok/15 text-[10px] text-ok" aria-hidden="true">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <dl className="m-0 grid grid-cols-3 gap-2.5 font-mono">
        {[['Stars', repo.stars], ['Forks', repo.forks], ['Updated', updated]].map(([k, v]) => (
          <div key={k as string} className="rounded-xl border border-line bg-surface p-3">
            <dt className="text-[10px] uppercase tracking-[.14em] text-muted">{k}</dt>
            <dd className="m-0 mt-1 text-base font-semibold text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      {repo.languages.length > 0 && (
        <section>
          <h3 className="mb-2 mt-0 font-mono text-xs uppercase tracking-[.14em] text-muted">Languages</h3>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-line">
            {repo.languages.map(([l, b]) => <span key={l} style={{ width: `${(b / total) * 100}%`, background: LANG_COLORS[l] ?? '#8b949e' }} />)}
          </div>
          <ul className="m-0 mt-2 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-sm text-muted">
            {repo.languages.map(([l, b]) => (
              <li key={l} className="flex items-center gap-1.5"><i className="size-2.5 rounded-full" style={{ background: LANG_COLORS[l] ?? '#8b949e' }} />{l} <span className="font-mono text-xs">{((b / total) * 100).toFixed(1)}%</span></li>
            ))}
          </ul>
        </section>
      )}
      {repo.files.length > 0 && (
        <section>
          <h3 className="mb-2 mt-0 font-mono text-xs uppercase tracking-[.14em] text-muted">Inside the repo</h3>
          <ul className="m-0 grid list-none grid-cols-2 gap-1 rounded-xl border border-line bg-surface p-3 font-mono text-[13px] sm:grid-cols-3">
            {repo.files.map((f) => (
              <li key={f.name} className="truncate text-ink"><span className="mr-1.5 text-muted">{f.type === 'dir' ? '▸' : '·'}</span>{f.name}{f.type === 'dir' ? '/' : ''}</li>
            ))}
          </ul>
        </section>
      )}
      {repo.readme && (
        <details className="group rounded-xl border border-line bg-surface">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 font-mono text-xs uppercase tracking-[.14em] text-muted hover:text-ink">
            Full README <span className="transition-transform group-open:rotate-180">▾</span>
          </summary>
          <article className="readme border-t border-line p-5" dangerouslySetInnerHTML={{ __html: renderReadme(repo) }} />
        </details>
      )}
    </div>
  );
}
