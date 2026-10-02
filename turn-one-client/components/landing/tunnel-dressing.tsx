"use client";

import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Grid } from "@react-three/drei";

/**
 * Wind-tunnel dressing for the car scene.
 *
 * Streamlines are LineSegments whose endpoints are computed entirely in the
 * vertex shader: each line has a seed (x, y, phase); the head is the flow
 * position at time t and the tail at t − lag. The car is approximated by a
 * capsule-ish radius profile along Z so the air deflects around and over it.
 * A few thousand lines cost one draw call and no CPU work per frame.
 *
 * `aero` is the shared 0 → 1 blend between Corner mode (0: wings closed, a
 * strong upwash plume off the rear wing) and Straight mode (1: wings flat,
 * cleaner and faster flow). The scene eases it; everything here just reads it.
 *
 * Colour: `signal.cyan` — airflow only, always as streamlines, never a fill.
 */

const CYAN = new THREE.Color("#46d3ff");
/** Free-stream speed in scene units per second; the rolling road and wheels match it. */
export const FLOW_SPEED = 6;

const vert = /* glsl */ `
  uniform float uTime;
  uniform float uLift;
  attribute vec3 aSeed;
  attribute float aEnd;
  varying float vAlpha;

  // half-width of the body at z (car spans z ≈ -2.55 … 2.55, nose at +z)
  float profile(float z) {
    float body = smoothstep(2.9, 1.6, abs(z));
    float nose = smoothstep(3.2, 2.4, z) * 0.15;
    return 0.22 + 0.78 * body + nose;
  }

  vec3 flow(vec3 seed, float t) {
    float len = 20.0;
    float z = 10.0 - mod(seed.z * len + t * ${FLOW_SPEED.toFixed(1)}, len);
    vec2 xy = seed.xy;
    vec2 c = vec2(0.0, 0.45);
    vec2 d = xy - c;
    d.x *= 0.75;                       // body is wider than it is tall
    float dist = length(d);
    float R = profile(z);
    float push = max(0.0, R - dist);
    vec2 n = normalize(d + vec2(0.0, 0.0001));
    n.x /= 0.75;
    xy += n * push * 1.15;
    xy.y += push * 0.55;               // air prefers to go over the top
    // the rear wing throws the air up behind the car: that's the downforce
    float behind = smoothstep(-1.9, -3.6, z);
    float core = smoothstep(1.3, 0.2, abs(xy.x)) * smoothstep(2.4, 0.7, xy.y);
    xy.y += behind * core * uLift * (0.4 + 0.8 * smoothstep(-2.0, -8.0, z));
    xy.y = max(xy.y, 0.04);            // never through the floor
    return vec3(xy, z);
  }

  void main() {
    float t = uTime - aEnd * 0.045;
    vec3 p = flow(aSeed, t);
    float ends = smoothstep(10.0, 7.5, abs(p.z));
    vAlpha = (1.0 - aEnd * 0.85) * ends;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const frag = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(uColor, vAlpha * 0.75);
  }
`;

export function Streamlines({ count = 2200, aero }: { count?: number; aero: RefObject<number> }) {
  const mat = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const seeds = new Float32Array(count * 2 * 3);
    const ends = new Float32Array(count * 2);
    const rand = mulberry32(2026);
    for (let i = 0; i < count; i++) {
      // bias lines toward the car: more density near the centre and low
      const x = (rand() * 2 - 1) * 2.6 * Math.sqrt(rand());
      const y = 0.05 + Math.pow(rand(), 1.6) * 2.2;
      const phase = rand();
      for (let e = 0; e < 2; e++) {
        const k = (i * 2 + e) * 3;
        seeds[k] = x; seeds[k + 1] = y; seeds[k + 2] = phase;
        ends[i * 2 + e] = e;
      }
    }
    const g = new THREE.BufferGeometry();
    // positions are computed in the shader; three still wants an attribute to size the draw
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 2 * 3), 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 3));
    g.setAttribute("aEnd", new THREE.BufferAttribute(ends, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, 0), 14);
    return g;
  }, [count]);

  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uLift: { value: 1 }, uColor: { value: CYAN } }), []);

  useFrame((_, dt) => {
    const m = mat.current;
    if (!m) return;
    const a = aero.current ?? 0;
    // integrate time scaled by speed so a mode change never makes the lines jump
    m.uniforms.uTime.value += dt * (1 + 0.25 * a);
    m.uniforms.uLift.value = 1 - 0.8 * a;
  });

  return (
    <lineSegments geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

/** The belt under the car, as in a real F1 tunnel: moving at the air's speed so the floor sees true ground effect. */
function RollingRoad({ aero }: { aero: RefObject<number> }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uOffset: { value: 0 } }), []);
  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uOffset.value += dt * FLOW_SPEED * (1 + 0.25 * (aero.current ?? 0));
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, 0]}>
      <planeGeometry args={[2.3, 7.2]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `}
        fragmentShader={/* glsl */ `
          uniform float uOffset;
          varying vec2 vUv;
          void main() {
            float z = vUv.y * 7.2 - uOffset;        // after the -90° tilt, +v points to the tail; stripes travel nose → tail
            float line = step(0.96, fract(z * 1.6));
            float edge = step(0.985, abs(vUv.x * 2.0 - 1.0));
            float fade = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.88, vUv.y);
            vec3 col = mix(vec3(0.035), vec3(0.16), max(line, edge));
            gl_FragColor = vec4(col, fade);
          }
        `}
        transparent
      />
    </mesh>
  );
}

/** The room: a measured grid floor, the rolling road, and light hoops receding into the fog. */
export function Tunnel({ aero }: { aero: RefObject<number> }) {
  // arches only at the tunnel ends so nothing crosses the car from any orbit angle
  const hoops = [-14, -10, -6.5, 6.5, 10, 14];
  return (
    <group>
      <Grid
        position={[0, -0.03, 0]}
        args={[40, 40]}
        cellSize={0.5}
        sectionSize={2.5}
        cellThickness={0.6}
        sectionThickness={1}
        cellColor="#1a1a1a"
        sectionColor="#2b2b2b"
        fadeDistance={24}
        fadeStrength={1.5}
        infiniteGrid
      />
      <RollingRoad aero={aero} />
      {hoops.map((z) => (
        <mesh key={z} position={[0, 4.6, z]}>
          <torusGeometry args={[4.6, 0.02, 6, 72]} />
          <meshBasicMaterial color="#333333" />
        </mesh>
      ))}
    </group>
  );
}

function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
