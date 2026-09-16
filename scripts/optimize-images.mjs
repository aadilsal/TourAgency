#!/usr/bin/env node
/**
 * Compress every JPEG under public/ in place (idempotent).
 *
 *   npm run optimize:images            # compress + regenerate og-image
 *   npm run optimize:images -- --dry   # report only, write nothing
 *
 * - Fits inside 1920x1920 (public/maps/* — PDF/Word cover fallbacks — 1600 wide).
 * - mozjpeg q76, progressive (maps stay baseline for maximum PDF/DOCX compatibility).
 * - Only replaces a file when the result is at least 5% smaller, so re-running
 *   is a no-op on already-optimised images.
 * - Generates public/og-image.jpg (1200x630) from the Badshahi Mosque hero.
 */
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const DRY = process.argv.includes("--dry");
const MIN_SAVING = 0.05;
const QUALITY = 76;

const OG_SOURCE = path.join(PUBLIC_DIR, "images/marketing/hero-heritage.jpg");
const OG_TARGET = path.join(PUBLIC_DIR, "og-image.jpg");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "pdfjs" || e.name === "node_modules") continue;
      out.push(...(await walk(full)));
    } else if (/\.jpe?g$/i.test(e.name)) {
      out.push(full);
    }
  }
  return out;
}

const kb = (n) => `${(n / 1024).toFixed(0)}KB`;
const mb = (n) => `${(n / 1024 / 1024).toFixed(2)}MB`;

async function optimise(file) {
  const rel = path.relative(PUBLIC_DIR, file).replace(/\\/g, "/");
  const isMap = rel.startsWith("maps/");
  const input = await readFile(file);
  const maxSide = isMap ? 1600 : 1920;

  const output = await sharp(input, { failOn: "none" })
    .rotate() // bake in EXIF orientation before metadata is stripped
    .resize({
      width: maxSide,
      height: isMap ? undefined : maxSide,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: QUALITY, mozjpeg: true, progressive: !isMap })
    .toBuffer();

  const saving = 1 - output.length / input.length;
  const replaced = saving >= MIN_SAVING;
  if (replaced && !DRY) await writeFile(file, output);
  return {
    rel,
    before: input.length,
    after: replaced ? output.length : input.length,
    replaced,
  };
}

async function buildOgImage() {
  const buf = await sharp(OG_SOURCE)
    .rotate()
    .resize(1200, 630, { fit: "cover", position: "centre" })
    .modulate({ brightness: 1.04, saturation: 1.08 })
    .jpeg({ quality: 80, mozjpeg: true, progressive: true })
    .toBuffer();
  if (!DRY) await writeFile(OG_TARGET, buf);
  return buf.length;
}

async function main() {
  const files = await walk(PUBLIC_DIR);
  let before = 0;
  let after = 0;
  for (const f of files) {
    if (path.resolve(f) === path.resolve(OG_TARGET)) continue;
    const r = await optimise(f);
    before += r.before;
    after += r.after;
    const tag = r.replaced ? "compressed" : "skipped   ";
    console.log(`${tag} ${r.rel.padEnd(52)} ${kb(r.before).padStart(8)} -> ${kb(r.after).padStart(8)}`);
  }
  console.log(`\nJPEG total: ${mb(before)} -> ${mb(after)} (${files.length} files)${DRY ? " [dry run]" : ""}`);

  await stat(OG_SOURCE);
  const og = await buildOgImage();
  console.log(`og-image.jpg (1200x630): ${kb(og)}${DRY ? " [dry run]" : ""}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
