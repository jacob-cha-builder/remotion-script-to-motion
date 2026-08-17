import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, random } from 'remotion';
import { palette, SAFE_RATIO, layout, type as typo, scaleFor } from './tokens';
import { breathe, exitProgress, parallax } from './motion';

/**
 * 모든 씬의 공통 껍데기: 배경 → 세이프에어리어 → 그레인/비네트.
 * 씬별 고유 비주얼은 children 이 담당한다.
 * 세로형: 상하 12% / 좌우 5% 비대칭 세이프 에어리어로 플랫폼 UI 오버레이를 피한다.
 */
export const SceneFrame: React.FC<{
  children: React.ReactNode;
  /** 씬 길이(프레임). 퇴장 타이밍 계산에 쓰인다. */
  durationInFrames: number;
  /** 배경 강조색 — 씬마다 달라져야 단조로움을 피한다 */
  glow?: string;
  glowPos?: [string, string];
}> = ({ children, durationInFrames, glow = palette.accent, glowPos = ['30%', '35%'] }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const ctx = { frame, fps };
  const s = scaleFor(width);

  const out = exitProgress(ctx, durationInFrames);
  const safeX = width * SAFE_RATIO.x;
  const safeY = height * SAFE_RATIO.y;

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bg, fontFamily: typo.family }}>
      {/* 그라디언트 메시 배경 — drift 로 완전 정지 방지 */}
      <AbsoluteFill
        style={{
          transform: parallax(ctx, 0.5),
          background: `radial-gradient(60% 55% at ${glowPos[0]} ${glowPos[1]}, ${glow}26 0%, transparent 70%),
                       radial-gradient(50% 50% at 80% 75%, ${palette.accentWarm}14 0%, transparent 70%)`,
        }}
      />

      {/* 콘텐츠 — 세이프 에어리어 안쪽 (상하 12%, 좌우 5%) */}
      <AbsoluteFill
        style={{
          paddingTop: safeY,
          paddingBottom: safeY,
          paddingLeft: safeX,
          paddingRight: safeX,
          opacity: 1 - out,
          transform: `scale(${breathe(ctx) * (1 - out * 0.04)})`,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            maxWidth: `${layout.maxTextWidth * 100}%`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {children}
        </div>
      </AbsoluteFill>

      {/* 비네트 */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(75% 70% at 50% 50%, transparent 55%, ${palette.bg}CC 100%)`,
          pointerEvents: 'none',
        }}
      />

      {/* 필름 그레인 — 시드 고정으로 렌더 재현성 유지 */}
      <AbsoluteFill style={{ opacity: 0.05, pointerEvents: 'none' }}>
        {new Array(90).fill(0).map((_, i) => {
          const seed = `grain-${Math.floor(frame / 2)}-${i}`;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${random(seed + 'x') * 100}%`,
                top: `${random(seed + 'y') * 100}%`,
                width: 2 * s,
                height: 2 * s,
                backgroundColor: palette.text,
              }}
            />
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
