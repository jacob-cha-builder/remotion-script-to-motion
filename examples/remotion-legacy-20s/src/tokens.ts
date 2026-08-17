/**
 * 아트디렉션 잠금 (P2).
 * 씬 코드는 이 파일의 값만 참조한다. 인라인 hex 는 guard-tokens.mjs 가 잡는다.
 * tone: confident-minimal / 9:16 세로형 1080×1920
 */

export const palette = {
  bg: '#0B0D10',
  bgLift: '#14171C',
  surface: '#1C2027',
  text: '#F2F4F7',
  textMuted: '#8A93A3',
  accent: '#5B8CFF',
  accentWarm: '#FFB44D',
  danger: '#FF5F56',
  line: '#2A2F38',
} as const;

/**
 * 1080 폭(이 프로젝트의 네이티브 캔버스) 기준.
 * 세로형은 가로형보다 화면 폭 대비 글자를 훨씬 크게 잡는다 —
 * 같은 글자수라도 세로 캔버스에서는 훨씬 크게 보여야 가독성이 산다.
 */
export const type = {
  display: 180,
  h1: 108,
  h2: 72,
  body: 42,
  caption: 30,
  family: '"Pretendard", "Inter", -apple-system, system-ui, sans-serif',
  weightBold: 800,
  weightMedium: 600,
  weightRegular: 400,
  tightTracking: -0.03,
} as const;

/** 세이프 에어리어: 세로형은 상하 12% (플랫폼 UI 오버레이 회피), 좌우 5%. */
export const SAFE_RATIO = {
  x: 0.05,
  y: 0.12,
} as const;

export const layout = {
  maxTextWidth: 0.86, // 캔버스 폭 대비
  gridGap: 24,
} as const;

/** 스프링 프리셋. 선형 보간은 금지. */
export const springs = {
  /** 기본 등장 — 약간의 오버슈트 */
  entrance: { damping: 14, mass: 0.7, stiffness: 110 },
  /** 부드럽고 무게감 있는 등장 */
  soft: { damping: 20, mass: 1, stiffness: 80 },
  /** 강조 팝 — 빠르고 탄력적 */
  pop: { damping: 10, mass: 0.5, stiffness: 200 },
  /** 숫자 카운트업 — 오버슈트 없이 */
  count: { damping: 26, mass: 1, stiffness: 90 },
} as const;

/** 베지어 이징 (스프링이 부적합한 경우에만) */
export const easings = {
  outExpo: [0.16, 1, 0.3, 1] as const,
  inOutQuint: [0.83, 0, 0.17, 1] as const,
  outQuart: [0.25, 1, 0.5, 1] as const,
};

/** 모션 타이밍 규칙 — 전부 fps 파생. 프레임 상수 하드코딩 금지. */
export const timing = {
  /** 요소 간 stagger 간격 (초) */
  staggerSec: 0.09,
  /** 기본 등장 길이 (초) */
  enterSec: 0.75,
  /** 퇴장은 등장의 0.6배 */
  exitRatio: 0.6,
  /** 씬 간 크로스페이드 (초) */
  crossfadeSec: 0.35,
} as const;

export const scaleFor = (width: number) => width / 1080;
