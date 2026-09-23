"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Html, Lightformer, OrbitControls, useGLTF } from "@react-three/drei";
import { CAR } from "./data";
import { FLOW_SPEED, Streamlines, Tunnel } from "./tunnel-dressing";

/**
 * The 2026 Turn One car in a wind tunnel, in the STUDIO look from t1-style:
 * near-black room, one hard key light, nothing coloured by accident — except
 * the airflow, which is cyan.
 *
 * The visitor drags to orbit (it turns slowly on its own until touched).
 * Hotspots are anchored to real parts of the mesh. `aero` switches the 2026
 * active-aero state: the wing elements actually move, and the flow reacts.
 *
 * The parent renders a poster <img> underneath (SSR'd, the LCP element, the
 * fallback); this canvas fades in over it once the model has decoded, and
 * renders only while on screen.
 */

export type AeroMode = "corner" | "straight";

export type Hotspot = {
  id: string;
  /** World position on the car (metres; +Z is the nose, Y up) */
  position: [number, number, number];
  label: string;
  index: number;
  onClick: () => void;
};

type Props = {
  hotspots?: Hotspot[];
  aero?: AeroMode;
  onInteract?: () => void;
  className?: string;
  /** Fraction of the width to push the framing right, so the car clears the copy column on wide screens */
  shiftX?: number;
};

const START: [number, number, number] = [6.3, 2.1, 5.6]; // front three-quarter, far enough back that the whole car clears the copy
const TARGET: [number, number, number] = [0, 0.5, 0];

export function CarScene({ hotspots, aero = "corner", onInteract, className = "", shiftX = 0 }: Props) {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className={`absolute inset-0 ${className}`}>
      <Canvas
        dpr={[1, 1.5]}
        frameloop={visible ? "always" : "never"}
        gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
        camera={{ fov: 32, near: 0.1, far: 60, position: START }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor("#020202");
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          scene.fog = new THREE.Fog("#020202", 10, 24);
        }}
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: ready ? 1 : 0 }}
      >
        <Suspense fallback={null}>
          <Studio />
          <AeroRig target={aero === "straight" ? 1 : 0} onReady={() => setReady(true)} />
          {hotspots?.map((h) => (
            <Html key={h.id} position={h.position} center occlude zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
              <button
                type="button"
                onClick={h.onClick}
                aria-label={`Open ${h.label}`}
                className="group pointer-events-auto relative -translate-y-1/2"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <span className="absolute inset-0 -m-3 animate-ping rounded-full bg-red-500/30 motion-reduce:hidden" />
                <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-red-400 bg-black/70 font-mono text-[11px] font-bold text-red-400 backdrop-blur-sm transition-colors group-hover:bg-red-600 group-hover:text-white">
                  {String(h.index + 1).padStart(2, "0")}
                </span>
                <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap border border-zinc-800 bg-black/80 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-zinc-200 opacity-0 transition-opacity group-hover:opacity-100">
                  {h.label}
                </span>
              </button>
            </Html>
          ))}
          <ViewShift shiftX={shiftX} />
          <OrbitRig onInteract={onInteract} />
        </Suspense>
      </Canvas>
    </div>
  );
}

/* ── Lighting: STUDIO look ───────────────────────────────────────────────── */
function Studio() {
  return (
    <>
      {/* one hard key overhead, slightly front-left; a cool rim from behind so the silhouette reads */}
      <spotLight position={[-3, 10, 3]} angle={0.55} penumbra={0.7} intensity={420} distance={30} decay={1.6} color="#fff3e0" />
      <spotLight position={[6, 5, -8]} angle={0.5} penumbra={0.8} intensity={120} distance={30} decay={1.6} color="#d8e2ff" />
      <ambientLight intensity={0.35} />
      {/* reflections come from a synthetic room, no HDR download */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={4} position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[12, 5, 1]} />
        <Lightformer form="rect" intensity={2} position={[-8, 2, 0]} rotation={[0, Math.PI / 2, 0]} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={1} position={[8, 2, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[0, 2, 9]} rotation={[0, Math.PI, 0]} scale={[8, 2, 1]} />
      </Environment>
      <ContactShadows position={[0, -0.02, 0]} opacity={0.9} scale={12} blur={2.4} far={1.6} resolution={512} frames={1} />
    </>
  );
}

/* ── The model ───────────────────────────────────────────────────────────── */

/** Moving wing elements (GLB node → hinge edge and travel). Angles in radians; negative lifts the leading edge. */
const FLAPS = [
  { node: "rear_wing_drs", hinge: "trailing" as const, open: -0.5 },
  { node: "front_wing_top", hinge: "leading" as const, open: -0.18 },
];
const WHEELS = ["front_tire", "front_wheel_cover", "inside_cover", "rear_tire", "rear_wheel_cover", "rear_inside_cover"];
const WHEEL_RADIUS = 0.33;
const X_AXIS = new THREE.Vector3(1, 0, 0);
const tmpQ = new THREE.Quaternion();
const tmpV = new THREE.Vector3();

type Flap = { o: THREE.Object3D; base: THREE.Vector3; rest: THREE.Quaternion; hinge: THREE.Vector3; open: number };

function Car({ aero, onReady }: { aero: RefObject<number>; onReady: () => void }) {
  const { scene } = useGLTF(CAR.model, CAR.draco);

  // Find each flap's hinge edge in its own space. Multi-primitive nodes load as Groups, so measure the subtree.
  const parts = useMemo(() => {
    const flaps: Flap[] = FLAPS.flatMap((f) => {
      const o = scene.getObjectByName(f.node);
      if (!o) return [];
      // useGLTF caches the scene across mounts, so the rest pose is captured once, before anything moves it
      if (!o.userData.t1Rest) {
        o.updateWorldMatrix(true, true);
        const box = new THREE.Box3().setFromObject(o).applyMatrix4(o.matrixWorld.clone().invert());
        o.userData.t1Rest = {
          base: o.position.clone(),
          rest: o.quaternion.clone(),
          hinge: new THREE.Vector3(0, (box.min.y + box.max.y) / 2, f.hinge === "trailing" ? box.min.z : box.max.z),
        };
      }
      return [{ o, ...(o.userData.t1Rest as Omit<Flap, "o" | "open">), open: f.open }];
    });
    const wheels = WHEELS.map((n) => scene.getObjectByName(n)).filter((o): o is THREE.Object3D => !!o);
    return { flaps, wheels };
  }, [scene]);

  useEffect(() => {
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).frustumCulled = false;
    });
    onReady();
  }, [scene, onReady]);

  useFrame((_, dt) => {
    const a = aero.current ?? 0;
    for (const f of parts.flaps) {
      // rotate about the hinge: q = rest·Rx(θ); p = base + rest·(h − Rx(θ)·h)
      tmpQ.setFromAxisAngle(X_AXIS, f.open * a);
      tmpV.copy(f.hinge).applyQuaternion(tmpQ).negate().add(f.hinge).multiply(f.o.scale).applyQuaternion(f.rest);
      f.o.position.copy(f.base).add(tmpV);
      f.o.quaternion.copy(f.rest).multiply(tmpQ);
    }
    // the belt and the air move at the same speed, so the wheels turn with them
    const spin = (-FLOW_SPEED * (1 + 0.25 * a) * dt) / WHEEL_RADIUS;
    for (const w of parts.wheels) w.rotateOnWorldAxis(X_AXIS, spin);
  });

  return <primitive object={scene} />;
}
useGLTF.preload(CAR.model, CAR.draco);

/**
 * Owns the Corner ↔ Straight blend (0 → 1) and eases it every frame — the wings
 * take ~0.4 s to move, like the real actuators. The car, the flow and the belt read it.
 */
function AeroRig({ target, onReady }: { target: number; onReady: () => void }) {
  const blend = useRef(0);
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 7);
    blend.current += (target - blend.current) * k;
  });
  return (
    <>
      <Tunnel aero={blend} />
      <Streamlines aero={blend} />
      <Car aero={blend} onReady={onReady} />
    </>
  );
}

/* ── Camera ──────────────────────────────────────────────────────────────── */

/** Framing: wider lens on portrait screens so the whole car fits (and lifted above the copy),
 *  and a sideways push on wide screens so the car sits right of the copy column. */
function ViewShift({ shiftX }: { shiftX: number }) {
  const get = useThree((s) => s.get);
  const size = useThree((s) => s.size);
  useEffect(() => {
    // three objects are mutable by design; read the camera off the store so the compiler doesn't see a hook value mutated
    const cam = get().camera as THREE.PerspectiveCamera;
    const portrait = size.width < size.height;
    cam.fov = portrait ? 50 : 32;
    // portrait: lift the car into the top half, clear of the copy stacked underneath it
    const dy = portrait ? 0.2 * size.height : 0;
    if (shiftX || dy) cam.setViewOffset(size.width, size.height, -shiftX * size.width, dy, size.width, size.height);
    else cam.clearViewOffset();
    cam.updateProjectionMatrix();
    return () => cam.clearViewOffset();
  }, [get, size, shiftX]);
  return null;
}

function OrbitRig({ onInteract }: { onInteract?: () => void }) {
  const [touched, setTouched] = useState(false);
  return (
    <OrbitControls
      target={TARGET}
      enablePan={false}
      enableZoom={false}
      minPolarAngle={0.9}
      maxPolarAngle={1.45}
      autoRotate={!touched}
      autoRotateSpeed={0.6}
      enableDamping
      dampingFactor={0.06}
      onStart={() => {
        setTouched(true);
        onInteract?.();
      }}
    />
  );
}



