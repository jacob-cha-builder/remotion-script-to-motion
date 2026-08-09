#!/usr/bin/env node
// 비트별 스틸을 뽑아 콘택트시트(격자 PNG)를 만든다. P4 시각 QA 의 입력.
// 사용: node contact-sheet.mjs --script <script.json> --entry <src/index.ts> --comp <id> --out <dir> [--scale 0.5]
//
// 한 번의 remotion render 로 필요한 프레임만 이미지 시퀀스로 뽑고(--frames --sequence),
// ffmpeg 으로 타일링한다. 씬당 25% / 75% 두 지점을 본다.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
}
for (const k of ['script', 'entry', 'comp', 'out']) {
  if (!args[k]) {
    console.error(`사용법: node contact-sheet.mjs --script <script.json> --entry <src/index.ts> --comp <id> --out <dir> [--scale 0.5]`);
    process.exit(2);
  }
}
const scale = args.scale ?? '0.5';

const script = JSON.parse(readFileSync(args.script, 'utf8'));
const { fps } = script.meta;
const projectDir = resolve(dirname(args.entry), '..');
const outDir = resolve(args.out);
const framesDir = join(outDir, 'frames');

rmSync(framesDir, { recursive: true, force: true });
mkdirSync(framesDir, { recursive: true });

// ── 각 씬의 25% / 75% 지점 프레임 ───────────────────────────────────────────
const picks = [];
for (const s of script.scenes) {
  for (const at of [0.25, 0.75]) {
    const f = Math.round((s.startSec + s.durationSec * at) * fps);
    picks.push({ frame: f, scene: s.id, at });
  }
}
picks.sort((a, b) => a.frame - b.frame);

console.log(`▶ ${script.scenes.length}씬 × 2지점 = ${picks.length}프레임 추출 중...`);
console.log(`  프레임: ${picks.map((p) => p.frame).join(', ')}`);

// ── 단일 remotion render 로 이미지 시퀀스 추출 ──────────────────────────────
try {
  execFileSync(
    'npx',
    [
      'remotion', 'render', resolve(args.entry), args.comp, framesDir,
      `--frames=${picks.map((p) => p.frame).join(',')}`,
      '--sequence',
      `--scale=${scale}`,
      '--image-format=png',
      '--log=error',
    ],
    { cwd: projectDir, stdio: 'inherit' },
  );
} catch (e) {
  console.error(`\n✘ 스틸 추출 실패. remotion render 가 통과하는지 먼저 확인하세요.`);
  process.exit(1);
}

// ── 파일명을 씬 id 로 바꿔 어느 프레임인지 즉시 알아보게 한다 ────────────────
const produced = readdirSync(framesDir).filter((f) => /\.png$/i.test(f)).sort();
if (produced.length !== picks.length) {
  console.error(`⚠ 기대한 ${picks.length}장 중 ${produced.length}장만 생성됨 — 순서 매핑을 확인하세요`);
}
const labeled = [];
produced.forEach((f, i) => {
  const p = picks[i];
  if (!p) return;
  const name = `${String(i).padStart(2, '0')}_${p.scene}_${p.at * 100}pct_f${p.frame}.png`;
  renameSync(join(framesDir, f), join(framesDir, name));
  labeled.push(name);
});

// ── ffmpeg 으로 격자 합성 ───────────────────────────────────────────────────
const cols = 4;
const rows = Math.ceil(labeled.length / cols);
const sheet = join(outDir, 'contact-sheet.png');

try {
  execFileSync(
    'ffmpeg',
    [
      '-y', '-loglevel', 'error',
      '-pattern_type', 'glob', '-i', join(framesDir, '*.png'),
      '-filter_complex', `tile=${cols}x${rows}:margin=8:padding=8:color=0x111111`,
      '-frames:v', '1',
      sheet,
    ],
    { stdio: 'inherit' },
  );
  console.log(`\n✔ 콘택트시트: ${sheet}`);
} catch {
  console.error(`⚠ ffmpeg 타일링 실패 — 개별 프레임은 ${framesDir} 에 있습니다`);
}

console.log(`✔ 개별 프레임 ${labeled.length}장: ${framesDir}`);
console.log(`\n다음: 콘택트시트를 Read 로 열어 references/qa-rubric.md 기준으로 채점하세요.`);
for (const p of picks) console.log(`  · ${p.scene} @ ${p.at * 100}% (frame ${p.frame})`);
