#!/usr/bin/env node
/**
 * scan.js — Slant Hour photo scanner
 * Scans sihas-abeywickrama/images/ and writes photos.json
 * Run: node scan.js
 */

const fs   = require('fs');
const path = require('path');

const IMAGES_DIR  = path.join(__dirname, 'sihas-abeywickrama', 'images');
const BANNER_DIR  = path.join(IMAGES_DIR, 'banner');
const OUTPUT_FILE = path.join(__dirname, 'sihas-abeywickrama', 'photos.json');
const EXTS        = ['.jpg', '.jpeg', '.png', '.webp'];

function scanDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => EXTS.includes(path.extname(f).toLowerCase()))
    .sort();
}

// Banner
const bannerFiles = scanDir(BANNER_DIR);
const banner = bannerFiles.length > 0 ? `images/banner/${bannerFiles[0]}` : null;

// All photos — everything directly inside images/ (not subfolders)
const allFiles = fs.existsSync(IMAGES_DIR)
  ? fs.readdirSync(IMAGES_DIR)
      .filter(f => EXTS.includes(path.extname(f).toLowerCase()))
      .sort()
      .map(f => `images/${f}`)
  : [];

const output = { banner, photos: allFiles };

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

console.log(`\n✅ photos.json written`);
if (banner) console.log(`   Banner : ${banner}`);
console.log(`   Photos : ${allFiles.length} found`);
allFiles.forEach(f => console.log(`     ${f}`));
console.log('\nNow run:');
console.log('  git add . && git commit -m "Add photos" && git push\n');
