"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BranchEdge, Vec3 } from "@/lib/lineage";
import { FamilyMember, TreeLayoutMode } from "@/types/family";
import {
  createCoiledVeinCurve,
  createLineageBranchCurve,
  createTaperedOrganicTube,
} from "@/lib/treeGeometry";
import { getBarkTextures } from "@/lib/treeTextures";
import { SanctuaryGround } from "./SanctuaryGround";
import { TreeTrunkAndRoots } from "./TreeTrunkAndRoots";
import { TreeCanopy } from "./TreeCanopy";
import { SpiritAnimals } from "./SpiritAnimals";

interface OrganicBranchesProps {
  members: FamilyMember[];
  edges: BranchEdge[];
  positions: Record<string, Vec3>;
  layoutMode: TreeLayoutMode;
  selectedId: string | null;
  directLineageIds: Set<string>;
  generations: number[];
  onSelectMember: (id: string) => void;
}

interface BranchBoughProps {
  edgeId: string;
  from: Vec3;
  to: Vec3;
  kind: "lineage" | "partner";
  layoutMode: TreeLayoutMode;
  highlighted: boolean;
  dimmed: boolean;
  seed: number;
}

function BranchBough({
  from,
  to,
  kind,
  layoutMode,
  highlighted,
  dimmed,
  seed,
}: BranchBoughProps) {
  const barkTextures = useMemo(() => getBarkTextures(), []);

  const { mainGeo, veinGeo, partnerTwinGeo } = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);

    if (kind === "partner") {
      // Sculpted intertwined double-helix golden vines uniting partners
      const mid = start.clone().lerp(end, 0.5);
      mid.y += layoutMode === "organic" ? 0.45 : 0.38;
      const baseCurve = new THREE.CatmullRomCurve3([start, mid, end]);
      const strandA = createCoiledVeinCurve(baseCurve, 0.045, 0.045, 1.5, 0, 28);
      const strandB = createCoiledVeinCurve(
        baseCurve,
        0.045,
        0.045,
        1.5,
        Math.PI,
        28
      );
      const r = highlighted ? 0.036 : 0.024;
      return {
        mainGeo: createTaperedOrganicTube({
          curve: strandA,
          tubularSegments: 28,
          radialSegments: 8,
          radiusStart: r,
          radiusEnd: r,
          barkNoise: 0.02,
          seed,
        }),
        partnerTwinGeo: createTaperedOrganicTube({
          curve: strandB,
          tubularSegments: 28,
          radialSegments: 8,
          radiusStart: r * 0.85,
          radiusEnd: r * 0.85,
          barkNoise: 0.02,
          seed: seed + 5,
        }),
        veinGeo: null,
      };
    }

    if (layoutMode === "organic") {
      const {
        curve,
        radiusStart: baseStart,
        radiusEnd: baseEnd,
      } = createLineageBranchCurve(from, to, "organic", seed);

      const radiusStart = baseStart * (highlighted ? 1.14 : 1);
      const radiusEnd = baseEnd * (highlighted ? 1.14 : 1);

      const main = createTaperedOrganicTube({
        curve,
        tubularSegments: 32,
        radialSegments: 12,
        radiusStart,
        radiusEnd,
        taperPower: 0.85,
        flareStart: 0.24,
        fluteCount: 4,
        fluteDepth: 0.1,
        twist: 1.2 * (seed % 2 === 0 ? 1 : -1),
        barkNoise: 0.045,
        seed,
      });

      const veinCurve = createCoiledVeinCurve(
        curve,
        radiusStart * 1.04,
        radiusEnd * 1.05,
        1.2,
        seed * 0.8,
        30
      );
      const vein = createTaperedOrganicTube({
        curve: veinCurve,
        tubularSegments: 30,
        radialSegments: 6,
        radiusStart: highlighted ? 0.026 : 0.013,
        radiusEnd: highlighted ? 0.016 : 0.008,
        barkNoise: 0,
      });

      return { mainGeo: main, veinGeo: vein, partnerTwinGeo: null };
    }

    // Radial "Tree of Life" graceful phylogenetic ribbon arc
    const { curve } = createLineageBranchCurve(from, to, "radial", seed);
    const rStart = highlighted ? 0.072 : 0.048;
    const rEnd = highlighted ? 0.044 : 0.026;
    return {
      mainGeo: createTaperedOrganicTube({
        curve,
        tubularSegments: 26,
        radialSegments: 10,
        radiusStart: rStart,
        radiusEnd: rEnd,
        barkNoise: 0.02,
        seed,
      }),
      veinGeo: null,
      partnerTwinGeo: null,
    };
  }, [from, to, kind, layoutMode, highlighted, seed]);

  if (kind === "partner") {
    return (
      <group>
        <mesh geometry={mainGeo}>
          <meshStandardMaterial
            color={highlighted ? "#F5DA9D" : "#D4A359"}
            emissive="#D4A359"
            emissiveIntensity={highlighted ? 1.45 : dimmed ? 0.1 : 0.52}
            roughness={0.28}
            metalness={0.55}
            transparent
            opacity={highlighted ? 0.98 : dimmed ? 0.14 : 0.78}
          />
        </mesh>
        {partnerTwinGeo && (
          <mesh geometry={partnerTwinGeo}>
            <meshStandardMaterial
              color={highlighted ? "#FFEBC2" : "#B88946"}
              emissive="#E6C385"
              emissiveIntensity={highlighted ? 1.15 : dimmed ? 0.08 : 0.38}
              roughness={0.34}
              metalness={0.5}
              transparent
              opacity={highlighted ? 0.92 : dimmed ? 0.12 : 0.66}
            />
          </mesh>
        )}
      </group>
    );
  }

  return (
    <group>
      <mesh geometry={mainGeo}>
        <meshStandardMaterial
          map={layoutMode === "organic" ? barkTextures?.map ?? null : null}
          bumpMap={layoutMode === "organic" ? barkTextures?.bumpMap ?? null : null}
          bumpScale={0.06}
          color={highlighted ? "#D6AC68" : "#8F6D45"}
          emissive={highlighted ? "#D4A359" : "#4E3415"}
          emissiveIntensity={highlighted ? 0.78 : dimmed ? 0.08 : 0.28}
          roughness={highlighted ? 0.36 : 0.62}
          metalness={highlighted ? 0.38 : 0.22}
          transparent
          opacity={highlighted ? 0.98 : dimmed ? 0.18 : 0.94}
        />
      </mesh>

      {/* Luminous bioluminescent golden sap vein spiraling up the limb */}
      {veinGeo && (
        <mesh geometry={veinGeo}>
          <meshStandardMaterial
            color={highlighted ? "#FFF0C8" : "#E6C385"}
            emissive="#E6C385"
            emissiveIntensity={highlighted ? 1.9 : dimmed ? 0.06 : 0.72}
            roughness={0.2}
            metalness={0.4}
            transparent
            opacity={highlighted ? 0.96 : dimmed ? 0.08 : 0.56}
          />
        </mesh>
      )}
    </group>
  );
}

/**
 * Intricate brass-astrolabe & phylogenetic rings for Radial "Tree of Life" mode.
 */
function RadialAstrolabe({
  visible,
  generations,
}: {
  visible: boolean;
  generations: number[];
}) {
  const groupRef = useRef<THREE.Group>(null);

  const tickGeometry = useMemo(() => {
    const pts: number[] = [];
    const maxRadius =
      generations.length <= 1 ? 2.4 : 3.2 + (generations.length - 1) * 3.15 + 1.2;

    // 12 radial compass meridians
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const inner = 0.85;
      pts.push(Math.cos(a) * inner, 0.72, Math.sin(a) * inner);
      pts.push(Math.cos(a) * maxRadius, -0.55, Math.sin(a) * maxRadius);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, [generations.length]);

  useFrame(({ clock }) => {
    if (groupRef.current && visible) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.018;
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      {/* Central luminous origin mandala */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.76, 0]}>
        <ringGeometry args={[0.15, 0.78, 64]} />
        <meshBasicMaterial
          color="#D4A359"
          transparent
          opacity={0.14}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.77, 0]}>
        <ringGeometry args={[0.76, 0.8, 64]} />
        <meshBasicMaterial
          color="#E6C385"
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Radial compass meridians */}
      <lineSegments geometry={tickGeometry}>
        <lineBasicMaterial
          color="#D4A359"
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </lineSegments>

      {/* Concentric double-etched generational rings */}
      {generations.map((_, levelIndex) => {
        const radius = levelIndex === 0 ? 1.6 : 3.2 + levelIndex * 3.15;
        const y = -levelIndex * 0.45 + 0.76;
        return (
          <group key={levelIndex} position={[0, y, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[radius - 0.03, radius + 0.03, 128]} />
              <meshBasicMaterial
                color="#E6C385"
                transparent
                opacity={0.32 - levelIndex * 0.04}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[radius - 0.14, radius - 0.12, 96]} />
              <meshBasicMaterial
                color="#D4A359"
                transparent
                opacity={0.14}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function OrganicBranches({
  members,
  edges,
  positions,
  layoutMode,
  selectedId,
  directLineageIds,
  generations,
  onSelectMember,
}: OrganicBranchesProps) {
  const hasSelection = Boolean(selectedId);
  const minGen = generations[0] ?? 0;
  const maxGen = generations[generations.length - 1] ?? 0;

  // Dynamic positions of Generation 0 founding ancestors so the braided trunk connects directly into them
  const rootAnchors = useMemo<Vec3[]>(() => {
    return members
      .filter((m) => m.generation === minGen)
      .map((m) => positions[m.id])
      .filter((p): p is Vec3 => Boolean(p));
  }, [members, minGen, positions]);

  return (
    <group>
      {/* Mossy obsidian sanctuary floor */}
      <SanctuaryGround
        visible={layoutMode === "organic"}
        dimmed={hasSelection}
      />

      {/* Sculpted braided trunk & multi-tier branching buttress roots */}
      <TreeTrunkAndRoots
        visible={layoutMode === "organic"}
        rootAnchors={rootAnchors}
        dimmed={hasSelection}
      />

      {/* Lush procedural twigs, 600+ fluttering botanical leaves & hanging willow light tendrils */}
      <TreeCanopy
        visible={layoutMode === "organic"}
        members={members}
        positions={positions}
        maxGeneration={maxGen}
        dimmed={hasSelection}
      />

      {/* Ethereal animals made of light resting on selected family branches */}
      <SpiritAnimals
        members={members}
        edges={edges}
        positions={positions}
        layoutMode={layoutMode}
        selectedId={selectedId}
        directLineageIds={directLineageIds}
        onSelectMember={onSelectMember}
      />

      {/* Astrolabe rings for Radial "Tree of Life" mode */}
      <RadialAstrolabe
        visible={layoutMode === "radial"}
        generations={generations}
      />

      {/* Tapered lineage limbs & double-helix partner vines */}
      {edges.map((edge, idx) => {
        const from = positions[edge.fromId];
        const to = positions[edge.toId];
        if (!from || !to) return null;

        const bothInLineage =
          hasSelection &&
          directLineageIds.has(edge.fromId) &&
          directLineageIds.has(edge.toId);

        return (
          <BranchBough
            key={`${edge.id}-${layoutMode}`}
            edgeId={edge.id}
            from={from}
            to={to}
            kind={edge.kind}
            layoutMode={layoutMode}
            highlighted={bothInLineage}
            dimmed={hasSelection && !bothInLineage}
            seed={idx * 17 + 3}
          />
        );
      })}
    </group>
  );
}
