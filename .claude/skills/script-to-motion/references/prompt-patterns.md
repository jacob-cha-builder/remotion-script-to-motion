# 좋은 지시문의 해부 — `intent` 를 어떻게 쓸 것인가

`intent` 는 검증되지 않지만 **P3 코드 생성 품질을 사실상 혼자 결정한다.** 여기가 부실하면
씬이 전부 "가운데 큰 글자 + 페이드인"으로 수렴한다. AI 티가 나는 결과물의 진짜 원인이다.

아래는 [remotion.dev/prompts](https://www.remotion.dev/prompts) 의 실제 커뮤니티 프롬프트를
읽고 추린 것이다. 인용은 원문 그대로다.

## 관찰: 잘 되는 지시문은 두 갈래다

### 갈래 A — 샷 리스트 (동사 + 순서 + 구체값)

가장 높은 반응(333)을 얻은 프롬프트는 **짧지만 전부 동사와 순서**다:

> "make a new composition and add a map and zoom out of LA while staying focused on it.
> once done, animate a line from LA to NY and make the camera follow it. add another stop
> to the trip, this time we go to paris. animate the eiffel tower and show it in 3D!"
> — Travel Route on Map, Claude Code / Opus 4.5

형용사가 없다. `zoom out` `staying focused` `animate a line` `camera follow` `add another stop`
— 전부 **무엇이 어떻게 움직이는가**다.

정밀한 쪽은 수치까지 박는다:

> "slowly, very subtly, zoom into it and slightly rotate the article in 3d from left to right.
> **the overall rotation should be around 15deg for each axis.** at the beginning, blur the whole
> composition and unblur it **over 1 second.** after the blur is done, evolve a highlighter
> **from left to right** using rough.js over the words "government shutdown" and "funding lapses".
> **make sure the marker appears behind the text.**"
> — News Article Headline Highlight, Claude Code / Opus 4.5

주목할 것: **레이어 순서까지 지정한다** ("marker appears behind the text"). 이런 건
안 적으면 반드시 틀리는 종류의 디테일이다.

이징을 요소별로 나눠 지정하기도 한다:

> "use a ease-out animation for pressing in the button and a spring animation with a
> slight bounce once the button is released."
> — Transparent Call-To-Action Overlay

### 갈래 B — 인터뷰 요청

> "The app has a LOT of features/functionality, so take guidance from the marketing home page
> for what to highlight, while keeping language simple and to-the-point. **Really grill me with
> questions to nail down exactly how the final video should look/feel and what content should
> be there.** The ultimate goal is to replicate what me, the founder, would be showing with
> a product demo with a customer."
> — Product Demo for Presscut, Claude Code / Opus 4.5

소재가 크고 모호할수록 **먼저 캐묻는 쪽**이 이긴다. 우리 P1a 인터뷰가 이 자리를 대신한다.
사용자가 이걸 요청하기 전에 우리가 먼저 한다.

## `intent` 작성 규칙

위 관찰을 그대로 적용한다.

| 나쁨 | 좋음 |
|---|---|
| `텍스트 표시` | `big-number — 0에서 10까지 씬 45%에 걸쳐 카운트업, 단위는 숫자와 같은 줄 baseline 정렬` |
| `충격적 통계` | `gauge-bar — 10칸이 좌→우로 차오르다 후반에 우측부터 회색으로 붕괴` |
| `해결책 제시` | `converge-bars — 흩어진 막대 4개가 씬 28~85%에 걸쳐 가운데 하나로 수렴, 나머지는 페이드아웃` |
| `행동 유도` | `arrow-push — 밑줄이 좌→우로 그려진 뒤 화살표가 씬 끝까지 오른쪽으로 밀려 나감` |

**포함할 것**
1. **인포그래픽 이름** — `infographic-catalog.md` 의 것
2. **동사와 방향** — 차오른다 / 수렴한다 / 밀려 나간다, 좌→우, 아래→위
3. **씬 내 타이밍 구간** — "씬 28~85%에 걸쳐". 이게 있어야 P3 가 `progressOver()` 를 쓴다.
   없으면 스프링 등장만 쓰고 씬 후반이 정지 화면이 된다
4. **틀리기 쉬운 디테일** — 레이어 순서, baseline 정렬, 색이 바뀌는 지점

**빼야 할 것**
- 형용사만 있는 서술 ("세련되게", "임팩트 있게") — 검증도 구현도 불가능
- 화면에 뜰 문구 — 그건 `copy` 다. `intent` 는 절대 화면에 렌더하지 않는다

## "use remotion best practices"

@Remotion 공식 프롬프트는 전부 이 문장으로 연다. 공식 스킬(`/remotion-best-practices`)을
불러오는 트리거다. **공식 Remotion 스킬이 설치돼 있으면 P3 시작 시 이 표현을 쓴다.**
설치돼 있지 않으면 웹 문서를 참조한다.

## 운영 가드레일도 지시문에 넣는다

> "when installing new dependencies, check for existing lockfiles and use the right package manager."

우리 파이프라인에서 대응하는 것:
- 새 의존성은 `examples/<project>/package.json` 에만 추가한다
- 렌더 산출물은 `out/` 에만 쓴다
- 전역 설정을 건드리지 않는다
