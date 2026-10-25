// 벨벳 카지노 데스크톱: 게임 주소를 전용 창으로 연다.
// 게임은 인터넷 주소에서 불러오므로, 게임을 업데이트해도 이 프로그램은 다시 깔 필요가 없다.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("벨벳 카지노를 여는 중에 문제가 생겼어요");
}
