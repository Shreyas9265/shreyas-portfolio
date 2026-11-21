import SplitText from './reactbits/SplitText';
import ShinyText from './reactbits/ShinyText';
import Magnet from './reactbits/Magnet';
import SmoothLink from './SmoothLink';
import TripComputer from './TripComputer';
import { GitHubIcon, LinkedInIcon } from './Icons';
import { profile } from '../data/profile';

/** Transparent hero over the 3D scene: the camera orbits the parked car behind this text. */
export default function Hero() {
  return (
    <section id="scene" className="pointer-events-none relative z-10 flex min-h-[100svh] items-center">
      <div className="hero-veil pointer-events-none absolute inset-0" />
      <div className="wrap relative w-full py-24">
        <div className="pointer-events-auto max-w-[620px]">
          <div className="flex flex-wrap items-center gap-2.5 font-mono text-[13px] uppercase tracking-[.08em]">
            <span className="size-2 animate-pulse rounded-full bg-ok" />
            <ShinyText text={`Frontend developer · open to roles · ${profile.availability}`} color="var(--muted)" shineColor="var(--ink)" speed={3} />
          </div>
          <h1 className="display my-5 text-[clamp(30px,10.5vw,104px)] leading-[.86] text-ink">
            <span className="block"><SplitText tag="span" text={profile.name[0]} trigger="load" effect="rise" delay={45} duration={0.9} /></span>
            <span className="block text-accent [text-shadow:0_0_40px_rgba(255,75,85,.35)]"><SplitText tag="span" text={profile.name[1]} trigger="load" effect="rise" delay={45} duration={0.9} /></span>
          </h1>
          <p className="mb-7 max-w-[34em] text-[clamp(17px,2vw,19px)] text-muted">
            I build responsive, accessible interfaces with <strong className="font-semibold text-ink">React</strong>, <strong className="font-semibold text-ink">TypeScript</strong> and <strong className="font-semibold text-ink">Tailwind CSS</strong>. Scroll to take the wheel: we'll drive from my first role at PwC past every project I've shipped.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Magnet padding={40} magnetStrength={3}><SmoothLink className="btn btn-primary" href="#route">Start the engine ↓</SmoothLink></Magnet>
            <Magnet padding={40} magnetStrength={3}><a className="btn glass !text-ink" href={profile.github} target="_blank" rel="noopener"><GitHubIcon />GitHub</a></Magnet>
            <Magnet padding={40} magnetStrength={3}><a className="btn glass !text-ink" href={profile.linkedin} target="_blank" rel="noopener"><LinkedInIcon />LinkedIn</a></Magnet>
          </div>
          <div className="mt-10 max-w-[440px]"><TripComputer /></div>
        </div>
        <p className="pointer-events-none absolute bottom-24 right-8 m-0 hidden font-mono text-xs uppercase tracking-[.16em] text-panel-dim lg:block">
          <span className="text-lane">●</span> Move your mouse to turn the car
        </p>
        <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-[11px] uppercase tracking-[.2em] text-panel-dim sm:flex">
          Scroll to drive
          <span className="h-9 w-[2px] animate-bounce rounded bg-lane" />
        </div>
      </div>
    </section>
  );
}
