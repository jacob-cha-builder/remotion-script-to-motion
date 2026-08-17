import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { SceneFrame } from '../SceneFrame';
import { framesOf, sceneById, splitEmphasis } from '../script';
import { palette, type as typo, scaleFor } from '../tokens';
import { progressOver, staggerIn } from '../motion';

/** proof — 카운트업과 도트 격자가 씬 전체에 걸쳐 함께 차오른다. */
export const ProofScene: React.FC = () => {
  const scene = sceneById('proof');
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const ctx = { frame, fps };
  const s = scaleFor(width);
  const dur = scene.durationSec;

  const [before, emph, after] = splitEmphasis(scene);
  const target = parseInt(emph.replace(/,/g, ''), 10) || 0;
  const unit = emph.replace(/^[\d,]+/, '');

  // 카운트업과 격자를 같은 진행도로 묶어 씬 80% 에 걸쳐 채운다
  const fillP = progressOver(ctx, 0.4, dur * 0.82);
  const count = Math.round(fillP * target);

  const COLS = 20;
  const ROWS = 4;
  const TOTAL = COLS * ROWS;
  const litCount = fillP * TOTAL;

  return (
    <SceneFrame durationInFrames={framesOf(dur)} glow={palette.accent} glowPos={['38%', '62%']}>
      <div style={{ ...staggerIn(ctx, 0), color: palette.textMuted, fontSize: typo.caption * s, letterSpacing: '0.2em' }}>
        {before.trim()}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 * s, marginTop: 10 * s }}>
        <span
          style={{
            color: palette.text,
            fontSize: typo.display * s,
            fontWeight: typo.weightBold,
            letterSpacing: `${typo.tightTracking}em`,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {count.toLocaleString('ko-KR')}
        </span>
        <span style={{ color: palette.accent, fontSize: typo.h2 * s, fontWeight: typo.weightMedium }}>
          {unit}
        </span>
        <span style={{ color: palette.text, fontSize: typo.h2 * s, fontWeight: typo.weightMedium }}>
          {after.trim()}
        </span>
      </div>

      {/* 도트가 카운트업과 함께 하나씩 켜진다 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gap: 12 * s,
          marginTop: 44 * s,
          width: '68%',
        }}
      >
        {new Array(TOTAL).fill(0).map((_, i) => {
          const lit = Math.max(0, Math.min(1, litCount - i));
          return (
            <div
              key={i}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: '50%',
                backgroundColor: lit > 0 ? palette.accent : palette.line,
                opacity: 0.25 + lit * 0.75,
                transform: `scale(${0.62 + lit * 0.38})`,
              }}
            />
          );
        })}
      </div>
    </SceneFrame>
  );
};
