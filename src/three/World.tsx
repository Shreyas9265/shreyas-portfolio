import { Suspense, useEffect, useState } from 'react';
import { PerformanceMonitor } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import Road from './Road';
import Scenery from './Scenery';
import Signs from './Signs';
import Rig from './Rig';
import Atmosphere from './Atmosphere';
import Avatar from './Avatar';
import { Birds } from './DaySky';
import { useTheme } from '../lib/theme';
import { drive, emitDrive } from './store';

/** The fixed 3D backdrop: night road, car, signs, lights and post-processing. */
export default function World() {
  const [vw, setVw] = useState(() => window.innerWidth);
  useEffect(() => { const on = () => setVw(window.innerWidth); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on); }, []);
  const desktop = vw >= 1024, lite = vw < 768;
  const day = useTheme() === 'day';
  const [dpr, setDpr] = useState(lite ? 1.25 : 1.5);
  const [fx, setFx] = useState(!lite);

  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        eventSource={document.getElementById('root')!}
        eventPrefix="client"
        dpr={dpr}
        camera={{ fov: 42, near: 0.1, far: 2000, position: [10, 4, 8] }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        fallback={<div className="h-full w-full bg-[radial-gradient(ellipse_at_70%_30%,#1b2333,#07080c_70%)]" />}
      >
        <PerformanceMonitor
          onDecline={() => { setDpr((d) => Math.max(0.85, d - 0.25)); setFx(false); }}
          onIncline={() => { setDpr((d) => Math.min(lite ? 1.25 : 1.5, d + 0.25)); setFx(!lite); }}
          flipflops={3}
          onFallback={() => { setDpr(0.85); setFx(false); }}
        />
        <color attach="background" args={['#07090e']} />
        <Atmosphere />
        <Suspense fallback={null}>
          <Road />
          <Scenery lite={lite} />
          <Suspense fallback={null}><Signs /></Suspense>
          <Rig desktop={desktop} />
          <Birds />
          <Avatar />
          <FirstFrame />
        </Suspense>
        {fx && (
          <EffectComposer multisampling={0}>
            <Bloom mipmapBlur intensity={day ? 0.35 : 0.9} luminanceThreshold={day ? 0.92 : 0.62} luminanceSmoothing={0.2} />
            <Vignette eskil={false} offset={0.25} darkness={day ? 0.35 : 0.75} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}

/** Tells the loader the scene has actually drawn (a few frames in, after shaders compile). */
function FirstFrame() {
  let n = 0;
  useFrame(() => { if (!drive.ready && ++n > 3) { drive.ready = true; emitDrive(); } });
  return null;
}
