import * as THREE from "three";

export interface BarkTextureSet {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}

let cachedBark: BarkTextureSet | null = null;
let cachedGlow: THREE.CanvasTexture | null = null;

/**
 * Generates a tileable procedural obsidian-walnut bark albedo + bump texture
 * with deep fibrous bark grooves and delicate gilded resin highlights.
 */
export function getBarkTextures(): BarkTextureSet | null {
  if (typeof document === "undefined") return null;
  if (cachedBark) return cachedBark;

  const width = 256;
  const height = 512;

  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = width;
  colorCanvas.height = height;
  const cCtx = colorCanvas.getContext("2d");

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext("2d");

  if (!cCtx || !bCtx) return null;

  // Base dark warm obsidian-walnut wood
  cCtx.fillStyle = "#261B12";
  cCtx.fillRect(0, 0, width, height);

  bCtx.fillStyle = "#5A5A5A";
  bCtx.fillRect(0, 0, width, height);

  // Layered vertical fibrous bark ridges & deep shadow crevices
  for (let i = 0; i < 160; i++) {
    const x = ((i * 73) % width);
    const w = 2 + ((i * 17) % 10);
    const ridgeBrightness = (i % 5) / 4;

    // Bark ridge highlight
    const r = Math.round(42 + ridgeBrightness * 44);
    const g = Math.round(30 + ridgeBrightness * 31);
    const b = Math.round(18 + ridgeBrightness * 16);

    cCtx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.52)`;
    cCtx.lineWidth = w;
    cCtx.beginPath();
    cCtx.moveTo(x, 0);
    const sway = Math.sin(i * 1.9) * 14;
    cCtx.bezierCurveTo(
      x + sway,
      height * 0.33,
      x - sway,
      height * 0.66,
      x,
      height
    );
    cCtx.stroke();

    // Matching bump height
    const bumpLum = Math.round(100 + ridgeBrightness * 135);
    bCtx.strokeStyle = `rgba(${bumpLum}, ${bumpLum}, ${bumpLum}, 0.6)`;
    bCtx.lineWidth = w;
    bCtx.beginPath();
    bCtx.moveTo(x, 0);
    bCtx.bezierCurveTo(
      x + sway,
      height * 0.33,
      x - sway,
      height * 0.66,
      x,
      height
    );
    bCtx.stroke();
  }

  // Deep dark crevices + subtle moss/lichen undertones
  for (let i = 0; i < 95; i++) {
    const x = ((i * 41 + 13) % width);
    const sway = Math.cos(i * 2.3) * 10;

    cCtx.strokeStyle =
      i % 7 === 0 ? "rgba(32, 48, 36, 0.42)" : "rgba(10, 7, 5, 0.78)";
    cCtx.lineWidth = 1.5 + (i % 3);
    cCtx.beginPath();
    cCtx.moveTo(x, 0);
    cCtx.bezierCurveTo(
      x + sway,
      height * 0.35,
      x - sway * 0.7,
      height * 0.7,
      x,
      height
    );
    cCtx.stroke();

    bCtx.strokeStyle = "rgba(18, 18, 18, 0.85)";
    bCtx.lineWidth = 2 + (i % 3);
    bCtx.beginPath();
    bCtx.moveTo(x, 0);
    bCtx.bezierCurveTo(
      x + sway,
      height * 0.35,
      x - sway * 0.7,
      height * 0.7,
      x,
      height
    );
    bCtx.stroke();
  }

  // Delicate golden amber mineral veins running inside select bark fissures
  for (let i = 0; i < 18; i++) {
    const x = ((i * 59 + 19) % width);
    const sway = Math.sin(i * 3.1) * 12;
    cCtx.strokeStyle = "rgba(212, 163, 89, 0.28)";
    cCtx.lineWidth = 1.2;
    cCtx.beginPath();
    cCtx.moveTo(x, 0);
    cCtx.bezierCurveTo(
      x + sway,
      height * 0.33,
      x - sway,
      height * 0.66,
      x,
      height
    );
    cCtx.stroke();
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  cachedBark = { map, bumpMap };
  return cachedBark;
}

/**
 * Generates a soft Gaussian circular glow sprite for particles and hanging light dewdrops.
 */
export function getSoftGlowTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  if (cachedGlow) return cachedGlow;

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  grad.addColorStop(0, "rgba(255, 246, 224, 1)");
  grad.addColorStop(0.22, "rgba(235, 198, 130, 0.72)");
  grad.addColorStop(0.55, "rgba(212, 163, 89, 0.22)");
  grad.addColorStop(1, "rgba(212, 163, 89, 0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedGlow = tex;
  return cachedGlow;
}
