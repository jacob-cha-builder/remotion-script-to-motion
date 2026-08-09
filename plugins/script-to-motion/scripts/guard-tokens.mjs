#!/usr/bin/env node
// 아트디렉션 잠금 가드. 씬 .tsx 에 인라인 색상/하드코딩 프레임 상수가 들어가면 경고한다.
// 사용: node guard-tokens.mjs <path/to/Scene.tsx>
// 종료코드: 0 = 통과(경고 없음), 1 = 경고 있음 (차단하지 않음 — 되먹임 전용)

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const target = process.argv[2];
if (!target) process.exit(0);
if (!/\.(tsx|ts)$/.test(target)) process.exit(0);
// 토큰 정의 파일 자체와 모션 구현은 예외
if (/\/(tokens|motion)\.tsx?$/.test(target)) process.exit(0);

let src;
try {
  src = readFileSync(target, 'utf8');
} catch {
  process.exit(0);
}

const lines = src.split('\n');
const warnings = [];

lines.forEach((line, i) => {
  const n = i + 1;
  const code = line.replace(/\/\/.*$/, '');

  // 규칙 5: 인라인 hex 색상 금지
  const hex = code.match(/#[0-9a-fA-F]{3,8}\b/g);
  if (hex) {
    for (const h of hex) {
      // 템플릿 리터럴 안에서 토큰에 알파를 붙이는 패턴(`${palette.x}26`)은 hex 가 아니므로 무해
      warnings.push({ n, rule: 5, msg: `인라인 색상 ${h} — tokens.ts 의 palette 를 참조하세요` });
    }
  }
  // rgb()/hsl() 리터럴도 동일
  if (/\b(rgba?|hsla?)\s*\(/.test(code)) {
    warnings.push({ n, rule: 5, msg: `인라인 ${code.match(/\b(rgba?|hsla?)/)[0]}() — tokens.ts 의 palette 를 참조하세요` });
  }

  // 규칙 4: 프레임 상수 하드코딩 금지
  if (/\b(durationInFrames|from)\s*[:=]\s*\d+/.test(code)) {
    warnings.push({ n, rule: 4, msg: `프레임 상수 하드코딩 — framesOf(초) 로 script.json 에서 파생시키세요` });
  }
  if (/\bframe\s*[-+]\s*\d{2,}/.test(code)) {
    warnings.push({ n, rule: 4, msg: `프레임 오프셋 하드코딩 — fps 파생값을 쓰세요` });
  }

  // 규칙 1: 선형 보간 경고 (easing 없는 interpolate)
  if (/\binterpolate\s*\(/.test(code)) {
    const window = lines.slice(i, i + 8).join(' ');
    if (!/easing|Easing/.test(window)) {
      warnings.push({ n, rule: 1, msg: `easing 없는 interpolate — spring() 또는 Easing.bezier 를 쓰세요` });
    }
  }
});

if (warnings.length === 0) process.exit(0);

console.error(`\n⚠ 아트디렉션 가드 — ${basename(target)} 에서 ${warnings.length}건\n`);
const RULES = {
  1: '선형 보간 금지',
  4: '타이밍은 fps/script 파생',
  5: '색상은 tokens.ts 참조만',
};
for (const w of warnings) {
  console.error(`  ${target}:${w.n}  [규칙 ${w.rule} ${RULES[w.rule]}] ${w.msg}`);
}
console.error('');
process.exit(1);
