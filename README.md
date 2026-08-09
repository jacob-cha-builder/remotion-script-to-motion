# script-to-motion

자연어 요청을 **검증 가능한 대본(`script.json`)** 으로 먼저 굳히고, 그 대본을 단일 진실 공급원으로 삼아 Remotion 모션그래픽을 만드는 Claude Code 플러그인.

```
자연어 → [P1 대본] → [P2 아트디렉션] → [P3 코드] → [P4 시각QA] → [P5 렌더]
          검증기 10규칙   토큰 잠금      tsc+comp    콘택트시트를
          기계 거부       가드 훅        무오류      실제로 보고 채점
```

## 설치

설치 방법이 세 가지다. **A 가 기본**이고, 전역에 아무것도 쓰지 않는다.

### A. 클론해서 그 폴더 안에서만 (전역 오염 0)

```bash
git clone https://github.com/jacob-cha-builder/remotion-script-to-motion.git
cd remotion-script-to-motion
claude          # 리포 루트에서 실행. 워크스페이스 신뢰 다이얼로그 수락
```

`.claude/skills/script-to-motion/` 이 `script-to-motion@skills-dir` 플러그인으로 자동 로드된다.
마켓플레이스 등록도 `plugin install` 도 없고 `~/.claude/` 에 아무것도 쓰지 않는다. 확인:

```bash
claude --plugin-dir ./.claude/skills/script-to-motion plugin list
# ❯ script-to-motion@inline   Status: ✔ loaded
```

> ⚠️ 프로젝트 스코프 `@skills-dir` 플러그인은 **Claude Code 를 실행한 디렉터리의
> `.claude/skills/`** 에서만 로드된다. 하위 디렉터리에서 실행하면 안 잡힌다.
> 리포 루트에서 실행하거나 `/reload-plugins` 를 쓴다.

### B. 내 프로젝트에 폴더째 복사

```bash
cp -r remotion-script-to-motion/.claude/skills/script-to-motion your-project/.claude/skills/
```

폴더 하나가 자기완결적이다. 외부 의존성이 없다.

### C. 모든 프로젝트에서 쓰기 (전역 설치)

```bash
claude plugin marketplace add jacob-cha-builder/remotion-script-to-motion
claude plugin install script-to-motion@remotion-script-to-motion
```

`~/.claude/` 에 기록된다. **폴더 격리를 원하면 A 를 쓴다.**
비공개 리포이므로 `gh auth login` 등으로 git 인증이 되어 있어야 한다.

제거:
```bash
claude plugin uninstall script-to-motion
claude plugin marketplace remove remotion-script-to-motion
```

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
node ../../.claude/skills/script-to-motion/scripts/validate-script.mjs script.json
npx remotion render src/index.ts Main out/video.mp4
```

## 구조

```
.claude/skills/script-to-motion/       # 플러그인 (자기완결적)
├── .claude-plugin/plugin.json
├── skills/{new,check,qa}/SKILL.md
├── references/                        # 단계 진입 시에만 로드
│   ├── script-writing.md  art-direction.md
│   ├── motion-patterns.md qa-rubric.md
├── assets/
│   ├── motion-catalog.json            # 모션명 단일 진실 공급원
│   └── script.schema.json
├── hooks/hooks.json                   # 게이트 기계 강제
└── scripts/                           # 의존성 0, 출력만 컨텍스트 소비
    ├── validate-script.mjs
    ├── guard-tokens.mjs
    └── contact-sheet.mjs

examples/demo-30s/                     # 실동작 참고 구현
├── script.json                        # 단일 진실 공급원
└── src/{tokens,motion,script,Root,Main,SceneFrame}.tsx + scenes/
```
