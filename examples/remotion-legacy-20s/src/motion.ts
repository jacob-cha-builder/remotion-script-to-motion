/**
 * 모션 프리미티브 구현.
 * 이름은 .claude/skills/script-to-motion/assets/motion-catalog.json 과 1:1 대응한다.
 * 모든 타이밍은 fps 파생 — 프레임 상수 하드코딩 금지.
 */

import { interpolate, spring, Easing } from 'remotion';
import { easings, springs, timing } from './tokens';

type Ctx = { frame: number; fps: number };

const bez = ([a, b, c, d]: readonly [number, number, number, number]) =>
  Easing.bezier(a, b, c, d);

/**
 * 씬 내 임의 구간(초)에 걸친 진행도 0→1.
 * 등장만 스프링으로 처리하면 씬 후반이 정지 화면이 된다. 씬 길이에 걸쳐
 * 천천히 진행되는 요소는 이걸 쓴다.
 */
export const progressOver = (
  { frame, fps }: Ctx,
  startSec: number,
  endSec: number,
  easing: readonly [number, number, number, number] = easings.outExpo,
) =>
  interpolate(frame, [startSec * fps, endSec * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: bez(easing),
  });

/** 등장 진행도 0→1 (스프링). delayIndex 로 stagger 를 준다. */
export const enterProgress = (
  { frame, fps }: Ctx,
  delayIndex = 0,
  preset: keyof typeof springs = 'entrance',
) =>
  spring({
    frame: frame - Math.round(delayIndex * timing.staggerSec * fps),
    fps,
    config: springs[preset],
    durationInFrames: Math.round(timing.enterSec * fps),
  });

/** 퇴장 진행도 0→1. 씬 끝에서 exitRatio 배 빠르게. */
export const exitProgress = ({ frame, fps }: Ctx, sceneDurationInFrames: number) => {
  const dur = Math.round(timing.enterSec * timing.exitRatio * fps);
  const start = sceneDurationInFrames - dur;
  return interpolate(frame, [start, sceneDurationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: bez(easings.outQuart),
  });
};

// ── enter ────────────────────────────────────────────────────────────────────

export const staggerIn = (ctx: Ctx, i = 0) => {
  const p = enterProgress(ctx, i);
  return {
    opacity: p,
    transform: `translateY(${(1 - p) * 34}px) scale(${0.94 + p * 0.06})`,
  };
};

export const riseIn = (ctx: Ctx, i = 0) => {
  const p = enterProgress(ctx, i, 'soft');
  return { opacity: p, transform: `translateY(${(1 - p) * 56}px)` };
};

export const scaleIn = (ctx: Ctx, i = 0) => {
  const p = enterProgress(ctx, i);
  return { opacity: p, transform: `scale(${0.72 + p * 0.28})` };
};

export const wipeIn = (ctx: Ctx, i = 0) => {
  const p = enterProgress(ctx, i, 'soft');
  return { clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` };
};

export const blurIn = (ctx: Ctx, i = 0) => {
  const p = enterProgress(ctx, i, 'soft');
  return { opacity: p, filter: `blur(${(1 - p) * 18}px)` };
};

export const drawIn = (ctx: Ctx, i = 0) => {
  const p = enterProgress(ctx, i, 'soft');
  return { strokeDashoffset: 1 - p, opacity: Math.min(1, p * 3) };
};

/** 글자 단위 노출 개수 */
export const typewriter = ({ frame, fps }: Ctx, total: number, charPerSec = 14) =>
  Math.min(total, Math.max(0, Math.floor((frame / fps) * charPerSec)));

/** 0 → target 스프링 카운트업 */
export const numberCountup = (ctx: Ctx, target: number, i = 0) =>
  Math.round(enterProgress(ctx, i, 'count') * target);

// ── emphasis ─────────────────────────────────────────────────────────────────

/** 강조 구간을 훑고 지나가는 스와이프 진행도 */
export const highlightSweep = ({ frame, fps }: Ctx, delaySec = 0.45) => {
  const start = Math.round(delaySec * fps);
  return interpolate(frame, [start, start + Math.round(0.5 * fps)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: bez(easings.outExpo),
  });
};

export const underlineDraw = ({ frame, fps }: Ctx, delaySec = 0.5) => {
  const start = Math.round(delaySec * fps);
  return interpolate(frame, [start, start + Math.round(0.45 * fps)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: bez(easings.outExpo),
  });
};

/** 짧게 커졌다 제자리로 */
export const scalePop = ({ frame, fps }: Ctx, delaySec = 0.4) => {
  const p = spring({
    frame: frame - Math.round(delaySec * fps),
    fps,
    config: springs.pop,
    durationInFrames: Math.round(0.6 * fps),
  });
  return 1 + Math.sin(p * Math.PI) * 0.12;
};

export const colorShift = ({ frame, fps }: Ctx, delaySec = 0.4) =>
  spring({
    frame: frame - Math.round(delaySec * fps),
    fps,
    config: springs.soft,
    durationInFrames: Math.round(0.5 * fps),
  });

// ── ambient (완전 정지 프레임 방지) ──────────────────────────────────────────

/** 미세 호흡. 진폭은 눈에 거슬리지 않을 만큼만. */
export const breathe = ({ frame, fps }: Ctx, periodSec = 4, amount = 0.012) =>
  1 + Math.sin((frame / fps / periodSec) * Math.PI * 2) * amount;

export const drift = ({ frame, fps }: Ctx, periodSec = 9, px = 14) => ({
  x: Math.sin((frame / fps / periodSec) * Math.PI * 2) * px,
  y: Math.cos((frame / fps / periodSec) * Math.PI * 2 * 0.6) * px * 0.5,
});

export const parallax = (ctx: Ctx, depth = 1) => {
  const d = drift(ctx, 12, 22 * depth);
  return `translate(${d.x}px, ${d.y}px)`;
};
