# 벨벳 카지노 데스크톱 (Windows)

게임 주소(https://yh20507.github.io/yh20507/velvet/)를 전용 창으로 여는 설치 프로그램.
게임을 업데이트하면 다시 깔지 않아도 바로 반영된다. 로그인은 컴퓨터마다 한 번.

- 만들기: 이 폴더를 고쳐서 GitHub에 올리면 Actions(.github/workflows/desktop.yml)가 Windows에서 자동으로 만든다.
- 받기: GitHub 저장소의 Releases → "벨벳 카지노 데스크톱" → `Velvet Casino_*_x64-setup.exe`
- 처음 실행 때 "Windows의 PC 보호"가 뜨면 "추가 정보 → 실행" (서명 없는 프로그램이라 뜨는 것)
- 프로그램 자체를 바꿨을 때만 src-tauri/tauri.conf.json 과 Cargo.toml 의 version 을 올린다.
