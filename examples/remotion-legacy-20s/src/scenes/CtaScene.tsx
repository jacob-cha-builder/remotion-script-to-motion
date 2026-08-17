import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { SceneFrame } from '../SceneFrame';
import { framesOf, sceneById, splitEmphasis } from '../script';
import { palette, type as typo, scaleFor } from '../tokens';
import { breathe, progressOver, riseIn } from '../motion';

/** cta — 밑줄과 화살표가 씬 내내 자란다. 작은 10/10 배지로 숫자의 마지막 변주를 남긴다. */
export const CtaScene: React.FC = () => {
  const scene = sceneById('cta');
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const ctx = { frame, fps };
  const s = scaleFor(width);
  const dur = scene.durationSec;

  const [before, emph, after] = splitEmphasis(scene);
  const underline = progressOver(ctx, dur * 0.2, dur * 0.7);
  const arrow = progressOver(ctx, dur * 0.35, dur * 0.95);
  const badge = progressOver(ctx, dur * 0.05, dur * 0.3);

  return (
    <SceneFrame durationInFrames={framesOf(dur)} glow={palette.accentWarm} glowPos={['50%', '60%']}>
      <div
        style={{
          opacity: badge,
          transform: `translateY(${(1 - badge) * -16 * s}px)`,
          textAlign: 'center',
          color: palette.textMuted,
          fontSize: typo.caption * s,
          letterSpacing: '0.16em',
          marginBottom: 28 * s,
        }}
      >
        10 / 10 통과
      </div>

      <div
        style={{
          ...riseIn(ctx, 0),
          transform: `scale(${breathe(ctx, 3, 0.008)})`,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            color: palette.text,
            fontSize: typo.h1 * s,
            fontWeight: typo.weightBold,
            letterSpacing: `${typo.tightTracking}em`,
            lineHeight: 1.2,
          }}
        >
          {before}
          <span style={{ position: 'relative', display: 'inline-block', color: palette.accentWarm }}>
            {emph}
            <span
              style={{
                position: 'absolute',
                left: 0,
                bottom: -12 * s,
                height: 7 * s,
                width: `${underline * 100}%`,
                backgroundColor: palette.accentWarm,
                borderRadius: 4 * s,
              }}
            />
          </span>
          {after}
        </div>
      </div>

      {/* 앞으로 밀려 나가는 화살표 — 씬 끝까지 계속 움직인다 */}
      <div style={{ marginTop: 68 * s, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 * s }}>
        <div
          style={{
            height: 7 * s,
            width: `${22 + arrow * 38}%`,
            backgroundColor: palette.accentWarm,
            opacity: 0.7 + arrow * 0.3,
            borderRadius: 4 * s,
          }}
        />
        <svg width={46 * s} height={46 * s} viewBox="0 0 26 26" style={{ opacity: 0.7 + arrow * 0.3, flexShrink: 0 }}>
          <path
            d="M3 13 H21 M14 6 L21 13 L14 20"
            fill="none"
            stroke={palette.accentWarm}
            strokeWidth={3.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </SceneFrame>
  );
};
