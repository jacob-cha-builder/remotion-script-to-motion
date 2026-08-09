#!/usr/bin/env node
// script.json 검증기. 의존성 0 (Node 내장 모듈만).
// 사용: node validate-script.mjs <path/to/script.json>
// 종료코드: 0 = 통과, 1 = 위반, 2 = 파일/파싱 오류

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { estimateSec, suggestDuration, fmtDuration, PAD } from './narration.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = resolve(HERE, '../assets/motion-catalog.json');
const REGISTRY_PATH = resolve(HERE, '../assets/hf-registry.json');

const ROLES = ['hook', 'problem', 'solution', 'how', 'proof', 'cta'];
const ASPECTS = ['16:9', '9:16', '1:1'];
// 세로형은 화면이 좁아 같은 글자가 훨씬 크게 잡힌다 — 예산을 낮춘다 (references/interview.md)
const CAPS = {
  '16:9': { words: 7, chars: 32 },
  '9:16': { words: 5, chars: 20 },
  '1:1': { words: 6, chars: 26 },
};
const MIN_DURATION = 1.2;
const EPS = 1e-6;

const RULE_NAMES = {
  1: '필수 필드 / 타입',
  2: '타임라인 연속성',
  3: '길이 합계 일치',
  4: '프레임 정수 정렬',
  5: 'emphasis 는 copy 의 부분 문자열',
  6: '모션 이름이 카탈로그에 존재',
  7: 'copy 분량 상한',
  8: '최소 노출 시간',
  9: 'id 유일성 / kebab-case',
  10: 'hook 구조',
  11: '나레이션 존재',
  12: '나레이션이 씬 길이에 들어감',
  13: '침묵 과다',
  14: 'blocks 가 HyperFrames 레지스트리에 존재',
};

const errors = [];
const fail = (rule, where, msg) => errors.push({ rule, where, msg });

// ── 입력 로드 ────────────────────────────────────────────────────────────────
const target = process.argv[2];
if (!target) {
  console.error('사용법: node validate-script.mjs <path/to/script.json>');
  process.exit(2);
}

let script;
try {
  script = JSON.parse(readFileSync(target, 'utf8'));
} catch (e) {
  console.error(`[FATAL] ${target} 를 읽거나 파싱할 수 없습니다: ${e.message}`);
  process.exit(2);
}

let motionNames = new Set();
let exitNames = new Set();
try {
  const cat = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  for (const group of ['enter', 'emphasis', 'ambient']) {
    for (const k of Object.keys(cat[group] ?? {})) motionNames.add(k);
  }
  exitNames = new Set(Object.keys(cat.exit ?? {}));
} catch (e) {
  console.error(`[FATAL] 모션 카탈로그를 읽을 수 없습니다 (${CATALOG_PATH}): ${e.message}`);
  process.exit(2);
}

// HyperFrames 레지스트리 — blocks 화이트리스트 (규칙 14)
let blockNames = new Set();
try {
  const reg = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
  for (const group of Object.values(reg.byType ?? {})) {
    for (const k of Object.keys(group)) blockNames.add(k);
  }
} catch (e) {
  console.error(`[FATAL] HyperFrames 레지스트리를 읽을 수 없습니다 (${REGISTRY_PATH}): ${e.message}`);
  process.exit(2);
}

// 나레이션 사용 여부 — 기본 true, meta.narration === false 로 끈다
const narrated = script?.meta?.narration !== false;

// ── 규칙 1: 필수 필드 + 타입 ─────────────────────────────────────────────────
const meta = script.meta;
if (!meta || typeof meta !== 'object') {
  fail(1, 'meta', 'meta 객체가 없습니다');
} else {
  for (const [k, t] of [['fps', 'number'], ['width', 'number'], ['height', 'number'], ['totalSec', 'number']]) {
    if (typeof meta[k] !== t) fail(1, `meta.${k}`, `${t} 이어야 합니다 (현재: ${JSON.stringify(meta[k])})`);
  }
  if (meta.aspect !== undefined && !ASPECTS.includes(meta.aspect)) {
    fail(1, 'meta.aspect', `${ASPECTS.join(' | ')} 중 하나여야 합니다 (현재: ${JSON.stringify(meta.aspect)})`);
  }
}

const scenes = script.scenes;
if (!Array.isArray(scenes) || scenes.length === 0) {
  fail(1, 'scenes', '비어있지 않은 배열이어야 합니다');
}

// 치명적 구조 오류면 여기서 중단 (이후 규칙이 의미 없음)
if (errors.length > 0) {
  report();
}

scenes.forEach((s, i) => {
  const at = `scenes[${i}]${s?.id ? ` (id: ${s.id})` : ''}`;
  if (typeof s?.id !== 'string') fail(1, at, 'id 는 문자열이어야 합니다');
  if (typeof s?.startSec !== 'number') fail(1, at, 'startSec 는 숫자여야 합니다');
  if (typeof s?.durationSec !== 'number') fail(1, at, 'durationSec 는 숫자여야 합니다');
  // 나레이션이 있으면 화면 카피는 선택 — 말이 메시지를 나르고 화면은 보조한다
  if (s?.copy !== undefined && typeof s.copy !== 'string') {
    fail(1, at, 'copy 는 문자열이어야 합니다');
  } else if (s?.copy === undefined && !narrated) {
    fail(1, at, '나레이션을 끈 대본(meta.narration=false)에서는 copy 가 필수입니다');
  }
  if (!ROLES.includes(s?.role)) fail(1, at, `role 은 ${ROLES.join(' | ')} 중 하나여야 합니다 (현재: ${JSON.stringify(s?.role)})`);
});

if (errors.length > 0) report();

// ── 규칙 2: 타임라인 연속성 (구멍/겹침 없음) ──────────────────────────────────
if (Math.abs(scenes[0].startSec) > EPS) {
  fail(2, `scenes[0] (id: ${scenes[0].id})`, `첫 씬의 startSec 은 0 이어야 합니다 (현재: ${scenes[0].startSec})`);
}
for (let i = 0; i < scenes.length - 1; i++) {
  const end = scenes[i].startSec + scenes[i].durationSec;
  const next = scenes[i + 1].startSec;
  const gap = next - end;
  if (Math.abs(gap) > EPS) {
    const kind = gap > 0 ? `${gap.toFixed(3)}초 구멍(검은 프레임)` : `${(-gap).toFixed(3)}초 겹침`;
    fail(2, `scenes[${i}] (id: ${scenes[i].id}) → scenes[${i + 1}] (id: ${scenes[i + 1].id})`,
      `${kind}. ${scenes[i].id} 는 ${end.toFixed(3)}초에 끝나는데 ${scenes[i + 1].id} 는 ${next.toFixed(3)}초에 시작합니다`);
  }
}

// ── 규칙 3: 길이 합 == totalSec ──────────────────────────────────────────────
const sum = scenes.reduce((a, s) => a + s.durationSec, 0);
if (Math.abs(sum - meta.totalSec) > EPS) {
  const diff = sum - meta.totalSec;
  fail(3, 'meta.totalSec', `씬 durationSec 합계는 ${sum.toFixed(3)}초인데 meta.totalSec 은 ${meta.totalSec}초입니다 (${diff > 0 ? '+' : ''}${diff.toFixed(3)}초 불일치)`);
}

// ── 규칙 4: durationSec * fps 가 정수 ────────────────────────────────────────
scenes.forEach((s, i) => {
  const frames = s.durationSec * meta.fps;
  if (Math.abs(frames - Math.round(frames)) > EPS) {
    fail(4, `scenes[${i}] (id: ${s.id})`,
      `durationSec ${s.durationSec} × fps ${meta.fps} = ${frames} — 정수가 아닙니다. 1프레임 깜빡임이 생깁니다. ${(Math.round(frames) / meta.fps).toFixed(4)} 를 쓰세요`);
  }
});

// ── 규칙 5: emphasis ⊂ copy ──────────────────────────────────────────────────
scenes.forEach((s, i) => {
  if (s.emphasis === undefined) return;
  if (typeof s.copy !== 'string') {
    fail(5, `scenes[${i}] (id: ${s.id})`, 'emphasis 를 쓰려면 copy 가 있어야 합니다');
    return;
  }
  if (typeof s.emphasis !== 'string' || !s.copy.includes(s.emphasis)) {
    fail(5, `scenes[${i}] (id: ${s.id})`,
      `emphasis ${JSON.stringify(s.emphasis)} 가 copy ${JSON.stringify(s.copy)} 안에 없습니다. 하이라이트 렌더링이 크래시합니다`);
  }
});

// ── 규칙 6: motion / exit 이 카탈로그에 존재 ─────────────────────────────────
scenes.forEach((s, i) => {
  const at = `scenes[${i}] (id: ${s.id})`;
  if (s.motion !== undefined) {
    if (!Array.isArray(s.motion)) {
      fail(6, at, 'motion 은 배열이어야 합니다');
    } else {
      for (const m of s.motion) {
        if (!motionNames.has(m)) {
          fail(6, at, `motion ${JSON.stringify(m)} 는 카탈로그에 없습니다. 사용 가능: ${[...motionNames].join(', ')}`);
        }
      }
    }
  }
  if (s.exit !== undefined && !exitNames.has(s.exit)) {
    fail(6, at, `exit ${JSON.stringify(s.exit)} 는 카탈로그에 없습니다. 사용 가능: ${[...exitNames].join(', ')}`);
  }
});

// ── 규칙 7: copy 분량 상한 (화면 과밀 방지) — 화면비별 ───────────────────────
const aspect = meta.aspect ?? '16:9';
const cap = CAPS[aspect] ?? CAPS['16:9'];
scenes.forEach((s, i) => {
  if (typeof s.copy !== 'string') return; // 나레이션만 있는 씬 — 화면 카피 없음
  const words = s.copy.trim().split(/\s+/).filter(Boolean).length;
  const chars = [...s.copy].length;
  const suffix = aspect === '16:9' ? '' : ` (${aspect} 기준)`;
  if (words > cap.words) {
    fail(7, `scenes[${i}] (id: ${s.id})`, `copy 가 ${words}단어입니다 (상한 ${cap.words}${suffix}). 화면이 과밀해집니다: ${JSON.stringify(s.copy)}`);
  } else if (chars > cap.chars) {
    fail(7, `scenes[${i}] (id: ${s.id})`, `copy 가 ${chars}자입니다 (상한 ${cap.chars}${suffix}). 화면이 과밀해집니다: ${JSON.stringify(s.copy)}`);
  }
});

// ── 규칙 8: 최소 노출 시간 ───────────────────────────────────────────────────
scenes.forEach((s, i) => {
  if (s.durationSec < MIN_DURATION - EPS) {
    fail(8, `scenes[${i}] (id: ${s.id})`, `durationSec ${s.durationSec}초는 최소 ${MIN_DURATION}초 미만입니다. 읽을 수 없는 컷입니다`);
  }
});

// ── 규칙 9: id 유일성 + kebab-case ──────────────────────────────────────────
const seen = new Map();
scenes.forEach((s, i) => {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id)) {
    fail(9, `scenes[${i}]`, `id ${JSON.stringify(s.id)} 는 kebab-case 여야 합니다 (소문자/숫자/하이픈)`);
  }
  if (seen.has(s.id)) {
    fail(9, `scenes[${i}]`, `id ${JSON.stringify(s.id)} 가 scenes[${seen.get(s.id)}] 와 중복됩니다. 파일명이 충돌합니다`);
  } else {
    seen.set(s.id, i);
  }
});

// ── 규칙 10: hook 은 정확히 1개이며 첫 씬 ───────────────────────────────────
const hookIdx = scenes.map((s, i) => (s.role === 'hook' ? i : -1)).filter((i) => i >= 0);
if (hookIdx.length === 0) {
  fail(10, 'scenes', 'role: "hook" 인 씬이 없습니다. 첫 5초 안에 시청자의 문제로 열어야 합니다');
} else if (hookIdx.length > 1) {
  fail(10, 'scenes', `role: "hook" 이 ${hookIdx.length}개입니다 (scenes[${hookIdx.join('], scenes[')}]). 정확히 1개여야 합니다`);
} else if (hookIdx[0] !== 0) {
  fail(10, `scenes[${hookIdx[0]}]`, `hook 은 첫 씬이어야 합니다 (현재 ${hookIdx[0]}번째)`);
}

// ── 규칙 11~13: 나레이션이 씬 길이를 결정한다 ────────────────────────────────
if (narrated) {
  scenes.forEach((s, i) => {
    const at = `scenes[${i}] (id: ${s.id})`;

    if (typeof s.narration !== 'string' || !s.narration.trim()) {
      fail(11, at, 'narration 이 없습니다. 음성 없는 영상이면 meta.narration=false 로 끄세요');
      return;
    }

    // 실측이 있으면 실측 우선 (P4 reconcile-tts.mjs 가 narrationSec 을 기록한다)
    const measured = typeof s.narrationSec === 'number' ? s.narrationSec : null;
    const spoken = measured ?? estimateSec(s.narration);
    const src = measured !== null ? '실측' : '추정';
    const slack = s.durationSec - spoken;

    if (slack < PAD.min - EPS) {
      const need = suggestDuration(s.narration, meta.fps);
      fail(12, at,
        `나레이션 ${src} ${spoken.toFixed(2)}초인데 씬은 ${s.durationSec}초 — 여백이 ${slack.toFixed(2)}초뿐입니다 ` +
        `(최소 ${PAD.min}초). durationSec 을 ${fmtDuration(need)} 이상으로 올리거나 나레이션을 줄이세요`);
    } else if (slack > PAD.max + EPS) {
      fail(13, at,
        `나레이션 ${src} ${spoken.toFixed(2)}초인데 씬은 ${s.durationSec}초 — ${slack.toFixed(2)}초가 빕니다 ` +
        `(최대 ${PAD.max}초). 말이 끝난 뒤 정적이 흐릅니다. 씬을 줄이거나 나레이션을 늘리세요`);
    }
  });
}

// ── 규칙 14: blocks 가 HyperFrames 레지스트리에 존재 ─────────────────────────
scenes.forEach((s, i) => {
  if (s.blocks === undefined) return;
  if (!Array.isArray(s.blocks)) {
    fail(14, `scenes[${i}] (id: ${s.id})`, 'blocks 는 배열이어야 합니다');
    return;
  }
  for (const b of s.blocks) {
    if (!blockNames.has(b)) {
      fail(14, `scenes[${i}] (id: ${s.id})`,
        `block ${JSON.stringify(b)} 는 HyperFrames 레지스트리에 없습니다. ` +
        `references/block-catalog.md 에서 고르거나 npx hyperframes add --list 로 확인하세요`);
    }
  }
});

report();

// ── 출력 ─────────────────────────────────────────────────────────────────────
function report() {
  if (errors.length === 0) {
    const frames = Math.round(meta.totalSec * meta.fps);
    let line = `✔ script 검증 통과 — ${scenes.length}씬 / ${meta.totalSec}초 / ${frames}프레임 @ ${meta.fps}fps`;
    if (narrated) {
      const anyMeasured = scenes.some((s) => typeof s.narrationSec === 'number');
      const spoken = scenes.reduce(
        (a, s) => a + (typeof s.narrationSec === 'number' ? s.narrationSec : estimateSec(s.narration ?? '')),
        0,
      );
      const pct = Math.round((spoken / meta.totalSec) * 100);
      line += `\n  나레이션 ${anyMeasured ? '실측' : '추정'} ${spoken.toFixed(1)}초 (발화 밀도 ${pct}%)`;
      if (!anyMeasured) line += ' — P4 에서 TTS 실측으로 보정하세요';
    } else {
      line += '\n  나레이션 없음 (meta.narration=false)';
    }
    console.log(line);
    process.exit(0);
  }
  console.error(`\n✘ script 검증 실패 — ${errors.length}건\n`);
  const byRule = new Map();
  for (const e of errors) {
    if (!byRule.has(e.rule)) byRule.set(e.rule, []);
    byRule.get(e.rule).push(e);
  }
  for (const rule of [...byRule.keys()].sort((a, b) => a - b)) {
    console.error(`  [규칙 ${rule}] ${RULE_NAMES[rule]}`);
    for (const e of byRule.get(rule)) console.error(`    · ${e.where}: ${e.msg}`);
    console.error('');
  }
  console.error('대본을 고치기 전에는 씬 코드를 생성하지 마세요.\n');
  process.exit(1);
}
