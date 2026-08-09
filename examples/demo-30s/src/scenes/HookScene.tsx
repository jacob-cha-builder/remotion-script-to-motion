import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { SceneFrame } from '../SceneFrame';
import { framesOf, sceneById, splitEmphasis } from '../script';
import { palette, type as typo, scaleFor } from '../tokens';
import { numberCountup, progressOver, scalePop, staggerIn } from '../motion';

/** hook — 거대한 숫자 카운트업. 첫 5초는 제품이 아니라 시청자의 문제로 연다. */
export const HookScene: React.FC = () => {
  const scene = sceneById('hook');
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const ctx = { frame, fps };
  const s = scaleFor(width);
  const dur = scene.durationSec;

  const [before, emph, after] = splitEmphasis(scene);
  // emphasis 에 조사가 붙어 있다 ("3시간을") — 숫자와 나머지를 분리한다
  const target = parseInt(emph, 10) || 0;
  const unit = emph.replace(/^\d+/, '');
  // 카운트업을 씬 전반 45% 에 걸쳐 진행 — 25% 지점에서 아직 움직이고 있어야 한다
  const countP = progressOver(ctx, 0.35, dur * 0.45);
  const count = Math.round(countP * target);

  // 씬 후반에 걸쳐 자라는 손실 게이지 — 정지 구간을 없앤다
  const gauge = progressOver(ctx, dur * 0.4, dur * 0.92);

  return (
    <SceneFrame durationInFrames={framesOf(dur)} glow={palette.danger} glowPos={['28%', '38%']}>
      <div
        style={{
          ...staggerIn(ctx, 0),
          color: palette.text,
          fontSize: typo.body * s,
          fontWeight: typo.weightMedium,
          letterSpacing: '0.18em',
        }}
      >
        {before.trim()}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 14 * s,
          marginTop: 10 * s,
          transform: `scale(${scalePop(ctx, dur * 0.45)})`,
          transformOrigin: 'left center',
        }}
      >
        <span
          style={{
            color: palette.danger,
            fontSize: typo.display * s,
            fontWeight: typo.weightBold,
            letterSpacing: `${typo.tightTracking}em`,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {count}
        </span>
        <span style={{ color: palette.text, fontSize: typo.h2 * s, fontWeight: typo.weightMedium }}>
          {unit}
        </span>
        <span style={{ color: palette.text, fontSize: typo.h2 * s, fontWeight: typo.weightMedium }}>
          {after.trim()}
        </span>
      </div>

      {/* 손실 게이지 — 씬 내내 차오른다 */}
      <div style={{ marginTop: 52 * s, width: '68%' }}>
        <div
          style={{
            height: 10 * s,
            borderRadius: 5 * s,
            backgroundColor: palette.surface,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${gauge * 100}%`,
              backgroundColor: palette.danger,
              borderRadius: 5 * s,
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 14 * s,
            color: palette.textMuted,
            fontSize: typo.caption * s,
            letterSpacing: '0.1em',
            opacity: staggerIn(ctx, 4).opacity,
          }}
        >
          <span>월요일</span>
          <span>금요일</span>
        </div>
      </div>
    </SceneFrame>
  );
};
