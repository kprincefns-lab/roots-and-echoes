"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { seededRandom } from "@/lib/treeGeometry";
import { getSoftGlowTexture } from "@/lib/treeTextures";

interface AmbientPollenProps {
  count?: number;
}

/**
 * Dual-layer atmospheric bokeh pollen & subtle emerald-gold fireflies
 * floating gently upward through the canopy and around the roots.
 */
export function AmbientPollen({ count = 260 }: AmbientPollenProps) {
  const goldRef = useRef<THREE.Points>(null);
  const fireflyRef = useRef<THREE.Points>(null);
  const glowTexture = useMemo(() => getSoftGlowTexture(), []);

  const fireflyCount = Math.floor(count * 0.28);

  const { goldPositions, goldSeeds, fireflyPositions, fireflySeeds } =
    useMemo(() => {
      const gPos = new Float32Array(count * 3);
      const gSeed = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const f1 = seededRandom(i * 11.3 + 1);
        const f2 = seededRandom(i * 23.7 + 2);
        const f3 = seededRandom(i * 37.1 + 3);

        const angle = f1 * Math.PI * 2;
        const radius = 1.8 + Math.sqrt(f2) * 14.2;
        const y = -6.6 + f3 * 18.2;

        gPos[i * 3] = Math.cos(angle) * radius;
        gPos[i * 3 + 1] = y;
        gPos[i * 3 + 2] = Math.sin(angle) * radius;

        gSeed[i * 3] = f1 * Math.PI * 2;
        gSeed[i * 3 + 1] = 0.14 + f2 * 0.36;
        gSeed[i * 3 + 2] = 0.18 + f3 * 0.5;
      }

      const fPos = new Float32Array(fireflyCount * 3);
      const fSeed = new Float32Array(fireflyCount * 3);
      for (let i = 0; i < fireflyCount; i++) {
        const a = seededRandom(i * 41.9 + 7) * Math.PI * 2;
        const rad = 1.4 + Math.sqrt(seededRandom(i * 53.3 + 9)) * 9.5;
        // Concentrate warm lantern fireflies near the root sanctuary & canopy boughs
        const nearRoots = i % 3 === 0;
        const y = nearRoots
          ? -6.3 + seededRandom(i * 67.1) * 3.4
          : -1.0 + seededRandom(i * 71.9) * 10.5;

        fPos[i * 3] = Math.cos(a) * rad;
        fPos[i * 3 + 1] = y;
        fPos[i * 3 + 2] = Math.sin(a) * rad;

        fSeed[i * 3] = a;
        fSeed[i * 3 + 1] = 0.25 + seededRandom(i * 83.7) * 0.45;
        fSeed[i * 3 + 2] = 0.3 + seededRandom(i * 97.1) * 0.6;
      }

      return {
        goldPositions: gPos,
        goldSeeds: gSeed,
        fireflyPositions: fPos,
        fireflySeeds: fSeed,
      };
    }, [count, fireflyCount]);

  const goldGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(goldPositions.slice(), 3)
    );
    return geo;
  }, [goldPositions]);

  const fireflyGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(fireflyPositions.slice(), 3)
    );
    return geo;
  }, [fireflyPositions]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (goldRef.current) {
      const attr = goldRef.current.geometry.getAttribute(
        "position"
      ) as THREE.BufferAttribute;
      for (let i = 0; i < count; i++) {
        const phase = goldSeeds[i * 3];
        const speed = goldSeeds[i * 3 + 1];
        const drift = goldSeeds[i * 3 + 2];

        const bx = goldPositions[i * 3];
        const by = goldPositions[i * 3 + 1];
        const bz = goldPositions[i * 3 + 2];

        const x = bx + Math.sin(t * speed + phase) * 0.55;
        const y = ((by + t * drift * 0.24 + 6.6) % 18.2) - 6.6;
        const z = bz + Math.cos(t * speed * 0.8 + phase) * 0.55;
        attr.setXYZ(i, x, y, z);
      }
      attr.needsUpdate = true;
    }

    if (fireflyRef.current) {
      const attr = fireflyRef.current.geometry.getAttribute(
        "position"
      ) as THREE.BufferAttribute;
      for (let i = 0; i < fireflyCount; i++) {
        const phase = fireflySeeds[i * 3];
        const speed = fireflySeeds[i * 3 + 1];
        const drift = fireflySeeds[i * 3 + 2];

        const bx = fireflyPositions[i * 3];
        const by = fireflyPositions[i * 3 + 1];
        const bz = fireflyPositions[i * 3 + 2];

        attr.setXYZ(
          i,
          bx + Math.sin(t * speed + phase) * 0.65,
          by + Math.cos(t * speed * 0.7 + phase) * drift * 0.55,
          bz + Math.cos(t * speed * 0.9 + phase * 1.4) * 0.65
        );
      }
      attr.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Fine drifting golden botanical pollen */}
      <points ref={goldRef} geometry={goldGeometry}>
        <pointsMaterial
          map={glowTexture ?? null}
          color="#E8C684"
          size={0.26}
          transparent
          opacity={0.58}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Larger soft bokeh root & canopy fireflies */}
      <points ref={fireflyRef} geometry={fireflyGeometry}>
        <pointsMaterial
          map={glowTexture ?? null}
          color="#FFF0C4"
          size={0.5}
          transparent
          opacity={0.46}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
