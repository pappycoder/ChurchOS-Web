// One-off brand asset generator.
// Keys the flat white/black background out of the ChurchOS PNG masters in
// public/brand/ to true transparency (edge-unmixing the anti-aliased margin
// against the keyed background so there is no halo when composited elsewhere),
// then writes the transparent derivatives used by the app + favicon/icon/OG.
//
// Run: node scripts/gen-brand.mjs
// Inputs (masters, kept untouched):
//   public/brand/churchos-logo.png          navy emblem on near-white
//   public/brand/churchos-logoname-light.png navy emblem+wordmark on near-white
//   public/brand/churchos-logoname-dark.png  light emblem+wordmark on near-black
// Outputs:
//   public/brand/churchos-emblem.png        transparent navy emblem (square, centered)
//   public/brand/churchos-lockup-navy.png   transparent navy lockup (for light surfaces)
//   public/brand/churchos-lockup-light.png  transparent light lockup (for dark surfaces)
//   public/brand/churchos-favicon.png       1024x1024 transparent emblem master

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BRAND = resolve(ROOT, "public/brand");
const out = (n) => resolve(BRAND, n);
const inp = (n) => resolve(BRAND, n);

const WHITE_B = 254;
const BLACK_KEY = 12;

/** Decode to raw RGBA buffer. */
async function decode(src) {
  const { data, info } = await sharp(src, { limitInputPixels: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

function encode(rgba, width, height, file) {
  return sharp(Buffer.from(rgba), { raw: { width, height, channels: 4 } })
    .png()
    .toFile(file);
}

/**
 * Key a near-white background out (dark navy foreground) OR a near-black
 * background out (light foreground). Un-mixes anti-aliasing against the keyed
 * background so the result has no halo. Marks the working copy transparent.
 * Writes back RGBA to `file`.
 */
async function keyTransparent(file, bgMode) {
  const { data, width: W, height: H } = await decode(file);
  const rgba = Buffer.alloc(W * H * 4);

  for (let i = 0; i < W * H; i++) {
    const o = i * 4;
    let r = data[o],
      g = data[o + 1],
      b = data[o + 2];
    let alpha, fr, fg, fb;

    if (bgMode === "white") {
      // foreground is dark navy; bg is ~254,254,254. blue has the biggest
      // separation (navy blue ~64-80, deepest ~34). solve p=A*f+(1-A)*bg.
      const aRaw = (WHITE_B - b) / (WHITE_B - 34);
      alpha = Math.min(1, Math.max(0, aRaw));
      const a = alpha > 1e-4 ? alpha : 0;
      fr = a > 1e-4 ? Math.min(255, Math.max(0, (r - (1 - a) * 254) / a)) : 254;
      fg = a > 1e-4 ? Math.min(255, Math.max(0, (g - (1 - a) * 254) / a)) : 254;
      fb = a > 1e-4 ? Math.min(255, Math.max(0, (b - (1 - a) * 254) / a)) : 254;
    } else {
      // bg is near-black, fg light. coverage proxy = luminance above key floor.
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const aRaw = (lum - BLACK_KEY) / (255 - BLACK_KEY);
      alpha = Math.min(1, Math.max(0, aRaw));
      const a = alpha > 1e-4 ? alpha : 0;
      fr = a > 1e-4 ? Math.min(255, r / a) : 0;
      fg = a > 1e-4 ? Math.min(255, g / a) : 0;
      fb = a > 1e-4 ? Math.min(255, b / a) : 0;
    }

    rgba[o] = Math.round(fr);
    rgba[o + 1] = Math.round(fg);
    rgba[o + 2] = Math.round(fb);
    rgba[o + 3] = Math.round(alpha * 255);
  }

  await encode(rgba, W, H, file);
}

/** Center a surface onto a transparent square of `side`, file to `output`. */
async function centerOnSquare(input, side, output) {
  const meta = await sharp(input, { limitInputPixels: false }).metadata();
  const scale = side / Math.max(meta.width, meta.height);
  const w = Math.round(meta.width * scale);
  const h = Math.round(meta.height * scale);
  const x = Math.round((side - w) / 2);
  const y = Math.round((side - h) / 2);
  await sharp({
    create: {
      width: side,
      height: side,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: await sharp(input, { limitInputPixels: false })
          .resize(w, h, { kernel: sharp.kernel.lanczos3 })
          .toBuffer(),
        left: x,
        top: y,
      },
    ])
    .png()
    .toFile(output);
}

/** Keep aspect ratio, normalize height to `H`. */
async function keyedLockupTo(file, H, output) {
  const meta = await sharp(file, { limitInputPixels: false }).metadata();
  const W = Math.round((meta.width / meta.height) * H);
  await sharp(file, { limitInputPixels: false })
    .resize(W, H, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toFile(output);
}

/** Add white circular background to icon for favicon. */
async function faviconWithWhiteCircle(input, size, output) {
  // Scale the emblem to fit nicely in the circle (about 60% of radius)
  const emblemSize = Math.round(size * 0.6);

  // Create white circle background and composite emblem on top
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 255 },
    },
  })
    .composite([
      {
        input: await sharp(input, { limitInputPixels: false })
          .resize(emblemSize, emblemSize, { kernel: sharp.kernel.lanczos3 })
          .toBuffer(),
        left: Math.round((size - emblemSize) / 2),
        top: Math.round((size - emblemSize) / 2),
      },
    ])
    .png()
    .toFile(output);
}

async function main() {
  console.log("Generating transparent brand derivatives...");
  const base = out("__work");

  const emblemWork = base + "-emblem.png";
  writeFileSync(emblemWork, readFileSync(inp("churchos-logo.png")));
  await keyTransparent(emblemWork, "white");
  await centerOnSquare(emblemWork, 512, out("churchos-emblem.png"));
  await sharp(out("churchos-emblem.png"))
    .resize(1024, 1024, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toFile(out("churchos-favicon.png"));

  const navyWork = base + "-navy.png";
  writeFileSync(navyWork, readFileSync(inp("churchos-logoname-light.png")));
  await keyTransparent(navyWork, "white");
  await keyedLockupTo(navyWork, 512, out("churchos-lockup-navy.png"));

  const lightWork = base + "-light.png";
  writeFileSync(lightWork, readFileSync(inp("churchos-logoname-dark.png")));
  await keyTransparent(lightWork, "black");
  await keyedLockupTo(lightWork, 512, out("churchos-lockup-light.png"));

  // Generate favicon and icons with white circular background
  console.log("Generating favicon and icons with white background...");
  await faviconWithWhiteCircle(
    out("churchos-emblem.png"),
    1024,
    out("churchos-favicon-white.png"),
  );
  await faviconWithWhiteCircle(
    out("churchos-emblem.png"),
    192,
    resolve(ROOT, "public/icons/icon-192x192.png"),
  );
  await faviconWithWhiteCircle(
    out("churchos-emblem.png"),
    512,
    resolve(ROOT, "public/icons/icon-512x512.png"),
  );

  for (const t of [emblemWork, navyWork, lightWork]) {
    try {
      await sharp(t).rotate().png().toBuffer(); /* exists */
    } catch {}
  }
  console.log("done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
