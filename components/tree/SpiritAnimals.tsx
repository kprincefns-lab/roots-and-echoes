"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BranchEdge, Vec3 } from "@/lib/lineage";
import {
  FamilyMember,
  SpiritAnimalType,
  TreeLayoutMode,
} from "@/types/family";
import {
  createLineageBranchCurve,
  createTaperedOrganicTube,
  seededRandom,
} from "@/lib/treeGeometry";
import { getSoftGlowTexture } from "@/lib/treeTextures";
import { soundscape } from "@/lib/soundscape";

interface SpiritAnimalsProps {
  members: FamilyMember[];
  edges: BranchEdge[];
  positions: Record<string, Vec3>;
  layoutMode: TreeLayoutMode;
  selectedId: string | null;
  directLineageIds: Set<string>;
  onSelectMember: (id: string) => void;
}

const SPIRIT_VERTEX = /* glsl */ `
  varying vec3 vNormalDir;
  varying vec3 vViewDir;
  varying vec3 vLocalPos;

  void main() {
    vLocalPos = position;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vNormalDir = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const SPIRIT_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uHover;

  varying vec3 vNormalDir;
  varying vec3 vViewDir;
  varying vec3 vLocalPos;

  void main() {
    // Crisp Fresnel rim light so every silhouette glows like sculpted starlight
    float ndotv = clamp(abs(dot(normalize(vNormalDir), normalize(vViewDir))), 0.0, 1.0);
    float fresnel = pow(1.0 - ndotv, 1.95);

    // Flowing internal ethereal light waves drifting along the form
    float flow1 = 0.5 + 0.5 * sin(vLocalPos.x * 5.2 + vLocalPos.y * 3.8 - uTime * 2.1);
    float flow2 = 0.5 + 0.5 * cos(vLocalPos.z * 6.5 - vLocalPos.y * 4.4 + uTime * 1.5);
    float shimmer = flow1 * 0.6 + flow2 * 0.4;

    vec3 warmAmber = vec3(0.86, 0.65, 0.32);
    vec3 celestialGold = vec3(1.0, 0.93, 0.76);
    vec3 pureStarlight = vec3(1.0, 0.99, 0.94);

    vec3 col = mix(warmAmber, celestialGold, clamp(fresnel * 0.78 + shimmer * 0.35, 0.0, 1.0));
    col = mix(col, pureStarlight, pow(fresnel, 3.2) * (0.65 + uHover * 0.35));

    float coreFill = 0.24 + shimmer * 0.14;
    float alpha = (coreFill + fresnel * 0.88) * uIntensity * (1.0 + uHover * 0.32);
    gl_FragColor = vec4(col * (1.18 + fresnel * 0.65 + uHover * 0.3), clamp(alpha, 0.04, 0.96));
  }
`;

function createSpiritLightMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: SPIRIT_VERTEX,
    fragmentShader: SPIRIT_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0.92 },
      uHover: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
  });
}

/**
 * Delicate rising stardust motes evaporating off a luminous spirit animal.
 */
function SpiritStardust({
  count = 20,
  spread = 0.55,
  height = 0.7,
  seed = 1,
  dimmed,
}: {
  count?: number;
  spread?: number;
  height?: number;
  seed?: number;
  dimmed: boolean;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const glowTex = useMemo(() => getSoftGlowTexture(), []);

  const { basePositions, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = seededRandom(seed * 31 + i * 13) * Math.PI * 2;
      const r = seededRandom(seed * 47 + i * 17) * spread;
      const y = seededRandom(seed * 61 + i * 19) * height;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(a) * r;

      ph[i * 3] = a;
      ph[i * 3 + 1] = 0.4 + seededRandom(seed + i * 29) * 0.6;
      ph[i * 3 + 2] = 0.25 + seededRandom(seed + i * 43) * 0.45;
    }
    return { basePositions: pos, phases: ph };
  }, [count, spread, height, seed]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(basePositions.slice(), 3)
    );
    return geo;
  }, [basePositions]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const attr = pointsRef.current.geometry.getAttribute(
      "position"
    ) as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const p = phases[i * 3];
      const spd = phases[i * 3 + 1];
      const rise = phases[i * 3 + 2];
      const bx = basePositions[i * 3];
      const by = basePositions[i * 3 + 1];
      const bz = basePositions[i * 3 + 2];

      const y = ((by + t * rise * 0.35) % (height + 0.35));
      attr.setXYZ(
        i,
        bx + Math.sin(t * spd + p) * 0.08,
        y,
        bz + Math.cos(t * spd * 0.8 + p) * 0.08
      );
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        map={glowTex ?? null}
        color="#FFF2CC"
        size={0.16}
        transparent
        opacity={dimmed ? 0.14 : 0.72}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/**
 * 1. PANTHER OF LIGHT — Sleek feline spirit reclining gracefully along a curved bough,
 *    one forepaw stretched forward, one draped over the limb, long luminous tail swaying below.
 */
function PantherLightForm({
  material,
  dimmed,
  phase,
}: {
  material: THREE.ShaderMaterial;
  dimmed: boolean;
  phase: number;
}) {
  const bodyRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);

  const { bodyParts, tailGeo } = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];

    // Sculpted feline spine & torso (haunches -> lean waist -> arched shoulders -> chest)
    const spineCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.52, 0.15, 0),
      new THREE.Vector3(-0.28, 0.25, 0),
      new THREE.Vector3(-0.02, 0.22, 0),
      new THREE.Vector3(0.24, 0.29, 0),
      new THREE.Vector3(0.42, 0.21, 0),
    ]);
    parts.push(
      createTaperedOrganicTube({
        curve: spineCurve,
        tubularSegments: 32,
        radialSegments: 16,
        radiusStart: 0.115,
        radiusEnd: 0.132,
        taperPower: 0.9,
        barkNoise: 0.02,
        seed: 7,
      })
    );

    // Graceful neck lifting into sleek panther head & tapered muzzle
    const neckHeadCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.32, 0.24, 0),
      new THREE.Vector3(0.46, 0.42, 0),
      new THREE.Vector3(0.58, 0.49, 0),
      new THREE.Vector3(0.7, 0.45, 0),
      new THREE.Vector3(0.79, 0.41, 0),
    ]);
    parts.push(
      createTaperedOrganicTube({
        curve: neckHeadCurve,
        tubularSegments: 26,
        radialSegments: 14,
        radiusStart: 0.102,
        radiusEnd: 0.044,
        taperPower: 1.05,
        barkNoise: 0.015,
        seed: 13,
        capTip: true,
      })
    );

    // Slept-back pointed feline ears (left & right)
    for (const side of [-1, 1]) {
      const earCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.55, 0.52, side * 0.055),
        new THREE.Vector3(0.52, 0.6, side * 0.082),
        new THREE.Vector3(0.48, 0.64, side * 0.092),
      ]);
      parts.push(
        createTaperedOrganicTube({
          curve: earCurve,
          tubularSegments: 10,
          radialSegments: 8,
          radiusStart: 0.036,
          radiusEnd: 0.006,
          barkNoise: 0,
          capTip: true,
        })
      );
    }

    // Outstretched right foreleg gripping forward along the top of the branch
    const frontStretch = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.33, 0.22, 0.085),
      new THREE.Vector3(0.47, 0.11, 0.08),
      new THREE.Vector3(0.66, 0.05, 0.055),
      new THREE.Vector3(0.76, 0.035, 0.045),
    ]);
    parts.push(
      createTaperedOrganicTube({
        curve: frontStretch,
        tubularSegments: 18,
        radialSegments: 10,
        radiusStart: 0.068,
        radiusEnd: 0.034,
        barkNoise: 0.015,
        capTip: true,
      })
    );

    // Relaxed left foreleg draped gracefully down over the side of the bough
    const frontDrape = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.3, 0.2, -0.095),
      new THREE.Vector3(0.36, 0.04, -0.155),
      new THREE.Vector3(0.35, -0.15, -0.145),
      new THREE.Vector3(0.38, -0.27, -0.115),
    ]);
    parts.push(
      createTaperedOrganicTube({
        curve: frontDrape,
        tubularSegments: 18,
        radialSegments: 10,
        radiusStart: 0.066,
        radiusEnd: 0.03,
        barkNoise: 0.015,
        capTip: true,
      })
    );

    // Coiled muscular hind haunches & tucked hind legs
    for (const side of [-1, 1]) {
      const haunchCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.42, 0.2, side * 0.09),
        new THREE.Vector3(-0.27, 0.12, side * 0.13),
        new THREE.Vector3(-0.36, 0.045, side * 0.1),
        new THREE.Vector3(-0.5, 0.03, side * 0.075),
      ]);
      parts.push(
        createTaperedOrganicTube({
          curve: haunchCurve,
          tubularSegments: 16,
          radialSegments: 10,
          radiusStart: 0.078,
          radiusEnd: 0.032,
          barkNoise: 0.015,
          capTip: true,
        })
      );
    }

    // Long sinuous hanging tail (pivoted at rump origin for gentle sway animation)
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.18, -0.07, 0.05),
      new THREE.Vector3(-0.28, -0.34, 0.09),
      new THREE.Vector3(-0.22, -0.66, 0.03),
      new THREE.Vector3(-0.08, -0.82, -0.04),
    ]);
    const tail = createTaperedOrganicTube({
      curve: tailCurve,
      tubularSegments: 26,
      radialSegments: 9,
      radiusStart: 0.042,
      radiusEnd: 0.014,
      taperPower: 0.85,
      barkNoise: 0.01,
      capTip: true,
    });

    return { bodyParts: parts, tailGeo: tail };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (bodyRef.current) {
      // Calm feline breathing
      bodyRef.current.scale.y = 1 + Math.sin(t * 1.45 + phase) * 0.028;
    }
    if (tailRef.current) {
      // Lazy pendulum sway of the hanging luminous tail
      tailRef.current.rotation.z = Math.sin(t * 0.95 + phase) * 0.14;
      tailRef.current.rotation.x = Math.cos(t * 0.72 + phase) * 0.08;
    }
  });

  return (
    <group scale={1.12}>
      <group ref={bodyRef}>
        {bodyParts.map((geo, i) => (
          <mesh key={i} geometry={geo} material={material} />
        ))}

        {/* Two bright pinpoint feline eyes */}
        {[-1, 1].map((side) => (
          <mesh key={`eye-${side}`} position={[0.66, 0.47, side * 0.045]}>
            <sphereGeometry args={[0.015, 10, 10]} />
            <meshBasicMaterial
              color="#FFFDF5"
              transparent
              opacity={dimmed ? 0.25 : 0.98}
            />
          </mesh>
        ))}

        {/* Swaying luminous tail */}
        <group ref={tailRef} position={[-0.5, 0.14, 0]}>
          <mesh geometry={tailGeo} material={material} />
        </group>
      </group>

      <SpiritStardust count={24} spread={0.62} height={0.75} seed={11} dimmed={dimmed} />
    </group>
  );
}

/**
 * 2. SONGBIRD OF LIGHT — Delicate luminous bird perched lightly on a canopy bough,
 *    with layered half-poised starlight wings and twin flowing swallow-ribbon tail plumes.
 */
function BirdLightForm({
  material,
  dimmed,
  phase,
}: {
  material: THREE.ShaderMaterial;
  dimmed: boolean;
  phase: number;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);

  const { bodyParts, leftWingParts, rightWingParts } = useMemo(() => {
    const body: THREE.BufferGeometry[] = [];
    const lWing: THREE.BufferGeometry[] = [];
    const rWing: THREE.BufferGeometry[] = [];

    // Sculpted teardrop chest, curved back & uplifted neck
    const torsoCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.14, -0.24),
      new THREE.Vector3(0, 0.17, -0.05),
      new THREE.Vector3(0, 0.24, 0.1),
      new THREE.Vector3(0, 0.37, 0.15),
      new THREE.Vector3(0, 0.46, 0.16),
    ]);
    body.push(
      createTaperedOrganicTube({
        curve: torsoCurve,
        tubularSegments: 24,
        radialSegments: 14,
        radiusStart: 0.036,
        radiusEnd: 0.068,
        flareStart: 0,
        barkNoise: 0.012,
        seed: 21,
      })
    );

    // Full luminous breast contour
    const breastCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.13, -0.14),
      new THREE.Vector3(0, 0.16, 0.04),
      new THREE.Vector3(0, 0.27, 0.14),
    ]);
    body.push(
      createTaperedOrganicTube({
        curve: breastCurve,
        tubularSegments: 16,
        radialSegments: 12,
        radiusStart: 0.062,
        radiusEnd: 0.082,
        barkNoise: 0.01,
      })
    );

    // Sculpted head tapering into fine pointed beak
    const beakCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.45, 0.15),
      new THREE.Vector3(0, 0.455, 0.23),
      new THREE.Vector3(0, 0.435, 0.34),
    ]);
    body.push(
      createTaperedOrganicTube({
        curve: beakCurve,
        tubularSegments: 14,
        radialSegments: 10,
        radiusStart: 0.062,
        radiusEnd: 0.005,
        taperPower: 0.85,
        barkNoise: 0,
        capTip: true,
      })
    );

    // Twin graceful sweeping swallow-ribbon tail plumes
    for (const side of [-1, 1]) {
      const plumeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.02, 0.15, -0.22),
        new THREE.Vector3(side * 0.05, 0.09, -0.44),
        new THREE.Vector3(side * 0.12, -0.02, -0.68),
        new THREE.Vector3(side * 0.17, -0.1, -0.82),
      ]);
      body.push(
        createTaperedOrganicTube({
          curve: plumeCurve,
          tubularSegments: 20,
          radialSegments: 7,
          radiusStart: 0.028,
          radiusEnd: 0.005,
          barkNoise: 0,
          capTip: true,
        })
      );
    }

    // Layered swept wings (3 luminous feather arcs per wing, half-poised)
    for (const side of [-1, 1]) {
      const targetArr = side === -1 ? lWing : rWing;
      for (let f = 0; f < 3; f++) {
        const lift = 0.26 - f * 0.07;
        const span = 0.42 - f * 0.06;
        const sweepBack = -0.34 - f * 0.09;
        const featherCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(side * span * 0.48, lift * 0.85, sweepBack * 0.35),
          new THREE.Vector3(side * span * 0.88, lift * 1.05, sweepBack * 0.78),
          new THREE.Vector3(side * span, lift * 0.72, sweepBack),
        ]);
        targetArr.push(
          createTaperedOrganicTube({
            curve: featherCurve,
            tubularSegments: 16,
            radialSegments: 7,
            radiusStart: 0.036 - f * 0.005,
            radiusEnd: 0.006,
            barkNoise: 0,
            capTip: true,
          })
        );
      }
    }

    return {
      bodyParts: body,
      leftWingParts: lWing,
      rightWingParts: rWing,
    };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (rootRef.current) {
      // Gentle curious songbird bob & subtle head-turn
      rootRef.current.position.y = Math.sin(t * 2.1 + phase) * 0.015;
      rootRef.current.rotation.y = Math.sin(t * 0.55 + phase) * 0.22;
    }
    // Periodic gentle wing poise & flutter
    const flutterPulse = Math.pow(Math.max(0, Math.sin(t * 0.65 + phase)), 8);
    const wingAngle =
      0.08 +
      Math.sin(t * 1.9 + phase) * 0.04 +
      Math.sin(t * 11.0) * 0.14 * flutterPulse;

    if (leftWingRef.current) leftWingRef.current.rotation.z = -wingAngle;
    if (rightWingRef.current) rightWingRef.current.rotation.z = wingAngle;
  });

  return (
    <group scale={1.15}>
      <group ref={rootRef}>
        {bodyParts.map((geo, i) => (
          <mesh key={i} geometry={geo} material={material} />
        ))}

        {/* Left & Right poised wings */}
        <group ref={leftWingRef} position={[-0.06, 0.25, 0.02]}>
          {leftWingParts.map((geo, i) => (
            <mesh key={i} geometry={geo} material={material} />
          ))}
        </group>
        <group ref={rightWingRef} position={[0.06, 0.25, 0.02]}>
          {rightWingParts.map((geo, i) => (
            <mesh key={i} geometry={geo} material={material} />
          ))}
        </group>

        {/* Tiny luminous songbird eyes */}
        {[-1, 1].map((side) => (
          <mesh key={`be-${side}`} position={[side * 0.044, 0.465, 0.2]}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshBasicMaterial
              color="#FFFDF5"
              transparent
              opacity={dimmed ? 0.25 : 0.98}
            />
          </mesh>
        ))}
      </group>

      <SpiritStardust count={18} spread={0.44} height={0.68} seed={37} dimmed={dimmed} />
    </group>
  );
}

/**
 * 3. OWL OF LIGHT — Serene horned guardian owl perched upright on a limb,
 *    with sculpted folded wings, facial starlight halo, and slow watchful head turns.
 */
function OwlLightForm({
  material,
  dimmed,
  phase,
}: {
  material: THREE.ShaderMaterial;
  dimmed: boolean;
  phase: number;
}) {
  const headRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);

  const { bodyParts, headParts } = useMemo(() => {
    const body: THREE.BufferGeometry[] = [];
    const head: THREE.BufferGeometry[] = [];

    // Dignified upright owl torso
    const torsoCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.06, -0.02),
      new THREE.Vector3(0, 0.22, 0.02),
      new THREE.Vector3(0, 0.39, 0.01),
      new THREE.Vector3(0, 0.49, 0),
    ]);
    body.push(
      createTaperedOrganicTube({
        curve: torsoCurve,
        tubularSegments: 22,
        radialSegments: 16,
        radiusStart: 0.095,
        radiusEnd: 0.125,
        flareStart: 0.15,
        barkNoise: 0.015,
        seed: 51,
      })
    );

    // Folded crescent wing wraps hugging the flanks
    for (const side of [-1, 1]) {
      const wingWrap = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.1, 0.42, 0.02),
        new THREE.Vector3(side * 0.155, 0.28, -0.02),
        new THREE.Vector3(side * 0.11, 0.12, -0.09),
        new THREE.Vector3(side * 0.04, 0.02, -0.16),
      ]);
      body.push(
        createTaperedOrganicTube({
          curve: wingWrap,
          tubularSegments: 18,
          radialSegments: 10,
          radiusStart: 0.062,
          radiusEnd: 0.012,
          barkNoise: 0.01,
          capTip: true,
        })
      );
    }

    // Short tapered tail feathers angling beneath perch
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.1, -0.08),
      new THREE.Vector3(0, -0.04, -0.18),
      new THREE.Vector3(0, -0.17, -0.24),
    ]);
    body.push(
      createTaperedOrganicTube({
        curve: tailCurve,
        tubularSegments: 12,
        radialSegments: 8,
        radiusStart: 0.055,
        radiusEnd: 0.012,
        barkNoise: 0,
        capTip: true,
      })
    );

    // Sculpted round head + swept horned ear tufts (relative to head pivot at y=0.52)
    const headCore = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.04, 0),
      new THREE.Vector3(0, 0.05, 0.01),
      new THREE.Vector3(0, 0.12, 0),
    ]);
    head.push(
      createTaperedOrganicTube({
        curve: headCore,
        tubularSegments: 14,
        radialSegments: 14,
        radiusStart: 0.115,
        radiusEnd: 0.095,
        barkNoise: 0.01,
      })
    );

    // Swept horned ear tufts
    for (const side of [-1, 1]) {
      const tuftCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.075, 0.09, 0.01),
        new THREE.Vector3(side * 0.125, 0.175, -0.02),
        new THREE.Vector3(side * 0.16, 0.22, -0.055),
      ]);
      head.push(
        createTaperedOrganicTube({
          curve: tuftCurve,
          tubularSegments: 10,
          radialSegments: 7,
          radiusStart: 0.032,
          radiusEnd: 0.005,
          barkNoise: 0,
          capTip: true,
        })
      );
    }

    // Delicate downward beak
    const beakCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.04, 0.105),
      new THREE.Vector3(0, 0.015, 0.15),
      new THREE.Vector3(0, -0.01, 0.14),
    ]);
    head.push(
      createTaperedOrganicTube({
        curve: beakCurve,
        tubularSegments: 8,
        radialSegments: 6,
        radiusStart: 0.024,
        radiusEnd: 0.004,
        barkNoise: 0,
        capTip: true,
      })
    );

    return { bodyParts: body, headParts: head };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (bodyRef.current) {
      bodyRef.current.scale.y = 1 + Math.sin(t * 1.3 + phase) * 0.022;
    }
    if (headRef.current) {
      // Calm owl head-turn scanning the canopy
      headRef.current.rotation.y = Math.sin(t * 0.42 + phase) * 0.42;
      headRef.current.rotation.z = Math.cos(t * 0.35 + phase) * 0.06;
    }
  });

  return (
    <group scale={1.12}>
      <group ref={bodyRef}>
        {bodyParts.map((geo, i) => (
          <mesh key={i} geometry={geo} material={material} />
        ))}

        {/* Watchful owl head group */}
        <group ref={headRef} position={[0, 0.51, 0.01]}>
          {headParts.map((geo, i) => (
            <mesh key={i} geometry={geo} material={material} />
          ))}

          {/* Luminous golden owl eyes */}
          {[-1, 1].map((side) => (
            <mesh key={`oe-${side}`} position={[side * 0.048, 0.06, 0.098]}>
              <sphereGeometry args={[0.019, 10, 10]} />
              <meshBasicMaterial
                color="#FFFDF2"
                transparent
                opacity={dimmed ? 0.25 : 0.98}
              />
            </mesh>
          ))}
        </group>
      </group>

      <SpiritStardust count={18} spread={0.42} height={0.78} seed={67} dimmed={dimmed} />
    </group>
  );
}

interface PerchedSpiritProps {
  member: FamilyMember;
  animalType: SpiritAnimalType;
  position: [number, number, number];
  quaternion: THREE.Quaternion;
  highlighted: boolean;
  dimmed: boolean;
  onSelect: (id: string) => void;
}

function PerchedSpirit({
  member,
  animalType,
  position,
  quaternion,
  highlighted,
  dimmed,
  onSelect,
}: PerchedSpiritProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const spiritMaterial = useMemo(() => createSpiritLightMaterial(), []);
  const phase = member.birthYear * 0.13;

  useFrame(({ clock }, delta) => {
    const group = groupRef.current;
    if (!group) return;

    // Locate the shared ShaderMaterial via scene graph traversal once per frame
    const mat = group.userData.spiritMat as THREE.ShaderMaterial | undefined;
    if (!mat) return;
    mat.uniforms.uTime.value = clock.getElapsedTime();

    const targetIntensity = highlighted ? 1.15 : dimmed ? 0.24 : 0.92;
    const targetHover = hovered ? 1.0 : 0.0;
    const alpha = Math.min(1, delta * 4.5);

    mat.uniforms.uIntensity.value = THREE.MathUtils.lerp(
      mat.uniforms.uIntensity.value,
      targetIntensity,
      alpha
    );
    mat.uniforms.uHover.value = THREE.MathUtils.lerp(
      mat.uniforms.uHover.value,
      targetHover,
      alpha
    );
  });

  return (
    <group
      ref={groupRef}
      userData={{ spiritMat: spiritMaterial }}
      position={position}
      quaternion={quaternion}
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
      {/* Soft warm point aura cast onto the wood right beneath the light animal */}
      <mesh position={[0, 0.26, 0]}>
        <sphereGeometry args={[animalType === "panther" ? 0.68 : 0.46, 16, 16]} />
        <meshBasicMaterial
          color="#F5D799"
          transparent
          opacity={hovered ? 0.14 : highlighted ? 0.11 : dimmed ? 0.015 : 0.065}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {animalType === "panther" && (
        <PantherLightForm
          material={spiritMaterial}
          dimmed={dimmed}
          phase={phase}
        />
      )}
      {animalType === "bird" && (
        <BirdLightForm
          material={spiritMaterial}
          dimmed={dimmed}
          phase={phase}
        />
      )}
      {animalType === "owl" && (
        <OwlLightForm
          material={spiritMaterial}
          dimmed={dimmed}
          phase={phase}
        />
      )}
    </group>
  );
}

export function SpiritAnimals({
  members,
  edges,
  positions,
  layoutMode,
  selectedId,
  directLineageIds,
  onSelectMember,
}: SpiritAnimalsProps) {
  const hasSelection = Boolean(selectedId);

  const placements = useMemo(() => {
    const list: Array<{
      member: FamilyMember;
      animalType: SpiritAnimalType;
      position: [number, number, number];
      quaternion: THREE.Quaternion;
    }> = [];

    const worldUp = new THREE.Vector3(0, 1, 0);

    for (const member of members) {
      if (!member.spiritAnimal) continue;

      // Find the member's primary incoming lineage edge so the animal rests directly on their limb
      const edgeIndex = edges.findIndex(
        (e) => e.kind === "lineage" && e.toId === member.id
      );

      let perchPos: THREE.Vector3;
      const quat = new THREE.Quaternion();

      if (edgeIndex !== -1) {
        const edge = edges[edgeIndex];
        const from = positions[edge.fromId];
        const to = positions[edge.toId];
        if (!from || !to) continue;

        const seed = edgeIndex * 17 + 3;
        const { curve, radiusStart, radiusEnd } = createLineageBranchCurve(
          from,
          to,
          layoutMode,
          seed
        );

        const t = member.spiritAnimal === "panther" ? 0.48 : 0.54;
        const pt = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t).normalize();
        const rAtT = THREE.MathUtils.lerp(radiusStart, radiusEnd, t);

        if (member.spiritAnimal === "panther") {
          // Align the reclining panther smoothly along the curved wood limb (+X forward along bough)
          const forward = tangent.clone();
          // Keep right-vector horizontal so the panther sits upright on top of the limb
          const right = new THREE.Vector3().crossVectors(worldUp, forward);
          if (right.lengthSq() < 1e-4) {
            right.set(1, 0, 0);
          } else {
            right.normalize();
          }
          const localUp = new THREE.Vector3()
            .crossVectors(forward, right)
            .normalize();

          perchPos = pt.clone().addScaledVector(localUp, rAtT + 0.015);
          const basis = new THREE.Matrix4().makeBasis(forward, localUp, right);
          quat.setFromRotationMatrix(basis);
        } else {
          // Upright perched bird / owl resting on top of the bough, facing outward gracefully
          perchPos = pt.clone().add(new THREE.Vector3(0, rAtT + 0.02, 0));
          const faceAngle = Math.atan2(pt.x, pt.z + 4.5);
          quat.setFromAxisAngle(worldUp, faceAngle);
        }
      } else {
        // Fallback for Gen 0 founding ancestors who choose a spirit animal: perch beside their node
        const nodePos = positions[member.id];
        if (!nodePos) continue;
        perchPos = new THREE.Vector3(
          nodePos[0] + (nodePos[0] >= 0 ? 0.85 : -0.85),
          nodePos[1] - 0.15,
          nodePos[2] + 0.35
        );
        quat.setFromAxisAngle(worldUp, nodePos[0] >= 0 ? 0.55 : -0.55);
      }

      list.push({
        member,
        animalType: member.spiritAnimal,
        position: [perchPos.x, perchPos.y, perchPos.z],
        quaternion: quat,
      });
    }

    return list;
  }, [members, edges, positions, layoutMode]);

  return (
    <group>
      {placements.map(({ member, animalType, position, quaternion }) => {
        const inLineage = hasSelection && directLineageIds.has(member.id);
        return (
          <PerchedSpirit
            key={`${member.id}-${animalType}-${layoutMode}`}
            member={member}
            animalType={animalType}
            position={position}
            quaternion={quaternion}
            highlighted={inLineage}
            dimmed={hasSelection && !inLineage}
            onSelect={onSelectMember}
          />
        );
      })}
    </group>
  );
}
