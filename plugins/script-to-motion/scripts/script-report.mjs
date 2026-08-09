#!/usr/bin/env node
// 대본 리포트: 씬별 글자수/단어수/여유와 인포그래픽 추천.
// 사용: node script-report.mjs <path/to/script.json>
// 검증기(validate-script.mjs)와 달리 게이트가 아니다. 항상 exit 0.

import { readFileSync } from 'node:fs';

const target = process.argv[2];
if (!target) {
  console.error('사용법: node script-report.mjs <path/to/script.json>');
  process.exit(2);
}

let script;
try {
  script = JSON.parse(readFileSync(target, 'utf8'));
} catch (e) {
  console.error(`[FATAL] ${target}: ${e.message}`);
  process.exit(2);
}

const aspect = script.meta.aspect ?? '16:9';
const vertical = aspect === '9:16';
// 화면비별 글자 예산 — validate-script.mjs 의 CAPS 와 동일해야 한다
const CAPS = { '16:9': { chars: 32, words: 7 }, '9:16': { chars: 20, words: 5 }, '1:1': { chars: 26, words: 6 } };
const { chars: CHAR_CAP, words: WORD_CAP } = CAPS[aspect] ?? CAPS['16:9'];

/**
 * 글자수 구간 → 얹을 수 있는 그래픽 밀도.
 * 구간은 상한에 **비례**해야 한다. 상수를 빼면 좁은 화면비에서 '낮음' 구간이
 * 사라져 짧은 카피까지 미니멀로 강등된다.
 */
const density = (chars) => {
  const r = chars / CHAR_CAP;
  if (r <= 0.25) return { level: '낮음', label: '무엇이든' };
  if (r <= 0.5) return { level: '중간', label: '단일 그래픽 1개' };
  if (r <= 0.75) return { level: '높음', label: '미니멀만' };
  return { level: '포화', label: '텍스트만' };
};

/** role 별 1순위/2순위 (infographic-catalog.md 와 동일해야 한다) */
const BY_ROLE = {
  hook: ['big-number', 'gauge-bar'],
  problem: ['checklist', 'sweep-highlight'],
  solution: ['converge-bars', 'before-after'],
  how: ['ring-progress', 'step-dots'],
  proof: ['dot-grid', 'big-number'],
  cta: ['arrow-push', 'underline-accent'],
};

/** 밀도가 높으면 미니멀 계열로 강등한다 */
const MINIMAL = ['underline-accent', 'sweep-highlight', 'arrow-push', 'text-only'];
const HEAVY = ['big-number', 'gauge-bar', 'dot-grid', 'ring-progress', 'converge-bars', 'bar-race', 'checklist', 'step-dots', 'stat-stack', 'before-after'];

const rows = [];
const notes = [];
const used = new Set();

for (const s of script.scenes) {
  const chars = [...s.copy].length;
  const words = s.copy.trim().split(/\s+/).filter(Boolean).length;
  const d = density(chars);

  let cands = BY_ROLE[s.role] ?? ['text-only'];
  if (d.level === '포화') {
    cands = ['text-only'];
  } else if (d.level === '높음') {
    cands = cands.filter((c) => MINIMAL.includes(c));
    if (cands.length === 0) cands = ['underline-accent', 'sweep-highlight'];
  }

  // 이미 쓴 것은 뒤로 밀어 반복을 피한다
  const fresh = cands.filter((c) => !used.has(c));
  const pick = (fresh.length > 0 ? fresh : cands)[0];
  used.add(pick);

  rows.push({
    id: s.id,
    role: s.role,
    sec: s.durationSec,
    chars,
    words,
    d,
    pick,
    alt: cands.filter((c) => c !== pick),
    intent: s.intent ?? '',
  });

  if (chars > CHAR_CAP) notes.push(`${s.id}: ${chars}자 — ${script.meta.aspect ?? '16:9'} 상한 ${CHAR_CAP}자 초과. 줄이세요`);
  if (words > WORD_CAP) notes.push(`${s.id}: ${words}단어 — 상한 ${WORD_CAP}단어 초과. 줄이세요`);
  if (chars / s.durationSec > 8) notes.push(`${s.id}: 초당 ${(chars / s.durationSec).toFixed(1)}자 — 읽을 시간이 부족합니다. 길이를 늘리거나 카피를 줄이세요`);
  if (HEAVY.includes(pick) && d.level === '높음') notes.push(`${s.id}: 글자가 많아 무거운 그래픽을 얹기 어렵습니다`);
}

// ── 출력 ─────────────────────────────────────────────────────────────────────
const fmt = aspect;
console.log(`\n대본 리포트 — ${script.meta.title ?? target}`);
console.log(`${script.meta.totalSec}초 / ${fmt} / ${script.scenes.length}씬 / ${script.meta.fps}fps` +
  `   (씬당 상한 ${CHAR_CAP}자·${WORD_CAP}단어${vertical ? ', 세로형 기준' : ''})\n`);

const pad = (s, n) => {
  const w = [...String(s)].reduce((a, c) => a + (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(c) ? 2 : 1), 0);
  return String(s) + ' '.repeat(Math.max(0, n - w));
};

console.log(`${pad('씬', 12)}${pad('role', 10)}${pad('초', 6)}${pad('글자', 7)}${pad('단어', 6)}${pad('밀도', 8)}${pad('추천 인포그래픽', 22)}대안`);
console.log('─'.repeat(104));
for (const r of rows) {
  console.log(
    pad(r.id, 12) + pad(r.role, 10) + pad(r.sec, 6) +
    pad(`${r.chars}/${CHAR_CAP}`, 7) + pad(`${r.words}/${WORD_CAP}`, 6) +
    pad(r.d.level, 8) + pad(r.pick, 22) + (r.alt.join(', ') || '—'),
  );
}

const totalChars = rows.reduce((a, r) => a + r.chars, 0);
console.log('─'.repeat(104));
console.log(`${pad('합계', 12)}${pad('', 10)}${pad(script.meta.totalSec, 6)}${pad(totalChars, 7)}` +
  `${pad(rows.reduce((a, r) => a + r.words, 0), 6)}${pad('', 8)}초당 ${(totalChars / script.meta.totalSec).toFixed(1)}자`);

if (new Set(rows.map((r) => r.pick)).size < rows.length) {
  notes.push('추천 인포그래픽이 중복됩니다 — 같은 형태를 두 번 쓰지 마세요. 대안 열에서 바꾸세요');
}

if (notes.length > 0) {
  console.log(`\n⚠ 확인 필요 ${notes.length}건`);
  for (const n of notes) console.log(`  · ${n}`);
} else {
  console.log(`\n✔ 글자 예산·밀도 문제 없음`);
}

console.log(`\n확정한 인포그래픽 이름을 각 씬의 intent 에 적어두세요 (예: "big-number — 10을 압도적으로").`);
console.log(`카탈로그: references/infographic-catalog.md\n`);
