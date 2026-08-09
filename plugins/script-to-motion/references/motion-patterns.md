# 모션 프리미티브 (P3)

이름의 **단일 진실 공급원은 `assets/motion-catalog.json`** 이다. 검증기(규칙 6)가 이 파일을 화이트리스트로 읽으므로, 카탈로그에 없는 이름을 `script.json` 에 쓰면 대본 검증에서 거부된다.

새 모션을 추가하려면: ① `motion-catalog.json` 에 등록 → ② `src/motion.ts` 에 구현 → ③ 씬에서 사용.

## 시그니처 규약

모든 프리미티브는 `ctx = { frame, fps }` 를 첫 인자로 받는다. 프레임 상수를 내부에 두지 않고 전부 `fps` 파생으로 계산한다.

```tsx
const frame = useCurrentFrame();
const { fps, width } = useVideoConfig();
const ctx = { frame, fps };
const s = scaleFor(width);   // 1920 기준 크기를 현재 해상도로 보정
```

## enter — 등장

| 이름 | 반환 | 쓰임 |
|---|---|---|
| `staggerIn(ctx, i)` | `{opacity, transform}` | 기본. `i` 를 0,1,2… 로 주면 순차 등장 |
| `riseIn(ctx, i)` | `{opacity, transform}` | 무게감 있는 상승. 큰 제목에 |
| `scaleIn(ctx, i)` | `{opacity, transform}` | 중심에서 확대. 브랜드 노출 순간에 |
| `wipeIn(ctx, i)` | `{clipPath}` | 마스크가 열림. 텍스트 블록에 |
| `blurIn(ctx, i)` | `{opacity, filter}` | 초점이 맞아드는 느낌 |
| `drawIn(ctx, i)` | `{strokeDashoffset, opacity}` | SVG 패스/링을 그림 |
| `typewriter(ctx, total, cps)` | `number` (노출 글자수) | `copy.slice(0, n)` 에 쓴다 |
| `numberCountup(ctx, target, i)` | `number` | 0→target 스프링 증가 |

`staggerIn` 계열은 스프레드로 붙인다:
```tsx
<div style={{ ...staggerIn(ctx, 0), color: palette.text }} />
<div style={{ ...staggerIn(ctx, 1) }} />   // 0.09초 뒤 등장
```

## emphasis — 강조

| 이름 | 반환 | 쓰임 |
|---|---|---|
| `highlightSweep(ctx, delaySec)` | `0→1` | 강조 배경을 `scaleX` 로 훑음 |
| `underlineDraw(ctx, delaySec)` | `0→1` | 밑줄 폭 `width: ${p*100}%` |
| `scalePop(ctx, delaySec)` | `≈1` | `transform: scale()` 에 직접 |
| `colorShift(ctx, delaySec)` | `0→1` | 두 색 사이 보간 계수 |

강조는 **등장이 끝난 뒤** 걸어야 눈에 띈다. `delaySec` 기본값 0.4~0.55 가 그 이유다.

## ambient — 완전 정지 방지

| 이름 | 반환 | 쓰임 |
|---|---|---|
| `breathe(ctx, periodSec, amount)` | `≈1` | 미세 스케일. 진폭 1~2% |
| `drift(ctx, periodSec, px)` | `{x, y}` | 배경 요소 느린 이동 |
| `parallax(ctx, depth)` | `transform` 문자열 | 레이어별 속도차 |

**모든 씬에 최소 하나는 건다.** 정지 프레임은 영상이 멈춘 것처럼 보인다.

## exit — 퇴장

`SceneFrame` 이 `exitProgress(ctx, durationInFrames)` 로 자동 처리한다. 씬 코드가 따로 퇴장을 구현할 필요는 없다. `script.json` 의 `exit` 값은 의도 기록용이며, 씬별로 다르게 처리하고 싶을 때만 직접 읽어 분기한다.

## 씬 골격

```tsx
export const XxxScene: React.FC = () => {
  const scene = sceneById('<id>');                 // script.json 에서 읽는다
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const ctx = { frame, fps };
  const s = scaleFor(width);
  const [before, emph, after] = splitEmphasis(scene);

  return (
    <SceneFrame
      durationInFrames={framesOf(scene.durationSec)}   // 하드코딩 금지
      glow={palette.accent}                            // 씬마다 다르게
      glowPos={['30%', '40%']}                         // 씬마다 다르게
    >
      {/* 씬 고유 비주얼 */}
    </SceneFrame>
  );
};
```

`Main.tsx` 의 `REGISTRY` 에 씬 id 를 등록하는 것을 잊지 마라. 누락되면 렌더 시 명시적 에러가 난다.

## 반복을 피하는 체크

3씬 연속으로 같은 것을 쓰고 있다면 멈추고 바꾼다:
- 정렬 (좌 / 중앙 / 좌우 분할 / 격자)
- `glow` 색과 위치
- 지배적 요소 (텍스트만 / 숫자 / SVG 도형 / 격자 도트)
- 등장 방향 (아래→위 / 좌→우 / 중심→확대)
