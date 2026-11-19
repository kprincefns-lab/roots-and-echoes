import * as THREE from "three";

export interface TaperedTubeOptions {
  curve: THREE.CatmullRomCurve3;
  tubularSegments?: number;
  radialSegments?: number;
  radiusStart: number;
  radiusEnd: number;
  /** Exponent controlling taper curve (<1 holds thickness longer, >1 narrows rapidly) */
  taperPower?: number;
  /** Extra flared buttress multiplier near t = 0 */
  flareStart?: number;
  /** Extra flared collar multiplier near t = 1 */
  flareEnd?: number;
  /** Number of longitudinal bark ridges / root flutes */
  fluteCount?: number;
  /** Relative depth of flutes (0..0.4) */
  fluteDepth?: number;
  /** Helical twist radians from base to tip */
  twist?: number;
  /** Subtle organic surface undulation amplitude */
  barkNoise?: number;
  /** Deterministic seed for surface noise */
  seed?: number;
  /** Pinches the end into a natural fine apex tip */
  capTip?: boolean;
}

/**
 * Deterministic hash returning [0, 1) for hydration-safe procedural botany.
 */
export function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

/**
 * Builds a sculpted, smoothly tapered, optionally fluted & twisted organic wood tube
 * using Rotation-Minimizing Frames (parallel transport) so curves never suffer Frenet
 * pinch-twists. Smoothly welds seam normals for silk-like specular bark lighting.
 */
export function createTaperedOrganicTube({
  curve,
  tubularSegments = 36,
  radialSegments = 14,
  radiusStart,
  radiusEnd,
  taperPower = 0.85,
  flareStart = 0,
  flareEnd = 0,
  fluteCount = 0,
  fluteDepth = 0,
  twist = 0,
  barkNoise = 0.04,
  seed = 1,
  capTip = false,
}: TaperedTubeOptions): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  const tangents: THREE.Vector3[] = [];
  const normals: THREE.Vector3[] = [];
  const binormals: THREE.Vector3[] = [];

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    points.push(curve.getPointAt(t));
    tangents.push(curve.getTangentAt(t).normalize());
  }

  // Initial orthogonal frame at t = 0
  const t0 = tangents[0];
  const refAxis =
    Math.abs(t0.y) < 0.92
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0);
  const n0 = new THREE.Vector3().crossVectors(t0, refAxis).normalize();
  const b0 = new THREE.Vector3().crossVectors(t0, n0).normalize();
  normals.push(n0);
  binormals.push(b0);

  // Parallel transport frames along curve
  const rotAxis = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  for (let i = 1; i <= tubularSegments; i++) {
    const prevT = tangents[i - 1];
    const currT = tangents[i];
    const prevN = normals[i - 1].clone();

    rotAxis.crossVectors(prevT, currT);
    const axisLen = rotAxis.length();
    if (axisLen > 1e-5) {
      rotAxis.divideScalar(axisLen);
      const angle = Math.acos(THREE.MathUtils.clamp(prevT.dot(currT), -1, 1));
      quat.setFromAxisAngle(rotAxis, angle);
      prevN.applyQuaternion(quat);
    }
    // Re-orthogonalize against currT to prevent numeric drift
    prevN.addScaledVector(currT, -prevN.dot(currT)).normalize();
    const currB = new THREE.Vector3().crossVectors(currT, prevN).normalize();
    normals.push(prevN);
    binormals.push(currB);
  }

  const ringStride = radialSegments + 1;
  const ringCount = tubularSegments + 1;
  const vertexCount = ringCount * ringStride;

  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const indices: number[] = [];

  const arcLen = Math.max(0.5, curve.getLength());
  const offsetVec = new THREE.Vector3();

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    const center = points[i];
    const N = normals[i];
    const B = binormals[i];

    // Smooth tapered radius with optional buttress flare at start/end
    const shapedT = Math.pow(t, taperPower);
    let baseRadius = THREE.MathUtils.lerp(radiusStart, radiusEnd, shapedT);

    if (flareStart > 0) {
      const flare = Math.pow(Math.max(0, 1 - t * 2.6), 2.4) * flareStart;
      baseRadius *= 1 + flare;
    }
    if (flareEnd > 0) {
      const flare = Math.pow(Math.max(0, (t - 0.72) / 0.28), 2.0) * flareEnd;
      baseRadius *= 1 + flare;
    }
    if (capTip && i === tubularSegments) {
      baseRadius *= 0.14;
    }

    // Subtle longitudinal swell/knot undulation
    const knotWave =
      1 + Math.sin(t * Math.PI * 5.0 + seed * 3.1) * barkNoise * 0.65;

    for (let j = 0; j <= radialSegments; j++) {
      const u = j / radialSegments;
      const theta = u * Math.PI * 2;
      const twistedTheta = theta + t * twist;

      // Sculptural root/trunk fluting (stronger lower down, smoother toward upper limbs)
      let fluteFactor = 1;
      if (fluteCount > 0 && fluteDepth > 0) {
        const fluteFade = 1 - t * 0.55;
        const primaryFlute = Math.sin(twistedTheta * fluteCount + seed);
        const secondaryFlute =
          Math.sin(twistedTheta * (fluteCount * 2 - 1) - t * 2.5 + seed * 2.1) *
          0.32;
        fluteFactor += (primaryFlute + secondaryFlute) * fluteDepth * fluteFade;
      }

      // Fine organic cross-section irregularity
      const grain =
        1 +
        Math.sin(theta * 3 + t * 9.0 + seed * 5.7) * barkNoise * 0.45 +
        Math.cos(theta * 5 - t * 6.5 + seed * 1.9) * barkNoise * 0.25;

      const r = Math.max(0.004, baseRadius * knotWave * fluteFactor * grain);

      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      offsetVec
        .set(0, 0, 0)
        .addScaledVector(N, cosT * r)
        .addScaledVector(B, sinT * r);

      const vIdx = i * ringStride + j;
      positions[vIdx * 3] = center.x + offsetVec.x;
      positions[vIdx * 3 + 1] = center.y + offsetVec.y;
      positions[vIdx * 3 + 2] = center.z + offsetVec.z;

      uvs[vIdx * 2] = u * 2.0;
      uvs[vIdx * 2 + 1] = t * (arcLen * 0.42);
    }
  }

  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * ringStride + j;
      const b = (i + 1) * ringStride + j;
      const c = (i + 1) * ringStride + (j + 1);
      const d = i * ringStride + (j + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  // Weld vertex normals across the radial UV seam (j = 0 and j = radialSegments)
  const normalAttr = geometry.getAttribute("normal") as THREE.BufferAttribute;
  const nA = new THREE.Vector3();
  const nB = new THREE.Vector3();
  for (let i = 0; i <= tubularSegments; i++) {
    const first = i * ringStride;
    const last = i * ringStride + radialSegments;
    nA.fromBufferAttribute(normalAttr, first);
    nB.fromBufferAttribute(normalAttr, last);
    nA.add(nB).normalize();
    normalAttr.setXYZ(first, nA.x, nA.y, nA.z);
    normalAttr.setXYZ(last, nA.x, nA.y, nA.z);
  }
  normalAttr.needsUpdate = true;

  return geometry;
}

/**
 * Creates a delicate, gently arched elliptical botanical leaf blade for the instanced canopy.
 */
export function createBotanicalLeafGeometry(): THREE.BufferGeometry {
  // 9 vertices forming a gracefully cupped, tapered willow/olive leaf blade
  const positions = new Float32Array([
    // Base stem point (0)
    0, 0, 0,
    // Lower-left & lower-right (1, 2)
    -0.085, 0.12, 0.025,
    0.085, 0.12, 0.025,
    // Midrib lower (3)
    0, 0.14, 0.005,
    // Wide belly left & right (4, 5)
    -0.115, 0.28, 0.04,
    0.115, 0.28, 0.04,
    // Midrib upper (6)
    0, 0.31, 0.01,
    // Tapered upper left & right (7, 8)
    -0.055, 0.44, -0.01,
    0.055, 0.44, -0.01,
    // Gracefully drooping tip (9)
    0, 0.56, -0.055,
  ]);

  const indices = [
    0, 1, 3,
    0, 3, 2,
    1, 4, 3,
    3, 4, 6,
    2, 3, 5,
    3, 6, 5,
    4, 7, 6,
    5, 6, 8,
    7, 9, 6,
    6, 9, 8,
  ];

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a coiled helical energy vein curve wrapped snugly along a parent branch curve.
 */
export function createCoiledVeinCurve(
  parentCurve: THREE.CatmullRomCurve3,
  radiusStart: number,
  radiusEnd: number,
  turns = 1.4,
  phaseOffset = 0,
  samples = 34
): THREE.CatmullRomCurve3 {
  const pts: THREE.Vector3[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const alt = new THREE.Vector3(1, 0, 0);

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const p = parentCurve.getPointAt(t);
    const tangent = parentCurve.getTangentAt(t).normalize();
    const ref = Math.abs(tangent.y) < 0.9 ? up : alt;
    const n = new THREE.Vector3().crossVectors(tangent, ref).normalize();
    const b = new THREE.Vector3().crossVectors(tangent, n).normalize();

    const angle = t * Math.PI * 2 * turns + phaseOffset;
    const r = THREE.MathUtils.lerp(radiusStart, radiusEnd, t);

    pts.push(
      p
        .clone()
        .addScaledVector(n, Math.cos(angle) * r)
        .addScaledVector(b, Math.sin(angle) * r)
    );
  }
  return new THREE.CatmullRomCurve3(pts);
}
