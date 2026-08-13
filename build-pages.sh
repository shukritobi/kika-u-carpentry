#!/usr/bin/env bash
set -euo pipefail

rm -rf dist
mkdir -p dist

cp index.html styles.css app.js payment-status.html projects-sprite.webp _headers dist/
cp -R assets dist/assets

# Keep deployment payload intentionally small. Backend code remains in /functions
# where Cloudflare Pages Functions discovers it separately.
echo "Cloudflare Pages static bundle prepared in ./dist"
