import { execFileSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rename,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const allowedHosts = new Set(['kenney.nl', 'kenney.itch.io']);
const supportedExtensions = {
  images: new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']),
  'images/tilesets': new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']),
  ui: new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']),
  audio: new Set(['.ogg', '.mp3', '.wav', '.m4a']),
  fonts: new Set(['.ttf', '.otf', '.woff', '.woff2']),
  models: new Set(['.glb', '.gltf', '.obj', '.mtl']),
};

function parseOptions(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === '--apply') {
      options.apply = true;
    } else if (value.startsWith('--')) {
      const key = value.slice(2);
      options[key] = args[index + 1];
      index += 1;
    }
  }
  return options;
}

function safeSlug(slug) {
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('slug must contain lowercase letters, numbers, and single hyphens only');
  }
  return slug;
}

function approvedUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !allowedHosts.has(url.hostname)) {
    throw new Error('download URL must use HTTPS on kenney.nl or kenney.itch.io');
  }
  return url;
}

function validateZipEntries(zipPath) {
  execFileSync('unzip', ['-tq', zipPath], { stdio: 'pipe' });
  const listing = execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' });
  const entries = listing.split(/\r?\n/).filter(Boolean);
  if (entries.length === 0) throw new Error('archive has no entries');

  for (const entry of entries) {
    if (entry.includes('\0') || entry.includes('\\') || path.posix.isAbsolute(entry)) {
      throw new Error(`unsafe ZIP path: ${entry}`);
    }
    const segments = entry.split('/');
    if (segments.some((segment) => segment === '..' || segment === '.')) {
      throw new Error(`unsafe ZIP path: ${entry}`);
    }
  }
  return entries;
}

async function fetchOfficialZip(initialUrl) {
  let url = approvedUrl(initialUrl);
  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    const response = await fetch(url, { redirect: 'manual' });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) throw new Error(`redirect ${response.status} omitted a location`);
      url = approvedUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok) throw new Error(`download failed with HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
      throw new Error('official response was not a ZIP archive');
    }
    return { bytes, finalUrl: url.toString() };
  }
  throw new Error('too many redirects');
}

async function walkFiles(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walkFiles(fullPath));
    else if (entry.isFile()) result.push(fullPath);
  }
  return result;
}

function imageDimensions(filePath, bytes) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.png' && bytes.length >= 24) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (extension === '.gif' && bytes.length >= 10) {
    return { width: bytes.readUInt16LE(6), height: bytes.readUInt16LE(8) };
  }
  if (extension === '.svg') {
    const svg = bytes.toString('utf8', 0, Math.min(bytes.length, 16_384));
    const viewBox = svg.match(/\bviewBox=["']\s*[-\d.]+[ ,]+[-\d.]+[ ,]+([\d.]+)[ ,]+([\d.]+)/i);
    const width = svg.match(/\bwidth=["']([\d.]+)/i);
    const height = svg.match(/\bheight=["']([\d.]+)/i);
    if (viewBox) return { width: Number(viewBox[1]), height: Number(viewBox[2]) };
    if (width && height) return { width: Number(width[1]), height: Number(height[1]) };
  }
  if (extension === '.jpg' || extension === '.jpeg') {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) break;
      const marker = bytes[offset + 1];
      const segmentLength = bytes.readUInt16BE(offset + 2);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5) };
      }
      if (segmentLength < 2) break;
      offset += 2 + segmentLength;
    }
  }
  return null;
}

function packPaths(slug) {
  const root = path.join(projectRoot, 'asset-source', 'kenney', slug);
  return {
    root,
    zip: path.join(root, `${slug}.zip`),
    source: path.join(root, 'source'),
    record: path.join(root, 'download.json'),
    manifest: path.join(root, 'manifest.json'),
    contactSheet: path.join(root, 'contact-sheet.html'),
  };
}

async function downloadPack(options) {
  const slug = safeSlug(options.slug);
  const category = options.category ?? 'images';
  if (!supportedExtensions[category]) throw new Error(`unsupported category: ${category}`);
  const url = approvedUrl(options.url);
  const paths = packPaths(slug);
  const outputDirectory = path.join(projectRoot, 'public', 'assets', category, 'kenney', slug);

  console.log(`Source: ${url.toString()}`);
  console.log(`Archive: ${path.relative(projectRoot, paths.zip)}`);
  console.log(`Extract to: ${path.relative(projectRoot, paths.source)}`);
  console.log(`Runtime assets: ${path.relative(projectRoot, outputDirectory)}`);
  if (!options.apply) {
    console.log('Preview only. Add --apply to download and extract this official Kenney pack.');
    return;
  }

  await mkdir(paths.root, { recursive: true });
  try {
    await stat(paths.zip);
    throw new Error(`archive already exists; inspect it instead of overwriting: ${paths.zip}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  try {
    await stat(paths.source);
    throw new Error(`source directory already exists; refusing to overwrite: ${paths.source}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  try {
    await stat(outputDirectory);
    throw new Error(`runtime directory already exists; refusing to overwrite: ${outputDirectory}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const { bytes, finalUrl } = await fetchOfficialZip(url.toString());
  const temporaryZip = `${paths.zip}.partial`;
  await writeFile(temporaryZip, bytes, { flag: 'wx' });
  validateZipEntries(temporaryZip);
  await rename(temporaryZip, paths.zip);
  execFileSync('unzip', ['-q', paths.zip, '-d', paths.source], { stdio: 'pipe' });

  const runtimeFiles = [];
  for (const filePath of await walkFiles(paths.source)) {
    const extension = path.extname(filePath).toLowerCase();
    if (!supportedExtensions[category].has(extension)) continue;
    const relative = path.relative(paths.source, filePath);
    const destination = path.join(outputDirectory, relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(filePath, destination);
    runtimeFiles.push(path.relative(projectRoot, destination));
  }

  await writeFile(paths.record, `${JSON.stringify({
    slug,
    category,
    sourceUrl: url.toString(),
    finalUrl,
    downloadedAt: new Date().toISOString(),
    archive: path.relative(projectRoot, paths.zip),
    extractedTo: path.relative(projectRoot, paths.source),
    runtimeFiles,
  }, null, 2)}\n`);
  console.log(`Downloaded and checked ZIP; copied ${runtimeFiles.length} supported runtime files.`);
  console.log('Next: run assets:kenney:inspect, review the contact sheet, then keep only assets used by the game.');
}

async function inspectPack(options) {
  const slug = safeSlug(options.slug);
  const paths = packPaths(slug);
  const sourceDirectory = options['assets-dir']
    ? path.resolve(projectRoot, options['assets-dir'])
    : paths.source;
  const files = await walkFiles(sourceDirectory);
  const inventory = [];
  for (const filePath of files) {
    const bytes = await readFile(filePath);
    const details = {
      path: path.relative(sourceDirectory, filePath),
      bytes: bytes.length,
    };
    const dimensions = imageDimensions(filePath, bytes);
    if (dimensions) Object.assign(details, dimensions);
    inventory.push(details);
  }
  const manifest = {
    slug,
    inspectedAt: new Date().toISOString(),
    sourceDirectory: path.relative(projectRoot, sourceDirectory),
    files: inventory,
    licenseFiles: inventory.map((file) => file.path).filter((file) => /(^|\/)(license|licence|readme|credits?)(\.|$)/i.test(file)),
  };
  await mkdir(paths.root, { recursive: true });
  await writeFile(paths.manifest, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${path.relative(projectRoot, paths.manifest)} (${inventory.length} files).`);
  console.log(`License/readme candidates: ${manifest.licenseFiles.join(', ') || 'none found by filename; check the official page and archive manually'}`);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

async function createContactSheet(options) {
  const slug = safeSlug(options.slug);
  const paths = packPaths(slug);
  const sourceDirectory = options['assets-dir']
    ? path.resolve(projectRoot, options['assets-dir'])
    : path.join(projectRoot, 'public', 'assets', 'images', 'kenney', slug);
  const images = (await walkFiles(sourceDirectory))
    .filter((filePath) => supportedExtensions.images.has(path.extname(filePath).toLowerCase()));
  const cards = await Promise.all(images.map(async (filePath) => {
    const relative = path.relative(sourceDirectory, filePath);
    const dimensions = imageDimensions(filePath, await readFile(filePath));
    const dimensionText = dimensions ? `${dimensions.width} × ${dimensions.height}` : '尺寸未解析';
    return `<article><img loading="lazy" src="${pathToFileURL(filePath).href}" alt="${escapeHtml(relative)}"><p>${escapeHtml(relative)}<br>${dimensionText}</p></article>`;
  }));
  await mkdir(paths.root, { recursive: true });
  const html = `<!doctype html>
<html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(slug)} 素材聯絡表</title>
<style>body{font:14px system-ui,sans-serif;margin:24px;background:#f3f6fb;color:#1b2b42}h1{font-size:22px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:16px}article{background:#fff;border:1px solid #d7dfeb;border-radius:12px;padding:12px}img{display:block;width:100%;height:140px;object-fit:contain}p{overflow-wrap:anywhere;line-height:1.4}</style>
<h1>${escapeHtml(slug)}（${images.length} 張圖片）</h1><main class="grid">${cards.join('\n')}</main></html>`;
  await writeFile(paths.contactSheet, html);
  console.log(`Wrote ${path.relative(projectRoot, paths.contactSheet)} (${images.length} images).`);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const options = parseOptions(args);
  if (command === 'download') return downloadPack(options);
  if (command === 'inspect') return inspectPack(options);
  if (command === 'contact-sheet') return createContactSheet(options);
  throw new Error('usage: kenney-assets.mjs <download|inspect|contact-sheet> [options]');
}

main().catch((error) => {
  console.error(`Kenney asset tool: ${error.message}`);
  process.exitCode = 1;
});
