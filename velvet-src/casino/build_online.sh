#!/bin/sh
cd "$(dirname "$0")"
{
  printf '<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
  cat head.html plus.css.html hw.css.html
  printf '</head>\n<body>\n'
  cat body.html
  for f in engine.js online.js app.js friends.js ../pchess/engine.js plus_core.js plus_games.js plus_special.js plus_more.js plus_hw.js sound.js; do printf '<script>\n'; cat "$f"; printf '</script>\n'; done
  printf '<script>App.boot();</script>\n</body>\n</html>\n'
} > 벨벳카지노.html
