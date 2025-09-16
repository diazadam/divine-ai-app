#!/usr/bin/env node
// Generate simple royalty-free background beds using ffmpeg tone/noise sources.
// Outputs MP3 files under uploads/beds/<key>.mp3

import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const DURATION = process.env.BED_DURATION_SEC ? parseInt(process.env.BED_DURATION_SEC, 10) : 180; // 3 minutes
const OUTDIR = path.join(process.cwd(), 'uploads', 'beds');

async function hasFfmpeg() {
  return await new Promise((resolve) => {
    const p = spawn('ffmpeg', ['-version']);
    p.on('error', () => resolve(false));
    p.on('close', (code) => resolve(code === 0));
  });
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function runFfmpeg(args) {
  await new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', args);
    let stderr = '';
    p.stderr.on('data', d => { stderr += d.toString(); });
    p.on('close', (code) => code === 0 ? resolve() : reject(new Error(stderr)));
    p.on('error', reject);
  });
}

async function genSoftAmbient(outFile) {
  // Two gentle tones mixed + subtle noise, low-passed for softness
  const args = [
    '-y',
    '-f', 'lavfi', '-t', `${DURATION}`, '-i', 'sine=frequency=432:sample_rate=44100',
    '-f', 'lavfi', '-t', `${DURATION}`, '-i', 'sine=frequency=528:sample_rate=44100',
    '-f', 'lavfi', '-t', `${DURATION}`, '-i', 'anoisesrc=color=pink:amplitude=0.02:sample_rate=44100',
    '-filter_complex', '[0:a]volume=0.05[a0];[1:a]volume=0.04[a1];[2:a]lowpass=f=1000,volume=0.03[a2];[a0][a1][a2]amix=inputs=3:duration=shortest,dynaudnorm=g=5[final]',
    '-map', '[final]', '-c:a', 'libmp3lame', '-b:a', '160k', outFile
  ];
  await runFfmpeg(args);
}

async function genLofi(outFile) {
  // Pink noise heavily low-passed
  const args = [
    '-y',
    '-f', 'lavfi', '-t', `${DURATION}`, '-i', 'anoisesrc=color=pink:amplitude=0.05:sample_rate=44100',
    '-filter_complex', 'lowpass=f=700,volume=0.06,dynaudnorm=g=7[final]',
    '-map', '[final]', '-c:a', 'libmp3lame', '-b:a', '160k', outFile
  ];
  await runFfmpeg(args);
}

async function genPianoWarm(outFile) {
  // Warm triad (C-E-G) as soft sustained pads (approximated via sines)
  const args = [
    '-y',
    '-f', 'lavfi', '-t', `${DURATION}`, '-i', 'sine=frequency=261.63:sample_rate=44100',
    '-f', 'lavfi', '-t', `${DURATION}`, '-i', 'sine=frequency=329.63:sample_rate=44100',
    '-f', 'lavfi', '-t', `${DURATION}`, '-i', 'sine=frequency=392.00:sample_rate=44100',
    '-filter_complex', '[0:a]volume=0.05[a0];[1:a]volume=0.05[a1];[2:a]volume=0.05[a2];[a0][a1][a2]amix=inputs=3:duration=shortest,lowpass=f=2000,dynaudnorm=g=5[final]',
    '-map', '[final]', '-c:a', 'libmp3lame', '-b:a', '160k', outFile
  ];
  await runFfmpeg(args);
}

async function genCinematicLight(outFile) {
  // Slow evolving pad: mix of two low sines plus subtle noise
  const args = [
    '-y',
    '-f', 'lavfi', '-t', `${DURATION}`, '-i', 'sine=frequency=140:sample_rate=44100',
    '-f', 'lavfi', '-t', `${DURATION}`, '-i', 'sine=frequency=220:sample_rate=44100',
    '-f', 'lavfi', '-t', `${DURATION}`, '-i', 'anoisesrc=color=white:amplitude=0.02:sample_rate=44100',
    '-filter_complex', '[0:a]volume=0.04[a0];[1:a]volume=0.04[a1];[2:a]lowpass=f=1200,volume=0.02[a2];[a0][a1][a2]amix=inputs=3:duration=shortest,dynaudnorm=g=7[final]',
    '-map', '[final]', '-c:a', 'libmp3lame', '-b:a', '160k', outFile
  ];
  await runFfmpeg(args);
}

async function main() {
  if (!(await hasFfmpeg())) {
    console.error('ffmpeg not found. Please install ffmpeg and re-run.');
    process.exit(1);
  }
  await ensureDir(OUTDIR);

  const tasks = [
    { key: 'soft_ambient', gen: genSoftAmbient },
    { key: 'lofi', gen: genLofi },
    { key: 'piano_warm', gen: genPianoWarm },
    { key: 'cinematic_light', gen: genCinematicLight },
    { key: 'default_bed', gen: genSoftAmbient },
  ];

  for (const t of tasks) {
    const outfile = path.join(OUTDIR, `${t.key}.mp3`);
    try {
      console.log(`🎵 Generating ${t.key} → ${outfile}`);
      await t.gen(outfile);
      console.log(`✅ Created ${outfile}`);
    } catch (e) {
      console.warn(`⚠️ Failed to create ${t.key}:`, e?.stderr || e?.message || String(e));
    }
  }

  console.log('\nDone. Beds available under uploads/beds/. Enable in UI with Background Music toggle.');
}

main().catch((e) => { console.error(e); process.exit(1); });
