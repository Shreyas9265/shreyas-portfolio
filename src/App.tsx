import { lazy, Suspense, useEffect } from 'react';
import ClickSpark from './components/reactbits/ClickSpark';
import Nav from './components/Nav';
import Hero from './components/Hero';
import DriveSection from './components/DriveSection';
import Garage from './components/Garage';
import Skills from './components/Skills';
import Contact from './components/Contact';
import Hud3D from './components/Hud3D';
import Loader from './components/Loader';
import DetailsPanel from './components/DetailsPanel';
import { startLenis } from './lib/lenis';

const World = lazy(() => import('./three/World'));

export default function App() {
  useEffect(() => startLenis(), []);
  return (
    <ClickSpark sparkColor={['#f2c230', '#ff4b55']} sparkCount={10} sparkRadius={28} sparkSize={11} duration={480}>
      <Suspense fallback={null}><World /></Suspense>
      <Loader />
      <Nav />
      <main id="top" className="relative">
        <Hero />
        <DriveSection />
        <Garage />
        <Skills />
        <Contact />
      </main>
      <footer className="wrap relative z-10 flex flex-wrap justify-between gap-2.5 bg-bg pb-11 pt-8 font-mono text-[13px] text-muted">
        <span>© 2026 Shreyas Peddireddy</span>
        <span>React · TypeScript · Three.js · R3F · GSAP · Lenis · React Bits</span>
        <span className="w-full text-xs text-panel-dim">
          3D car: <a className="underline hover:text-lane" href="https://sketchfab.com/3d-models/free-porsche-911-carrera-4s-d01b254483794de3819786d93e0e1ebf" target="_blank" rel="noopener">"(FREE) Porsche 911 Carrera 4S"</a> by <a className="underline hover:text-lane" href="https://sketchfab.com/karolmiklas" target="_blank" rel="noopener">Karol Miklas</a>, <a className="underline hover:text-lane" href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>. Modified: recolored, badges removed, optimized for the web. Not affiliated with Porsche.
        </span>
      </footer>
      <Hud3D />
      <DetailsPanel />
    </ClickSpark>
  );
}
