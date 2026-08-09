---
name: qa
description: 렌더 전에 비트별 프레임을 뽑아 콘택트시트로 시각 검수한다. 영상이 밋밋하거나 텍스트가 잘리는지 확인할 때, 최종 렌더 직전에 사용.
---

# 시각 QA (P4)

## 1. 콘택트시트 생성

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/contact-sheet.mjs" \
  --script script.json --entry src/index.ts --comp Main --out out/qa/ --scale 0.5
```

씬마다 25% / 75% 두 지점을 뽑는다. 한 번의 `remotion render --frames=... --sequence` 로 처리하므로 씬 수와 무관하게 번들은 1회만 돈다.

산출물:
- `out/qa/contact-sheet.png` — 격자 합성본
- `out/qa/frames/NN_<씬id>_<지점>pct_f<프레임>.png` — 개별 프레임

## 2. 실제로 본다

**`contact-sheet.png` 를 Read 툴로 연다.** 파일 생성 여부만 확인하고 통과시키는 것은 QA 가 아니다.

## 3. 채점

`references/qa-rubric.md` 의 6개 항목으로 각 비트를 본다:

| 항목 | 실패 신호 |
|---|---|
| 가독성 | 텍스트 대비 부족, 잘림, 세이프에어리어 침범 |
| 계층 | 한 프레임에 동급 강조 2개 이상 |
| 구도 | 중앙 뭉침, 여백 붕괴, 한쪽 쏠림 |
| 컬러 | `tokens.ts` 밖 색상 |
| 중간상태 | 전환 중 스틸이 찌그러져 보임 |
| 공백 | 빈 프레임 / 요소가 겹쳐 읽힘 |

## 4. 고치고 부분 재확인

문제가 있는 씬만 고친 뒤, 전체 렌더 대신 해당 구간만 확인한다:

```bash
npx remotion render src/index.ts Main out/probe.mp4 --frames=<시작>-<끝>
```

프레임 번호는 `씬 startSec × fps` 로 계산한다.

## 5. 상한

**라운드 3회를 넘기지 않는다.** 3회 안에 통과하지 못하면 남은 이슈를 사용자에게 구체적으로 보고하고 판단을 넘긴다. 무한 루프는 금지.
