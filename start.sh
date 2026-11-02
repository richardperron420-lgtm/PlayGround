#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"
: "${OPENCODE_WEB_DIR:?OPENCODE_WEB_DIR must point to worker metadata storage}"

run_timed() {
  local label="$1"
  shift
  /usr/bin/time -f "[timing] ${label}: %e s" "$@"
}

needs_install=false
if [[ ! -x "$PROJECT_DIR/node_modules/.bin/vite" || ! -f "$PROJECT_DIR/node_modules/.package-lock.json" ]]; then
  needs_install=true
elif [[ "$PROJECT_DIR/package.json" -nt "$PROJECT_DIR/node_modules/.package-lock.json" || ( -f "$PROJECT_DIR/package-lock.json" && "$PROJECT_DIR/package-lock.json" -nt "$PROJECT_DIR/node_modules/.package-lock.json" ) ]]; then
  needs_install=true
fi
if [[ "$needs_install" == true ]]; then
  if [[ -f package-lock.json ]]; then
    run_timed 'npm ci' npm ci --no-audit --no-fund
  else
    run_timed 'npm install' npm install --no-audit --no-fund
  fi
fi

needs_build=false
if [[ ! -f "$PROJECT_DIR/dist/index.html" ]]; then
  needs_build=true
else
  for input in package.json package-lock.json index.html vite.config.js vite.config.ts; do
    if [[ -f "$input" && "$input" -nt dist/index.html ]]; then
      needs_build=true
      break
    fi
  done
  if [[ "$needs_build" == false ]] && find src public -type f -newer dist/index.html -print -quit 2>/dev/null | grep -q .; then
    needs_build=true
  fi
fi
if [[ "$needs_build" == true ]]; then
  run_timed 'npm run build' npm run build
fi
[[ -f "$PROJECT_DIR/dist/index.html" ]] || { echo 'Build did not produce dist/index.html.' >&2; exit 1; }

run_timed 'write deployment metadata' node -e 'const fs=require("node:fs"); const path=require("node:path"); const project=process.cwd(); const directory=path.join(project,"dist"); fs.mkdirSync(process.env.OPENCODE_WEB_DIR,{recursive:true}); fs.writeFileSync(path.join(process.env.OPENCODE_WEB_DIR,"deployment-output.json"),JSON.stringify({project,directory}));'

public_url="${APP_URL:-}"
if [[ -z "$public_url" && -f "$OPENCODE_WEB_DIR/app-url" ]]; then
  public_url="$(run_timed 'read public preview URL' cat "$OPENCODE_WEB_DIR/app-url")"
fi
if [[ -n "$public_url" ]]; then
  export __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS="$(run_timed 'resolve public preview hostname' node -e 'const url=new URL(process.argv[1]); if (!/^https?:$/.test(url.protocol)) process.exit(1); process.stdout.write(url.hostname)' "$public_url")"
fi

export PORT
run_timed 'static preview server' npm run preview -- --port "$PORT" --strictPort
