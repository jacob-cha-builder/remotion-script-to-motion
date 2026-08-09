# 아트디렉션 잠금 (P2)

**코드를 쓰기 전에 토큰을 먼저 확정한다.** 이 순서를 뒤집으면 씬마다 색과 크기가 제각각인 결과물이 나온다 — 결과물이 "AI 가 만든 티" 나는 가장 큰 원인이다.

## 토큰 파일

`src/tokens.ts` 하나에 전부 모은다. 씬 코드는 이 파일만 참조한다.

```ts
export const palette = { bg, bgLift, surface, text, textMuted, accent, accentWarm, danger, line };
export const type = { display, h1, h2, body, caption, family, weight*, tightTracking };
export const springs = { entrance, soft, pop, count };
export const easings = { outExpo, inOutQuint, outQuart };
export const timing = { staggerSec, enterSec, exitRatio, crossfadeSec };
```

## 팔레트 결정 규칙

- **배경 1개, 텍스트 2단계(주/보조), 액센트 1개**로 시작한다. 액센트 2개 이상은 초심자 실수다.
- 다크 배경(#0B0D10 계열)이 모션그래픽에서 가장 안전하다. 글로우·그레인이 자연스럽게 얹힌다.
- 액센트는 **경고/문제 씬용 1개**(warm/red)와 **해결/브랜드용 1개**(cool/blue)까지만 허용한다.
- 대비: 본문 텍스트는 배경 대비 4.5:1 이상. 큰 디스플레이 텍스트도 3:1 아래로 내려가지 않는다.

## 타입스케일

1920 폭 기준으로 정하고 `scaleFor(width)` 로 다른 해상도에 비례 적용한다.

- `display` 는 숫자/한 단어 전용. 문장에 쓰지 않는다.
- 한 화면에 크기 단계는 **최대 3개**. 그 이상이면 계층이 무너진다.
- 큰 텍스트일수록 자간을 좁힌다 (`tightTracking: -0.03em`).

## 모션 언어

- **선형 보간 금지.** `spring()` 이 기본, 부득이하면 `Easing.bezier` + `clamp`.
- 등장 0.6~0.9초, 퇴장은 그 **0.6배** (`timing.exitRatio`). 퇴장이 등장보다 느리면 굼떠 보인다.
- stagger 간격 0.08~0.12초. 요소가 6개를 넘으면 간격을 줄인다.
- 정지 요소에도 `breathe()` 를 건다. 완전 정지 프레임은 영상이 멈춘 것처럼 보인다.
- 진폭은 절제한다. `breathe` 는 1~2%, `drift` 는 10~20px 수준.

## 잠근 뒤의 금지 사항

훅(`guard-tokens.mjs`)이 씬 `.tsx` 저장 시 자동 검사한다:

| 금지 | 대신 |
|---|---|
| `color: '#ff0000'` | `color: palette.danger` |
| `rgba(0,0,0,0.5)` | `palette.bg` + `opacity`, 또는 토큰에 알파 붙이기 `` `${palette.bg}80` `` |
| `durationInFrames={120}` | `framesOf(scene.durationSec)` |
| `frame - 45` | `frame - Math.round(0.5 * fps)` |
| easing 없는 `interpolate` | `spring()` 또는 `Easing.bezier` |

## 씬마다 시각을 바꾼다

토큰은 고정하되 **적용 방식은 씬마다 달라야 한다.** `SceneFrame` 의 `glow` / `glowPos` 를 씬마다 다르게 주고, 레이아웃(좌정렬 / 중앙 / 좌우 분할 / 격자)도 바꾼다. 같은 구도가 3씬 연속이면 그 자체로 QA 실패다.
