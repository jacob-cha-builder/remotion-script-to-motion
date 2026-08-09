# Remotion Elements — 손으로 만들기 전에 여기부터 본다

Remotion 이 공식으로 배포하는 **드롭인 비디오 빌딩 블록 17종**. 씬 비주얼을 새로 짜기 전에
여기에 이미 있는지 확인한다. 있으면 그 소스를 출발점으로 삼는 것이 처음부터 짜는 것보다 낫다.

## 소스를 가져오는 법

각 Element 상세 페이지에 **전체 소스코드가 그대로 실려 있다.** WebFetch 로 읽으면 된다.

```
https://www.remotion.dev/elements/<category>/<slug>/
```

예: `https://www.remotion.dev/elements/data/number-counter/`

> Studio Protocol(`installInStudio()`)로 Studio 에 바로 꽂는 경로도 있지만,
> **실행 중인 Studio + 브라우저 + 사람의 확인**이 필요하다 (Remotion 4.0.502+).
> 에이전트가 헤드리스로 당길 수 없으므로, 소스를 WebFetch 해서 우리 토큰 체계에 맞춰 옮겨 쓴다.

## 인덱스

| 카테고리 | 이름 | slug | 우리 카탈로그 대응 |
|---|---|---|---|
| backgrounds | Liquid Contours | `backgrounds/liquid-contours` | `SceneFrame` 배경 대체 |
| backgrounds | Notebook Paper | `backgrounds/notebook-paper` | — |
| backgrounds | Paper Texture | `backgrounds/paper-texture` | — |
| backgrounds | Rotating Starburst | `backgrounds/rotating-starburst` | — |
| captions | Moving Pill Captions | `captions/moving-pill-captions` | (자막 — 현재 범위 밖) |
| captions | Popping Word Captions | `captions/popping-word-captions` | (자막 — 현재 범위 밖) |
| captions | Word Highlight Captions | `captions/word-highlight-captions` | (자막 — 현재 범위 밖) |
| data | **Horizontal Bar Chart** | `data/horizontal-bar-chart` | `bar-race` |
| data | **Number Counter** | `data/number-counter` | `big-number` / `number-countup` |
| data | Product Offer | `data/product-offer` | — |
| overlays | Location Lower Third | `overlays/location-lower-third` | — |
| overlays | Name Lower Third | `overlays/lower-third` | — |
| text | **Circle Marker** | `text/circle-marker` | (신규 — 강조 원 표시) |
| text | **Crossed Off** | `text/crossed-off` | (신규 — 항목 취소선) |
| text | News Article Headline Highlight | `text/news-article-headline-highlight` | `sweep-highlight` |
| text | **Strike Through** | `text/strike-through` | (신규) |
| text | **Text Marker** | `text/text-marker` | `underline-accent` / `highlight-sweep` |

## Elements 를 읽고 알게 된 것

### 1. `Interactive.Div` — Studio 에서 직접 편집 가능하게 만든다

```tsx
import {Interactive} from 'remotion';
<Interactive.Div name="Container" style={{...}}>
```

Studio 에서 해당 요소를 골라 값을 조정할 수 있게 된다. 사용자가 렌더 후 미세조정을 원할 때
유용하다. 자세한 것은 공식 `/remotion-interactivity` 스킬에 위임한다.

### 2. `@remotion/rough-notation` — 손그림 느낌의 강조

`text-marker` 와 `news-article-headline-highlight` 가 쓰는 패키지. `Highlight` 컴포넌트로
하이라이터·밑줄·동그라미를 손으로 그린 듯 렌더한다.

우리 `highlight-sweep` / `underline-draw` 는 사각형 div 를 `scaleX` 하는 방식이라 기계적이다.
**따뜻하거나 손맛 있는 톤**이 필요하면 이쪽이 확실히 낫다.

```bash
npm i @remotion/rough-notation
```

> ⚠️ `motion-catalog.json` 에는 넣지 않았다. 카탈로그는 **구현된 것만** 담아야
> 검증기(규칙 6)의 약속이 유지된다. 쓰려면 먼저 `motion.ts` 에 구현하고 카탈로그에 등록한다.

### 3. `@remotion/google-fonts` — 폰트 로딩

```tsx
import {loadFont} from '@remotion/google-fonts/Inter';
loadFont('normal', {subsets: ['latin'], weights: ['800']});
```

현재 우리 `tokens.ts` 는 시스템 폰트 스택(`Pretendard`, `Inter`)에 의존한다.
렌더 머신에 폰트가 없으면 폴백되어 **결과물이 달라진다.** 재현성이 중요하면 이걸로 바꾼다.
한글은 `@remotion/google-fonts/NotoSansKR` 을 쓴다.

### 4. Element 는 props 가 없다 — 하드코딩된 예제다

`number-counter` 는 목표값 24813, 90프레임, 150px 가 전부 코드에 박혀 있다.
**라이브러리가 아니라 출발점이다.** 가져와서 우리 `tokens.ts` / `script.json` 파생값으로
바꿔 넣어야 한다. 그대로 쓰면 아트디렉션 가드(`guard-tokens.mjs`)에 걸린다.

## 쓰는 순서

1. `infographic-catalog.md` 에서 씬에 필요한 인포그래픽을 정한다
2. 위 표에서 대응하는 Element 가 있는지 본다
3. 있으면 상세 페이지를 WebFetch 해서 소스를 읽는다
4. **그대로 붙여넣지 않는다** — 하드코딩 값을 `tokens.ts` 참조와 `framesOf()` 파생으로 바꾼다
5. `guard-tokens.mjs` 로 확인한다
