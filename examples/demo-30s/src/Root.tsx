import { Composition, type CalculateMetadataFunction } from 'remotion';
import { Main } from './Main';
import { script } from './script';

/**
 * 길이·해상도·fps 는 여기서만 결정되며, 전부 script.json 파생이다.
 * 코드에 하드코딩된 durationInFrames 는 존재하지 않는다.
 */
const calculateMetadata: CalculateMetadataFunction<Record<string, unknown>> = ({
  props,
}) => ({
  durationInFrames: Math.round(script.meta.totalSec * script.meta.fps),
  fps: script.meta.fps,
  width: script.meta.width,
  height: script.meta.height,
  props,
});

export const Root: React.FC = () => (
  <Composition
    id="Main"
    component={Main}
    // 아래 4개는 calculateMetadata 가 덮어쓴다. 타입 요구를 만족시키기 위한 자리값.
    durationInFrames={1}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{}}
    calculateMetadata={calculateMetadata}
  />
);
