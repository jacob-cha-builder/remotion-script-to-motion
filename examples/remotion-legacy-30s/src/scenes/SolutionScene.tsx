import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { SceneFrame } from '../SceneFrame';
import { framesOf, sceneById, splitEmphasis } from '../script';
import { palette, type as typo, scaleFor } from '../tokens';
import { progressOver, scaleIn, scalePop } from '../motion';

/** solution — 중앙에서 커지며 등장. 잔무 4개가 하나로 접히는 것을 보여준다. */
export const SolutionScene: React.FC = () => {
  const scene = sceneById('solution');
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const ctx = { frame, fps };
  const s = scaleFor(width);
  const dur = scene.durationSec;

  const [before, emph, after] = splitEmphasis(scene);
  // 4개 막대가 씬 내내 하나로 수렴한다
  const merge = progressOver(ctx, dur * 0.28, dur * 0.85);

  return (
    <SceneFrame durationInFrames={framesOf(dur)} glow={palette.accent} glowPos={['50%', '30%']}>
      <div style={{ ...scaleIn(ctx, 0) }}>
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
              transform: `scale(${scalePop(ctx, dur * 0.3)})`,
            }}
          >
            {emph}
          </span>
          {after}
        </div>
      </div>

      {/* 흩어진 막대 4개 → 하나로 수렴 */}
      <div style={{ position: 'relative', height: 120 * s, marginTop: 56 * s, width: '72%' }}>
        {[0, 1, 2, 3].map((i) => {
          const spread = (i - 1.5) * 0.24; // -0.36 ~ 0.36
          const left = (0.5 + spread * (1 - merge)) * 100;
          const w = (0.16 + (0.44 - 0.16) * merge * (i === 0 ? 1 : 0)) * 100;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: 44 * s,
                left: `${left}%`,
                transform: 'translateX(-50%)',
                width: `${i === 0 ? w : 0.16 * 100 * (1 - merge)}%`,
                height: 12 * s,
                borderRadius: 6 * s,
                backgroundColor: i === 0 ? palette.accent : palette.line,
                opacity: i === 0 ? 1 : 1 - merge,
              }}
            />
          );
        })}
      </div>
    </SceneFrame>
  );
};
