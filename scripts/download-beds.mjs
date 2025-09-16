#!/usr/bin/env node
// Download royalty-free (preferably CC0) background beds into uploads/beds.
// Usage examples:
//   npm run download:beds -- --url https://example.com/bed.mp3 --key soft_ambient
//   npm run download:beds -- --list beds.json
// beds.json format: [{ "key": "lofi", "url": "https://.../file.mp3" }, ...]

import { promises as fs } from 'node:fs';
import path from 'node:path';

const OUTDIR = path.join(process.cwd(), 'uploads', 'beds');

function parseArgs() {
  const out = { url: null, key: null, list: null };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url') out.url = argv[++i];
    else if (a === '--key') out.key = argv[++i];
    else if (a === '--list') out.list = argv[++i];
  }
  return out;
}

async function ensureDir(dir) { await fs.mkdir(dir, { recursive: true }); }

async function downloadToFile(url, filePath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const ab = await res.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(ab));
}

async function main() {
  const { url, key, list } = parseArgs();
  await ensureDir(OUTDIR);

  const jobs = [];

  if (list) {
    // Load JSON list from inline JSON or a file path
    let content = list;
    try {
      const asFile = await fs.readFile(list, 'utf8');
      content = asFile;
    } catch {}
    let arr = [];
    try { arr = JSON.parse(content); } catch (e) {
      console.error('Failed to parse --list JSON. Provide a file path or JSON string array.');
      process.exit(1);
    }
    for (const item of arr) {
      if (!item?.url || !item?.key) continue;
      jobs.push({ url: String(item.url), key: String(item.key) });
    }
  } else if (url && key) {
    jobs.push({ url, key });
  } else {
    console.log(`Usage:
  npm run download:beds -- --url <mp3_url> --key <bedKey>
  npm run download:beds -- --list beds.json

beds.json example:
[
  { "key": "soft_ambient", "url": "https://example.com/soft_ambient_cc0.mp3" },
  { "key": "lofi", "url": "https://example.com/lofi_cc0.mp3" }
]

Notes:
- Only download beds you have the rights to use (CC0/public domain or properly licensed for redistribution).
- Files will be saved to uploads/beds/<key>.mp3
`);
    process.exit(0);
  }

  for (const j of jobs) {
    const safeKey = j.key.replace(/[^a-zA-Z0-9_\-]/g, '').trim();
    if (!safeKey) { console.warn(`Skipping invalid key: ${j.key}`); continue; }
    const out = path.join(OUTDIR, `${safeKey}.mp3`);
    try {
      console.log(`🎵 Downloading ${safeKey} from ${j.url}`);
      await downloadToFile(j.url, out);
      console.log(`✅ Saved ${out}`);
    } catch (e) {
      console.warn(`⚠️ Failed to download ${safeKey}:`, e?.message || String(e));
    }
  }

  console.log('\nDone. Beds available under uploads/beds/.');
}

main().catch((e) => { console.error(e); process.exit(1); });

