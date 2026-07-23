// Build-time helper: compress/resize oversized map JPGs in public/maps.
// Resizes to max width 1600px (no upscaling) and re-encodes JPEG at quality 72,
// overwriting the originals in place (filenames kept identical — they are
// referenced by name in the provinces/scrolly config).
//
// Usage: npm install --no-save sharp && node scripts/compress-maps.mjs

import { readdir, stat, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR = path.resolve(__dirname, "..", "public", "maps");
const MAX_WIDTH = 1600;
const QUALITY = 72;

function fmt(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function main() {
  const entries = await readdir(MAPS_DIR);
  const jpgs = entries.filter((f) => /\.jpe?g$/i.test(f));

  if (jpgs.length === 0) {
    console.log(`No JPG files found in ${MAPS_DIR}`);
    return;
  }

  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of jpgs) {
    const src = path.join(MAPS_DIR, file);
    const tmp = path.join(MAPS_DIR, `.${file}.tmp`);

    const before = (await stat(src)).size;
    totalBefore += before;

    await sharp(src)
      .rotate() // respect EXIF orientation before stripping metadata
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: QUALITY, mozjpeg: true })
      .toFile(tmp);

    // Atomically replace original with the compressed version.
    await unlink(src);
    await rename(tmp, src);

    const after = (await stat(src)).size;
    totalAfter += after;

    const pct = ((1 - after / before) * 100).toFixed(1);
    console.log(`${file.padEnd(20)} ${fmt(before).padStart(9)} -> ${fmt(after).padStart(9)}  (-${pct}%)`);
  }

  const totalPct = ((1 - totalAfter / totalBefore) * 100).toFixed(1);
  console.log("-".repeat(56));
  console.log(`${"TOTAL".padEnd(20)} ${fmt(totalBefore).padStart(9)} -> ${fmt(totalAfter).padStart(9)}  (-${totalPct}%)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
