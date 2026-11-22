"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { FamilyMember } from "@/types/family";
import { Vec3 } from "@/lib/lineage";
import { soundscape } from "@/lib/soundscape";

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
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Smoothly interpolate node position when toggling Organic <-> Radial layout
  // and add subtle living botanical sway & armillary brass ring motion.
  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const phase = member.birthYear * 0.17;
    const swayX = Math.sin(t * 0.55 + phase) * 0.055;
    const swayY = Math.cos(t * 0.72 + phase) * 0.07;

    const target = new THREE.Vector3(
      targetPosition[0] + swayX,
      targetPosition[1] + swayY,
      targetPosition[2]
    );
    const lerpFactor = Math.min(1, delta * 4.5);
    groupRef.current.position.lerp(target, lerpFactor);

    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = t * (isSelected ? 0.55 : 0.22);
      outerRingRef.current.rotation.x = Math.PI * 0.34 + Math.sin(t * 0.4 + phase) * 0.2;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.y = -t * (isSelected ? 0.72 : 0.28);
      innerRingRef.current.rotation.x = Math.PI * 0.62;
    }
    if (coreRef.current) {
      const breathe = 1 + Math.sin(t * 2.1 + phase) * 0.06;
      coreRef.current.scale.setScalar(breathe);
    }
  });

  const active = isSelected || hovered;
  const orbRadius = isSelected ? 0.42 : hovered ? 0.37 : 0.3;
  const emissiveIntensity = isSelected
    ? 2.4
    : hovered
      ? 1.7
      : isHighlighted
        ? 1.25
        : isDimmed
          ? 0.22
          : 0.92;

  return (
    <group ref={groupRef} position={targetPosition}>
      {/* Radiant inner amber heart-seed */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[orbRadius * 0.56, 20, 20]} />
        <meshStandardMaterial
          color="#FFF3D4"
          emissive="#F4CA7A"
          emissiveIntensity={emissiveIntensity * 1.4}
          roughness={0.15}
          metalness={0.2}
          transparent
          opacity={isDimmed ? 0.35 : 0.98}
        />
      </mesh>

      {/* Sculpted translucent amber-glass lantern shell */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect(member.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          soundscape.playNodeHover(member.generation);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[orbRadius, 32, 32]} />
        <meshPhysicalMaterial
          color={isSelected ? "#F6DFAC" : "#D4A359"}
          emissive="#C69142"
          emissiveIntensity={emissiveIntensity * 0.55}
          roughness={0.16}
          metalness={0.35}
          clearcoat={0.85}
          clearcoatRoughness={0.14}
          transparent
          opacity={isDimmed ? 0.28 : 0.84}
        />
      </mesh>

      {/* Warm atmospheric halo bloom */}
      <mesh>
        <sphereGeometry args={[orbRadius * 1.72, 20, 20]} />
        <meshBasicMaterial
          color="#E6C385"
          transparent
          opacity={
            isSelected ? 0.22 : hovered ? 0.16 : isHighlighted ? 0.11 : 0.055
          }
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Subtle brass astrolabe armillary rings (echoing watchmaker heirloom motif) */}
      <mesh ref={outerRingRef}>
        <torusGeometry
          args={[orbRadius * 1.48, active ? 0.018 : 0.011, 10, 48]}
        />
        <meshStandardMaterial
          color={isSelected ? "#FCE8BE" : "#D4A359"}
          emissive="#D4A359"
          emissiveIntensity={isSelected ? 1.4 : hovered ? 0.95 : 0.38}
          roughness={0.25}
          metalness={0.78}
          transparent
          opacity={
            isSelected ? 0.94 : hovered ? 0.78 : isDimmed ? 0.12 : 0.42
          }
        />
      </mesh>

      {(active || isHighlighted) && (
        <mesh ref={innerRingRef}>
          <torusGeometry args={[orbRadius * 1.78, 0.012, 10, 48]} />
          <meshStandardMaterial
            color="#F5DFB0"
            emissive="#E6C385"
            emissiveIntensity={isSelected ? 1.2 : 0.65}
            roughness={0.22}
            metalness={0.8}
            transparent
            opacity={isSelected ? 0.85 : 0.5}
          />
        </mesh>
      )}

      {/* Portrait medallion (or clean monogram for locked profiles) + sculptural glass label */}
      <Html
        position={[0, orbRadius + 0.54, 0]}
        center
        distanceFactor={14}
        zIndexRange={[20, 0]}
        style={{
          pointerEvents: "auto",
          opacity: isDimmed ? 0.24 : 1,
          transition: "opacity 320ms ease, transform 240ms ease",
        }}
      >
        {(() => {
          const isLocked =
            member.accessStatus === "locked" || member.accessStatus === "pending";
          const initials = `${member.firstName[0] ?? ""}${member.lastName[0] ?? ""}`.toUpperCase();

          return (
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
              {!isLocked && member.portraitUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.portraitUrl}
                  alt={`${member.firstName} ${member.lastName}`}
                  className={`h-7 w-7 rounded-full object-cover border ${
                    isSelected ? "border-[#E6C385]" : "border-[#D4A359]/40"
                  }`}
                />
              ) : (
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full border bg-[#121B16] font-editorial text-[11px] tracking-wider text-[#E6C385] ${
                    isSelected ? "border-[#E6C385]" : "border-[#D4A359]/35"
                  }`}
                >
                  {initials}
                </span>
              )}
              <div className="leading-tight whitespace-nowrap">
                <div className="font-editorial text-[14px] tracking-wide text-[#F5F2EB]">
                  {member.firstName} {member.lastName}
                </div>
                {!isLocked && member.birthYear > 0 ? (
                  <div className="text-[9.5px] tracking-wider uppercase text-[#D4A359]/80">
                    {member.birthYear}
                    {member.passingYear ? ` – ${member.passingYear}` : ""}
                  </div>
                ) : (
                  <div className="text-[9px] tracking-wider uppercase text-[#A6A095]/80">
                    {member.accessStatus === "pending"
                      ? "Request Pending"
                      : "Private Profile"}
                  </div>
                )}
              </div>
            </button>
          );
        })()}
      </Html>
    </group>
  );
}
