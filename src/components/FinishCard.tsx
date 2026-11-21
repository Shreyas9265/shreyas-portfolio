import { useRef, useState } from 'react';
import Magnet from './reactbits/Magnet';
import { GitHubIcon, LinkedInIcon } from './Icons';
import { profile } from '../data/profile';

/** Contact card beside the parked car and avatar at the end of the road. */
export default function FinishCard() {
  const [label, setLabel] = useState('Copy');
  const code = useRef<HTMLElement>(null);
  const copy = async () => {
    const flash = (m: string) => { setLabel(m); setTimeout(() => setLabel('Copy'), 1800); };
    try { await navigator.clipboard.writeText(profile.email); flash('Copied'); }
    catch { const r = document.createRange(); r.selectNodeContents(code.current!); const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(r); flash('Selected'); }
  };
  return (
    <div className="finish-card glass pointer-events-auto grid w-full max-w-[400px] gap-3.5 rounded-3xl p-6">
      <span className="sign-date w-fit !bg-accent">Finish line</span>
      <h2 className="display m-0 text-[clamp(26px,3.4vw,40px)] leading-[.92] text-ink [text-wrap:balance]">Next stop: your frontend team</h2>
      <p className="m-0 text-sm text-muted">Thanks for riding along. I'm looking for a frontend role where I can ship polished React interfaces. Available {profile.availability}, remote from Buffalo, NY.</p>
      <div className="grid gap-1.5 rounded-xl border border-line bg-surface/70 p-3.5">
        <span className="font-mono text-[11px] uppercase tracking-[.14em] text-muted">Email</span>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <a href={`mailto:${profile.email}`} className="no-underline"><code ref={code} className="select-all break-all font-mono text-[15px] font-semibold text-ink">{profile.email}</code></a>
          <button type="button" onClick={copy} className="cursor-pointer rounded-lg border-0 bg-lane px-3 py-1.5 text-sm font-semibold text-[#111]">{label}</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Magnet padding={30} magnetStrength={3}><a className="btn btn-primary" href={`mailto:${profile.email}?subject=Frontend%20role`}>Email me</a></Magnet>
        <Magnet padding={30} magnetStrength={3}><a className="btn" href={profile.linkedin} target="_blank" rel="noopener"><LinkedInIcon />LinkedIn</a></Magnet>
        <Magnet padding={30} magnetStrength={3}><a className="btn" href={profile.github} target="_blank" rel="noopener"><GitHubIcon />GitHub</a></Magnet>
      </div>
    </div>
  );
}
