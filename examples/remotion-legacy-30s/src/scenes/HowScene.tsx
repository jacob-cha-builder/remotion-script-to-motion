import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { SceneFrame } from '../SceneFrame';
import { framesOf, sceneById, splitEmphasis } from '../script';
import { palette, type as typo, scaleFor } from '../tokens';
import { breathe, progressOver, wipeIn } from '../motion';

/** how — 링이 씬 전체에 걸쳐 그려진다. 녹음이 도는 시간 자체를 시각화. */
export const HowScene: React.FC = () => {
  const scene = sceneById('how');
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const ctx = { frame, fps };
  const s = scaleFor(width);
  const dur = scene.durationSec;

  const [before, emph, after] = splitEmphasis(scene);
  // 링을 씬 90% 에 걸쳐 그린다 — 25%/75% 지점이 확연히 달라야 한다
  const ring = progressOver(ctx, dur * 0.12, dur * 0.9, [0.4, 0, 0.2, 1]);
  const R = 96 * s;
  const C = 2 * Math.PI * R;
  const elapsed = Math.max(0, Math.min(dur, (frame / fps)));

  return (
    <SceneFrame durationInFrames={framesOf(dur)} glow={palette.accent} glowPos={['70%', '52%']}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 64 * s }}>
        <svg width={R * 2.4} height={R * 2.4} viewBox={`0 0 ${R * 2.4} ${R * 2.4}`} style={{ flexShrink: 0 }}>
          <circle cx={R * 1.2} cy={R * 1.2} r={R} fill="none" stroke={palette.line} strokeWidth={4 * s} />
          <circle
            cx={R * 1.2}
            cy={R * 1.2}
            r={R}
            fill="none"
            stroke={palette.accent}
            strokeWidth={6 * s}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - ring)}
            transform={`rotate(-90 ${R * 1.2} ${R * 1.2})`}
          />
          <circle
            cx={R * 1.2}
            cy={R * 1.2}
            r={30 * s * breathe(ctx, 1.6, 0.09)}
            fill={palette.danger}
          />
        </svg>

        <div style={{ ...wipeIn(ctx, 1) }}>
          <div
            style={{
              color: palette.text,
              fontSize: typo.h2 * s,
              fontWeight: typo.weightBold,
              letterSpacing: `${typo.tightTracking}em`,
              lineHeight: 1.3,
            }}
          >
            <span style={{ color: palette.accent }}>{emph || before}</span>
            <span>{emph ? after : ''}</span>
          </div>
          {/* 경과 시간 — 씬 내내 흐른다 */}
          <div
            style={{
              color: palette.textMuted,
              fontSize: typo.body * s,
              marginTop: 22 * s,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.08em',
            }}
          >
            {`00:0${Math.floor(elapsed)}`} 녹음 중
          </div>
        </div>
      </div>
    </SceneFrame>
  );
};
