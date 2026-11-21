# Shreyas Peddireddy · Portfolio

**Live:** https://shreyas-peddireddy.vercel.app

A 3D night-drive portfolio. Scroll to drive a 911-style coupe down a winding road; each role,
degree and shipped project is a glowing roadside billboard, and the drive ends at "your frontend team".

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · Three.js · React Three Fiber · drei · postprocessing · GSAP + ScrollTrigger · Lenis · React Bits

## What's where

| Path | What it does |
| --- | --- |
| `src/data/profile.ts` | All content: milestones, garage projects, skills, links. Edit this to update the site. |
| `src/three/World.tsx` | The fixed 3D canvas: lights, fog, environment reflections, bloom and vignette. |
| `src/three/track.ts` | The road's spline and where each milestone sits on it. |
| `src/three/Rig.tsx` | Moves the car from scroll (steering, body roll, wheel spin, brake lights) and flies the camera: orbit → chase → orbit. |
| `src/three/Car911.tsx` | The 911-style coupe built in code. |
| `src/three/Car.tsx` | Swaps in a real model if `public/models/porsche-911.glb` exists. |
| `src/three/Road.tsx`, `Scenery.tsx`, `Signs.tsx` | Asphalt, lane paint, start/finish line, trees, mountains, lamps, stars, moon and the milestone billboards. |
| `src/components/DriveSection.tsx` | One screen of scroll per milestone; feeds scroll progress to the car; 3D-tilting glass cards. |
| `src/components/Hud3D.tsx` | Speedometer, gear, minimap and "Now passing" (React Bits DecryptedText). |
| `src/components/reactbits/` | React Bits components: SplitText, ShinyText, CountUp, DecryptedText, Magnet, SpotlightCard, ClickSpark. |

### 3D car model and license

`public/models/porsche-911.glb` is **"(FREE) Porsche 911 Carrera 4S" by [Karol Miklas](https://sketchfab.com/karolmiklas)**
([Sketchfab](https://sketchfab.com/3d-models/free-porsche-911-carrera-4s-d01b254483794de3819786d93e0e1ebf)),
licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). This copy is modified: repainted, badges and
plates removed, simplified from about 650k to 224k triangles, textures resized to 1024px WebP and meshopt-compressed
(24MB → 2.3MB). Under ShareAlike, this modified model file is also shared under CC BY-SA 4.0. The site's own code is
separate and not affected. This project is not affiliated with Porsche.

### Sky and ground (CC0, Poly Haven)

- `public/env/day_2k.hdr`: [Kloofendal 48d Partly Cloudy (Pure Sky)](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky)
- `public/env/night_2k.hdr`: [Kloppenheim 02 (Pure Sky)](https://polyhaven.com/a/kloppenheim_02_puresky)
- `public/textures/grass_*`: [Aerial Grass Rock](https://polyhaven.com/a/aerial_grass_rock)
- `public/textures/asphalt_*`: [Asphalt 02](https://polyhaven.com/a/asphalt_02)

All CC0 (public domain); credit is appreciated, not required.

### Your avatar at the finish line

Create it at [MetaPerson Creator](https://avatarsdk.com/avatar-creator/) from one front-facing selfie, export as **GLB**,
and save it as `public/models/avatar.glb`. It appears beside the car at the finish line, and its head follows the mouse.
Until then, a blue placeholder shows in `npm run dev` only.

To change the paint, edit `PAINT` in `src/three/Car.tsx` (set it to `null` for the original silver). If the
model file is missing, the code-built `Car911` is used instead.

Visitors with "reduce motion" on get the same content without smoothing, intro sweeps or extra effects.

## Run it

```bash
npm install
npm run dev
```

## Deploy

Hosted free on **Vercel** (Hobby plan). Redeploy from this folder with:

```bash
npx vercel deploy --prod
```

The included GitHub Pages workflow (`.github/workflows/deploy.yml`) also works if you'd rather host on Pages:
in the repo go to **Settings → Pages → Source: GitHub Actions**.
