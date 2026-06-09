#!/bin/zsh
set -eu

cd "$(dirname "$0")"

unset HTTP_PROXY HTTPS_PROXY ALL_PROXY http_proxy https_proxy all_proxy
unset GIT_HTTP_PROXY GIT_HTTPS_PROXY
export NO_PROXY="localhost,127.0.0.1,::1"
export no_proxy="localhost,127.0.0.1,::1"

APP_PORT="${PORT:-8787}"
APP_URL="http://127.0.0.1:${APP_PORT}"

if command -v open >/dev/null 2>&1; then
  open "${APP_URL}" >/dev/null 2>&1 || true
fi

echo "Macro dashboard: ${APP_URL}"
echo "Keep this Terminal window open while using the dashboard."
echo

node server.js
