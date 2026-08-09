---
name: new
description: 자연어 요청에서 모션그래픽 영상을 만든다. 대본(script.json) → 아트디렉션 → Remotion 코드 → 프레임 단위 시각 QA → 렌더 순으로 게이트를 통과시킨다. 사용자가 영상/모션그래픽/애니메이션/explainer/숏폼을 만들어 달라고 할 때 사용.
---

# script-to-motion: 대본 기반 모션그래픽 파이프라인

자연어 한 줄을 **검증 가능한 대본**으로 먼저 굳히고, 그 대본을 단일 진실 공급원으로 삼아 영상을 만든다.

## 절대 규칙

1. **대본 검증 통과 전에는 씬 코드를 한 줄도 쓰지 않는다.** 게이트를 건너뛰지 마라.
2. **길이·타이밍 숫자를 코드에 쓰지 않는다.** 전부 `script.json` → `framesOf()` 파생.
3. **Remotion API 를 기억에 의존해 쓰지 않는다.** 불확실하면 `/remotion-docs` 나 `/remotion-markup` 에 위임한다 (설치돼 있을 때). 없으면 웹에서 확인한다.
4. **P4 시각 QA 를 건너뛰고 최종 렌더를 하지 않는다.** 프레임을 실제로 보기 전에는 완료가 아니다.

## P0 — 사전점검

```bash
node --version              # 22+ 권장
npx remotion versions       # Remotion 프로젝트인지 확인
```

- Remotion 프로젝트가 없으면 `npx create-video --yes --blank <name>` 로 만든다.
- `examples/demo-30s/` 가 참고 구현이다. 구조(`script.ts`, `tokens.ts`, `motion.ts`, `SceneFrame.tsx`, `Main.tsx`, `scenes/`)를 그대로 따른다.

## P1a — 인터뷰 (대본 전)

`references/interview.md` 를 읽는다. **최대 3문항**, AskUserQuestion 으로 묻는다.

반드시 확보할 것: ① 소재 ② 핵심 수치 1개 ③ 길이 + 화면비.
나머지(fps, 씬 수, 배경, 이징)는 **묻지 말고 기본값을 채택하고 알린다.**

사용자가 이미 말한 것은 다시 묻지 않는다. 요청에 소재·길이·화면비가 다 들어 있으면 인터뷰를 건너뛰고 브리프만 보여준다.

인터뷰가 끝나면 대본을 쓰기 전에 브리프를 한 번 확인시킨다:
```
소재 / 핵심 수치 / 초·화면비·씬 수 / 구조(hook→…→cta)
```

## P1 — 대본 (게이트 1)

`references/script-writing.md` 를 읽고 `script.json` 을 쓴다.

구조는 hook → problem → solution → how → proof → cta. **hook 은 정확히 1개, 첫 씬**이며 제품이 아니라 시청자의 문제로 연다.

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/validate-script.mjs" <path>/script.json
```

**exit 0 이 나올 때까지 다음 단계로 가지 않는다.** 검증기는 타임라인 구멍/겹침, 길이 합 불일치, 프레임 비정수, emphasis 오류, 존재하지 않는 모션명, 화면 과밀, 너무 짧은 컷, id 중복, hook 구조를 거부한다. 위반 메시지는 어느 씬 어느 규칙인지 정확히 말해준다 — 그대로 고쳐라.

> 이 파일을 Write/Edit 하면 훅이 자동으로 검증기를 돌린다. stderr 에 위반이 뜨면 즉시 고쳐라.

## P1b — 글자수 + 인포그래픽 추천

검증을 통과하면 **코드를 쓰기 전에** 씬마다 어떤 그래픽을 얹을지 정한다.

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/script-report.mjs" <path>/script.json
```

씬별 글자수/단어수/밀도와 추천 인포그래픽이 표로 나온다. 밀도가 '포화'면 그래픽을 얹지 말고 텍스트만 간다 — 억지로 얹으면 P4 에서 과밀로 떨어진다.

`references/infographic-catalog.md` 에서 후보를 확인한다. **같은 인포그래픽을 두 번 쓰지 않는다** — 리포트가 중복을 경고한다.

확정했으면 `references/prompt-patterns.md` 를 읽고 그 규칙대로 `intent` 를 쓴다. `intent` 는 검증되지 않지만 **P3 코드 품질을 사실상 혼자 결정한다.** 형용사만 적으면 씬이 전부 "가운데 큰 글자 + 페이드인"으로 수렴한다.

```jsonc
// 나쁨 — 구현할 수 없다
{ "intent": "충격적 통계" }

// 좋음 — 인포그래픽 이름 + 동사·방향 + 씬 내 타이밍 구간 + 틀리기 쉬운 디테일
{ "intent": "big-number — 0에서 10까지 씬 45%에 걸쳐 카운트업, 단위는 숫자와 같은 줄 baseline 정렬" }
```

**타이밍 구간("씬 28~85%에 걸쳐")을 반드시 넣는다.** 이게 있어야 P3 가 `progressOver()` 를 쓰고, 없으면 스프링 등장만 써서 씬 후반이 정지 화면이 된다 — P4 에서 가장 자주 떨어지는 지점이다.

## P2 — 아트디렉션 (게이트 2)

`references/art-direction.md` 를 읽고 `src/tokens.ts` 를 확정한다. **코드를 쓰기 전에 팔레트·타입스케일·스프링 프리셋을 먼저 잠근다.**

잠근 뒤부터는:
- 색상은 `palette.*` 참조만. 인라인 hex/rgba 금지.
- 타이밍은 `timing.*` 과 `fps` 파생만.
- 스프링은 `springs.*` 프리셋만.

> 씬 `.tsx` 를 Write/Edit 하면 훅이 `guard-tokens.mjs` 를 돌려 위반을 stderr 로 알린다.

## P3 — 코드 생성 (게이트 3)

**먼저 `references/remotion-elements.md` 를 본다.** Remotion 공식 Element 17종 중 이 씬이 필요한 것이 이미 있으면, 상세 페이지를 WebFetch 해서 소스를 읽고 출발점으로 삼는다 (각 페이지에 전체 소스가 실려 있다). 처음부터 짜는 것보다 낫다. 단 하드코딩 값을 `tokens.ts` 참조와 `framesOf()` 파생으로 반드시 바꾼다 — 그대로 붙이면 가드에 걸린다.

공식 Remotion 스킬이 설치돼 있으면 이 단계를 `use remotion best practices` 로 연다.

그다음 `references/motion-patterns.md` 를 읽는다. 모션 이름은 `assets/motion-catalog.json` 이 단일 진실 공급원이며 검증기 화이트리스트와 동일하다.

**씬 하나 = 파일 하나.** 씬마다 시각적 처리를 다르게 한다 — 같은 레이아웃 반복이 "AI 티" 나는 결과물의 주범이다.

각 씬은:
```tsx
const scene = sceneById('<id>');                       // script.json 에서 읽음
<SceneFrame durationInFrames={framesOf(scene.durationSec)} glow={...}>
```

`Main.tsx` 의 `REGISTRY` 에 씬 id ↔ 컴포넌트를 등록한다. 누락되면 렌더 시 즉시 에러가 난다.

검증:
```bash
npx tsc --noEmit
npx remotion compositions src/index.ts
```

## P4 — 시각 QA (게이트 4, 가장 중요)

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/contact-sheet.mjs" \
  --script script.json --entry src/index.ts --comp Main --out out/qa/ --scale 0.5
```

**생성된 `out/qa/contact-sheet.png` 를 Read 툴로 실제로 열어서 본다.** 파일이 만들어졌다는 사실만으로 통과시키지 마라.

`references/qa-rubric.md` 의 6개 항목으로 채점하고, 실패한 비트만 고친 뒤 재실행한다.

- 수정 확인은 부분 렌더로: `npx remotion render src/index.ts Main out/probe.mp4 --frames=<구간>`
- **라운드 3회 상한.** 초과하면 남은 이슈를 사용자에게 보고하고 멈춘다.

## P5 — 렌더

```bash
npx remotion render src/index.ts Main out/video.mp4
```

완료 보고에는 반드시 포함한다: 최종 파일 경로, 길이/해상도/fps, QA 라운드 수, 남은 이슈(있다면).

## 대본을 고치면 영상이 따라온다

`script.json` 의 `totalSec` 이나 씬 `durationSec` 을 바꾸면 **코드 수정 없이** 길이와 타이밍이 전부 따라온다. `calculateMetadata` 가 `script.json` 에서 파생시키기 때문이다. 타이밍을 바꾸고 싶으면 코드가 아니라 대본을 고쳐라.

## 참조 파일 (필요할 때만 읽는다)

| 파일 | 언제 |
|---|---|
| `references/interview.md` | P1a 인터뷰 / 정보 밀도 예산 |
| `references/script-writing.md` | P1 대본 쓸 때 |
| `references/infographic-catalog.md` | P1b 인포그래픽 고를 때 |
| `references/prompt-patterns.md` | P1b `intent` 쓸 때 — 커뮤니티 프롬프트에서 뽑은 규칙 |
| `references/art-direction.md` | P2 토큰 잠글 때 |
| `references/remotion-elements.md` | P3 시작 시 — 공식 Element 17종에 이미 있는지 확인 |
| `references/motion-patterns.md` | P3 씬 코드 쓸 때 |
| `references/qa-rubric.md` | P4 채점할 때 |
| `assets/motion-catalog.json` | 사용 가능한 모션 이름 확인 |

## 세로형(9:16) 추가 규칙

| | 16:9 | 9:16 |
|---|---|---|
| 씬당 글자 | 32자 / 7단어 | **20자 / 5단어** |
| 20초 씬 수 | 4–5 | **4** |
| 세이프 에어리어 | 5% | **상하 12%** (UI 오버레이 회피) |
| 지배 요소 위치 | 자유 | **화면 중앙 40~60% 밴드** |
| 나열형 항목 | 6개까지 | **4개 이하** |

세로형은 같은 글자가 훨씬 크게 잡히고 시청 거리가 가까워, 가로형 기준으로 만들면 반드시 과밀로 떨어진다.
