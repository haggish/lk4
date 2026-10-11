// Conforms the images in public/images to what NgOptimizedImage expects, so the
// NG02952 (aspect ratio) and NG02960 (oversized source) warnings cannot creep
// back in when an asset is replaced.
//
//   npm run images         fix anything that does not conform
//   npm run images:check   report only, non-zero exit if something does not
//
// Each target below records how the template actually renders the image. The
// rules mirror the directive's own checks in @angular/common:
//
//   - a source whose aspect ratio differs from the rendered ratio by more than
//     ASPECT_RATIO_TOLERANCE is reported as distorted, with no exemption for
//     object-fit: cover, so a cropped image has to be pre-cropped on disk
//   - a source wider than DENSITY_CAP x the rendered width is reported as
//     oversized
//
// Keep `rendered` in step with the CSS, and the width/height attributes in the
// templates in step with the files this script produces.

import { readFile, rename, writeFile } from 'node:fs/promises';
import { argv, exit } from 'node:process';
import sharp from 'sharp';

// Mirrors ASPECT_RATIO_TOLERANCE and RECOMMENDED_SRCSET_DENSITY_CAP in
// @angular/common's NgOptimizedImage.
const ASPECT_RATIO_TOLERANCE = 0.1;
const DENSITY_CAP = 2;

const TARGETS = [
  {
    file: 'public/images/eka.jpg',
    // .bio-img pins the box to 200x267 and crops with object-fit: cover, so the
    // source has to carry that 3:4 ratio itself.
    rendered: { width: 200, height: 267 },
    mode: 'crop',
  },
  {
    file: 'public/images/bear.png',
    // .news-photo is max-width: 100% with height: auto, so the ratio is whatever
    // the file has and only the oversized-source cap applies.
    rendered: { width: 873 },
    mode: 'scale',
  },
];

const ratio = ({ width, height }) => width / height;

/** Largest centred crop of `width`x`height` matching `target` aspect ratio. */
function centreCrop(width, height, target) {
  if (width / height > target) {
    const cropped = Math.round(height * target);
    return { left: Math.round((width - cropped) / 2), top: 0, width: cropped, height };
  }
  const cropped = Math.round(width / target);
  return { left: 0, top: Math.round((height - cropped) / 2), width, height: cropped };
}

/** What the file should look like, given how the template renders it. */
function plan({ rendered, mode }, current) {
  const cap = DENSITY_CAP * rendered.width;
  const box = mode === 'crop' ? centreCrop(current.width, current.height, ratio(rendered)) : null;
  const width = box ? box.width : current.width;
  return { box, cap, width: Math.min(width, cap) };
}

function describe(target, current) {
  const { box, cap, width } = plan(target, current);
  const problems = [];

  if (target.mode === 'crop') {
    const drift = Math.abs(current.width / current.height - ratio(target.rendered));
    if (drift > ASPECT_RATIO_TOLERANCE) {
      problems.push(
        `ratio ${(current.width / current.height).toFixed(4)} differs from rendered ` +
          `${ratio(target.rendered).toFixed(4)} by ${drift.toFixed(4)} (NG02952)`,
      );
    }
  }
  if (current.width > cap) {
    problems.push(`width ${current.width} exceeds the ${cap}px cap (NG02960)`);
  }

  return { box, width, problems };
}

async function conform(target, current, { box, width }) {
  let pipeline = sharp(await readFile(target.file));
  if (box && (box.width !== current.width || box.height !== current.height)) {
    pipeline = pipeline.extract(box);
  }
  if (width !== (box ? box.width : current.width)) {
    pipeline = pipeline.resize({ width, fit: 'inside', kernel: 'lanczos3' });
  }
  pipeline = target.file.endsWith('.png')
    ? pipeline.png({ compressionLevel: 9, effort: 10 })
    : pipeline.jpeg({ quality: 92, mozjpeg: true });

  // sharp cannot write over a file it is reading, so stage then swap.
  const staged = `${target.file}.tmp`;
  await writeFile(staged, await pipeline.toBuffer());
  await rename(staged, target.file);
}

const checkOnly = argv.includes('--check');
let failed = false;

for (const target of TARGETS) {
  const current = await sharp(target.file).metadata();
  const { box, width, problems } = describe(target, current);
  const size = `${current.width}x${current.height}`;

  if (problems.length === 0) {
    console.log(`ok       ${target.file} ${size}`);
    continue;
  }
  for (const problem of problems) {
    console.log(`${checkOnly ? 'FAIL    ' : 'fixing  '} ${target.file} ${size}: ${problem}`);
  }
  if (checkOnly) {
    failed = true;
    continue;
  }

  await conform(target, current, { box, width });
  const updated = await sharp(target.file).metadata();
  console.log(`         -> ${updated.width}x${updated.height}`);
}

if (failed) {
  console.log('\nRun `npm run images` to conform them.');
  exit(1);
}
