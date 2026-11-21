import { forwardRef, useMemo, useRef, useImperativeHandle } from 'react';
import * as THREE from 'three';

/**
 * A 911-inspired coupe built from code: sloping fastback flyline, frog-eye headlights on the fenders,
 * wide rear hips, ducktail and the full-width rear light bar. Local +x is forward.
 */
export type CarHandle = { group: THREE.Group; front: THREE.Object3D[]; brake: THREE.MeshStandardMaterial; spin: (distance: number) => void; exhaustX?: number };

const extrude = (pts: [number, number][], depth: number, bevel: number) => {
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 24 });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
};

// Side profile, front at +x. Smoothed with a spline so the flyline reads as one curve.
const profile = (() => {
  const key: [number, number][] = [
    [2.28, 0.3], [2.34, 0.48], [2.22, 0.64], [1.7, 0.74], [1.0, 0.82], [0.62, 0.9],
    [0.18, 1.24], [-0.35, 1.31], [-0.9, 1.22], [-1.55, 1.0], [-2.02, 0.86], [-2.24, 0.84],
    [-2.3, 0.62], [-2.26, 0.32],
  ];
  const c = new THREE.CatmullRomCurve3(key.map(([x, y]) => new THREE.Vector3(x, y, 0)), false, 'centripetal');
  const top = c.getPoints(90).map((v) => [v.x, v.y] as [number, number]);
  return [...top, [-2.1, 0.22], [2.12, 0.22]] as [number, number][];
})();
const glassProfile: [number, number][] = [[0.66, 0.92], [0.2, 1.235], [-0.34, 1.3], [-0.88, 1.21], [-1.42, 1.0], [-0.2, 0.93]];

const Car911 = forwardRef<CarHandle>(function Car911(_, ref) {
  const group = useRef<THREE.Group>(null!);
  const wheels = useRef<THREE.Object3D[]>([]);
  const front = useRef<THREE.Object3D[]>([]);

  const geo = useMemo(() => ({
    body: extrude(profile, 1.36, 0.24),
    glass: extrude(glassProfile, 1.6, 0.07),
    tire: new THREE.CylinderGeometry(0.37, 0.37, 0.3, 32),
    rim: new THREE.CylinderGeometry(0.25, 0.25, 0.32, 5),
    fender: new THREE.SphereGeometry(1, 32, 16),
  }), []);

  const mat = useMemo(() => ({
    paint: new THREE.MeshPhysicalMaterial({ color: '#c3121f', metalness: 0.45, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#0a0f16', metalness: 0.9, roughness: 0.05, clearcoat: 1 }),
    tire: new THREE.MeshStandardMaterial({ color: '#0d0d0f', roughness: 0.9 }),
    rim: new THREE.MeshStandardMaterial({ color: '#b9bec6', metalness: 1, roughness: 0.25 }),
    head: new THREE.MeshStandardMaterial({ color: '#fff7e0', emissive: '#fff2c4', emissiveIntensity: 3 }),
    brake: new THREE.MeshStandardMaterial({ color: '#ff1a2a', emissive: '#ff1a2a', emissiveIntensity: 2.2 }),
    trim: new THREE.MeshStandardMaterial({ color: '#111216', metalness: 0.6, roughness: 0.4 }),
  }), []);

  useImperativeHandle(ref, () => ({
    group: group.current, front: front.current, brake: mat.brake,
    spin: (d: number) => wheels.current.forEach((w) => { if (w) w.rotation.y -= d / 0.37; }),
  }), [mat]);

  const wheelAt: [number, number, boolean][] = [[1.36, 0.82, true], [1.36, -0.82, true], [-1.38, 0.86, false], [-1.38, -0.86, false]];

  return (
    <group ref={group}>
      <mesh geometry={geo.body} material={mat.paint} />
      <mesh geometry={geo.glass} material={mat.glass} />
      {/* front fenders carrying the round headlights, and the wide rear hips */}
      {[0.66, -0.66].map((z) => (
        <mesh key={'ff' + z} geometry={geo.fender} material={mat.paint} position={[1.45, 0.58, z * 1.02]} scale={[0.78, 0.22, 0.3]} />
      ))}
      {[0.7, -0.7].map((z) => (
        <mesh key={'rh' + z} geometry={geo.fender} material={mat.paint} position={[-1.32, 0.62, z * 1.04]} scale={[0.95, 0.27, 0.34]} />
      ))}
      {[0.64, -0.64].map((z) => (
        <group key={'hl' + z} position={[2.08, 0.7, z]} rotation={[0, 0, -Math.PI / 2]}>
          <mesh material={mat.trim}><cylinderGeometry args={[0.19, 0.19, 0.1, 32]} /></mesh>
          <mesh material={mat.head} position={[0, 0.03, 0]}><cylinderGeometry args={[0.15, 0.15, 0.06, 32]} /></mesh>
        </group>
      ))}
      {/* rounded engine lid and rear bumper so the back reads as a 911, not a box */}
      <mesh geometry={geo.fender} material={mat.paint} position={[-1.55, 0.78, 0]} scale={[0.95, 0.3, 0.84]} />
      <mesh geometry={geo.fender} material={mat.paint} position={[-2.05, 0.5, 0]} scale={[0.32, 0.3, 0.9]} />
      <mesh geometry={geo.fender} material={mat.paint} position={[1.95, 0.46, 0]} scale={[0.42, 0.26, 0.86]} />
      {/* full-width rear light bar */}
      <mesh material={mat.brake} position={[-2.33, 0.72, 0]}><boxGeometry args={[0.06, 0.08, 1.56]} /></mesh>
      {/* ducktail */}
      <mesh material={mat.paint} position={[-2.08, 0.92, 0]} rotation={[0, 0, 0.22]}><boxGeometry args={[0.36, 0.05, 1.5]} /></mesh>
      {/* mirrors */}
      {[0.92, -0.92].map((z) => (
        <mesh key={'m' + z} material={mat.paint} position={[0.5, 0.98, z]}><boxGeometry args={[0.14, 0.09, 0.16]} /></mesh>
      ))}
      {/* sills */}
      <mesh material={mat.trim} position={[0, 0.27, 0]}><boxGeometry args={[3.9, 0.08, 1.74]} /></mesh>
      {wheelAt.map(([x, z, isFront], i) => (
        <group key={i} position={[x, 0.37, z]} ref={(o) => { if (o && isFront) front.current[i] = o; }}>
          <group rotation={[Math.PI / 2, 0, 0]} ref={(o) => { if (o) wheels.current[i] = o; }}>
            <mesh geometry={geo.tire} material={mat.tire} />
            <mesh geometry={geo.rim} material={mat.rim} />
          </group>
        </group>
      ))}
    </group>
  );
});

export default Car911;
