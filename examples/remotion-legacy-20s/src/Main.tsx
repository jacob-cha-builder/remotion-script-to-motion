import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { framesOf, script } from './script';
import { palette } from './tokens';

import { HookScene } from './scenes/HookScene';
import { ProblemScene } from './scenes/ProblemScene';
import { SolutionScene } from './scenes/SolutionScene';
import { CtaScene } from './scenes/CtaScene';

/** 씬 id → 컴포넌트. script.json 에 없는 id 가 있으면 즉시 드러난다. */
const REGISTRY: Record<string, React.FC> = {
  hook: HookScene,
  problem: ProblemScene,
  solution: SolutionScene,
  cta: CtaScene,
};

export const Main: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: palette.bg }}>
    {script.scenes.map((scene) => {
      const Component = REGISTRY[scene.id];
      if (!Component) {
        throw new Error(
          `script.json 의 씬 "${scene.id}" 에 대응하는 컴포넌트가 Main.tsx REGISTRY 에 없습니다`,
        );
      }
      return (
        <Sequence
          key={scene.id}
          from={framesOf(scene.startSec)}
          durationInFrames={framesOf(scene.durationSec)}
          name={`${scene.id} (${scene.role})`}
        >
          <Component />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
