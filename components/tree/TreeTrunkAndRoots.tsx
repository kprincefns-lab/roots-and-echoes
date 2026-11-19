"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Vec3 } from "@/lib/lineage";
import {
  createCoiledVeinCurve,
  createTaperedOrganicTube,
  seededRandom,
} from "@/lib/treeGeometry";
import { getBarkTextures } from "@/lib/treeTextures";

interface TreeTrunkAndRootsProps {
  visible: boolean;
  rootAnchors: Vec3[];
  dimmed: boolean;
}

const SAP_VEIN_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SAP_VEIN_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;

  void main() {
    // Flowing upward golden sap pulse from roots toward crown
    float pulse1 = pow(0.5 + 0.5 * sin(vUv.y * 2.8 - uTime * 1.45), 4.0);
    float pulse2 = pow(0.5 + 0.5 * sin(vUv.y * 5.2 - uTime * 2.2 + 1.7), 6.0);
    float glow = 0.32 + pulse1 * 0.52 + pulse2 * 0.35;

    vec3 deepGold = vec3(0.78, 0.54, 0.24);
    vec3 brightGold = vec3(1.0, 0.9, 0.66);
    vec3 col = mix(deepGold, brightGold, clamp(pulse1 * 0.75 + pulse2 * 0.45, 0.0, 1.0));

    gl_FragColor = vec4(col * (1.1 + glow * 0.6), clamp(glow * uIntensity, 0.08, 0.95));
  }
`;

/**
 * Sculptural braided ancient trunk & multi-tier branching buttress root system.
 * Uses custom tapered, fluted, Rotation-Minimizing Frame organic wood meshes
 * with animated bioluminescent sap veins — zero blocky cylinders or straight pipes.
 */
export function TreeTrunkAndRoots({
  visible,
  rootAnchors,
  dimmed,
}: TreeTrunkAndRootsProps) {
  const barkTextures = useMemo(() => getBarkTextures(), []);

  // Serialize anchors into a stable dependency key
  const anchorKey = rootAnchors
    .map((a) => `${a[0].toFixed(2)},${a[1].toFixed(2)},${a[2].toFixed(2)}`)
    .join("|");

  const { woodGeometries, sapGeometries } = useMemo(() => {
    const wood: THREE.BufferGeometry[] = [];
    const sap: THREE.BufferGeometry[] = [];

    const anchors =
      rootAnchors.length > 0
        ? rootAnchors.map((a) => new THREE.Vector3(...a))
        : [new THREE.Vector3(-1.5, -1.9, 0.3), new THREE.Vector3(1.5, -1.9, -0.3)];

    // Compute centroid of Gen 0 anchors so the trunk rises naturally toward them
    const crownCenter = anchors
      .reduce((acc, v) => acc.add(v), new THREE.Vector3())
      .divideScalar(anchors.length);
    const forkY = Math.min(-2.55, crownCenter.y - 0.75);

    // ─── 1. CENTRAL GNARLED FLUTED HEARTWOOD CORE ───
    const coreCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -6.58, 0),
      new THREE.Vector3(-0.14, -5.55, 0.1),
      new THREE.Vector3(0.11, -4.35, -0.09),
      new THREE.Vector3(crownCenter.x * 0.35, -3.3, crownCenter.z * 0.35),
      new THREE.Vector3(crownCenter.x * 0.7, forkY, crownCenter.z * 0.7),
    ]);

    wood.push(
      createTaperedOrganicTube({
        curve: coreCurve,
        tubularSegments: 42,
        radialSegments: 20,
        radiusStart: 0.76,
        radiusEnd: 0.3,
        taperPower: 0.72,
        flareStart: 0.58,
        fluteCount: 7,
        fluteDepth: 0.24,
        twist: 1.65,
        barkNoise: 0.06,
        seed: 11,
      })
    );

    // ─── 2. BRAIDED SPIRAL TRUNK STRANDS FLOWING DIRECTLY INTO GEN 0 ROOTS ───
    const strandCount = Math.max(6, anchors.length * 3);
    for (let i = 0; i < strandCount; i++) {
      const targetAnchor = anchors[i % anchors.length];
      const baseAngle = (i / strandCount) * Math.PI * 2 + 0.3;
      const twistDir = i % 2 === 0 ? 1 : -1;
      const baseRadius = 0.72 + seededRandom(i * 19 + 3) * 0.28;
      const waistRadius = 0.34 + seededRandom(i * 23 + 7) * 0.14;

      const p0 = new THREE.Vector3(
        Math.cos(baseAngle) * (baseRadius * 1.45),
        -6.52,
        Math.sin(baseAngle) * (baseRadius * 1.45)
      );
      const p1 = new THREE.Vector3(
        Math.cos(baseAngle + 0.35 * twistDir) * baseRadius,
        -5.45,
        Math.sin(baseAngle + 0.35 * twistDir) * baseRadius
      );
      const p2 = new THREE.Vector3(
        Math.cos(baseAngle + 0.95 * twistDir) * waistRadius,
        -4.15,
        Math.sin(baseAngle + 0.95 * twistDir) * waistRadius
      );
      const p3 = new THREE.Vector3(
        THREE.MathUtils.lerp(
          Math.cos(baseAngle + 1.35 * twistDir) * 0.28,
          targetAnchor.x,
          0.52
        ),
        THREE.MathUtils.lerp(-3.1, targetAnchor.y, 0.45),
        THREE.MathUtils.lerp(
          Math.sin(baseAngle + 1.35 * twistDir) * 0.28,
          targetAnchor.z,
          0.52
        )
      );
      const p4 = targetAnchor.clone();

      const strandCurve = new THREE.CatmullRomCurve3([p0, p1, p2, p3, p4]);
      wood.push(
        createTaperedOrganicTube({
          curve: strandCurve,
          tubularSegments: 40,
          radialSegments: 12,
          radiusStart: 0.24,
          radiusEnd: 0.1,
          taperPower: 0.85,
          flareStart: 0.38,
          fluteCount: 3,
          fluteDepth: 0.1,
          twist: 1.9 * twistDir,
          barkNoise: 0.05,
          seed: 30 + i * 7,
        })
      );

      // Add a glowing bioluminescent sap vein coiling along alternate trunk strands
      if (i % 2 === 0) {
        const veinCurve = createCoiledVeinCurve(
          strandCurve,
          0.25,
          0.11,
          1.35,
          i * 1.1,
          40
        );
        sap.push(
          createTaperedOrganicTube({
            curve: veinCurve,
            tubularSegments: 40,
            radialSegments: 6,
            radiusStart: 0.026,
            radiusEnd: 0.014,
            barkNoise: 0,
            seed: 90 + i,
          })
        );
      }
    }

    // ─── 3. MULTI-TIERED BUTTRESS ROOTS + FORKED SECONDARY & TERTIARY ROOTLETS ───
    const primaryRootCount = 10;
    for (let i = 0; i < primaryRootCount; i++) {
      const jitter = (seededRandom(i * 13 + 5) - 0.5) * 0.26;
      const angle = (i / primaryRootCount) * Math.PI * 2 + jitter;
      const reach = 4.2 + seededRandom(i * 29 + 11) * 3.1;
      const startY = -4.25 - seededRandom(i * 7 + 2) * 0.85;
      const archLift = 0.22 + seededRandom(i * 17 + 9) * 0.32;
      const curveBend = (seededRandom(i * 31 + 4) - 0.5) * 0.48;

      const dirX = Math.cos(angle);
      const dirZ = Math.sin(angle);

      const r0 = new THREE.Vector3(dirX * 0.44, startY, dirZ * 0.44);
      const r1 = new THREE.Vector3(
        Math.cos(angle + curveBend * 0.25) * (reach * 0.24),
        -5.65 + archLift * 0.6,
        Math.sin(angle + curveBend * 0.25) * (reach * 0.24)
      );
      const r2 = new THREE.Vector3(
        Math.cos(angle + curveBend * 0.6) * (reach * 0.52),
        -6.28 + archLift * 0.5,
        Math.sin(angle + curveBend * 0.6) * (reach * 0.52)
      );
      const r3 = new THREE.Vector3(
        Math.cos(angle + curveBend * 0.95) * (reach * 0.8),
        -6.48 + (i % 2 === 0 ? 0.1 : -0.05),
        Math.sin(angle + curveBend * 0.95) * (reach * 0.8)
      );
      const r4 = new THREE.Vector3(
        Math.cos(angle + curveBend * 0.72) * reach,
        -6.64,
        Math.sin(angle + curveBend * 0.72) * reach
      );

      const primaryCurve = new THREE.CatmullRomCurve3([r0, r1, r2, r3, r4]);
      const baseR = 0.27 + seededRandom(i * 41) * 0.08;

      wood.push(
        createTaperedOrganicTube({
          curve: primaryCurve,
          tubularSegments: 36,
          radialSegments: 12,
          radiusStart: baseR,
          radiusEnd: 0.022,
          taperPower: 0.68,
          flareStart: 0.45,
          fluteCount: 4,
          fluteDepth: 0.16,
          twist: 0.9 * (i % 2 === 0 ? 1 : -1),
          barkNoise: 0.06,
          seed: 100 + i * 11,
          capTip: true,
        })
      );

      // Glowing subterranean memory vein hugging alternate primary roots
      if (i % 2 === 0) {
        const rootVein = createCoiledVeinCurve(
          primaryCurve,
          baseR * 0.95,
          0.028,
          0.95,
          i * 0.7,
          32
        );
        sap.push(
          createTaperedOrganicTube({
            curve: rootVein,
            tubularSegments: 32,
            radialSegments: 6,
            radiusStart: 0.022,
            radiusEnd: 0.008,
            barkNoise: 0,
            capTip: true,
          })
        );
      }

      // Fork 2 secondary organic rootlets off each primary root
      for (let f = 0; f < 2; f++) {
        const forkT = f === 0 ? 0.34 : 0.62;
        const forkOrigin = primaryCurve.getPointAt(forkT);
        const side = f === 0 ? 1 : -1;
        const forkAngle =
          angle +
          curveBend * forkT +
          side * (0.42 + seededRandom(i * 19 + f * 37) * 0.34);
        const forkLen = (1.6 + seededRandom(i * 53 + f * 17) * 1.45) * (f === 0 ? 1.15 : 0.85);

        const f1 = forkOrigin
          .clone()
          .add(
            new THREE.Vector3(
              Math.cos(forkAngle) * (forkLen * 0.36),
              -0.14 + (f === 0 ? 0.08 : 0),
              Math.sin(forkAngle) * (forkLen * 0.36)
            )
          );
        const f2 = forkOrigin
          .clone()
          .add(
            new THREE.Vector3(
              Math.cos(forkAngle + side * 0.22) * (forkLen * 0.72),
              -0.34,
              Math.sin(forkAngle + side * 0.22) * (forkLen * 0.72)
            )
          );
        const f3 = new THREE.Vector3(
          forkOrigin.x + Math.cos(forkAngle - side * 0.08) * forkLen,
          -6.64,
          forkOrigin.z + Math.sin(forkAngle - side * 0.08) * forkLen
        );

        // Clamp intermediate y so forked roots hug the mossy ground nicely
        f1.y = Math.max(-6.54, Math.min(-5.95, f1.y));
        f2.y = Math.max(-6.6, Math.min(-6.28, f2.y));

        const forkCurve = new THREE.CatmullRomCurve3([forkOrigin, f1, f2, f3]);
        const forkStartR = THREE.MathUtils.lerp(baseR, 0.024, forkT) * 0.72;

        wood.push(
          createTaperedOrganicTube({
            curve: forkCurve,
            tubularSegments: 22,
            radialSegments: 8,
            radiusStart: forkStartR,
            radiusEnd: 0.01,
            taperPower: 0.78,
            barkNoise: 0.05,
            seed: 240 + i * 17 + f * 5,
            capTip: true,
          })
        );

        // Fine tertiary glowing tip-tendril extending delicately from the first fork
        if (f === 0 && i % 2 === 1) {
          const tipOrigin = forkCurve.getPointAt(0.7);
          const tipAngle = forkAngle - side * 0.38;
          const tipEnd = new THREE.Vector3(
            tipOrigin.x + Math.cos(tipAngle) * 1.15,
            -6.64,
            tipOrigin.z + Math.sin(tipAngle) * 1.15
          );
          const tipMid = tipOrigin.clone().lerp(tipEnd, 0.5);
          tipMid.y = -6.54;
          const tipCurve = new THREE.CatmullRomCurve3([tipOrigin, tipMid, tipEnd]);
          sap.push(
            createTaperedOrganicTube({
              curve: tipCurve,
              tubularSegments: 14,
              radialSegments: 5,
              radiusStart: 0.014,
              radiusEnd: 0.004,
              barkNoise: 0,
              capTip: true,
            })
          );
        }
      }
    }

    return { woodGeometries: wood, sapGeometries: sap };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorKey]);

  const sapGroupRef = useRef<THREE.Group>(null);

  const sapMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SAP_VEIN_VERTEX,
        fragmentShader: SAP_VEIN_FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uIntensity: { value: 0.85 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useFrame(({ clock }, delta) => {
    const firstMesh = sapGroupRef.current?.children[0] as THREE.Mesh | undefined;
    const mat = firstMesh?.material as THREE.ShaderMaterial | undefined;
    if (!mat) return;
    mat.uniforms.uTime.value = clock.getElapsedTime();
    const targetIntensity = dimmed ? 0.28 : 0.88;
    mat.uniforms.uIntensity.value = THREE.MathUtils.lerp(
      mat.uniforms.uIntensity.value,
      targetIntensity,
      Math.min(1, delta * 4)
    );
  });

  if (!visible) return null;

  return (
    <group>
      {/* Sculpted ancient walnut-amber bark meshes */}
      {woodGeometries.map((geo, idx) => (
        <mesh key={`wood-${idx}`} geometry={geo}>
          <meshStandardMaterial
            map={barkTextures?.map ?? null}
            bumpMap={barkTextures?.bumpMap ?? null}
            bumpScale={0.08}
            color={dimmed ? "#4B3B28" : "#8A6842"}
            emissive="#543816"
            emissiveIntensity={dimmed ? 0.09 : 0.24}
            roughness={0.68}
            metalness={0.18}
            transparent={dimmed}
            opacity={dimmed ? 0.5 : 1}
          />
        </mesh>
      ))}

      {/* Flowing bioluminescent golden sap veins */}
      <group ref={sapGroupRef}>
        {sapGeometries.map((geo, idx) => (
          <mesh key={`sap-${idx}`} geometry={geo} material={sapMaterial} />
        ))}
      </group>
    </group>
  );
}
