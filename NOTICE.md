# NOTICE

이 플러그인을 쓸 때 적용되는 라이선스는 셋이고, 서로 다른 대상에 걸린다.

| 대상 | 라이선스 | 재배포 여부 |
|---|---|---|
| 이 리포의 코드 | MIT (`LICENSE`) | — |
| [HyperFrames](https://github.com/heygen-com/hyperframes) | Apache-2.0 | 재배포 안 함 (플러그인 의존성으로 설치) |
| [Piper](https://github.com/OHF-Voice/piper1-gpl) 런타임 | GPL-3.0 | 재배포 안 함 (서브프로세스 호출) |

## 이 리포의 코드 — MIT

`LICENSE` 의 MIT 는 **이 리포지터리의 코드에만** 적용된다 —
플러그인(`plugins/script-to-motion/`), 스크립트, 문서.

## HyperFrames — Apache-2.0

대상 렌더러는 [HyperFrames](https://github.com/heygen-com/hyperframes) 다.
이 플러그인은 `core-skills@hyperframes` 를 마켓플레이스 의존성으로 선언할 뿐
HyperFrames 코드를 담거나 재배포하지 않는다.

Apache-2.0 은 **사용 인원이나 조직 규모에 제한을 두지 않는다.** 저작권·라이선스 고지 유지와
변경 사항 표시를 요구하는데, 이 리포는 HyperFrames 코드를 포함하지 않으므로 해당 조항이
발동하지 않는다. 전문은 상류 리포의 `LICENSE` 를 보라.

## Piper 런타임 — GPL-3.0

한국어 TTS 는 `piper-tts` PyPI 패키지를 쓴다. 이 패키지는
[OHF-Voice/piper1-gpl](https://github.com/OHF-Voice/piper1-gpl) 로 **GPL-3.0** 이다.

`scripts/ko-tts.mjs` 는 piper 를 **서브프로세스로 실행**할 뿐 링크하거나 코드를 포함하지 않는다.
따라서 이 리포는 MIT 를 유지한다. GPL 을 조직 정책상 피해야 한다면 MIT 인
[rhasspy/piper](https://github.com/rhasspy/piper) 바이너리로 바꿔 끼울 수 있다 —
`ko-tts.mjs` 가 `--piper` / `PIPER_BIN` 으로 실행 파일을 받고, 음성 모델 `.onnx` 는
런타임과 분리되어 있어 같은 파일을 그대로 쓴다.

음성 모델 `ko_KR-kss-medium` 자체의 배포 조건은
[rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices) 를 확인하라.
이 리포는 모델 파일을 담지 않는다 (사용자가 직접 내려받는다).

## 제휴 관계 없음

이 프로젝트는 HeyGen 및 HyperFrames 팀과 무관한 서드파티이며, 보증이나 제휴를 받지 않았다.
모든 상표는 각 소유자에게 있다.

## 히스토리

v0.6.0 까지 이 플러그인은 [Remotion](https://remotion.dev) 을 대상 렌더러로 삼았고,
이 문서도 Remotion 라이선스를 고지했다. **v1.0.0 부터 Remotion 을 쓰지 않으므로
그 라이선스는 이 플러그인에 적용되지 않는다** — 조직 규모에 따른 제약도 마찬가지다.
당시 구현은 `script-to-motion--v1.0.0` 태그에 동결되어 있다.
