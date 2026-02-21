#!/usr/bin/env node
/**
 * Slant Hour — Portfolio Builder
 * ─────────────────────────────────────────────────────────────
 * Scans your images folders, detects portrait/landscape,
 * and regenerates sihas-abeywickrama/index.html automatically.
 *
 * Usage:
 *   node build.js
 *
 * Then push:
 *   git add . && git commit -m "Update photos" && git push
 * ─────────────────────────────────────────────────────────────
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Config ────────────────────────────────────────────────────
const PORTFOLIO_DIR = path.join(__dirname, 'sihas-abeywickrama');
const IMAGES_DIR    = path.join(PORTFOLIO_DIR, 'images');
const OUTPUT_FILE   = path.join(PORTFOLIO_DIR, 'index.html');

const SERIES = [
  { folder: '01-rain-city-london',         num: '01', label: 'Rain &amp; City — London' },
  { folder: '02-stone-light-bath',          num: '02', label: 'Stone &amp; Light — Bath' },
  { folder: '03-concrete-river-southbank',  num: '03', label: 'Concrete &amp; River — Southbank' },
];

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

// ── Helpers ───────────────────────────────────────────────────

/**
 * Get pixel dimensions of an image using sips (built into macOS — no deps needed).
 * Returns { width, height }
 */
function getImageDimensions(filePath) {
  try {
    const out = execSync(`sips -g pixelWidth -g pixelHeight "${filePath}"`, { encoding: 'utf8' });
    const w = parseInt(out.match(/pixelWidth:\s*(\d+)/)?.[1]  || '0');
    const h = parseInt(out.match(/pixelHeight:\s*(\d+)/)?.[1] || '0');
    return { width: w, height: h };
  } catch {
    return { width: 1, height: 1 };
  }
}

/**
 * Derive a human-readable caption from a filename.
 * e.g. "long-acre-rain.jpg" → "Long Acre, Rain"
 *      "01.jpg"             → "" (leave blank, user can fill in)
 */
function captionFromFilename(filename) {
  const base = path.basename(filename, path.extname(filename));
  // If it's just a number, return empty string
  if (/^\d+$/.test(base)) return '';
  return base
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Get orientation class from dimensions.
 */
function orientationClass(width, height) {
  const ratio = width / height;
  if (ratio >= 1.6)  return 'landscape';   // wide
  if (ratio <= 0.75) return 'portrait';    // tall
  return 'square';
}

/**
 * Read images from a folder, sorted alphabetically.
 */
function getImages(seriesFolder) {
  const dir = path.join(IMAGES_DIR, seriesFolder);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => IMAGE_EXTS.includes(path.extname(f).toLowerCase()))
    .sort()
    .map(filename => {
      const fullPath = path.join(dir, filename);
      const { width, height } = getImageDimensions(fullPath);
      const orientation = orientationClass(width, height);
      const caption = captionFromFilename(filename);
      const src = `images/${seriesFolder}/${filename}`;
      return { filename, src, orientation, caption, width, height };
    });
}

// ── Layout engine ─────────────────────────────────────────────
/**
 * Given an array of images, produce an array of "spreads" (rows).
 * Each spread is { layout, images[] }
 *
 * Layout rules (feel like a photo book):
 *  - First image in a series → hero full-width (if landscape/wide) OR pair
 *  - Portraits pair up nicely as 2-equal or 1-2
 *  - Landscapes go into 2-1, land-port, or 3-equal
 *  - Lone leftover → hero
 */
function buildSpreads(images) {
  const spreads = [];
  let i = 0;

  // First image: always a hero if there are more after it
  if (images.length > 0) {
    const first = images[0];
    if (first.orientation === 'landscape' || first.orientation === 'square') {
      spreads.push({ layout: 'spread-hero', images: [first] });
      i = 1;
    }
  }

  while (i < images.length) {
    const remaining = images.length - i;
    const a = images[i];

    // 3 remaining
    if (remaining >= 3) {
      const b = images[i + 1];
      const c = images[i + 2];

      const portraits = [a, b, c].filter(x => x.orientation === 'portrait').length;

      if (portraits === 3) {
        // Three portraits → 1-2 layout (big left, two stacked right)
        spreads.push({ layout: 'spread-1-2', images: [a, b, c] });
        i += 3;
      } else if (portraits === 0) {
        // Three landscapes → 3-equal
        spreads.push({ layout: 'spread-3-equal', images: [a, b, c] });
        i += 3;
      } else if (a.orientation === 'landscape' && b.orientation === 'landscape') {
        // Two landscapes + portrait → 2-1
        spreads.push({ layout: 'spread-2-1', images: [a, b, c] });
        i += 3;
      } else {
        // Mixed → land-port pair + handle c next iteration
        spreads.push({ layout: 'spread-2-equal', images: [a, b] });
        i += 2;
      }
    }
    // 2 remaining
    else if (remaining === 2) {
      const b = images[i + 1];
      if (a.orientation === 'landscape' && b.orientation === 'portrait') {
        spreads.push({ layout: 'spread-land-port', images: [a, b] });
      } else if (a.orientation === 'portrait' && b.orientation === 'landscape') {
        // Flip to land-port order
        spreads.push({ layout: 'spread-land-port', images: [b, a] });
      } else {
        spreads.push({ layout: 'spread-2-equal', images: [a, b] });
      }
      i += 2;
    }
    // 1 remaining
    else {
      spreads.push({ layout: 'spread-hero', images: [a] });
      i += 1;
    }
  }

  return spreads;
}

// ── HTML generators ───────────────────────────────────────────
function photoCard(img) {
  return `
    <div class="photo ${img.orientation}" data-src="${img.src}" data-caption="${img.caption}">
      <img src="${img.src}" alt="${img.caption}" loading="lazy">
      <div class="photo-overlay"><span class="photo-caption">${img.caption}</span></div>
    </div>`.trimStart();
}

function spreadHTML(spread) {
  const cards = spread.images.map(photoCard).join('\n    ');
  return `  <div class="spread ${spread.layout} fade-up">
    ${cards}
  </div>`;
}

function seriesHTML(series, images) {
  if (images.length === 0) return ''; // skip empty series

  const spreads = buildSpreads(images);
  const spreadBlocks = spreads.map(spreadHTML).join('\n');

  return `
<!-- ─── SERIES ${series.num}: ${series.label.replace(/&amp;/g, '&').toUpperCase()} ─── -->
<div class="series-header fade-up"${series.num === '01' ? ' id="work"' : ''}>
  <span class="series-num">${series.num}</span>
  <span class="series-label">${series.label}</span>
</div>
<div class="album">
${spreadBlocks}
</div>`;
}

// ── Banner ────────────────────────────────────────────────────
function getBannerSrc() {
  const bannerDir = path.join(IMAGES_DIR, 'banner');
  if (!fs.existsSync(bannerDir)) return null;
  const files = fs.readdirSync(bannerDir)
    .filter(f => IMAGE_EXTS.includes(path.extname(f).toLowerCase()));
  return files.length > 0 ? `images/banner/${files[0]}` : null;
}

// ── Full HTML template ────────────────────────────────────────
function buildHTML(seriesBlocks, bannerSrc) {
  const bannerImg = bannerSrc
    ? `<img src="${bannerSrc}" alt="Banner photograph">`
    : `<div style="width:100%;height:100%;background:var(--rule);"></div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sihas — Photography</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Mono:wght@300;400&display=swap" rel="stylesheet">
<style>
/* ─────────────────────────────────────────
   RESET & BASE
───────────────────────────────────────── */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
:root {
  --bg: #f7f5f2;
  --ink: #1c1a18;
  --mid: #8a8680;
  --rule: #e0ddd8;
  --accent: #bfb09a;
  --white: #ffffff;
}
html { scroll-behavior: smooth; }
body {
  background: var(--bg);
  color: var(--ink);
  font-family: 'DM Mono', monospace;
  font-weight: 300;
  -webkit-font-smoothing: antialiased;
}
header {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 48px;
  background: transparent;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid transparent;
  transition: background 0.3s ease, border-color 0.3s ease;
}
header.scrolled { background: rgba(247,245,242,0.92); border-bottom-color: var(--rule); }
header.over-banner .logo,
header.over-banner nav a { color: rgba(255,255,255,0.9); }
header.over-banner nav a:hover { color: #fff; }
header.scrolled .logo { color: var(--ink); }
header.scrolled nav a { color: var(--mid); }
header.scrolled nav a:hover { color: var(--ink); }
.logo {
  font-family: 'Cormorant Garamond', serif;
  font-size: 20px; font-style: italic; font-weight: 300;
  letter-spacing: 0.02em; color: var(--ink); text-decoration: none;
}
nav { display: flex; gap: 32px; align-items: center; }
nav a {
  font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--mid); text-decoration: none; transition: color 0.2s ease;
}
nav a:hover { color: var(--ink); }
.hero-banner {
  position: relative; width: 100%; height: 70vh;
  min-height: 400px; max-height: 700px; overflow: hidden;
}
.hero-banner img { width: 100%; height: 100%; object-fit: cover; object-position: center 40%; display: block; }
.hero-banner-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.3) 100%);
}
.hero-banner-text { position: absolute; bottom: 48px; left: 48px; right: 48px; }
.hero-banner-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(48px, 8vw, 88px); font-weight: 300;
  line-height: 0.92; letter-spacing: -0.02em; color: #fff; margin-bottom: 16px;
}
.hero-banner-title em { font-style: italic; opacity: 0.7; }
.hero-banner-desc {
  font-family: 'Cormorant Garamond', serif; font-size: 18px;
  font-style: italic; color: rgba(255,255,255,0.75); max-width: 420px; line-height: 1.7;
}
.intro { max-width: 1100px; margin: 0 auto; padding: 64px 48px 48px; }
.intro-eyebrow { font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--accent); margin-bottom: 16px; }
.intro-rule { width: 1px; height: 40px; background: var(--accent); opacity: 0.6; }
.series-header {
  max-width: 1100px; margin: 80px auto 32px; padding: 0 48px;
  display: flex; align-items: center; gap: 20px;
}
.series-header::after { content: ''; flex: 1; height: 1px; background: var(--rule); }
.series-label { font-size: 9px; letter-spacing: 0.35em; text-transform: uppercase; color: var(--mid); white-space: nowrap; }
.series-num { font-family: 'Cormorant Garamond', serif; font-size: 13px; color: var(--accent); margin-right: -8px; }
.album { max-width: 1100px; margin: 0 auto; padding: 0 48px 120px; }
.spread { display: grid; gap: 10px; margin-bottom: 10px; }
.spread-1-2 { grid-template-columns: 1.4fr 1fr 1fr; }
.spread-hero { grid-template-columns: 1fr; }
.spread-2-1 { grid-template-columns: 1fr 1fr 1.3fr; }
.spread-land-port { grid-template-columns: 1.6fr 1fr; }
.spread-3-equal { grid-template-columns: 1fr 1fr 1fr; }
.spread-2-equal { grid-template-columns: 1fr 1fr; }
.span-2 { grid-column: span 2; }
.photo { position: relative; overflow: hidden; cursor: pointer; background: var(--rule); }
.photo img {
  display: block; width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.4s ease;
}
.photo:hover img { transform: scale(1.025); filter: brightness(0.96); }
.photo.portrait { aspect-ratio: 3/4; }
.photo.landscape { aspect-ratio: 4/3; }
.photo.square { aspect-ratio: 1/1; }
.photo.hero-img { aspect-ratio: 16/7; }
.photo-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 20px 16px 16px;
  background: linear-gradient(transparent, rgba(28,26,24,0.5));
  opacity: 0; transition: opacity 0.3s ease; pointer-events: none;
}
.photo:hover .photo-overlay { opacity: 1; }
.photo-caption { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(247,245,242,0.85); }
.lightbox {
  position: fixed; inset: 0; z-index: 999;
  background: rgba(247,245,242,0.97);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none; transition: opacity 0.35s ease;
}
.lightbox.active { opacity: 1; pointer-events: all; }
.lightbox-inner {
  position: relative; width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center; padding: 80px 48px;
}
.lightbox-img {
  max-width: 100%; max-height: 100%; object-fit: contain;
  box-shadow: 0 8px 60px rgba(28,26,24,0.12);
  transform: scale(0.97);
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.lightbox.active .lightbox-img { transform: scale(1); }
.lightbox-close {
  position: absolute; top: 28px; right: 48px;
  background: none; border: none; cursor: pointer;
  font-family: 'DM Mono', monospace; font-size: 10px;
  letter-spacing: 0.2em; text-transform: uppercase; color: var(--mid); padding: 8px;
}
.lightbox-close:hover { color: var(--ink); }
.lightbox-nav {
  position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 24px;
}
.lightbox-nav button {
  background: none; border: none; cursor: pointer;
  font-family: 'DM Mono', monospace; font-size: 10px;
  letter-spacing: 0.2em; text-transform: uppercase; color: var(--mid); padding: 8px 12px;
}
.lightbox-nav button:hover { color: var(--ink); }
.lightbox-counter { font-size: 10px; letter-spacing: 0.15em; color: var(--accent); min-width: 50px; text-align: center; }
.lightbox-caption-text {
  position: absolute; bottom: 70px; left: 50%; transform: translateX(-50%);
  font-family: 'Cormorant Garamond', serif; font-style: italic;
  font-size: 15px; color: var(--mid); white-space: nowrap;
}
.about-section {
  border-top: 1px solid var(--rule); max-width: 1100px; margin: 0 auto;
  padding: 80px 48px 120px; display: grid; grid-template-columns: 1fr 1fr;
  gap: 80px; align-items: start;
}
.about-label { font-size: 9px; letter-spacing: 0.35em; text-transform: uppercase; color: var(--accent); margin-bottom: 24px; }
.about-title { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 300; font-style: italic; line-height: 1.2; color: var(--ink); margin-bottom: 20px; }
.about-body { font-family: 'Cormorant Garamond', serif; font-size: 17px; line-height: 1.8; color: var(--mid); }
.contact-links { display: flex; flex-direction: column; gap: 16px; margin-top: 32px; }
.contact-link {
  display: flex; align-items: center; gap: 16px; text-decoration: none;
  color: var(--ink); transition: gap 0.2s ease; padding: 16px 0; border-top: 1px solid var(--rule);
}
.contact-link:hover { gap: 24px; }
.contact-link-label { font-size: 9px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--mid); min-width: 80px; }
.contact-link-value { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-style: italic; }
.contact-link-arrow { margin-left: auto; font-size: 16px; color: var(--accent); transition: transform 0.2s ease; }
.contact-link:hover .contact-link-arrow { transform: translateX(4px); }
footer { border-top: 1px solid var(--rule); padding: 28px 48px; display: flex; justify-content: space-between; align-items: center; }
.footer-name { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 16px; color: var(--mid); }
.footer-copy { font-size: 9px; letter-spacing: 0.15em; color: var(--accent); }
.fade-up { opacity: 0; transform: translateY(20px); transition: opacity 0.7s ease, transform 0.7s ease; }
.fade-up.visible { opacity: 1; transform: translateY(0); }
@media (max-width: 768px) {
  header { padding: 20px 24px; }
  .hero-banner { height: 50vh; min-height: 300px; }
  .hero-banner-text { bottom: 32px; left: 24px; right: 24px; }
  .intro { padding: 48px 24px 32px; }
  .album { padding: 0 24px 80px; }
  .series-header { padding: 0 24px; margin-top: 48px; }
  .spread-1-2, .spread-2-1, .spread-land-port, .spread-3-equal { grid-template-columns: 1fr 1fr; }
  .about-section { grid-template-columns: 1fr; gap: 48px; padding: 60px 24px 80px; }
  footer { padding: 24px; flex-direction: column; gap: 12px; text-align: center; }
  nav { gap: 20px; }
  .lightbox-close { right: 24px; }
}
</style>
</head>
<body>

<header id="site-header">
  <a href="/" class="logo">Sihas</a>
  <nav>
    <a href="#work">Work</a>
    <a href="#about">About</a>
    <a href="#contact">Contact</a>
  </nav>
</header>

<div class="hero-banner">
  ${bannerImg}
  <div class="hero-banner-overlay"></div>
  <div class="hero-banner-text">
    <h1 class="hero-banner-title">Between<br><em>Stones</em></h1>
    <p class="hero-banner-desc">Photographs made while passing through — rain-slicked streets, Georgian alleys, brutalist riverbanks.</p>
  </div>
</div>

<section class="intro fade-up">
  <p class="intro-eyebrow">Documentary &middot; Street &middot; Architecture</p>
  <div class="intro-rule"></div>
</section>

${seriesBlocks.join('\n')}

<section class="about-section fade-up" id="about">
  <div>
    <p class="about-label">About</p>
    <h2 class="about-title">Documenting a city before leaving it.</h2>
    <p class="about-body">
      These photographs were made across the United Kingdom between 2024 and 2025 —
      final year wanderings through London, Bath, and the South Bank.
      Shot with a Sirui 33mm f/1.2, mostly available light, mostly without a plan.
    </p>
  </div>
  <div id="contact">
    <p class="about-label">Contact</p>
    <div class="contact-links">
      <a href="mailto:hello@sihas.co" class="contact-link">
        <span class="contact-link-label">Email</span>
        <span class="contact-link-value">hello@sihas.co</span>
        <span class="contact-link-arrow">&rarr;</span>
      </a>
      <a href="https://instagram.com" target="_blank" class="contact-link">
        <span class="contact-link-label">Instagram</span>
        <span class="contact-link-value">@sihas</span>
        <span class="contact-link-arrow">&rarr;</span>
      </a>
      <a href="#" class="contact-link">
        <span class="contact-link-label">Prints</span>
        <span class="contact-link-value">Available on request</span>
        <span class="contact-link-arrow">&rarr;</span>
      </a>
    </div>
  </div>
</section>

<footer>
  <span class="footer-name">Sihas</span>
  <span class="footer-copy">&copy; 2025 &middot; All photographs</span>
</footer>

<div class="lightbox" id="lightbox" role="dialog" aria-modal="true">
  <div class="lightbox-inner">
    <button class="lightbox-close" id="lb-close">Close &times;</button>
    <img class="lightbox-img" id="lb-img" src="" alt="">
    <span class="lightbox-caption-text" id="lb-caption"></span>
    <div class="lightbox-nav">
      <button id="lb-prev">&larr; Prev</button>
      <span class="lightbox-counter" id="lb-counter">1 / 1</span>
      <button id="lb-next">Next &rarr;</button>
    </div>
  </div>
</div>

<script>
const header = document.getElementById('site-header');
const banner = document.querySelector('.hero-banner');
function updateHeader() {
  const scrollY = window.scrollY;
  const bannerBottom = banner ? banner.offsetHeight : 0;
  header.classList.toggle('scrolled', scrollY > 20);
  if (banner && scrollY < bannerBottom - 80) {
    header.classList.add('over-banner');
  } else {
    header.classList.remove('over-banner');
  }
}
window.addEventListener('scroll', updateHeader);
updateHeader();

const fadeEls = document.querySelectorAll('.fade-up');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 80);
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });
fadeEls.forEach(el => observer.observe(el));

const photos = Array.from(document.querySelectorAll('.photo[data-src]'));
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lb-img');
const lbCaption = document.getElementById('lb-caption');
const lbCounter = document.getElementById('lb-counter');
let current = 0;

function openLightbox(index) {
  current = index;
  const p = photos[index];
  lbImg.src = p.dataset.src;
  lbImg.alt = p.dataset.caption || '';
  lbCaption.textContent = p.dataset.caption || '';
  lbCounter.textContent = \`\${index + 1} / \${photos.length}\`;
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
  setTimeout(() => { lbImg.src = ''; }, 350);
}
function navigate(dir) {
  current = (current + dir + photos.length) % photos.length;
  lbImg.style.opacity = '0';
  lbImg.style.transform = 'scale(0.97)';
  setTimeout(() => {
    const p = photos[current];
    lbImg.src = p.dataset.src;
    lbCaption.textContent = p.dataset.caption || '';
    lbCounter.textContent = \`\${current + 1} / \${photos.length}\`;
    lbImg.style.opacity = '1';
    lbImg.style.transform = 'scale(1)';
  }, 150);
}
lbImg.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
photos.forEach((p, i) => p.addEventListener('click', () => openLightbox(i)));
document.getElementById('lb-close').addEventListener('click', closeLightbox);
document.getElementById('lb-prev').addEventListener('click', () => navigate(-1));
document.getElementById('lb-next').addEventListener('click', () => navigate(1));
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox || e.target === lightbox.querySelector('.lightbox-inner')) closeLightbox();
});
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') navigate(1);
  if (e.key === 'ArrowLeft') navigate(-1);
});
</script>
</body>
</html>`;
}

// ── Main ──────────────────────────────────────────────────────
console.log('🔍 Scanning images...\n');

const seriesBlocks = SERIES.map(series => {
  const images = getImages(series.folder);
  console.log(`  ${series.num} ${series.label.replace(/&amp;/g, '&')} — ${images.length} image(s) found`);
  images.forEach(img => {
    console.log(`     ${img.filename.padEnd(30)} ${img.orientation} (${img.width}×${img.height})`);
  });
  return seriesHTML(series, images);
}).filter(Boolean);

const bannerSrc = getBannerSrc();
console.log(`\n  Banner: ${bannerSrc || 'none found'}`);

const html = buildHTML(seriesBlocks, bannerSrc);
fs.writeFileSync(OUTPUT_FILE, html, 'utf8');

console.log(`\n✅ Done — index.html rebuilt with ${seriesBlocks.length} series.\n`);
console.log('Next steps:');
console.log('  git add . && git commit -m "Update photos" && git push\n');
