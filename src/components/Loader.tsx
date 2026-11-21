import { useEffect, useState } from 'react';
import { drive, onDrive } from '../three/store';

/** "Warming up the engine" screen until the 3D scene has rendered. */
export default function Loader() {
  const [done, setDone] = useState(drive.ready);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const off = onDrive(() => { if (drive.ready) setDone(true); });
    const fail = setTimeout(() => setDone(true), 4000); // never block the page
    return () => { off(); clearTimeout(fail); };
  }, []);
  useEffect(() => { if (done) { const t = setTimeout(() => setGone(true), 900); return () => clearTimeout(t); } }, [done]);
  if (gone) return null;
  return (
    <div className={`fixed inset-0 z-50 grid place-items-center bg-[#07090e] transition-opacity duration-700 ${done ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
      <div className="grid w-[min(320px,80vw)] gap-4 text-center font-mono text-xs uppercase tracking-[.2em] text-panel-dim">
        <div className="display text-3xl tracking-normal text-white">SP<span className="text-accent">·</span>911</div>
        <span>Warming up the engine</span>
        <div className="h-1 overflow-hidden rounded bg-[#1a1d24]">
          <i className={`block h-full bg-[linear-gradient(90deg,var(--lane),var(--car))] transition-[width] ease-out ${done ? 'w-full duration-300' : 'w-3/4 duration-[2500ms]'}`} />
        </div>
      </div>
    </div>
  );
}
