# 인포그래픽 추천 (P1b)

대본이 검증을 통과하면, **코드를 쓰기 전에** 씬마다 어떤 인포그래픽을 얹을지 정한다.
`scripts/script-report.mjs` 가 글자수와 함께 후보를 자동 추천하므로, 그 출력을 받아 확정한다.

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/script-report.mjs" script.json
```

## 선택 규칙 — 글자수가 1차 기준이다

씬에 얹을 수 있는 그래픽 밀도는 **남는 공간**이 결정하고, 남는 공간은 글자수가 결정한다.

| 글자수 | 화면 점유 | 얹을 수 있는 인포그래픽 |
|---|---|---|
| ~8자 | 낮음 | 무엇이든. 큰 숫자 + 격자/차트/링 전부 가능 |
| 9–16자 | 중간 | 단일 그래픽 1개 (게이지 / 링 / 막대 3~4개) |
| 17–24자 | 높음 | 미니멀만 (밑줄 / 화살표 / 도트 1줄) |
| 25자~ | 포화 | **텍스트만.** 그래픽을 얹으면 과밀 실패 |

세로형(9:16)은 위 구간을 **각 8자씩 낮춰** 적용한다.

## 카탈로그

### 수치형 — 숫자 하나가 주인공일 때

| 이름 | 언제 | 글자 예산 | 필요 모션 |
|---|---|---|---|
| `big-number` | 수치 1개를 압도적으로 | ~12자 | `number-countup` |
| `gauge-bar` | 누적/소진되는 양 | ~16자 | `progressOver` |
| `dot-grid` | 개수·규모의 체감 (팀 수, 건수) | ~16자 | `progressOver` 스태거 |
| `ring-progress` | 시간 경과·완료율 | ~16자 | `draw-in` / `progressOver` |
| `stat-stack` | 수치 2~3개 비교 | ~10자 | `stagger-in` |

### 관계형 — 변화·비교를 보여줄 때

| 이름 | 언제 | 글자 예산 | 필요 모션 |
|---|---|---|---|
| `before-after` | 전/후 대비 | ~14자 | `wipe-in` |
| `converge-bars` | 여럿 → 하나로 수렴 | ~16자 | `progressOver` |
| `bar-race` | 항목 간 순위·크기 비교 | ~12자 | `progressOver` |
| `flow-arrow` | 단계 이동·방향 | ~20자 | `draw-in` |

### 나열형 — 항목이 쌓일 때

| 이름 | 언제 | 글자 예산 | 필요 모션 |
|---|---|---|---|
| `checklist` | 잔무·조건이 하나씩 쌓임 | ~16자 | `progressOver` 순차 |
| `step-dots` | 3단계 이하 절차 | ~18자 | `stagger-in` |

> 나열형은 **세로형에서 4개를 넘기지 않는다.** 화면 폭이 좁아 항목이 줄바꿈되면 즉시 무너진다.

### 미니멀 — 글자가 이미 화면을 채웠을 때

| 이름 | 언제 | 글자 예산 | 필요 모션 |
|---|---|---|---|
| `underline-accent` | 강조 구간만 표시 | 제한 없음 | `underline-draw` |
| `sweep-highlight` | 강조 배경 스와이프 | 제한 없음 | `progressOver` |
| `arrow-push` | CTA 방향 지시 | ~20자 | `progressOver` |
| `text-only` | 문장 자체가 임팩트 | 제한 없음 | `stagger-in` + ambient |

## role 별 기본 추천

| role | 1순위 | 2순위 | 피할 것 |
|---|---|---|---|
| `hook` | `big-number` | `gauge-bar` | 나열형 (첫 4초에 읽을 시간 없음) |
| `problem` | `checklist` | `sweep-highlight` | `big-number` (수치는 hook 이 이미 씀) |
| `solution` | `converge-bars` | `before-after` | 나열형 |
| `how` | `ring-progress` | `step-dots` | `dot-grid` |
| `proof` | `dot-grid` | `big-number` | `text-only` (증명엔 시각 근거가 필요) |
| `cta` | `arrow-push` | `underline-accent` | 수치형 전부 |

## 반복 금지

**같은 인포그래픽을 두 번 쓰지 않는다.** 4씬짜리 숏폼이면 4종류가 전부 달라야 한다.
`hook` 이 `big-number` 를 쓰면 `proof` 는 `dot-grid` 로 간다 — 둘 다 수치형이지만 형태가 다르다.

단, **핵심 수치가 하나로 관통하는 구조**에서는 같은 숫자를 씬마다 *다른 형태로* 변주한다:
`big-number` → `gauge-bar` → `dot-grid` → `underline-accent`. 숫자는 같고 그릇이 바뀐다.

## 공식 Remotion Element 가 이미 있는 것

손으로 짜기 전에 확인한다. 각 페이지에 전체 소스가 실려 있어 WebFetch 로 읽을 수 있다.
목록과 사용법은 `references/remotion-elements.md`.

| 우리 이름 | 공식 Element |
|---|---|
| `big-number` | [data/number-counter](https://www.remotion.dev/elements/data/number-counter/) |
| `bar-race` | [data/horizontal-bar-chart](https://www.remotion.dev/elements/data/horizontal-bar-chart/) |
| `sweep-highlight` | [text/news-article-headline-highlight](https://www.remotion.dev/elements/text/news-article-headline-highlight/) |
| `underline-accent` | [text/text-marker](https://www.remotion.dev/elements/text/text-marker/) |
| (신규 후보) | `text/circle-marker`, `text/crossed-off`, `text/strike-through` |

`text-marker` 계열은 `@remotion/rough-notation` 으로 손그림 느낌을 낸다. 우리 구현은 사각형
`scaleX` 라 기계적이므로, 따뜻한 톤이 필요하면 그쪽이 낫다.

## 확정 후

씬마다 고른 인포그래픽 이름을 `script.json` 의 `intent` 에 적어둔다. 검증 대상은 아니지만
P3 코드 생성이 이걸 읽고 구현한다.

**`references/prompt-patterns.md` 의 규칙대로 쓴다** — 이름만 적지 말고 동사·방향·씬 내
타이밍 구간까지 넣는다.

```jsonc
// 부족
{ "intent": "big-number — 10을 압도적으로, 카운트업" }

// 충분
{ "intent": "big-number — 0에서 10까지 씬 45%에 걸쳐 카운트업, 단위는 숫자와 같은 줄 baseline 정렬" }
```
