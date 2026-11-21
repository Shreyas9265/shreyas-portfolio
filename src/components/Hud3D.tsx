import { useEffect, useMemo, useRef, useState } from 'react';
import DecryptedText from './reactbits/DecryptedText';
import { slots } from '../data/profile';
import { drive, onDrive } from '../three/store';
import { curve, N, tAtG } from '../three/track';

/** Dashboard: speed, gear, a minimap of the route and the milestone just passed. */
export default function Hud3D() {
  const mph = useRef<HTMLElement>(null);
  const gear = useRef<HTMLElement>(null);
  const dot = useRef<SVGCircleElement>(null);
  const needle = useRef<SVGLineElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [passed, setPassed] = useState(-1);

  const map = useMemo(() => {
    const pts = curve.getPoints(160);
    const xs = pts.map((p) => p.x), zs = pts.map((p) => p.z);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minZ = Math.min(...zs), maxZ = Math.max(...zs);
    const W = 64, H = 120, pad = 8;
    const sc = Math.min((W - pad * 2) / (maxX - minX || 1), (H - pad * 2) / (maxZ - minZ || 1));
    const proj = (x: number, z: number) => [pad + (x - minX) * sc + ((W - pad * 2) - (maxX - minX) * sc) / 2, H - pad - (z - minZ) * sc] as const;
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${proj(p.x, p.z).map((v) => v.toFixed(1)).join(',')}`).join(' ');
    const marks = slots.map((_, i) => { const p = curve.getPointAt(tAtG(i + 1)); return proj(p.x, p.z); });
    return { d, marks, proj, W, H };
  }, []);

  useEffect(() => {
    const off = onDrive(() => setPassed(drive.passed));
    let raf = 0;
    const loop = () => {
      const v = Math.round(drive.speed);
      if (mph.current) mph.current.textContent = String(v);
      if (gear.current) gear.current.textContent = v < 2 ? 'N' : String(Math.min(6, 1 + Math.floor(v / 28)));
      if (needle.current) needle.current.setAttribute('transform', `rotate(${-120 + (Math.min(v, 199) / 199) * 240} 40 40)`);
      const p = curve.getPointAt(tAtG(drive.g));
      const [x, y] = map.proj(p.x, p.z);
      dot.current?.setAttribute('cx', x.toFixed(1)); dot.current?.setAttribute('cy', y.toFixed(1));
      if (wrap.current) wrap.current.style.opacity = drive.hero > 0.4 && drive.outro < 0.6 && drive.g < N + 0.6 ? '1' : '0';
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { off(); cancelAnimationFrame(raf); };
  }, [map]);

  const atEnd = drive.g >= N + 0.9;
  const label = passed < 0 ? { when: '2023', name: 'Start line' } : atEnd ? { when: 'Next', name: 'Your team' } : { when: slots[passed].chapter, name: slots[passed].items.map((i) => i.hud).join(' + ') };

  return (
    <div ref={wrap} aria-hidden="true" className="pointer-events-none fixed bottom-[max(14px,env(safe-area-inset-bottom,0px))] left-1/2 z-20 flex -translate-x-1/2 items-end gap-3 opacity-0 transition-opacity duration-500">
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b0e14]/85 px-3 py-2.5 shadow-[0_20px_50px_-25px_rgba(0,0,0,.8)] backdrop-blur-sm sm:px-4">
        <svg viewBox="0 0 80 80" className="size-[58px] sm:size-[68px]">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#262b35" strokeWidth="5" strokeDasharray="142 72" transform="rotate(150 40 40)" strokeLinecap="round" />
          <circle cx="40" cy="40" r="34" fill="none" stroke="var(--accent)" strokeWidth="5" strokeDasharray="20 194" transform="rotate(50 40 40)" strokeLinecap="round" opacity=".8" />
          <line ref={needle} x1="40" y1="40" x2="40" y2="12" stroke="var(--lane)" strokeWidth="2.5" strokeLinecap="round" transform="rotate(-120 40 40)" />
          <circle cx="40" cy="40" r="4" fill="var(--lane)" />
        </svg>
        <div className="grid font-mono leading-none">
          <b ref={mph} className="display text-[30px] text-white tabular-nums sm:text-[36px]">0</b>
          <small className="mt-1 text-[10px] uppercase tracking-[.16em] text-panel-dim">mph · gear <b ref={gear} className="text-lane">N</b></small>
        </div>
        <div className="ml-1 hidden min-w-[170px] max-w-[230px] border-l border-white/10 pl-3 font-mono sm:grid">
          <small className="text-[10px] uppercase tracking-[.16em] text-panel-dim">Now passing</small>
          <strong className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold text-white">
            <span className="text-lane">{label.when}</span> · <DecryptedText key={label.name} text={label.name} animateOn="view" sequential speed={28} />
          </strong>
        </div>
      </div>
      <div className="hidden rounded-2xl border border-white/10 bg-[#0b0e14]/85 p-1.5 backdrop-blur-sm md:block">
        <svg viewBox={`0 0 ${map.W} ${map.H}`} className="h-[86px] w-[46px]">
          <path d={map.d} fill="none" stroke="#2c3240" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={map.d} fill="none" stroke="#f2c230" strokeWidth="1" strokeDasharray="2 3" opacity=".7" />
          {map.marks.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.2" fill={i <= passed ? 'var(--accent)' : '#5b6372'} />)}
          <circle ref={dot} r="3.6" fill="#fff" stroke="var(--accent)" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}
