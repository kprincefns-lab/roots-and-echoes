"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface AmbientPollenProps {
  count?: number;
}

export function AmbientPollen({ count = 240 }: AmbientPollenProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, seeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const seedArr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Deterministic pseudo-random distribution for clean hydration
      const r1 = Math.sin(i * 12.9898) * 43758.5453;
      const r2 = Math.sin(i * 78.233) * 43758.5453;
      const r3 = Math.sin(i * 39.425) * 43758.5453;
      const f1 = r1 - Math.floor(r1);
      const f2 = r2 - Math.floor(r2);
      const f3 = r3 - Math.floor(r3);

      const angle = f1 * Math.PI * 2;
      const radius = 2.5 + Math.sqrt(f2) * 14.5;
      const y = -6.5 + f3 * 18.0;

      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(angle) * radius;

      seedArr[i * 3] = f1 * Math.PI * 2;
      seedArr[i * 3 + 1] = 0.15 + f2 * 0.45;
      seedArr[i * 3 + 2] = 0.2 + f3 * 0.6;
    }
    return { positions: pos, seeds: seedArr };
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions.slice(), 3));
    return geo;
  }, [positions]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const attr = pointsRef.current.geometry.getAttribute(
      "position"
    ) as THREE.BufferAttribute;

    for (let i = 0; i < count; i++) {
      const phase = seeds[i * 3];
      const speed = seeds[i * 3 + 1];
      const drift = seeds[i * 3 + 2];

      const baseX = positions[i * 3];
      const baseY = positions[i * 3 + 1];
      const baseZ = positions[i * 3 + 2];

      const x = baseX + Math.sin(t * speed + phase) * 0.45;
      const y = ((baseY + t * drift * 0.28 + 6.5) % 18.0) - 6.5;
      const z = baseZ + Math.cos(t * speed * 0.8 + phase) * 0.45;

      attr.setXYZ(i, x, y, z);
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#E6C385"
        size={0.075}
        transparent
        opacity={0.48}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
