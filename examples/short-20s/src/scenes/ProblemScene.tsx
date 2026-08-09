import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { SceneFrame } from '../SceneFrame';
import { framesOf, sceneById, splitEmphasis } from '../script';
import { palette, type as typo, scaleFor } from '../tokens';
import { progressOver, riseIn } from '../motion';

/** problem — 10칸 신뢰도 게이지가 씬 내내 하나씩 금 가며 꺼진다. hook 의 눈금이 무너지는 형태로 변주. */
export const ProblemScene: React.FC = () => {
  const scene = sceneById('problem');
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const ctx = { frame, fps };
  const s = scaleFor(width);
  const dur = scene.durationSec;

  const [before, emph, after] = splitEmphasis(scene);
  const sweep = progressOver(ctx, dur * 0.18, dur * 0.55);

  // 씬 내내 하나씩 꺼지는 신뢰도 칸 — 후반 정지 방지
  const crackP = progressOver(ctx, dur * 0.28, dur * 0.92);
  const crackedCount = crackP * 10;

  return (
    <SceneFrame durationInFrames={framesOf(dur)} glow={palette.danger} glowPos={['70%', '45%']}>
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
        <div>{before.trim()}</div>
        <span style={{ position: 'relative', display: 'inline-block' }}>
          <span
            style={{
              position: 'absolute',
              left: 0,
              bottom: 4 * s,
              height: 10 * s,
              width: `${sweep * 100}%`,
              backgroundColor: palette.danger,
              opacity: 0.35,
              borderRadius: 4 * s,
            }}
          />
          <span style={{ position: 'relative', color: palette.danger }}>{emph}</span>
        </span>
        <span>{after}</span>
      </div>

      {/* 10칸 신뢰도 게이지 — 하나씩 금 가며 꺼진다 (hook 눈금의 붕괴 버전) */}
      <div
        style={{
          display: 'flex',
          gap: 8 * s,
          marginTop: 60 * s,
          width: '100%',
        }}
      >
        {new Array(10).fill(0).map((_, i) => {
          const cracked = Math.max(0, Math.min(1, crackedCount - i));
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: 30 * s,
                borderRadius: 3 * s,
                backgroundColor: cracked > 0 ? palette.textMuted : palette.danger,
                opacity: cracked > 0 ? 0.55 : 1,
                transform: `scaleY(${1 - cracked * 0.45})`,
              }}
            />
          );
        })}
      </div>
    </SceneFrame>
  );
};
