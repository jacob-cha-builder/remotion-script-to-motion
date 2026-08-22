# 한국어 TTS 환경 — 세션마다 한 번:  source tts-env.sh
# 설치는 README 의 "한국어 TTS 준비" 절 참고. .venv/ 와 voices/ 는 gitignore 된다.
_root="$(cd "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")" && pwd)"
export PIPER_PYTHON="$_root/.venv/bin/python"
export PIPER_VOICE="$_root/voices/ko_KR-kss-medium.onnx"
unset _root

[ -x "$PIPER_PYTHON" ] || echo "⚠ piper 없음 — python3 -m venv .venv && .venv/bin/pip install piper-tts"
[ -f "$PIPER_VOICE" ]  || echo "⚠ 음성 모델 없음 — README 의 curl 두 줄 실행"
