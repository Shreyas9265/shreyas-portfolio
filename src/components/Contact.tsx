import { useRef, useState } from 'react';
import Magnet from './reactbits/Magnet';
import { profile } from '../data/profile';

export default function Contact() {
  const [label, setLabel] = useState('Copy email');
  const code = useRef<HTMLElement>(null);
  const copy = async () => {
    const flash = (m: string) => { setLabel(m); setTimeout(() => setLabel('Copy email'), 1800); };
    try { await navigator.clipboard.writeText(profile.email); flash('Copied'); }
    catch {
      const r = document.createRange(); r.selectNodeContents(code.current!);
      const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(r); flash('Selected, press Ctrl+C');
    }
  };
  return (
    <section id="contact" className="relative z-10 bg-bg/90 pb-16 pt-4 backdrop-blur-md">
      <div className="wrap">
        <div className="grid gap-5 rounded-[20px] bg-panel p-[clamp(26px,5vw,52px)] text-panel-ink">
          <h2 className="display m-0 max-w-[18ch] text-[clamp(28px,5vw,48px)] leading-[.95] text-white [text-wrap:balance]">Let's take the next stretch together.</h2>
          <p className="m-0 max-w-[52ch] text-panel-dim">Available for frontend work {profile.availability}, remote from Buffalo, NY. Email is the fastest way to reach me.</p>
          <div className="flex flex-wrap items-center gap-2.5">
            <a href={`mailto:${profile.email}`} className="no-underline"><code ref={code} className="select-all break-all font-mono text-[clamp(15px,2.4vw,20px)] text-lane">{profile.email}</code></a>
            <Magnet padding={30} magnetStrength={3}>
              <button type="button" onClick={copy} className="cursor-pointer rounded-lg border-0 bg-lane px-3.5 py-2 text-sm font-semibold text-[#111]">{label}</button>
            </Magnet>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <a className="btn !border-[#2c3038] !bg-transparent !text-panel-ink hover:!border-lane" href={profile.linkedin} target="_blank" rel="noopener">LinkedIn ↗</a>
            <a className="btn !border-[#2c3038] !bg-transparent !text-panel-ink hover:!border-lane" href={profile.github} target="_blank" rel="noopener">GitHub ↗</a>
          </div>
        </div>
      </div>
    </section>
  );
}
