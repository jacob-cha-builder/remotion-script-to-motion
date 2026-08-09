import scriptJson from '../script.json';

export type SceneRole = 'hook' | 'problem' | 'solution' | 'how' | 'proof' | 'cta';

export type Scene = {
  id: string;
  role: SceneRole;
  startSec: number;
  durationSec: number;
  copy: string;
  emphasis?: string;
  intent?: string;
  motion?: string[];
  exit?: string;
};

export type Script = {
  meta: {
    title?: string;
    fps: number;
    width: number;
    height: number;
    totalSec: number;
    aspect?: '16:9' | '9:16' | '1:1';
    tone?: string;
  };
  scenes: Scene[];
};

export const script = scriptJson as Script;

/** 대본에서 프레임을 파생시키는 유일한 경로. 씬 코드는 프레임 상수를 갖지 않는다. */
export const framesOf = (sec: number) => Math.round(sec * script.meta.fps);

export const sceneById = (id: string): Scene => {
  const s = script.scenes.find((x) => x.id === id);
  if (!s) throw new Error(`script.json 에 씬 "${id}" 가 없습니다`);
  return s;
};

/** copy 를 emphasis 기준으로 [앞, 강조, 뒤] 로 쪼갠다. */
export const splitEmphasis = (scene: Scene): [string, string, string] => {
  if (!scene.emphasis) return [scene.copy, '', ''];
  const i = scene.copy.indexOf(scene.emphasis);
  if (i < 0) return [scene.copy, '', ''];
  return [
    scene.copy.slice(0, i),
    scene.emphasis,
    scene.copy.slice(i + scene.emphasis.length),
  ];
};
