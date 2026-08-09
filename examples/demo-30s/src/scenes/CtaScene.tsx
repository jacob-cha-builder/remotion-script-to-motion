import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { SceneFrame } from '../SceneFrame';
import { framesOf, sceneById, splitEmphasis } from '../script';
import { palette, type as typo, scaleFor } from '../tokens';
import { breathe, progressOver, riseIn } from '../motion';

/** cta — 단일 행동 지시. 밑줄이 씬에 걸쳐 그려지고 화살표가 밀려 나간다. */
export const CtaScene: React.FC = () => {
  const scene = sceneById('cta');
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const ctx = { frame, fps };
  const s = scaleFor(width);
  const dur = scene.durationSec;

  const [before, emph, after] = splitEmphasis(scene);
  const underline = progressOver(ctx, dur * 0.22, dur * 0.72);
  const arrow = progressOver(ctx, dur * 0.4, dur * 0.95);

  return (
    <SceneFrame durationInFrames={framesOf(dur)} glow={palette.accent} glowPos={['48%', '50%']}>
      <div style={{ ...riseIn(ctx, 0), transform: `scale(${breathe(ctx, 3, 0.008)})` }}>
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
          <span style={{ position: 'relative', display: 'inline-block', color: palette.accent }}>
            {emph}
            <span
              style={{
                position: 'absolute',
                left: 0,
                bottom: -12 * s,
                height: 6 * s,
                width: `${underline * 100}%`,
                backgroundColor: palette.accent,
                borderRadius: 3 * s,
              }}
            />
          </span>
          {after}
        </div>
      </div>

      {/* 앞으로 밀려 나가는 화살표 — 씬 끝까지 움직인다 */}
      <div style={{ marginTop: 62 * s, display: 'flex', alignItems: 'center', gap: 14 * s }}>
        <div
          style={{
            height: 6 * s,
            width: `${18 + arrow * 34}%`,
            backgroundColor: palette.accent,
            opacity: 0.7 + arrow * 0.3,
            borderRadius: 3 * s,
          }}
        />
        <svg width={40 * s} height={40 * s} viewBox="0 0 26 26" style={{ opacity: 0.7 + arrow * 0.3 }}>
          <path
            d="M3 13 H21 M14 6 L21 13 L14 20"
            fill="none"
            stroke={palette.accent}
            strokeWidth={3.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </SceneFrame>
  );
};
