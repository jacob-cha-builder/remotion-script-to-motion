# script-to-motion

자연어 요청을 **검증 가능한 대본(`script.json`)** 으로 먼저 굳히고, 그 대본을 단일 진실 공급원으로 삼아 Remotion 모션그래픽을 만드는 Claude Code 플러그인.

```
자연어 → [P1 대본] → [P2 아트디렉션] → [P3 코드] → [P4 시각QA] → [P5 렌더]
          검증기 10규칙   토큰 잠금      tsc+comp    콘택트시트를
          기계 거부       가드 훅        무오류      실제로 보고 채점
```

## 설치

GitHub 리포를 마켓플레이스로 등록하고 설치한다. 버전은 git 태그로 관리된다.

```bash
claude plugin marketplace add jacob-cha-builder/remotion-script-to-motion --scope local
claude plugin install script-to-motion@remotion-script-to-motion --scope local
```

비공개 리포이므로 git 인증이 되어 있어야 한다 (`gh auth login`).

### `--scope` 는 "어느 설정 파일에 기록할지"만 정한다

명령은 셋 다 동일하고, 기능 차이도 없다. 기록 위치만 다르다.

| scope | 기록 위치 | 적용 범위 |
|---|---|---|
| `local` | `.claude/settings.local.json` (gitignore 됨) | **이 프로젝트, 나만** |
| `project` | `.claude/settings.json` (커밋됨) | 이 리포를 클론한 모든 사람 |
| `user` (기본) | `~/.claude/settings.json` | 내 모든 프로젝트 |

팀과 공유하려면 `--scope project`, 어디서나 쓰려면 `--scope user`.

> 어떤 scope 를 쓰든 플러그인 본체는 `~/.claude/plugins/cache/` 에 복사된다 (약 112K).
> 이건 마켓플레이스 방식의 동작 방식이지 scope 와 무관하다.

## 업데이트

리포에 변경을 푸시하고 태그를 붙이면, 설치된 쪽에서 당겨받는다.

**리포 쪽 (릴리스)**
```bash
# plugins/script-to-motion/.claude-plugin/plugin.json 의 version 을 올리고
# .claude-plugin/marketplace.json 의 version 도 같은 값으로 맞춘 뒤
git add -A && git commit -m "..." && git push
claude plugin tag --push          # script-to-motion--v<version> 태그 생성·푸시
```

`claude plugin tag` 는 태그를 만들기 전에 플러그인을 검증하고, `plugin.json` 과 마켓플레이스
항목의 version 이 일치하는지, 작업 트리가 깨끗한지 확인한다. 어긋나면 거부한다.

**설치한 쪽 (갱신)**
```bash
claude plugin marketplace update remotion-script-to-motion
claude plugin update script-to-motion@remotion-script-to-motion --scope local
```

갱신 뒤 `/reload-plugins` 또는 재시작해야 적용된다.

> ⚠️ 두 인자 모두 생략하면 실패한다. 직접 겪은 것:
> - `claude plugin update script-to-motion` → `Plugin "script-to-motion" not found`
>   `--scope` 기본값이 `user` 라서 local 설치를 못 찾는다
> - `--scope local` 만 붙여도 여전히 실패 → **`plugin@marketplace` 정규화된 이름**이 필요하다
>
> 설치할 때 쓴 scope 를 그대로 쓰고, 이름은 항상 `@마켓플레이스` 까지 붙인다.

## 제거

```bash
claude plugin uninstall script-to-motion --scope local
claude plugin marketplace remove remotion-script-to-motion --scope local
```

`--prune` 을 붙이면 딸려 설치된 의존성까지 정리한다 (이 플러그인은 의존성이 없다).

## 개발 중이라면

캐시로 설치된 상태에서는 소스를 고쳐도 반영되지 않는다. 고치면서 바로 확인하려면:

```bash
claude --plugin-dir ./plugins/script-to-motion
```

세션 한정으로 로드되고 아무것도 기록하지 않는다. `/reload-plugins` 로 변경을 다시 읽는다.

## 스킬

| 명령 | 하는 일 |
|---|---|
| `/script-to-motion:new` | 자연어 → 대본 → 코드 → QA → 렌더 전체 파이프라인 |
| `/script-to-motion:check` | `script.json` 검증 (10규칙) |
| `/script-to-motion:qa` | 콘택트시트 생성 + 루브릭 채점 |

모델이 알아서 호출하기도 한다 ("30초 제품 소개 영상 만들어줘").

## 게이트

**대본 검증** — 통과 못 하면 코드를 생성하지 않는다.

| # | 규칙 | 막는 실패 |
|---|---|---|
| 1 | 필수 필드/타입 | 기본 |
| 2 | 타임라인 연속성 | 구멍 → 검은 프레임 / 겹침 |
| 3 | `Σ durationSec == totalSec` | 길이 드리프트 |
| 4 | `durationSec × fps` 정수 | 1프레임 깜빡임 |
| 5 | `emphasis` ⊂ `copy` | 하이라이트 크래시 |
| 6 | 모션명이 카탈로그에 존재 | 없는 프리미티브 환각 |
| 7 | copy ≤ 7단어 / 32자 | 화면 과밀 |
| 8 | `durationSec` ≥ 1.2초 | 읽을 수 없는 컷 |
| 9 | id 유일 + kebab-case | 파일명 충돌 |
| 10 | hook 정확히 1개, 첫 씬 | 구조 붕괴 |

**훅으로 기계 강제** — `script.json` 이나 씬 `.tsx` 를 저장하면 자동으로 검증기/가드가 돌고 위반이 에이전트에게 되먹여진다. 규칙을 기억하기를 바라는 대신 어기면 즉시 알려준다.

## 대본이 단일 진실 공급원

`Root.tsx` 의 `calculateMetadata` 가 `script.json` 에서 길이·해상도·fps 를 파생시킨다. 코드에 하드코딩된 프레임 수가 없다.

```bash
# totalSec 30 → 20 으로만 바꾸고 코드는 그대로
npx remotion compositions src/index.ts
# Main  30  1920x1080  600 (20.00 sec)   ← 따라온다
```

## Remotion API 지식은 위임한다

이 플러그인은 Remotion API 를 가르치지 않는다. 공식 스킬이 이미 그 일을 하고 버전업마다 갱신된다. 필요하면 별도로 설치한다 (선택):

```bash
npx skills add remotion-dev/skills
# 또는
claude plugin marketplace add remotion-dev/claude-code-plugin
claude plugin install remotion@remotion
```

> 위 명령들은 전역 설정을 건드린다. 폴더 격리를 유지하려면 설치하지 말고, 에이전트가 필요 시 웹 문서를 참조하게 두면 된다.

## 범위 밖 (의도적)

나레이션 TTS · 자막 · BGM · SFX · 스톡 영상 · 3D. 비주얼 전용 1단계다.
이 기능들이 필요하면 [`remotion-superpowers`](https://github.com/dojocodinglabs/remotion-superpowers) 를 병용한다 (`/add-voiceover`, `/add-captions`, `/find-footage`). 단 유료 API 키가 필요하다 — 그래서 여기 의존성으로 넣지 않았다.

## 데모

```bash
cd examples/demo-30s
npm install
npm run dev                                    # Remotion Studio
node ../../plugins/script-to-motion/scripts/validate-script.mjs script.json
npx remotion render src/index.ts Main out/video.mp4
```

## 구조

```
.claude-plugin/marketplace.json        # 마켓플레이스 항목 (설치 진입점)

plugins/script-to-motion/              # 플러그인 (자기완결적)
├── .claude-plugin/plugin.json
├── skills/{new,check,qa}/SKILL.md
├── references/                        # 단계 진입 시에만 로드
│   ├── interview.md                   # P1a 인터뷰 · 정보 밀도 예산
│   ├── script-writing.md              # P1 대본 규칙
│   ├── infographic-catalog.md         # P1b 인포그래픽 16종
│   ├── prompt-patterns.md             # P1b intent 작성 규칙
│   ├── art-direction.md               # P2 토큰 잠금
│   ├── remotion-elements.md           # P3 공식 Element 17종
│   ├── motion-patterns.md             # P3 모션 프리미티브
│   └── qa-rubric.md                   # P4 채점 루브릭
├── assets/
│   ├── motion-catalog.json            # 모션명 단일 진실 공급원
│   └── script.schema.json
├── hooks/hooks.json                   # 게이트 기계 강제
└── scripts/                           # 의존성 0, 출력만 컨텍스트 소비
    ├── validate-script.mjs            # 게이트 — exit 1 이면 코드 생성 금지
    ├── guard-tokens.mjs               # 아트디렉션 위반 되먹임
    ├── script-report.mjs              # 글자수 + 인포그래픽 추천
    └── contact-sheet.mjs              # 시각 QA 콘택트시트

examples/demo-30s/                     # 16:9 30초 참고 구현
examples/short-20s/                    # 9:16 20초 세로 숏폼
├── script.json                        # 단일 진실 공급원
└── src/{tokens,motion,script,Root,Main,SceneFrame}.tsx + scenes/
```
