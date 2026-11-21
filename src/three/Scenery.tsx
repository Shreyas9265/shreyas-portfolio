import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { curve, frameAt, ROAD_W, rng } from './track';
import { heightAt, roadDist } from './terrain';
import { crossedQuads, paintTree } from './trees';
import { drive } from './store';

const BASE = import.meta.env.BASE_URL;

const setInstances = (list: THREE.Matrix4[], colors?: THREE.Color[]) => (im: THREE.InstancedMesh | null) => {
  if (!im) return;
  list.forEach((m, i) => { im.setMatrixAt(i, m); if (colors) im.setColorAt(i, colors[i]); });
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
};

/** Rolling terrain with scanned grass, painted pine forest swaying in the wind, and street lamps. */
export default function Scenery({ lite }: { lite: boolean }) {
  const grass = useTexture({
    map: `${BASE}textures/grass_diff.jpg`,
    normalMap: `${BASE}textures/grass_nor_gl.jpg`,
    roughnessMap: `${BASE}textures/grass_rough.jpg`,
  });
  useMemo(() => {
    Object.values(grass).forEach((t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; });
    grass.map.colorSpace = THREE.SRGBColorSpace;
  }, [grass]);

  const box = useMemo(() => new THREE.Box3().setFromPoints(curve.getPoints(200)), []);

  // Terrain mesh: flat at the road, meadows, then hills and mountains. Vertex colors add rock on steep slopes.
  const terrain = useMemo(() => {
    const size = 1700, seg = lite ? 150 : 230;
    const cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2;
    const g = new THREE.PlaneGeometry(size, size, seg, seg);
    g.rotateX(-Math.PI / 2);
    const pos = g.getAttribute('position') as THREE.BufferAttribute;
    const uv = g.getAttribute('uv') as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + cx, z = pos.getZ(i) + cz;
      pos.setXYZ(i, x, heightAt(x, z), z);
      uv.setXY(i, x / 7, z / 7);
    }
    g.computeVertexNormals();
    const nor = g.getAttribute('normal');
    const colors = new Float32Array(pos.count * 3), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const slope = 1 - nor.getY(i), h = pos.getY(i);
      c.setRGB(1, 1, 1);
      c.lerp(new THREE.Color('#8a8072'), THREE.MathUtils.clamp((slope - 0.18) * 3, 0, 1));      // rock on steep slopes
      c.lerp(new THREE.Color('#f4f6f8'), THREE.MathUtils.clamp((h - 150) / 40, 0, 1) * 0.85);   // snow on peaks
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, [box, lite]);

  const groundMat = useMemo(() => new THREE.MeshStandardMaterial({ ...grass, vertexColors: true, roughness: 1 }), [grass]);

  // Forest: painted pines on crossed quads, three variants, color jitter per tree.
  const forest = useMemo(() => {
    const r = rng(911), want = lite ? 420 : 950;
    const sets = [0, 1, 2].map(() => ({ m: [] as THREE.Matrix4[], c: [] as THREE.Color[] }));
    const q = new THREE.Quaternion(), mm = new THREE.Matrix4(), up = new THREE.Vector3(0, 1, 0);
    for (let tries = 0, n = 0; n < want && tries < 20000; tries++) {
      const x = THREE.MathUtils.lerp(box.min.x - 140, box.max.x + 140, r());
      const z = THREE.MathUtils.lerp(box.min.z - 90, box.max.z + 90, r());
      const d = roadDist(x, z);
      if (d < ROAD_W + 7 || d > 150) continue;
      if (d > 60 && r() < 0.5) continue; // denser near the road
      const y = heightAt(x, z, d);
      if (y > 120) continue;
      const h = 7 + r() * 9;
      q.setFromAxisAngle(up, r() * Math.PI);
      const set = sets[n % 3];
      set.m.push(mm.clone().compose(new THREE.Vector3(x, y - 0.3, z), q.clone(), new THREE.Vector3(h * 0.55, h * 0.5, h * 0.55)));
      set.c.push(new THREE.Color().setHSL(0.27 + r() * 0.05, 0.25 + r() * 0.2, 0.75 + r() * 0.25));
      n++;
    }
    return sets;
  }, [box, lite]);

  const treeGeo = useMemo(crossedQuads, []);
  const wind = useMemo(() => ({ value: 0 }), []);
  const treeMats = useMemo(() => [11, 23, 37].map((seed) => {
    const m = new THREE.MeshStandardMaterial({ map: paintTree(seed), alphaTest: 0.42, side: THREE.DoubleSide, roughness: 0.95 });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uWind = wind;
      sh.vertexShader = 'uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        float sway = sin(uWind * 1.3 + instanceMatrix[3].x * 0.21 + instanceMatrix[3].z * 0.17) * 0.045 * position.y * position.y;
        transformed.x += sway; transformed.z += sway * 0.6;`);
    };
    return m;
  }), [wind]);

  // Street lamps along the road.
  const lamps = useMemo(() => {
    const poles: THREE.Matrix4[] = [], bulbs: THREE.Matrix4[] = [], arms: THREE.Matrix4[] = [];
    const q = new THREE.Quaternion(), m = new THREE.Matrix4(), one = new THREE.Vector3(1, 1, 1);
    const L = curve.getLength();
    for (let s = 10, k = 0; s < L - 10; s += 26, k++) {
      const { p, side, tan } = frameAt(s / L);
      const off = (k % 2 ? 1 : -1) * (ROAD_W + 2);
      const base = p.clone().addScaledVector(side, off);
      poles.push(m.clone().compose(new THREE.Vector3(base.x, 2.7, base.z), q, one));
      const head = p.clone().addScaledVector(side, off * 0.72);
      bulbs.push(m.clone().compose(new THREE.Vector3(head.x, 5.25, head.z), q, new THREE.Vector3(1, 0.35, 1)));
      const armQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), side.clone().multiplyScalar(-Math.sign(off)));
      const mid = base.clone().lerp(head, 0.5);
      arms.push(m.clone().compose(new THREE.Vector3(mid.x, 5.4, mid.z), armQ, new THREE.Vector3(base.distanceTo(head), 1, 1)));
      void tan;
    }
    return { poles, bulbs, arms };
  }, []);
  const metal = useMemo(() => new THREE.MeshStandardMaterial({ color: '#5d636c', metalness: 0.8, roughness: 0.35 }), []);
  const bulbMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fff2d6', emissive: '#ffc46b', emissiveIntensity: 5 }), []);

  const tint = useRef(new THREE.Color());
  useFrame((state) => {
    const t = drive.dayMix;
    wind.value = state.clock.elapsedTime;
    groundMat.color.copy(tint.current.set('#1a2630').lerp(new THREE.Color('#b9d59a'), t));
    treeMats.forEach((m) => m.color.set('#2b3a44').lerp(new THREE.Color('#ffffff'), t));
    bulbMat.emissiveIntensity = 5 * (1 - t);
  });

  return (
    <group>
      <mesh geometry={terrain} material={groundMat} />
      {forest.map((set, i) => (
        <instancedMesh key={i} args={[treeGeo, treeMats[i], set.m.length]} ref={setInstances(set.m, set.c)} frustumCulled={false} />
      ))}
      <instancedMesh args={[undefined, metal, lamps.poles.length]} ref={setInstances(lamps.poles)}>
        <cylinderGeometry args={[0.07, 0.11, 5.4, 10]} />
      </instancedMesh>
      <instancedMesh args={[undefined, metal, lamps.arms.length]} ref={setInstances(lamps.arms)}>
        <boxGeometry args={[1, 0.08, 0.08]} />
      </instancedMesh>
      <instancedMesh args={[undefined, bulbMat, lamps.bulbs.length]} ref={setInstances(lamps.bulbs)}>
        <boxGeometry args={[0.7, 0.3, 0.32]} />
      </instancedMesh>
    </group>
  );
}
