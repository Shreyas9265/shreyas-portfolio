import { Suspense, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { drive } from './store';
import { useTheme } from '../lib/theme';

const BASE = import.meta.env.BASE_URL;
const SKIES = {
  day: `${BASE}env/day_2k.hdr`,     // Poly Haven "Kloofendal 48d Partly Cloudy (Pure Sky)", CC0
  night: `${BASE}env/night_2k.hdr`, // Poly Haven "Kloppenheim 02 (Pure Sky)", CC0
};

const NIGHT = { fog: '#0a0e16', near: 60, far: 420, amb: 0.25, ambC: '#8ea2c8', sky: '#2a3550', ground: '#0b0d10', hemi: 0.45, sun: 0.55, sunC: '#b9c7ff' };
const DAY = { fog: '#c7d5e2', near: 120, far: 780, amb: 0.25, ambC: '#ffffff', sky: '#cfe3ff', ground: '#4d6b3c', hemi: 0.55, sun: 3.0, sunC: '#fff0d8' };
export const SUN_DIR = new THREE.Vector3(-0.35, 0.55, -0.75).normalize();

const mixC = (out: THREE.Color, a: string, b: string, t: number) => out.set(a).lerp(new THREE.Color(b), t);

/** Real photographed sky (HDRI) for background and reflections, plus fog and lights that crossfade with the theme. */
export default function Atmosphere() {
  const theme = useTheme();
  const { scene } = useThree();
  const amb = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const fog = useMemo(() => new THREE.Fog(NIGHT.fog, NIGHT.near, NIGHT.far), []);

  useFrame((_, dt) => {
    drive.dayMix = THREE.MathUtils.damp(drive.dayMix, drive.day, 2.5, Math.min(dt, 0.05));
    const t = drive.dayMix;
    mixC(fog.color, NIGHT.fog, DAY.fog, t);
    fog.near = THREE.MathUtils.lerp(NIGHT.near, DAY.near, t);
    fog.far = THREE.MathUtils.lerp(NIGHT.far, DAY.far, t);
    scene.fog = fog;
    if (amb.current) { amb.current.intensity = THREE.MathUtils.lerp(NIGHT.amb, DAY.amb, t); mixC(amb.current.color, NIGHT.ambC, DAY.ambC, t); }
    if (hemi.current) { hemi.current.intensity = THREE.MathUtils.lerp(NIGHT.hemi, DAY.hemi, t); mixC(hemi.current.color, NIGHT.sky, DAY.sky, t); mixC(hemi.current.groundColor, NIGHT.ground, DAY.ground, t); }
    if (sun.current) { sun.current.intensity = THREE.MathUtils.lerp(NIGHT.sun, DAY.sun, t); mixC(sun.current.color, NIGHT.sunC, DAY.sunC, t); }
  });

  const day = theme === 'day';
  return (
    <>
      <ambientLight ref={amb} intensity={NIGHT.amb} />
      <hemisphereLight ref={hemi} args={[NIGHT.sky, NIGHT.ground, NIGHT.hemi]} />
      <directionalLight ref={sun} position={SUN_DIR.clone().multiplyScalar(300).toArray()} intensity={NIGHT.sun} />
      <Suspense fallback={null}>
        <Environment key={theme} files={day ? SKIES.day : SKIES.night} background
          backgroundIntensity={day ? 1 : 0.9} environmentIntensity={day ? 1 : 0.55} />
      </Suspense>
    </>
  );
}
