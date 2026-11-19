"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FamilyMember } from "@/types/family";
import { Vec3 } from "@/lib/lineage";
import {
  createBotanicalLeafGeometry,
  createTaperedOrganicTube,
  seededRandom,
} from "@/lib/treeGeometry";
import { getBarkTextures, getSoftGlowTexture } from "@/lib/treeTextures";

interface TreeCanopyProps {
  visible: boolean;
  members: FamilyMember[];
  positions: Record<string, Vec3>;
  maxGeneration: number;
  dimmed: boolean;
}

interface LeafInstanceData {
  basePos: THREE.Vector3;
  baseRot: THREE.Euler;
  scale: number;
  phase: number;
  swayAmp: number;
  color: THREE.Color;
}

interface HangingTendril {
  origin: THREE.Vector3;
  length: number;
  phase: number;
}

const LEAF_PALETTE = [
  "#E8C882", // Sunlit archival gold
  "#D4A359", // Bioluminescent amber
  "#F2DCAA", // Pale parchment gold
  "#B5853E", // Burnished bronze-gold
  "#5D7E62", // Moonlit botanical sage
  "#3E5A44", // Deep obsidian forest leaf
];

/**
 * Generates sculptural secondary ornamental twigs arching out from the upper generations,
 * ~620 instanced fluttering botanical leaf blades, and delicate hanging luminous tendrils.
 */
export function TreeCanopy({
  visible,
  members,
  positions,
  maxGeneration,
  dimmed,
}: TreeCanopyProps) {
  const leafMeshRef = useRef<THREE.InstancedMesh>(null);
  const dewPointsRef = useRef<THREE.Points>(null);

  const barkTextures = useMemo(() => getBarkTextures(), []);
  const glowTexture = useMemo(() => getSoftGlowTexture(), []);
  const leafGeometry = useMemo(() => createBotanicalLeafGeometry(), []);

  const posKey = members
    .map((m) => {
      const p = positions[m.id] ?? [0, 0, 0];
      return `${m.id}:${p[0].toFixed(1)},${p[1].toFixed(1)},${p[2].toFixed(1)}`;
    })
    .join("|");

  const { twigGeometries, leaves, tendrils, tendrilLinesGeo } = useMemo(() => {
    const twigs: THREE.BufferGeometry[] = [];
    const leafList: LeafInstanceData[] = [];
    const tendrilList: HangingTendril[] = [];
    const dummyColor = new THREE.Color();

    let seedCounter = 1;

    members.forEach((member, mIdx) => {
      const posArr = positions[member.id];
      if (!posArr) return;
      // Only sprout ornamental canopy twigs from Gen 1+ (keep roots clean and dramatic)
      if (member.generation === 0) return;

      const nodePos = new THREE.Vector3(...posArr);
      const isCrown = member.generation >= maxGeneration;
      const twigCount = isCrown ? 5 : member.generation === 1 ? 2 : 3;

      for (let t = 0; t < twigCount; t++) {
        seedCounter += 1;
        const r1 = seededRandom(seedCounter * 17 + mIdx * 31);
        const r2 = seededRandom(seedCounter * 29 + t * 43);
        const r3 = seededRandom(seedCounter * 41 + mIdx * 11);

        // Fan twigs outward & slightly behind/above the node so portrait medallions remain crystal clear
        const baseOutAngle = Math.atan2(nodePos.z, nodePos.x || (mIdx % 2 === 0 ? 1 : -1));
        const spreadAngle = baseOutAngle + (t - (twigCount - 1) / 2) * 0.85 + (r1 - 0.5) * 0.4;
        const twigLen = (isCrown ? 2.5 : 1.75) + r2 * 1.45;
        const liftY = (isCrown ? 1.55 : 0.95) + r3 * 1.1;

        const dirX = Math.cos(spreadAngle);
        const dirZ = Math.sin(spreadAngle);

        const p0 = nodePos.clone();
        const p1 = nodePos.clone().add(
          new THREE.Vector3(dirX * twigLen * 0.42, liftY * 0.62, dirZ * twigLen * 0.42 - 0.15)
        );
        const p2 = nodePos.clone().add(
          new THREE.Vector3(
            dirX * twigLen * 0.78,
            liftY * 1.05,
            dirZ * twigLen * 0.78 - 0.25
          )
        );
        // Graceful willow-like arch dip at the very tip
        const p3 = nodePos.clone().add(
          new THREE.Vector3(
            dirX * twigLen,
            liftY * 0.88,
            dirZ * twigLen - 0.2
          )
        );

        const twigCurve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
        twigs.push(
          createTaperedOrganicTube({
            curve: twigCurve,
            tubularSegments: 16,
            radialSegments: 7,
            radiusStart: isCrown ? 0.055 : 0.068,
            radiusEnd: 0.008,
            taperPower: 0.78,
            barkNoise: 0.04,
            seed: seedCounter,
            capTip: true,
          })
        );

        // Cluster sculpted botanical leaves along the outer 70% of each twig
        const leavesOnTwig = isCrown ? 16 : 10;
        for (let l = 0; l < leavesOnTwig; l++) {
          const lSeed = seedCounter * 97 + l * 13;
          const u = 0.28 + (l / leavesOnTwig) * 0.72;
          const anchor = twigCurve.getPointAt(u);

          const jitterR = 0.22 + seededRandom(lSeed + 1) * 0.78;
          const jitterTheta = seededRandom(lSeed + 2) * Math.PI * 2;
          const jitterY = (seededRandom(lSeed + 3) - 0.32) * 0.55;

          const basePos = new THREE.Vector3(
            anchor.x + Math.cos(jitterTheta) * jitterR,
            anchor.y + jitterY,
            anchor.z + Math.sin(jitterTheta) * jitterR
          );

          const baseRot = new THREE.Euler(
            (seededRandom(lSeed + 4) - 0.5) * 1.2 + 0.35,
            seededRandom(lSeed + 5) * Math.PI * 2,
            (seededRandom(lSeed + 6) - 0.5) * 1.1
          );

          const scale = 0.65 + seededRandom(lSeed + 7) * 0.85;
          const paletteIndex = Math.floor(
            seededRandom(lSeed + 8) * LEAF_PALETTE.length
          );
          dummyColor.set(LEAF_PALETTE[paletteIndex]);

          leafList.push({
            basePos,
            baseRot,
            scale,
            phase: seededRandom(lSeed + 9) * Math.PI * 2,
            swayAmp: 0.06 + seededRandom(lSeed + 10) * 0.08,
            color: dummyColor.clone(),
          });
        }

        // Add an ethereal hanging willow-light filament on select outer twigs
        if ((isCrown && t % 2 === 0) || (member.generation === 2 && t === 0)) {
          const hangPt = twigCurve.getPointAt(0.86);
          tendrilList.push({
            origin: hangPt,
            length: 1.45 + seededRandom(seedCounter * 61) * 1.85,
            phase: seededRandom(seedCounter * 71) * Math.PI * 2,
          });
        }
      }
    });

    // Build single merged LineSegments geometry for hanging golden light threads
    const segsPerTendril = 8;
    const linePositions = new Float32Array(
      tendrilList.length * segsPerTendril * 2 * 3
    );
    let ptr = 0;
    tendrilList.forEach((td) => {
      for (let s = 0; s < segsPerTendril; s++) {
        const t0 = s / segsPerTendril;
        const t1 = (s + 1) / segsPerTendril;
        linePositions[ptr++] = td.origin.x + Math.sin(t0 * 2.5 + td.phase) * 0.08;
        linePositions[ptr++] = td.origin.y - t0 * td.length;
        linePositions[ptr++] = td.origin.z + Math.cos(t0 * 2.5 + td.phase) * 0.08;

        linePositions[ptr++] = td.origin.x + Math.sin(t1 * 2.5 + td.phase) * 0.08;
        linePositions[ptr++] = td.origin.y - t1 * td.length;
        linePositions[ptr++] = td.origin.z + Math.cos(t1 * 2.5 + td.phase) * 0.08;
      }
    });
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(linePositions, 3)
    );

    return {
      twigGeometries: twigs,
      leaves: leafList,
      tendrils: tendrilList,
      tendrilLinesGeo: lineGeo,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posKey, maxGeneration]);

  // Pre-build dewdrop tip positions for the hanging tendrils
  const dewGeometry = useMemo(() => {
    const arr = new Float32Array(tendrils.length * 3);
    tendrils.forEach((td, i) => {
      arr[i * 3] = td.origin.x + Math.sin(2.5 + td.phase) * 0.08;
      arr[i * 3 + 1] = td.origin.y - td.length;
      arr[i * 3 + 2] = td.origin.z + Math.cos(2.5 + td.phase) * 0.08;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [tendrils]);

  // Apply initial per-instance colors when leaf mesh mounts or updates
  useEffect(() => {
    const mesh = leafMeshRef.current;
    if (!mesh) return;
    leaves.forEach((leaf, i) => {
      mesh.setColorAt(i, leaf.color);
    });
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [leaves]);

  const dummyObj = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (!visible) return;
    const t = clock.getElapsedTime();

    const mesh = leafMeshRef.current;
    if (mesh) {
      for (let i = 0; i < leaves.length; i++) {
        const lf = leaves[i];
        const flutter = Math.sin(t * 1.25 + lf.phase) * lf.swayAmp;
        const drift = Math.cos(t * 0.85 + lf.phase * 1.3) * lf.swayAmp;

        dummyObj.position.set(
          lf.basePos.x + flutter * 0.6,
          lf.basePos.y + drift * 0.45,
          lf.basePos.z + drift * 0.5
        );
        dummyObj.rotation.set(
          lf.baseRot.x + flutter * 1.4,
          lf.baseRot.y + drift * 0.8,
          lf.baseRot.z + flutter * 1.1
        );
        const s = lf.scale * (dimmed ? 0.84 : 1.0);
        dummyObj.scale.setScalar(s);
        dummyObj.updateMatrix();
        mesh.setMatrixAt(i, dummyObj.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }

    // Gently sway hanging dewdrop sparks
    if (dewPointsRef.current) {
      const attr = dewPointsRef.current.geometry.getAttribute(
        "position"
      ) as THREE.BufferAttribute;
      for (let i = 0; i < tendrils.length; i++) {
        const td = tendrils[i];
        const sway = Math.sin(t * 0.9 + td.phase) * 0.14;
        attr.setXYZ(
          i,
          td.origin.x + Math.sin(2.5 + td.phase) * 0.08 + sway,
          td.origin.y - td.length + Math.cos(t * 1.2 + td.phase) * 0.06,
          td.origin.z + Math.cos(2.5 + td.phase) * 0.08 + sway * 0.5
        );
      }
      attr.needsUpdate = true;
    }
  });

  if (!visible) return null;

  return (
    <group>
      {/* Fine ornamental canopy twigs */}
      {twigGeometries.map((geo, idx) => (
        <mesh key={`twig-${idx}`} geometry={geo}>
          <meshStandardMaterial
            map={barkTextures?.map ?? null}
            color={dimmed ? "#4B3B28" : "#8E6C42"}
            emissive="#5A3D17"
            emissiveIntensity={dimmed ? 0.08 : 0.25}
            roughness={0.62}
            metalness={0.22}
            transparent
            opacity={dimmed ? 0.26 : 0.88}
          />
        </mesh>
      ))}

      {/* Instanced fluttering golden & moonlit-sage canopy leaves */}
      {leaves.length > 0 && (
        <instancedMesh
          ref={leafMeshRef}
          args={[leafGeometry, undefined, leaves.length]}
          frustumCulled={false}
        >
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#C69447"
            emissiveIntensity={dimmed ? 0.12 : 0.42}
            roughness={0.38}
            metalness={0.28}
            side={THREE.DoubleSide}
            transparent
            opacity={dimmed ? 0.22 : 0.78}
          />
        </instancedMesh>
      )}

      {/* Ethereal hanging willow-light threads */}
      {tendrils.length > 0 && (
        <>
          <lineSegments geometry={tendrilLinesGeo}>
            <lineBasicMaterial
              color="#E6C385"
              transparent
              opacity={dimmed ? 0.07 : 0.24}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </lineSegments>
          <points ref={dewPointsRef} geometry={dewGeometry}>
            <pointsMaterial
              map={glowTexture ?? null}
              color="#F8E4B8"
              size={0.34}
              transparent
              opacity={dimmed ? 0.18 : 0.78}
              sizeAttenuation
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </points>
        </>
      )}
    </group>
  );
}
