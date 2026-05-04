@echo off
cd /d "%~dp0"
set HTTP_PROXY=
set HTTPS_PROXY=
set ALL_PROXY=
set http_proxy=
set https_proxy=
set all_proxy=
set GIT_HTTP_PROXY=
set GIT_HTTPS_PROXY=
set NO_PROXY=localhost,127.0.0.1,::1
start "" http://127.0.0.1:8787
node server.js
