"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SanctuaryGroundProps {
  visible: boolean;
  dimmed: boolean;
}

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPos;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float r = length(pos.xy);
    // Subtle organic mossy earth mound rising softly under the trunk
    float mound = exp(-r * r * 0.055) * 0.42;
    float ripple = sin(r * 1.45) * cos(atan(pos.y, pos.x) * 5.0) * 0.06 * exp(-r * 0.14);
    pos.z += mound + ripple;
    vPos = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uDim;

  varying vec2 vUv;
  varying vec3 vPos;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    float r = length(vPos.xy);
    float normR = r / 11.5;

    // Seamless radial fade to zero so there is never a hard circular edge
    float edgeFade = smoothstep(1.0, 0.24, normR);
    if (edgeFade <= 0.001) discard;

    float angle = atan(vPos.y, vPos.x);
    float n1 = noise(vPos.xy * 0.65 + vec2(uTime * 0.03, -uTime * 0.02));
    float n2 = noise(vPos.xy * 1.8 - vec2(uTime * 0.04, uTime * 0.03));

    // Subtle glowing subterranean mycelium / root-halo veins
    float radialVeins = pow(max(0.0, sin(angle * 9.0 + n1 * 3.8 + r * 0.45)), 8.0);
    float pulseWave = 0.5 + 0.5 * sin(r * 1.15 - uTime * 0.85 + n2 * 2.0);
    float innerGlow = exp(-r * 0.34);

    // Subtle archival topographic rings
    float topo = smoothstep(0.92, 0.99, sin(r * 2.1 + n1 * 1.2)) * exp(-r * 0.16);

    vec3 deepMoss = vec3(0.045, 0.072, 0.056);
    vec3 warmEarth = vec3(0.11, 0.088, 0.055);
    vec3 goldGlow = vec3(0.86, 0.66, 0.36);

    vec3 col = mix(deepMoss, warmEarth, innerGlow * 0.75 + n1 * 0.25);
    col += goldGlow * (innerGlow * 0.28 + radialVeins * exp(-r * 0.22) * (0.28 + pulseWave * 0.24));
    col += goldGlow * topo * 0.16;

    float alpha = edgeFade * (0.48 * innerGlow + 0.22 + radialVeins * 0.18) * uDim;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.82));
  }
`;

export function SanctuaryGround({ visible, dimmed }: SanctuaryGroundProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDim: { value: 1 },
    }),
    []
  );

  useFrame(({ clock }, delta) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    const targetDim = dimmed ? 0.45 : 1.0;
    materialRef.current.uniforms.uDim.value = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uDim.value,
      targetDim,
      Math.min(1, delta * 4)
    );
  });

  if (!visible) return null;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6.58, 0]}>
      <planeGeometry args={[23, 23, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
