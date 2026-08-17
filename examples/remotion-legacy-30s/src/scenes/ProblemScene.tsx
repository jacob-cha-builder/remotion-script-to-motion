import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { SceneFrame } from '../SceneFrame';
import { framesOf, sceneById, splitEmphasis } from '../script';
import { palette, type as typo, scaleFor } from '../tokens';
import { progressOver, riseIn } from '../motion';

/** problem — 강조 구간에 스와이프가 지나가고, 잔무 목록이 씬 내내 쌓인다. */
export const ProblemScene: React.FC = () => {
  const scene = sceneById('problem');
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const ctx = { frame, fps };
  const s = scaleFor(width);
  const dur = scene.durationSec;

  const [before, emph, after] = splitEmphasis(scene);
  const sweep = progressOver(ctx, 0.5, dur * 0.42);

  // 씬 내내 하나씩 쌓이는 잔무 — 후반 정지 방지
  const chores = ['녹취 듣기', '요점 추리기', '공유 문서 정리', '할 일 옮기기'];

  return (
    <SceneFrame durationInFrames={framesOf(dur)} glow={palette.accentWarm} glowPos={['72%', '42%']}>
      <div
        style={{
          ...riseIn(ctx, 0),
          color: palette.text,
          fontSize: typo.h1 * s,
          fontWeight: typo.weightBold,
          letterSpacing: `${typo.tightTracking}em`,
          lineHeight: 1.25,
        }}
      >
        <span style={{ position: 'relative', display: 'inline-block' }}>
          <span
            style={{
              position: 'absolute',
              left: 0,
              bottom: 2 * s,
              height: 8 * s,
              width: `${sweep * 100}%`,
              backgroundColor: palette.accentWarm,
              borderRadius: 4 * s,
            }}
          />
          <span style={{ position: 'relative' }}>{emph || before}</span>
        </span>
        <span>{emph ? after : ''}</span>
      </div>

      {/* 잔무가 하나씩 쌓인다 */}
      <div style={{ marginTop: 46 * s, display: 'flex', flexDirection: 'column', gap: 16 * s }}>
        {chores.map((c, i) => {
          const appear = progressOver(ctx, dur * 0.3 + i * (dur * 0.14), dur * 0.42 + i * (dur * 0.14));
          return (
            <div
              key={c}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16 * s,
                opacity: appear,
                transform: `translateX(${(1 - appear) * 26}px)`,
              }}
            >
              <div
                style={{
                  width: 9 * s,
                  height: 9 * s,
                  borderRadius: '50%',
                  backgroundColor: palette.accentWarm,
                }}
              />
              <span style={{ color: palette.textMuted, fontSize: typo.body * s }}>{c}</span>
            </div>
          );
        })}
      </div>
    </SceneFrame>
  );
};
