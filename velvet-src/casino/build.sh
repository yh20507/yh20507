#!/bin/sh
{ cat head.html; cat body.html; printf '<script>\n'; cat engine.js; printf '</script>\n<script>\n'; cat app.js; printf '</script>\n'; [ -f friends.js ] && { printf '<script>\n'; cat friends.js; printf '</script>\n'; }; printf '<script>App.boot();</script>\n'; } > index.html
