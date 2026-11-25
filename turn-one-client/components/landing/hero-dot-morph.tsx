"use client"

/**
 * The landing hero scene: one cloud of dots that is the car, then the lap (chosen 2026-11-25).
 *
 * Loop: the car turns as a point cloud with a red scan (C) → its dots stream off and settle into
 * the real Paul Ricard lap, coloured where that lap lost (red) or gained (green) time, while a
 * bright runner drives it and the HUD shows speed, gear and delta (A) → the dots stream back into
 * the car. Points are sampled from the GLB surfaces, so no livery or third-party marks survive.
 */

import { Suspense, useMemo, useRef, type RefObject } from "react"
import * as THREE from "three"
import { Canvas, useFrame } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js"
import { CAR } from "./data"
import { type HudRefs, lap, lapClock, localLoss, sampleAt, writeHud } from "./hero-lap"

const COUNT = 24000

// Timeline, seconds: car → morph → lap → morph back.
const CAR_HOLD = 6
const MORPH = 2.6
const LAP_HOLD = 8
const PERIOD = CAR_HOLD + MORPH + LAP_HOLD + MORPH
/** Spacing of the lap's dot grid in world units, about 11 px at the hero's size like the 2D version. */
const GRID = 0.05
/** Field extent around the line, in grid steps. */
const FIELD = 10
/** Dot size, world units: the car keeps its fine dots, the lap gets the 2D version's bigger ones. */
const SIZE_CAR = 0.02
const SIZE_LAP = 0.042
/** Runner halo radius on the lap plane, world units (~60 px, as in the 2D version). */
const HALO = 0.28
/** How much of the morph window the per-dot start delay may use. */
const STAGGER = 0.4

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

/** 0 = car, 1 = lap, with each dot's own delay. */
function morphAt(t: number, delay: number) {
  const local = (p: number) => ease(THREE.MathUtils.clamp((p - delay) / (1 - STAGGER), 0, 1))
  if (t < CAR_HOLD) return 0
  if (t < CAR_HOLD + MORPH) return local((t - CAR_HOLD) / MORPH)
  if (t < CAR_HOLD + MORPH + LAP_HOLD) return 1
  return 1 - local((t - CAR_HOLD - MORPH - LAP_HOLD) / MORPH)
}

function Morph({ hud, reduced }: { hud: RefObject<HudRefs>; reduced: boolean }) {
  const { scene } = useGLTF(CAR.model, CAR.draco)
  const points = useRef<THREE.Points>(null)

  const data = useMemo(() => {
    // ---- car: surface samples, centred, scaled to ~4.2 units long --------------------------
    scene.updateMatrixWorld(true)
    const meshes: THREE.Mesh[] = []
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh && m.geometry?.attributes?.position) meshes.push(m)
    })
    const weights = meshes.map((m) => m.geometry.attributes.position.count)
    const total = weights.reduce((a, b) => a + b, 0) || 1
    const raw: THREE.Vector3[] = []
    const p = new THREE.Vector3()
    meshes.forEach((m, mi) => {
      const n = Math.max(1, Math.round((COUNT * weights[mi]) / total))
      const sampler = new MeshSurfaceSampler(m).build()
      for (let i = 0; i < n && raw.length < COUNT; i++) {
        sampler.sample(p)
        raw.push(p.clone().applyMatrix4(m.matrixWorld))
      }
    })
    while (raw.length < COUNT) raw.push(raw[raw.length % Math.max(1, raw.length)].clone())
    const box = new THREE.Box3().setFromPoints(raw)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const lengthAxis = size.z >= size.x ? 2 : 0
    const s = 4.2 / Math.max(size.x, size.y, size.z)
    const car = raw.map((v) => v.sub(center).multiplyScalar(s))
    // Pair dots front-to-back with the lap left-to-right, so the stream reads as one flow.
    car.sort((a, b) => (lengthAxis === 2 ? a.z - b.z : a.x - b.x))

    // ---- lap: a sparse dot grid on a plane tilted back towards the camera (the A look) ----
    // Grid dots on the line light up; the rest are a dim field that fades away from the track.
    // Several car dots share one grid dot, so the lap reads as sparse as the 2D version.
    const xs = lap.map.x
    const ys = lap.map.y
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
    const ts = 4.6 / Math.max(maxX - minX, maxY - minY)
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
    const tilt = 0.28 // radians back
    const line = xs.map((x, i) => ({ x: (x - cx) * ts, y: (ys[i] - cy) * ts, i }))
    const stride = Math.max(1, Math.floor(line.length / 600))
    const coarse = line.filter((_, i) => i % stride === 0)
    const halfW = ((maxX - minX) * ts) / 2 + GRID * FIELD
    const halfH = ((maxY - minY) * ts) / 2 + GRID * FIELD
    const grid: { x: number; y: number; idx: number; dist: number }[] = []
    for (let gy = -halfH; gy <= halfH; gy += GRID) {
      for (let gx = -halfW; gx <= halfW; gx += GRID) {
        let best = Infinity, idx = 0
        for (const q of coarse) {
          const d = (q.x - gx) ** 2 + (q.y - gy) ** 2
          if (d < best) { best = d; idx = q.i }
        }
        const dist = Math.sqrt(best)
        // Keep the field only near the track, like a vignette around it.
        if (dist < GRID * FIELD) grid.push({ x: gx, y: gy, idx, dist })
      }
    }
    grid.sort((p1, p2) => p1.x - p2.x)
    const trackPts = Array.from({ length: COUNT }, (_, i) => {
      const g = grid[Math.floor((i * grid.length) / COUNT)]
      return { v: new THREE.Vector3(g.x, g.y * Math.cos(tilt) - 0.1, -g.y * Math.sin(tilt)), idx: g.idx, dist: g.dist, gx: g.x, gy: g.y }
    })

    const carPos = new Float32Array(COUNT * 3)
    const trackPos = new Float32Array(COUNT * 3)
    const trackIdx = new Uint32Array(COUNT)
    const delay = new Float32Array(COUNT)
    const shade = new Float32Array(COUNT)
    const lenCoord = new Float32Array(COUNT)
    /** 1 for a grid dot on the line; below 0 for the field, nearer -1 further from the track. */
    const onLine = new Float32Array(COUNT)
    const planeX = new Float32Array(COUNT)
    const planeY = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      carPos.set([car[i].x, car[i].y, car[i].z], i * 3)
      trackPos.set([trackPts[i].v.x, trackPts[i].v.y, trackPts[i].v.z], i * 3)
      trackIdx[i] = trackPts[i].idx
      onLine[i] = trackPts[i].dist < GRID * 0.75 ? 1 : -Math.min(1, trackPts[i].dist / (GRID * FIELD))
      planeX[i] = trackPts[i].gx
      planeY[i] = trackPts[i].gy
      // Front of the car leaves first; a little noise so it isn't a hard wipe.
      delay[i] = (i / COUNT) * STAGGER * 0.8 + Math.random() * STAGGER * 0.2
      shade[i] = 0.45 + Math.random() * 0.45
      lenCoord[i] = lengthAxis === 2 ? car[i].z : car[i].x
    }
    const half = (lengthAxis === 2 ? size.z : size.x) * s * 0.5
    return { carPos, trackPos, trackIdx, delay, shade, lenCoord, onLine, planeX, planeY, line, half }
  }, [scene])

  const positions = useMemo(() => new Float32Array(COUNT * 3), [])
  const colors = useMemo(() => new Float32Array(COUNT * 3), [])
  const rot = useRef(-0.6)
  const tmp = useMemo(() => new THREE.Vector3(), [])
  const frame = useRef(0)

  useFrame((state, dt) => {
    const pts = points.current
    if (!pts) return
    const t = reduced ? 0 : state.clock.elapsedTime % PERIOD
    const inCar = t < CAR_HOLD + MORPH || t > CAR_HOLD + MORPH + LAP_HOLD
    if (!reduced && inCar) rot.current += dt * 0.14
    const rotY = rot.current
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY)
    const lean = 0.16 + state.pointer.y * 0.08

    // Car scan sweeps nose to tail; the runner drives the lap during the lap hold.
    const scan = ((state.clock.elapsedTime * 0.35) % 1.4) * 2 * data.half - data.half * 1.2
    const lapT = THREE.MathUtils.clamp((t - CAR_HOLD - MORPH) / LAP_HOLD, 0, 1)
    const target = lapT * lapClock[lapClock.length - 1]
    const runner = sampleAt(target)

    const P = pts.geometry.attributes.position as THREE.BufferAttribute
    const C = pts.geometry.attributes.color as THREE.BufferAttribute
    const { carPos, trackPos, trackIdx, delay, shade, lenCoord, onLine, planeX, planeY, line, half } = data
    const rp = line[Math.min(line.length - 1, runner)]
    let lapShare = 0

    for (let i = 0; i < COUNT; i++) {
      const j = i * 3
      // Car dot, turned and leaned.
      const x0 = carPos[j], y0 = carPos[j + 1], z0 = carPos[j + 2]
      const xr = x0 * cosY + z0 * sinY
      const zr = -x0 * sinY + z0 * cosY
      tmp.set(xr, y0 * Math.cos(lean) - zr * Math.sin(lean), y0 * Math.sin(lean) + zr * Math.cos(lean))

      const m = morphAt(t, delay[i])
      lapShare += m
      // Mid-flight the dots lift and drift, so the stream has some air in it.
      const lift = Math.sin(Math.PI * m) * 0.5
      positions[j] = tmp.x + (trackPos[j] - tmp.x) * m
      positions[j + 1] = tmp.y + (trackPos[j + 1] - tmp.y) * m + lift * (0.6 + shade[i])
      positions[j + 2] = tmp.z + (trackPos[j + 2] - tmp.z) * m + lift * 0.4

      // Car colour: grey dots, red under the scan band.
      const b = shade[i]
      let cr = b * 0.75, cg = b * 0.75, cb = b * 0.75
      const d = Math.abs(lenCoord[i] - scan)
      if (d < half * 0.06) {
        const k = 1 - d / (half * 0.06)
        cr = b + k * (1 - b)
        cg = cb = b * 0.75 * (1 - k) + k * 0.15
      }
      // Lap colour, written as the 2D version's on-screen values (sRGB) and converted to linear,
      // with tone mapping off on the material, so a 7 % field dot really shows at 7 %.
      // Line: red where the lap lost time, green where it gained, grey where it held; brightness
      // 50-100 % by the size of the change. Field: 7 % fading out. Runner: a halo like the 2D one.
      const idx = trackIdx[i]
      let lr: number, lg: number, lb: number
      let halo = 0
      if (lapT > 0 && lapT < 1 && rp) {
        const dr = Math.hypot(planeX[i] - rp.x, planeY[i] - rp.y)
        if (dr < HALO) halo = 0.9 * (1 - dr / HALO)
      }
      if (onLine[i] > 0) {
        const loss = localLoss[idx] ?? 0
        const a = Math.max(0.5 + Math.min(0.5, Math.abs(loss) * 25), halo)
        if (loss > 0.004) { lr = 0.94 * a; lg = 0.27 * a; lb = 0.27 * a }
        else if (loss < -0.004) { lr = 0.13 * a; lg = 0.77 * a; lb = 0.37 * a }
        else { lr = lg = lb = Math.max(0.5, halo) }
      } else {
        lr = lg = lb = Math.max(0.07 * (1 + onLine[i]), halo)
      }
      lr = lr ** 2.2; lg = lg ** 2.2; lb = lb ** 2.2
      colors[j] = cr + (lr - cr) * m
      colors[j + 1] = cg + (lg - cg) * m
      colors[j + 2] = cb + (lb - cb) * m
    }
    P.needsUpdate = true
    C.needsUpdate = true
    const mat = pts.material as THREE.PointsMaterial
    mat.size = SIZE_CAR + (SIZE_LAP - SIZE_CAR) * (lapShare / COUNT)

    // HUD: visible while the dots are the lap; written straight to the DOM, a few times a second.
    const h = hud.current
    frame.current++
    if (h?.root) h.root.style.opacity = String(Math.max(0, (lapShare / COUNT - 0.6) / 0.4))
    if (frame.current % 6 === 0 && lapT > 0 && lapT < 1) writeHud(h, runner)
  })

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={SIZE_CAR} sizeAttenuation vertexColors transparent opacity={0.95} depthWrite={false} toneMapped={false} />
    </points>
  )
}

export function DotMorphScene({ hud, reduced, active = true }: { hud: RefObject<HudRefs>; reduced: boolean; active?: boolean }) {
  return (
    <Canvas
      className="absolute inset-0"
      camera={{ position: [0, 0.7, 5.6], fov: 40 }}
      dpr={[1, 2]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <Morph hud={hud} reduced={reduced} />
      </Suspense>
    </Canvas>
  )
}
