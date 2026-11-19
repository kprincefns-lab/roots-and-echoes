"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BranchEdge, Vec3 } from "@/lib/lineage";
import { TreeLayoutMode } from "@/types/family";

interface OrganicBranchesProps {
  edges: BranchEdge[];
  positions: Record<string, Vec3>;
  layoutMode: TreeLayoutMode;
  selectedId: string | null;
  directLineageIds: Set<string>;
  generations: number[];
}

interface BranchTubeProps {
  from: Vec3;
  to: Vec3;
  kind: "lineage" | "partner";
  layoutMode: TreeLayoutMode;
  highlighted: boolean;
  dimmed: boolean;
}

function BranchTube({
  from,
  to,
  kind,
  layoutMode,
  highlighted,
  dimmed,
}: BranchTubeProps) {
  const geometry = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);

    if (kind === "partner") {
      const mid = start.clone().lerp(end, 0.5);
      mid.y += layoutMode === "organic" ? 0.42 : 0.35;
      const curve = new THREE.CatmullRomCurve3([start, mid, end]);
      return new THREE.TubeGeometry(curve, 24, highlighted ? 0.048 : 0.032, 8, false);
    }

    if (layoutMode === "organic") {
      // Sinuous upward botanical bough curve
      const dy = end.y - start.y;
      const ctrl1 = new THREE.Vector3(
        start.x + (end.x - start.x) * 0.22,
        start.y + dy * 0.42,
        start.z + (end.z - start.z) * 0.18
      );
      const ctrl2 = new THREE.Vector3(
        start.x + (end.x - start.x) * 0.72,
        start.y + dy * 0.72,
        start.z + (end.z - start.z) * 0.78
      );
      const curve = new THREE.CatmullRomCurve3([start, ctrl1, ctrl2, end]);
      // Thicker limbs lower in the tree, finer boughs in the canopy
      const heightFactor = Math.max(0.45, 1 - (start.y + 4.5) / 14);
      const radius = (highlighted ? 0.095 : 0.068) * heightFactor;
      return new THREE.TubeGeometry(curve, 28, radius, 8, false);
    }

    // Radial phylogenetic arc
    const mid = start.clone().lerp(end, 0.5);
    mid.y += 0.55;
    const curve = new THREE.CatmullRomCurve3([start, mid, end]);
    return new THREE.TubeGeometry(curve, 24, highlighted ? 0.065 : 0.04, 8, false);
  }, [from, to, kind, layoutMode, highlighted]);

  const color = highlighted
    ? "#F0CC88"
    : kind === "partner"
      ? "#B88A44"
      : "#9C7338";

  const emissive = highlighted ? "#D4A359" : "#4A3316";
  const emissiveIntensity = highlighted ? 1.15 : dimmed ? 0.12 : 0.42;
  const opacity = highlighted ? 0.96 : dimmed ? 0.15 : 0.68;

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={0.42}
        metalness={0.35}
        transparent
        opacity={opacity}
      />
    </mesh>
  );
}

/**
 * Sculptural root tendrils anchoring Generation 0 into the obsidian forest floor.
 */
function RootNetwork({ visible }: { visible: boolean }) {
  const rootGeometries = useMemo(() => {
    const geos: THREE.TubeGeometry[] = [];
    const rootCount = 9;
    for (let i = 0; i < rootCount; i++) {
      const angle = (i / rootCount) * Math.PI * 2 + 0.25;
      const spread = 3.4 + (i % 3) * 1.15;
      const startX = Math.cos(angle) * 0.65;
      const startZ = Math.sin(angle) * 0.45;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(startX, -4.1, startZ),
        new THREE.Vector3(Math.cos(angle) * (spread * 0.45), -5.3, Math.sin(angle) * (spread * 0.45)),
        new THREE.Vector3(Math.cos(angle + 0.14) * (spread * 0.8), -6.15, Math.sin(angle + 0.14) * (spread * 0.8)),
        new THREE.Vector3(Math.cos(angle - 0.08) * spread, -6.55, Math.sin(angle - 0.08) * spread),
      ]);
      geos.push(new THREE.TubeGeometry(curve, 24, 0.085 - (i % 2) * 0.02, 7, false));
    }
    return geos;
  }, []);

  if (!visible) return null;

  return (
    <group>
      {/* Core grounding trunk knot */}
      <mesh position={[0, -4.85, 0]}>
        <cylinderGeometry args={[0.38, 0.72, 1.85, 16]} />
        <meshStandardMaterial
          color="#5C421E"
          emissive="#8F652A"
          emissiveIntensity={0.28}
          roughness={0.65}
          metalness={0.2}
          transparent
          opacity={0.78}
        />
      </mesh>
      {rootGeometries.map((geo, idx) => (
        <mesh key={idx} geometry={geo}>
          <meshStandardMaterial
            color="#6E4E23"
            emissive="#A67833"
            emissiveIntensity={0.32}
            roughness={0.55}
            metalness={0.25}
            transparent
            opacity={0.62}
          />
        </mesh>
      ))}
      {/* Subtle bioluminescent ground aura */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6.55, 0]}>
        <ringGeometry args={[0.2, 6.2, 64]} />
        <meshBasicMaterial
          color="#D4A359"
          transparent
          opacity={0.07}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/**
 * Concentric phylogenetic rings shown in Radial "Tree of Life" mode.
 */
function RadialRings({
  visible,
  generations,
}: {
  visible: boolean;
  generations: number[];
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current && visible) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.015;
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      {generations.map((_, levelIndex) => {
        const radius = levelIndex === 0 ? 1.6 : 3.2 + levelIndex * 3.15;
        const y = -levelIndex * 0.45 + 0.76;
        return (
          <mesh key={levelIndex} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
            <ringGeometry args={[radius - 0.025, radius + 0.025, 96]} />
            <meshBasicMaterial
              color="#D4A359"
              transparent
              opacity={0.24 - levelIndex * 0.03}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export function OrganicBranches({
  edges,
  positions,
  layoutMode,
  selectedId,
  directLineageIds,
  generations,
}: OrganicBranchesProps) {
  const hasSelection = Boolean(selectedId);

  return (
    <group>
      <RootNetwork visible={layoutMode === "organic"} />
      <RadialRings visible={layoutMode === "radial"} generations={generations} />

      {edges.map((edge) => {
        const from = positions[edge.fromId];
        const to = positions[edge.toId];
        if (!from || !to) return null;

        const bothInLineage =
          hasSelection &&
          directLineageIds.has(edge.fromId) &&
          directLineageIds.has(edge.toId);

        return (
          <BranchTube
            key={`${edge.id}-${layoutMode}`}
            from={from}
            to={to}
            kind={edge.kind}
            layoutMode={layoutMode}
            highlighted={bothInLineage}
            dimmed={hasSelection && !bothInLineage}
          />
        );
      })}
    </group>
  );
}
