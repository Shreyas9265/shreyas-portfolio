import { forwardRef, Suspense, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import Car911, { type CarHandle } from './Car911';

/**
 * "(FREE) Porsche 911 Carrera 4S" by Karol Miklas, CC BY-SA 4.0:
 * https://sketchfab.com/3d-models/free-porsche-911-carrera-4s-d01b254483794de3819786d93e0e1ebf
 * Optimized for the web (badges and plates removed, simplified, textures resized). The code-built
 * Car911 shows while it loads, or if the file is missing.
 */
export const MODEL_URL = `${import.meta.env.BASE_URL}models/porsche-911.glb`;
/** Turns the model so its nose points along +x. */
export const MODEL_YAW = Math.PI / 2;
/** Body color. Set to null to keep the model's original silver. */
export const PAINT: string | null = '#b3121c';
const LENGTH = 4.5;

const Car = forwardRef<CarHandle>(function Car(_, ref) {
  const [hasModel, setHasModel] = useState(false);
  useEffect(() => {
    fetch(MODEL_URL, { method: 'HEAD' })
      .then((r) => { const ct = r.headers.get('content-type') ?? ''; if (r.ok && !ct.includes('html')) setHasModel(true); })
      .catch(() => {});
  }, []);
  if (!hasModel) return <Car911 ref={ref} />;
  return <Suspense fallback={<Car911 ref={ref} />}><GlbCar ref={ref} /></Suspense>;
});

type Wheel = { steer: THREE.Group; spin: THREE.Group; front: boolean };

/** Smallest-variance direction of a point cloud (inverse power iteration on its covariance). */
function discAxis(pts: THREE.Vector3[], c: THREE.Vector3) {
  const m = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (const p of pts) {
    const x = p.x - c.x, y = p.y - c.y, z = p.z - c.z;
    m[0] += x * x; m[1] += x * y; m[2] += x * z; m[4] += y * y; m[5] += y * z; m[8] += z * z;
  }
  m[3] = m[1]; m[6] = m[2]; m[7] = m[5];
  const cov = new THREE.Matrix3().fromArray(m).transpose();
  const det = cov.determinant();
  if (Math.abs(det) < 1e-12) return new THREE.Vector3(0, 0, 1);
  const inv = cov.clone().invert();
  const v = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i < 30; i++) v.applyMatrix3(inv).normalize();
  return v;
}

/**
 * The model's axles are single meshes (both wheels plus calipers). Split each into a left and right
 * wheel with its own hub at the tire's center, so wheels roll, front wheels steer, and calipers stay put.
 * Works in car space: +x forward, y up, z sideways.
 */
function buildWheels(model: THREE.Object3D) {
  model.updateMatrixWorld(true);
  const axles: THREE.Object3D[] = [];
  model.traverse((o) => { if (/^Cylinder\.?00[01]$/.test(o.name)) axles.push(o); });
  const wheels: Wheel[] = [];
  let radius = 0.33;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), m = new THREE.Vector3();

  const axleX = axles.map((ax) => new THREE.Box3().setFromObject(ax).getCenter(new THREE.Vector3()).x);
  axles.forEach((axle, ai) => {
    const front = axleX[ai] === Math.max(...axleX);
    const halves = { l: { meshes: [] as { mesh: THREE.Mesh; geo: THREE.BufferGeometry; caliper: boolean }[], tire: new THREE.Box3(), pts: [] as THREE.Vector3[] }, r: { meshes: [] as { mesh: THREE.Mesh; geo: THREE.BufferGeometry; caliper: boolean }[], tire: new THREE.Box3(), pts: [] as THREE.Vector3[] } };
    const meshes: THREE.Mesh[] = [];
    axle.traverse((o) => { if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh); });
    for (const mesh of meshes) {
      const geo = mesh.geometry, pos = geo.getAttribute('position');
      const index = geo.index ? Array.from(geo.index.array as ArrayLike<number>) : Array.from({ length: pos.count }, (_, i) => i);
      const idx = { l: [] as number[], r: [] as number[] };
      const mat = mesh.material as THREE.Material;
      const isTire = mat.name === 'rubber';
      for (let t = 0; t < index.length; t += 3) {
        a.fromBufferAttribute(pos, index[t]).applyMatrix4(mesh.matrixWorld);
        b.fromBufferAttribute(pos, index[t + 1]).applyMatrix4(mesh.matrixWorld);
        c.fromBufferAttribute(pos, index[t + 2]).applyMatrix4(mesh.matrixWorld);
        m.copy(a).add(b).add(c).divideScalar(3);
        const side = m.z > 0 ? 'l' : 'r';
        idx[side].push(index[t], index[t + 1], index[t + 2]);
        if (isTire) { halves[side].tire.expandByPoint(a).expandByPoint(b).expandByPoint(c); if (t % 9 === 0) halves[side].pts.push(m.clone()); }
      }
      (['l', 'r'] as const).forEach((side) => {
        if (!idx[side].length) return;
        const g = geo.clone(); g.setIndex(idx[side]);
        halves[side].meshes.push({ mesh, geo: g, caliper: mat.name === 'Material.001' });
      });
    }
    (['l', 'r'] as const).forEach((side) => {
      const h = halves[side];
      if (h.tire.isEmpty()) return;
      // True wheel center and axle: the tire is a disc, so its axle is the direction of least spread.
      const center = h.pts.reduce((acc, p) => acc.add(p), new THREE.Vector3()).divideScalar(h.pts.length);
      const axle = discAxis(h.pts, center);
      if (axle.z * (side === 'l' ? 1 : -1) < 0) axle.negate();
      radius = h.tire.getSize(new THREE.Vector3()).y / 2;
      // Straighten: rotate the wheel about its center so its axle lines up with the car's sideways axis.
      const straighten = new THREE.Quaternion().setFromUnitVectors(axle, new THREE.Vector3(0, 0, side === 'l' ? 1 : -1));
      const steer = new THREE.Group(); steer.position.copy(center);
      const spin = new THREE.Group(); steer.add(spin);
      const fixSpin = new THREE.Group(); fixSpin.quaternion.copy(straighten); spin.add(fixSpin);
      const fixStill = new THREE.Group(); fixStill.quaternion.copy(straighten); steer.add(fixStill);
      // At rest: center · straighten · piece  =  center · straighten · center⁻¹ · original
      // i.e. the original wheel rotated about its own center, so piece = center⁻¹ · original.
      const toCenter = new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z);
      for (const part of h.meshes) {
        const piece = new THREE.Mesh(part.geo, part.mesh.material);
        piece.matrixAutoUpdate = false;
        piece.matrix.multiplyMatrices(toCenter, part.mesh.matrixWorld);
        (part.caliper ? fixStill : fixSpin).add(piece);
      }
      wheels.push({ steer, spin, front });
    });
    axle.parent?.remove(axle);
  });
  // Line up each axle's wheels front-to-back (the model's pre-steered pose left them offset).
  [true, false].forEach((isFront) => {
    const pair = wheels.filter((w) => w.front === isFront);
    if (pair.length !== 2) return;
    const x = (pair[0].steer.position.x + pair[1].steer.position.x) / 2;
    pair.forEach((w) => { w.steer.position.x = x; });
  });
  return { wheels, radius };
}

const GlbCar = forwardRef<CarHandle>(function GlbCar(_, ref) {
  const { scene } = useGLTF(MODEL_URL);
  const group = useRef<THREE.Group>(null!);
  const brake = useMemo(() => new THREE.MeshStandardMaterial(), []);

  const built = useMemo(() => {
    const m = scene.clone(true);

    // Materials: paint, glowing headlights, cheaper glass, shadows.
    m.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      
      const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.MeshPhysicalMaterial[];
      mats.forEach((mat) => {
        if (mat.name === 'paint' && PAINT) { mat.color = new THREE.Color(PAINT); mat.metalness = 0.55; mat.roughness = 0.28; mat.clearcoat = 1; mat.clearcoatRoughness = 0.04; }
        if (mat.name === 'lights') { mat.emissive = new THREE.Color('#fff4d6'); mat.emissiveIntensity = 3; mat.toneMapped = false; }
        if (mat.transmission > 0) { mat.transmission = 0; mat.transparent = true; mat.opacity = 0.35; mat.roughness = 0.05; mat.metalness = 0.6; }
      });
    });

    // Orient nose along +x, scale to a real 911's length, sit the tires on the road.
    m.rotation.y = MODEL_YAW;
    m.updateMatrixWorld(true);
    const size = new THREE.Box3().setFromObject(m).getSize(new THREE.Vector3());
    m.scale.multiplyScalar(LENGTH / Math.max(size.x, size.z));
    m.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(m), c = box.getCenter(new THREE.Vector3());
    m.position.x -= c.x; m.position.z -= c.z; m.position.y -= box.min.y;
    m.updateMatrixWorld(true);

    const { wheels, radius } = buildWheels(m);
    const rear = new THREE.Box3().setFromObject(m);
    return { m, wheels, radius, rearX: rear.min.x };
  }, [scene]);

  useImperativeHandle(ref, () => ({
    group: group.current, brake, exhaustX: built.rearX,
    front: built.wheels.filter((w) => w.front).map((w) => w.steer),
    spin: (d: number) => built.wheels.forEach((w) => { w.spin.rotation.z -= d / built.radius; }),
  }), [brake, built]);

  return (
    <group ref={group}>
      <primitive object={built.m} />
      {built.wheels.map((w, i) => <primitive key={i} object={w.steer} />)}
    </group>
  );
});

useGLTF.preload(MODEL_URL);
export default Car;
