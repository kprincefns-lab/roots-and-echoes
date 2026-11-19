"use client";

import { ComponentRef, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { FamilyMember, TreeLayoutMode } from "@/types/family";
import {
  computeTreeLayouts,
  getDirectLineageIds,
  Vec3,
} from "@/lib/lineage";
import { AmbientPollen } from "./AmbientPollen";
import { OrganicBranches } from "./OrganicBranches";
import { MemberNode } from "./MemberNode";

export interface TreeCanvasProps {
  members: FamilyMember[];
  layoutMode: TreeLayoutMode;
  selectedMemberId: string | null;
  activeGeneration: number | null;
  autoRotate: boolean;
  resetSignal: number;
  onSelectMember: (id: string) => void;
  onClearSelection: () => void;
}

interface CameraRigProps {
  selectedPosition: Vec3 | null;
  layoutMode: TreeLayoutMode;
  autoRotate: boolean;
  resetSignal: number;
}

function CameraRig({
  selectedPosition,
  layoutMode,
  autoRotate,
  resetSignal,
}: CameraRigProps) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { camera } = useThree();

  const desiredPos = useRef(new THREE.Vector3(0, 1.8, 22.8));
  const desiredTarget = useRef(new THREE.Vector3(0, 1.35, 0));
  const isAnimating = useRef(false);

  // Trigger smooth camera flight when selection, layout, or reset changes
  useEffect(() => {
    if (selectedPosition) {
      const [x, y, z] = selectedPosition;
      // Offset target slightly right (+1.2 in X) so the selected node sits gracefully
      // in the open left-center canvas beside the right-side dossier drawer.
      if (layoutMode === "organic") {
        desiredTarget.current.set(x + 1.15, y, z);
        desiredPos.current.set(x + 1.45, y + 1.15, z + 7.6);
      } else {
        desiredTarget.current.set(x + 1.0, y, z);
        desiredPos.current.set(x + 1.6, y + 5.6, z + 6.4);
      }
      isAnimating.current = true;
      return;
    }

    if (layoutMode === "organic") {
      desiredTarget.current.set(0, 1.35, 0);
      desiredPos.current.set(0, 1.9, 22.8);
    } else {
      desiredTarget.current.set(0, 0.2, 0);
      desiredPos.current.set(0, 17.8, 14.8);
    }
    isAnimating.current = true;
  }, [selectedPosition, layoutMode, resetSignal]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (isAnimating.current) {
      const alpha = Math.min(1, delta * 3.8);
      camera.position.lerp(desiredPos.current, alpha);
      controls.target.lerp(desiredTarget.current, alpha);

      if (
        camera.position.distanceTo(desiredPos.current) < 0.06 &&
        controls.target.distanceTo(desiredTarget.current) < 0.06
      ) {
        isAnimating.current = false;
      }
    }

    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.055}
      rotateSpeed={0.62}
      zoomSpeed={0.85}
      panSpeed={0.65}
      minDistance={4.2}
      maxDistance={40}
      maxPolarAngle={Math.PI * 0.86}
      autoRotate={autoRotate && !selectedPosition}
      autoRotateSpeed={0.34}
      onStart={() => {
        // Yield immediately to user drag/zoom
        isAnimating.current = false;
      }}
    />
  );
}

export default function TreeCanvas({
  members,
  layoutMode,
  selectedMemberId,
  activeGeneration,
  autoRotate,
  resetSignal,
  onSelectMember,
  onClearSelection,
}: TreeCanvasProps) {
  const layout = useMemo(() => computeTreeLayouts(members), [members]);
  const activePositions =
    layoutMode === "organic" ? layout.organic : layout.radial;

  const directLineageIds = useMemo(
    () => getDirectLineageIds(selectedMemberId, members),
    [selectedMemberId, members]
  );

  const selectedPosition = selectedMemberId
    ? activePositions[selectedMemberId] ?? null
    : null;

  return (
    <div className="relative h-full w-full">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 1.9, 22.8], fov: 44, near: 0.1, far: 130 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.12,
        }}
        onPointerMissed={() => {
          if (selectedMemberId) {
            onClearSelection();
          }
        }}
      >
        <color attach="background" args={["#090D0B"]} />
        <fog attach="fog" args={["#090D0B", 24, 62]} />

        {/* Atmospheric archival 4-point obsidian-forest illumination */}
        <hemisphereLight args={["#D7E4D8", "#16110A", 0.55]} />

        {/* Warm subterranean golden root up-light accentuating bark flutes & buttress roots */}
        <pointLight
          position={[0, -5.2, 2.4]}
          intensity={44}
          distance={24}
          decay={1.55}
          color="#E2AC5C"
        />

        {/* Warm sunlight / amber key light grazing the sculpted trunk & canopy */}
        <directionalLight
          position={[11, 13, 12]}
          intensity={1.35}
          color="#F7E3BA"
        />

        {/* Cool moonlit forest emerald rim light separating bark ridges from obsidian void */}
        <directionalLight
          position={[-12, 8, -10]}
          intensity={0.85}
          color="#6B9478"
        />

        {/* Soft crown glow inside the upper canopy */}
        <pointLight
          position={[0, 7.2, 1.5]}
          intensity={26}
          distance={26}
          decay={1.6}
          color="#F0CA82"
        />

        <AmbientPollen count={260} />

        <OrganicBranches
          members={members}
          edges={layout.edges}
          positions={activePositions}
          layoutMode={layoutMode}
          selectedId={selectedMemberId}
          directLineageIds={directLineageIds}
          generations={layout.generations}
          onSelectMember={onSelectMember}
        />

        {members.map((member) => {
          const pos = activePositions[member.id] ?? [0, 0, 0];
          const isSelected = member.id === selectedMemberId;
          const isInLineage = directLineageIds.has(member.id);
          const matchesGen =
            activeGeneration === null || member.generation === activeGeneration;

          const isDimmed = selectedMemberId
            ? !isInLineage
            : activeGeneration !== null && !matchesGen;

          return (
            <MemberNode
              key={member.id}
              member={member}
              targetPosition={pos}
              isSelected={isSelected}
              isHighlighted={
                Boolean(selectedMemberId && isInLineage) ||
                (activeGeneration !== null && matchesGen)
              }
              isDimmed={isDimmed}
              onSelect={onSelectMember}
            />
          );
        })}

        <CameraRig
          selectedPosition={selectedPosition}
          layoutMode={layoutMode}
          autoRotate={autoRotate}
          resetSignal={resetSignal}
        />
      </Canvas>
    </div>
  );
}
