import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { SceneFrame } from '../SceneFrame';
import { framesOf, sceneById, splitEmphasis } from '../script';
import { palette, type as typo, scaleFor } from '../tokens';
import { progressOver, staggerIn } from '../motion';

/** hook — 거대한 숫자 10 이 카운트업하며, 10칸 눈금이 함께 채워진다. */
export const HookScene: React.FC = () => {
  const scene = sceneById('hook');
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const ctx = { frame, fps };
  const s = scaleFor(width);
  const dur = scene.durationSec;

  const [before, emph, after] = splitEmphasis(scene);
  const target = parseInt(emph, 10) || 0;
  const unit = emph.replace(/^\d+/, '');

  // 카운트업을 씬 전반 75% 에 걸쳐 진행 — 25%/75% 지점 모두 움직이는 중이어야 한다
  const countP = progressOver(ctx, dur * 0.15, dur * 0.78);
  const count = Math.round(countP * target);
  const litTicks = countP * 10;

  return (
    <SceneFrame durationInFrames={framesOf(dur)} glow={palette.accent} glowPos={['50%', '30%']}>
      <div
        style={{
          ...staggerIn(ctx, 0),
          textAlign: 'center',
          color: palette.textMuted,
          fontSize: typo.body * s,
          fontWeight: typo.weightMedium,
          letterSpacing: '0.2em',
        }}
      >
        {before.trim()}
      </div>

      {/* 숫자와 단위는 같은 줄에 — 세로로 쪼개면 "10 / 개" 로 읽혀 어색하다 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          gap: 6 * s,
          marginTop: 24 * s,
        }}
      >
        <span
          style={{
            color: palette.text,
            fontSize: typo.display * 1.7 * s,
            fontWeight: typo.weightBold,
            letterSpacing: `${typo.tightTracking}em`,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 0.92,
          }}
        >
          {count}
        </span>
        <span
          style={{
            color: palette.accent,
            fontSize: typo.display * 0.62 * s,
            fontWeight: typo.weightBold,
            letterSpacing: '0.01em',
          }}
        >
          {unit}
          {after.trim()}
        </span>
      </div>

      {/* 10칸 눈금 — 숫자와 함께 채워진다. 이후 씬의 gauge-bar/dot-grid 로 이어지는 첫 변주 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 14 * s,
          marginTop: 72 * s,
        }}
      >
        {new Array(10).fill(0).map((_, i) => {
          const lit = Math.max(0, Math.min(1, litTicks - i));
          return (
            <div
              key={i}
              style={{
                width: 22 * s,
                height: 56 * s,
                borderRadius: 3 * s,
                backgroundColor: lit > 0 ? palette.accent : palette.line,
                opacity: 0.3 + lit * 0.7,
                transform: `scaleY(${0.6 + lit * 0.4})`,
              }}
            />
          );
        })}
      </div>
    </SceneFrame>
  );
};
