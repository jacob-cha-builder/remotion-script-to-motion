# Palantir Foundry에서의 Git 기초

> **커밋 · 브랜치 · PR · CI, 결재 시스템으로 이해하기**

| 항목 | 내용 |
|---|---|
| **대상** | 개발 비전공 임직원 + 신규 온보딩 개발자 |
| **선수지식** | 없음 |
| **소요시간** | 90분 (강의 50분 + 실습 40분) |
| **작성일** | 2026-08-09 |
| **근거** | Palantir 공식 문서 (문서 하단 출처 참조) |

**학습 목표** — 수강 후 스스로 할 수 있어야 하는 것:

1. 브랜치를 만든다
2. 의미 있는 메시지로 커밋한다
3. PR(Pull Request)을 올린다
4. Checks(자동 검사) 결과를 읽는다
5. **내가 속한 트랙의 "배포 트리거"가 무엇인지 말한다** ← 가장 중요

---

## ⚠️ 시작 전 용어 정리: "Palantir GitHub"은 github.com이 아닙니다

교육 현장에서 가장 먼저 정리해야 할 오해입니다.

| 구분 | 실체 |
|---|---|
| **Foundry Code Repositories** | Palantir이 **자체 호스팅하는 Git 서버**. UI만 GitHub와 동일한 개념(브랜치·PR·체크)을 사용 |
| **실제 github.com** | 선택적으로만 사용 — ① 커스텀 위젯을 "Foundry 밖에서 개발" 선택 시 소스 보관용, ② 외부 CI(GitHub Actions)에서 `@osdk/cli`로 배포할 때 |
| **GitHub 커넥터** | 위 둘과 **무관**. GitHub의 데이터를 Foundry로 가져오는 데이터 연동 기능 |

> 💡 이 셋을 섞어서 설명하면 반드시 혼선이 발생합니다. 첫 슬라이드에서 명시적으로 구분하세요.

---

# 1교시 · 왜 Git이 필요한가 (10분)

## 1-1. Git 없는 세상

```
제안서_최종.pptx
제안서_최종_v2.pptx
제안서_최종_v2_진짜최종.pptx
제안서_최종_v2_진짜최종_김대리수정.pptx   ← 누가 뭘 왜 바꿨는지 아무도 모름
```

문서는 이래도 버팁니다. **코드는 못 버팁니다.** 잘못 합치면 서비스가 멈추기 때문입니다.

## 1-2. Git의 한 줄 정의

> **Git = 모든 변경을 "누가 · 언제 · 왜"와 함께 기록하고, 언제든 되돌릴 수 있게 하는 시스템**

## 1-3. Foundry에서 코드가 사는 곳

Foundry의 **Code Repositories**는 웹 기반 IDE이고, 그 아래에 Git이 깔려 있습니다.
화면 상단 탭 5개가 곧 Git의 전부입니다.

```
┌──────────┬────────────┬────────────────┬──────────┬──────────┐
│   Code   │  Branches  │  Pull requests │  Checks  │ Settings │
└──────────┴────────────┴────────────────┴──────────┴──────────┘
     ↑           ↑              ↑              ↑
  코드 작성   내 사본 관리    결재 상신     자동 검수 결과
```

---

# 2교시 · 핵심 개념 10개 — "결재 시스템" 비유 (25분)

> 💡 **강사 팁**: 이 표 한 장이 교안의 심장입니다. 슬라이드 1장으로 뽑아 배포하세요.

| Git 용어 | 회사 업무 비유 | 한 줄 정의 |
|---|---|---|
| **Repository** (레포) | 팀 공용 캐비닛 | 코드 + 전체 변경 이력이 통째로 보관된 곳 |
| **Branch** (브랜치) | 원본에서 뜬 **내 작업용 사본** | 원본을 안 건드리고 실험하는 평행 세계 |
| **Commit** (커밋) | 저장 **+ 사유서** | "여기까지 이렇게 바꿨음"을 이유와 함께 찍은 스냅샷 |
| **Push** (푸시) | 서버에 **올리기** | 내 PC의 커밋을 Foundry 서버로 전송 |
| **Pull** (풀) | 최신본 **받기** | 서버의 최신 변경을 내 PC로 내려받기 |
| **Pull Request** (PR) | **결재 상신** | "제 브랜치를 원본에 합쳐 주세요" 요청서 |
| **Review / Approve** | 결재 **검토 · 승인** | 동료가 줄 단위로 읽고 코멘트 또는 승인 |
| **Merge** (머지) | 결재 완료 → **원본 반영** | 승인된 변경을 원본 브랜치에 합침 |
| **CI / Checks** | **자동 검수 로봇** | 사람이 보기 전에 기계가 먼저 문법 · 테스트 · 빌드 검사 |
| **Tag** (태그) | **버전 도장** (1.0.0) | 특정 시점을 불변 버전으로 못박음 → *일부 트랙에선 배포 트리거* |

## 2-1. 브랜치부터 시작해야 하는 이유

Foundry는 **보호된 브랜치(protected branch)를 직접 편집할 수 없습니다.**
반드시 sandbox 브랜치를 만들어 거기서 작업해야 합니다. 불편함이 아니라 실수 방지 장치입니다.

```
master (보호됨) ●───●───●───────────────●   ← 실서비스가 바라보는 원본
                     ╲                 ╱
  내 브랜치            ●───●───●───────●      ← 여기서 자유롭게 작업
                      ↑   ↑   ↑       ↑
                     커밋 커밋 커밋   머지(결재완료)
```

## 2-2. Commit의 핵심은 메시지

공식 베스트 프랙티스에 명시된 주의사항:

> **Build 버튼을 먼저 누르지 마세요.**
> Build를 누르면 타임스탬프만 들어간 커밋 메시지가 자동 생성됩니다.
> **① Commit(메시지 작성) → ② Build** 순서를 지키세요.

| | 예시 |
|---|---|
| ❌ 나쁨 | `Update` / `수정` / `asdf` |
| ✅ 좋음 | `주문 데이터에서 취소건 제외 필터 추가 (환불 중복 집계 이슈)` |

**왜 중요한가**
- 리뷰어가 커밋만 보고 작업 흐름을 파악할 수 있음
- 되돌려야 할 때 문제의 커밋을 한눈에 찾을 수 있음

## 2-3. Push / Pull — 방향만 외우면 끝

```
        내 노트북                        Foundry 서버
     ┌─────────────┐   ── push ──▶    ┌─────────────┐
     │   로컬 사본  │                   │  원본 저장소 │
     └─────────────┘   ◀── pull ──    └─────────────┘
```

- **push** = 밀어 올리기 (내가 쓴 걸 팀에 공개)
- **pull** = 당겨 받기 (팀의 최신 변경을 내 PC에 반영)

> 🔑 **웹 IDE에서만 작업하면 push/pull을 볼 일이 없습니다.**
> 이 두 단어는 **로컬 개발을 시작하는 순간** 등장합니다.
> 그래서 4교시(로컬 연결)와 반드시 세트로 가르쳐야 합니다.

## 2-4. Pull Request — 결재 상신

**Propose changes** 버튼을 누르면 PR이 생성되고, 기본 병합 대상은 `master` 브랜치입니다.

PR 화면에서 일어나는 일:
- 변경 사항을 **줄 단위로** 비교하며 코멘트
- Transforms 코드라면 **어떤 데이터셋에 영향이 가는지** 분석 가능
- 저장소 설정에 따라 **최소 1명의 승인**이 필요할 수 있음

## 2-5. CI / Checks — 자동 검수 로봇

**커밋하면 자동으로 체크가 돕니다.** Checks 탭에서 진행/완료 상태와 유닛 테스트 결과를 확인합니다.

관리자가 보호 브랜치에 걸 수 있는 조건:

| 조건 | 의미 |
|---|---|
| `ci/foundry-publish` 성공 필수 | **이게 성공해야 데이터에 변경이 실제 반영됩니다.** 끝나기 전에 머지하면 반영 보장 없음 |
| 코드 리뷰 필수 | "거절 없음" 또는 "최소 1명 승인" 중 선택 |
| 특정 리뷰어 필수 | 지정 사용자/그룹 중 1명 이상 승인 |
| 고급 승인 정책 | **바뀐 파일 경로별로** 승인자를 다르게 지정 (예: `datasets/*.py`는 데이터팀 승인) |
| 보안 승인 | 보안 Marking 관련 변경 시 자동 요구 |

## 2-6. Merge 방식 3가지

| 방식 | 결과 | 언제 쓰나 |
|---|---|---|
| **Squash and merge** | 여러 커밋을 **1개로 압축**해서 반영 | 기본 권장. 히스토리가 깔끔해짐 |
| **Merge** | 개별 커밋 전부 + 머지 커밋 추가 | 작업 과정을 그대로 남겨야 할 때 |
| **Merge with fast-forward** | 대상 브랜치를 그냥 앞으로 당김 | 대상 브랜치에 다른 변경이 없을 때만 가능 |

---

# 3교시 · ⚠️ 트랙별로 "반영되는 순간"이 다릅니다 (15분)

> 🚨 **이 교시가 이 교안의 존재 이유입니다.**
> Python 담당자와 프론트엔드 담당자가 같은 규칙이라고 착각하면
> "머지했는데 왜 화면이 안 바뀌죠?" 문의가 폭증합니다.

| | **Python Transforms** | **Custom Widget (React)** | **Developer Console OSDK 앱 (React)** |
|---|---|---|---|
| **만드는 곳** | Code Repositories | Files → New → Widget set | Developer Console → Create code repository |
| **로컬 연결** | Palantir VS Code 확장(권장) 또는 `git clone` | `git clone` → `npm install` → `npm run dev` | `git clone` 또는 인플랫폼 VS Code Workspace |
| **로컬 미리보기** | Transforms preview | **Dev mode** — 내 localhost가 게시본을 덮어씀 | VS Code Workspace 라이브 프리뷰 |
| **인증 방식** | clone 토큰 (**7일마다 갱신**) | `FOUNDRY_TOKEN` 환경변수 | `FOUNDRY_TOKEN` / 워크스페이스 자동 |
| **로컬 검증 명령** | 유닛 테스트 / preview | `npm run lint` → `test` → `build` | `npm run lint` → `test` → `build` |
| **🔴 반영(배포) 트리거** | **master에 머지** → `ci/foundry-publish` → 빌드 | **`git tag x.y.z` + push** → 위젯셋 게시 | **`git tag x.y.z` + push** → 웹호스팅 배포 |
| **게시하면 사용자에게 바로 보이나?** | ✅ 예 (파이프라인 재빌드) | ❌ **아니오** — Workshop에서 버전을 올려야 함 | ✅ 예 (호스팅 사이트 교체) |

## 3-1. 한 문장 요약

> **Python은 "머지하면 반영", 프론트엔드는 "태그를 찍어야 배포".**
> 그리고 위젯은 **배포해도 Workshop이 자동으로 따라오지 않습니다** — 앱 담당자가 버전을 올려야 합니다.

## 3-2. 태그 찍기 (프론트엔드 트랙 필수)

```bash
git tag 1.2.0
git push origin tag
```

또는 Code Repositories UI의 **Tags / Version control → Tags and releases**에서도 가능합니다.

태그 이름 규칙은 저장소 루트의 `repoSettings.json`으로 강제할 수 있습니다:

```json
{
  "tagNameValidation": {
    "regex": "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(-rc\\d+)?$",
    "errorMessage": "Tag name must have the format x.x.x or x.x.x-rcx."
  }
}
```

## 3-3. Dev mode의 성격 (위젯 개발자용)

| 특성 | 내용 |
|---|---|
| **개인용** | 나에게만 적용. 다른 사용자는 게시된 버전을 봄 |
| **임시** | **24시간 후 자동 만료** |
| **즉시 반영** | 코드 저장 → 위젯에 바로 반영 (핫 리로드) |
| **예외** | `main.config.ts`의 파라미터/이벤트 변경은 핫 리로드 안 됨 → dev mode 재적용 필요 |

## 3-4. 위젯 게시 3가지 경로

| 방법 | 명령/동작 | 적합한 상황 |
|---|---|---|
| **Foundry CI/CD** | `git tag` + push (자동) | Foundry Code Repository 사용 시 **기본 권장** |
| **CLI** | `npx @osdk/cli@latest widgetset deploy` | 외부 CI(GitHub Actions 등) 연동 시 |
| **수동 업로드** | `dist/`를 zip으로 압축 → UI에서 Upload release | 임시/예외 상황 |

---

# 4교시 · 로컬(내 노트북)로 연결하기 (15분)

## 4-1. 선택지 3가지

| 방법 | 누가 쓰나 | 특징 |
|---|---|---|
| **① Palantir VS Code 확장** | Python transforms (**공식 권장**) | 로컬 프리뷰 · 빌드 · 디버깅 지원. ⚠️ **VS Code 마켓플레이스에 없음** — Foundry 플랫폼에서 VSIX 직접 다운로드 후 설치 |
| **② `git clone`** | 모든 트랙 | 순수 Git. 프론트엔드는 사실상 이 방식 |
| **③ Code Workspaces (인플랫폼 VS Code)** | 데이터 다운로드 권한을 받기 어려운 경우 | 브라우저 안에서 도는 VS Code. 데이터가 로컬로 나가지 않음 |

## 4-2. 클론 절차

1. 저장소 상단 메뉴에서 **Work locally**(데스크톱 아이콘) 클릭 → URL 복사
2. 터미널에서:
   ```bash
   git clone <URL>
   cd <저장소폴더>
   ```
3. *(프론트엔드 트랙)* 토큰 설정 후 개발 서버 실행:
   ```bash
   export FOUNDRY_TOKEN=<token>
   npm install
   npm run dev
   ```

## 4-3. 🔴 반드시 안내해야 할 제약

| 제약 | 설명 |
|---|---|
| **토큰 7일 만료** | 클론용 토큰은 단기 발급. 7일마다 갱신 필요 → **"갑자기 push가 안 돼요"의 대부분이 이 원인** |
| **체크 · 빌드는 서버에서만** | 로컬에서 코딩해도 **checks 실행과 job spec/artifact 게시는 Foundry에 push해야** 일어남 |
| **관리자 활성화 필요** | VS Code 확장 사용 여부는 Control Panel의 조직 설정에 의존 (기본 활성) |
| **로컬 프리뷰는 별도 권한** | 데이터셋을 로컬로 내려받는 특권 작업이라 `Download` 권한 필요 |

## 4-4. 로컬 개발 하루 루틴

```
아침  ┌─ git pull                              ← 팀의 최신 변경 받기
      │
낮    ├─ 코드 작성
      ├─ npm run lint/test  또는  유닛 테스트   ← 로컬에서 먼저 걸러내기
      ├─ git commit -m "이유가 담긴 메시지"
      │
저녁  ├─ git push                              ← 서버로 올리기 (여기서 CI 시작)
      ├─ Checks 초록불 확인
      └─ Propose changes → PR 상신
```

---

# 5교시 · 실습 (40분)

> **사전 준비**: 실습용 저장소를 하나 만들고 `master`를 보호 브랜치로 설정해 두세요.

| # | 과제 | 성공 기준 |
|---|---|---|
| 1 | 브랜치 생성 `feature/<본인이름>-first` | Branches 탭에 내 브랜치가 보임 |
| 2 | 파일 1줄 수정 후 **의미 있는 메시지로 커밋** | Checks 탭에 체크가 자동으로 도는 것 확인 |
| 3 | 일부러 오류를 넣고 커밋 | Checks가 **빨간불**이 되는 것 확인 → 로그 읽어보기 |
| 4 | 오류 수정 후 재커밋 | 초록불 복구 |
| 5 | **Propose changes**로 PR 생성 | PR에서 변경 diff가 줄 단위로 보임 |
| 6 | 옆자리 동료의 PR에 코멘트 1개 + 승인 | 승인 후 Merge 버튼 활성화 |
| 7 | Squash and merge | master 히스토리에 커밋 1개만 추가됨 |
| 8 | *(프론트엔드 트랙만)* `git tag 0.1.0 && git push origin tag` | Tags 탭에서 빌드 성공 확인 |

---

# 6교시 · 자주 하는 실수 TOP 10

| # | 증상 | 원인 / 해결 |
|---|---|---|
| 1 | "머지했는데 화면이 안 바뀌어요" | 프론트엔드는 **태그를 찍어야** 배포. 위젯은 Workshop에서 버전도 올려야 함 |
| 2 | "갑자기 push가 안 돼요" | **클론 토큰 7일 만료.** 재발급 필요 |
| 3 | "master에서 편집이 안 돼요" | 정상 동작. 보호 브랜치는 직접 편집 불가 → 브랜치를 만들 것 |
| 4 | 커밋 메시지가 타임스탬프뿐 | Build를 먼저 눌렀음. **Commit → Build 순서** |
| 5 | "프리뷰는 되는데 빌드는 실패" | 프리뷰는 **샘플 데이터**만 사용. 전체 데이터에 예외값 존재 |
| 6 | 라이브러리가 갑자기 없다고 나옴 | Conda 캐시 문제. **빈 줄 추가 후 재커밋**으로 대개 해결 |
| 7 | 브랜치를 남의 것까지 삭제 | ⛔ **본인이 만들지 않은 브랜치는 삭제 금지.** 타인의 작업이 유실됨 |
| 8 | `ci/foundry-publish` 끝나기 전에 머지 | 변경이 실제 반영된다는 **보장 없음.** 초록불 확인 후 머지 |
| 9 | 위젯에서 `localStorage`가 안 됨 | 커스텀 위젯 런타임은 Web Storage · IndexedDB **미지원.** 파라미터 또는 Ontology 사용 |
| 10 | 위젯/앱에서 외부 API 호출 실패 | **CSP가 기본 차단.** Foundry function 또는 webhook으로 감싸야 함 |

---

# 부록 A · 한영 용어 대조표 (1페이지 배포용)

| 영문 | 한글 | 통용 표현 |
|---|---|---|
| Repository | 저장소 | 리포지토리 / 레포 |
| Branch | 분기 | 브랜치 |
| Commit | 확정 저장 | 커밋 |
| Push / Pull | 올리기 / 받기 | 푸시 / 풀 |
| Pull Request (PR) | 병합 요청 | 피알 |
| Review / Approve | 검토 / 승인 | 리뷰 / 어프루브 |
| Merge | 병합 | 머지 |
| Conflict | 충돌 | 컨플릭트 |
| CI (Continuous Integration) | 지속적 통합 = 자동 검사 | 씨아이 |
| Checks | 자동 검사 | 체크 |
| Tag / Release | 버전 태그 / 릴리스 | 태그 |
| Protected branch | 보호 브랜치 | — |
| Sandbox branch | 작업용 브랜치 | — |

---

# 부록 B · 슬라이드 / 영상 구성안 (총 18장)

| 구간 | 장수 | 내용 | 비주얼 |
|---|---|---|---|
| 도입 | 2 | `제안서_최종_진짜최종.pptx` → 문제 제기 | 파일명 나열 애니메이션 |
| 개념 | 6 | 결재 비유 표 → 브랜치 다이어그램 → 커밋 → push/pull → PR → CI | 브랜치 그래프 애니메이션 |
| **차이** | 3 | **3트랙 비교표** → "머지 vs 태그" → 위젯 버전 함정 | 3열 대비 화면 |
| 로컬 | 3 | 연결 3가지 → 클론 화면 녹화 → 7일 토큰 경고 | 실제 화면 캡처 |
| 실습 | 3 | 8단계 과제 → 실수 TOP 10 → 용어표 | 체크리스트 |
| 마무리 | 1 | 사내 문의 채널 / 공식 문서 링크 | — |

---

# 부록 C · 출처 (Palantir 공식 문서)

> 📌 **공식 문서에는 한국어판이 있습니다.** URL의 `/docs/` 뒤에 `kr/`을 붙이면 됩니다.
> 예: `palantir.com/docs/kr/foundry/code-repositories/navigation`
> 교안 배포 시 한국어 링크로 안내하세요.

**Code Repositories / Git 기본**
- [Code Repositories · Navigation](https://www.palantir.com/docs/foundry/code-repositories/navigation) — 탭 구성, Propose changes, Checks, Tags
- [Code Repositories · Branch settings](https://www.palantir.com/docs/foundry/code-repositories/branch-settings) — 보호 브랜치, `ci/foundry-publish`, 머지 모드, 승인 정책
- [Code Repositories · FAQ](https://www.palantir.com/docs/foundry/code-repositories/faq) — Conda 캐시, 프리뷰 성공/빌드 실패
- [Development best practices](https://www.palantir.com/docs/foundry/building-pipelines/development-best-practices) — 커밋 메시지, master 보호, 브랜치 정리

**로컬 개발**
- [Python · Set up local development](https://www.palantir.com/docs/foundry/transforms-python/local-development) — VS Code 확장 vs git clone, 7일 토큰
- [Palantir extension for Visual Studio Code](https://www.palantir.com/docs/foundry/palantir-extension-for-visual-studio-code/overview) — VSIX 설치, 권한
- [Configure Code Repositories settings in Control Panel](https://www.palantir.com/docs/foundry/code-repositories/configure-repositories-in-control-panel) — 조직 단위 활성화 설정

**커스텀 위젯 (React)**
- [Custom widgets · Create a widget set](https://www.palantir.com/docs/foundry/custom-widgets/create) — Foundry 내부 개발 vs GitHub 자체 호스팅
- [Custom widgets · Develop a widget set](https://www.palantir.com/docs/foundry/custom-widgets/development) — dev mode, `FOUNDRY_TOKEN`, `npm run dev`, CSP · 스토리지 제약
- [Custom widgets · Publish a widget set](https://www.palantir.com/docs/foundry/custom-widgets/publish) — 태그 빌드, `@osdk/cli`, Workshop 자동 반영 안 됨

**Developer Console (OSDK React 앱)**
- [Developer Console · Overview](https://www.palantir.com/docs/foundry/developer-console/overview) — 커스텀 앱 구성요소, 웹호스팅
- [OSDK React applications · Development environment](https://www.palantir.com/docs/foundry/ontology-sdk-react-applications/development) — 코드 저장소 생성, `git tag` 배포, CSP
