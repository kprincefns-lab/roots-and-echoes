"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { FamilyMember } from "@/types/family";
import { Vec3 } from "@/lib/lineage";

interface MemberNodeProps {
  member: FamilyMember;
  targetPosition: Vec3;
  isSelected: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  onSelect: (id: string) => void;
}

export function MemberNode({
  member,
  targetPosition,
  isSelected,
  isHighlighted,
  isDimmed,
  onSelect,
}: MemberNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Smoothly interpolate node position when toggling Organic <-> Radial layout
  // and add subtle living botanical sway.
  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const phase = member.birthYear * 0.17;
    const swayX = Math.sin(t * 0.55 + phase) * 0.06;
    const swayY = Math.cos(t * 0.72 + phase) * 0.08;

    const target = new THREE.Vector3(
      targetPosition[0] + swayX,
      targetPosition[1] + swayY,
      targetPosition[2]
    );
    const lerpFactor = Math.min(1, delta * 4.5);
    groupRef.current.position.lerp(target, lerpFactor);

    if (ringRef.current) {
      ringRef.current.rotation.z = t * (isSelected ? 0.55 : 0.2);
      ringRef.current.rotation.x = Math.sin(t * 0.4 + phase) * 0.25;
    }
  });

  const active = isSelected || hovered;
  const orbRadius = isSelected ? 0.42 : hovered ? 0.37 : 0.31;
  const emissiveIntensity = isSelected
    ? 2.1
    : hovered
      ? 1.5
      : isHighlighted
        ? 1.15
        : isDimmed
          ? 0.2
          : 0.72;

  const coreColor = isSelected
    ? "#F6DFAC"
    : isHighlighted || hovered
      ? "#E6C385"
      : "#D4A359";

  return (
    <group ref={groupRef} position={targetPosition}>
      {/* Interactive luminous seed/orb */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect(member.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[orbRadius, 28, 28]} />
        <meshStandardMaterial
          color={coreColor}
          emissive="#D4A359"
          emissiveIntensity={emissiveIntensity}
          roughness={0.22}
          metalness={0.45}
          transparent
          opacity={isDimmed ? 0.3 : 0.96}
        />
      </mesh>

      {/* Subtle atmospheric aura shell */}
      <mesh>
        <sphereGeometry args={[orbRadius * 1.55, 20, 20]} />
        <meshBasicMaterial
          color="#D4A359"
          transparent
          opacity={isSelected ? 0.22 : hovered ? 0.16 : isHighlighted ? 0.1 : 0.04}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Orbital brass ring for selected or hovered member */}
      {(active || isHighlighted) && (
        <mesh ref={ringRef}>
          <torusGeometry args={[orbRadius * 1.65, 0.018, 12, 48]} />
          <meshBasicMaterial
            color={isSelected ? "#F5E2BA" : "#D4A359"}
            transparent
            opacity={isSelected ? 0.88 : hovered ? 0.65 : 0.38}
          />
        </mesh>
      )}

      {/* Portrait medallion + sculptural glass label */}
      <Html
        position={[0, orbRadius + 0.52, 0]}
        center
        distanceFactor={14}
        zIndexRange={[20, 0]}
        style={{
          pointerEvents: "auto",
          opacity: isDimmed ? 0.26 : 1,
          transition: "opacity 320ms ease, transform 240ms ease",
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(member.id);
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`group flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1 text-left transition-all duration-300 cursor-pointer ${
            isSelected
              ? "bg-[#151F19]/95 border border-[#E6C385]/70 shadow-[0_0_24px_rgba(212,163,89,0.4)] scale-105"
              : hovered
                ? "bg-[#121B16]/90 border border-[#D4A359]/50 shadow-[0_8px_24px_rgba(0,0,0,0.6)] scale-105"
                : "bg-[#0D1410]/78 border border-[#D4A359]/22 hover:border-[#D4A359]/45"
          } backdrop-blur-md`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={member.portraitUrl}
            alt={`${member.firstName} ${member.lastName}`}
            className={`h-7 w-7 rounded-full object-cover border ${
              isSelected ? "border-[#E6C385]" : "border-[#D4A359]/40"
            }`}
          />
          <div className="leading-tight whitespace-nowrap">
            <div className="font-editorial text-[14px] tracking-wide text-[#F5F2EB]">
              {member.firstName} {member.lastName}
            </div>
            <div className="text-[9.5px] tracking-wider uppercase text-[#D4A359]/80">
              {member.birthYear}
              {member.passingYear ? ` – ${member.passingYear}` : ""}
            </div>
          </div>
        </button>
      </Html>
    </group>
  );
}
