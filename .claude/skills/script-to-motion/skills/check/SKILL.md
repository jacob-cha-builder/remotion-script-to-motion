---
name: check
description: script.json 대본을 검증 규칙 10가지로 검사한다. 대본을 고친 뒤 코드 생성 전에 통과 여부를 확인할 때 사용.
---

# 대본 검증

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/validate-script.mjs" <path>/script.json
```

인자가 없으면 현재 디렉터리와 `examples/*/script.json` 에서 찾는다.

## 종료코드

| 코드 | 의미 | 다음 행동 |
|---|---|---|
| 0 | 통과 | 코드 생성 진행 가능 |
| 1 | 규칙 위반 | 메시지가 지목한 씬/규칙을 고친다. **코드 생성 금지** |
| 2 | 파일 없음/JSON 파싱 실패 | 경로와 JSON 문법 확인 |

## 검증 규칙

| # | 규칙 | 막는 실패 |
|---|---|---|
| 1 | 필수 필드 + 타입 | 기본 |
| 2 | 타임라인 연속성 (`start + dur == 다음 start`) | 구멍 → 검은 프레임 / 겹침 |
| 3 | `Σ durationSec == meta.totalSec` | 길이 드리프트 |
| 4 | `durationSec × fps` 정수 | 1프레임 깜빡임 |
| 5 | `emphasis` ⊂ `copy` | 하이라이트 크래시 |
| 6 | `motion`/`exit` 이 카탈로그에 존재 | 없는 프리미티브 환각 |
| 7 | `copy` ≤ 7단어 또는 ≤ 32자 | 화면 과밀 |
| 8 | `durationSec` ≥ 1.2초 | 읽을 수 없는 컷 |
| 9 | `id` 유일 + kebab-case | 파일명 충돌 |
| 10 | `role: hook` 정확히 1개, 첫 씬 | 구조 붕괴 |

규칙 6의 화이트리스트 원본은 `assets/motion-catalog.json` 이다. 새 모션을 쓰려면 카탈로그에 먼저 추가하고 `motion.ts` 에 구현해야 한다.
