import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { SceneFrame } from '../SceneFrame';
import { framesOf, sceneById, splitEmphasis } from '../script';
import { palette, type as typo, scaleFor } from '../tokens';
import { progressOver, scaleIn, scalePop } from '../motion';

/** solution — 10개 점이 하나씩 통과되어 켜진다. 앞선 씬의 무너지던 칸이 여기서 회복되는 형태로 변주. */
export const SolutionScene: React.FC = () => {
  const scene = sceneById('solution');
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const ctx = { frame, fps };
  const s = scaleFor(width);
  const dur = scene.durationSec;

  const [before, emph, after] = splitEmphasis(scene);
  // 10개 점이 씬 내내 순차적으로 통과 — 후반까지 계속 움직인다
  const passP = progressOver(ctx, dur * 0.2, dur * 0.88);
  const litDots = passP * 10;

  return (
    <SceneFrame durationInFrames={framesOf(dur)} glow={palette.accent} glowPos={['30%', '55%']}>
      <div style={{ ...scaleIn(ctx, 0), textAlign: 'center' }}>
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
          <span
            style={{
              color: palette.accent,
              display: 'inline-block',
              transform: `scale(${scalePop(ctx, dur * 0.35)})`,
            }}
          >
            {emph}
          </span>
          {after}
        </div>
      </div>

      {/* 10개 점 — 대본 검증 10개 규칙이 하나씩 통과되어 켜진다 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 20 * s,
          marginTop: 64 * s,
          width: '78%',
          alignSelf: 'center',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        {new Array(10).fill(0).map((_, i) => {
          const lit = Math.max(0, Math.min(1, litDots - i));
          return (
            <div
              key={i}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: '50%',
                backgroundColor: lit > 0 ? palette.accent : palette.line,
                opacity: 0.3 + lit * 0.7,
                transform: `scale(${0.55 + lit * 0.45})`,
              }}
            />
          );
        })}
      </div>
    </SceneFrame>
  );
};
