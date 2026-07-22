#!/bin/sh
# DC FORGE freight: ship everything in jobs/ to the repo, one command.
cd "$(dirname "$0")"
mkdir -p jobs
git add jobs
git commit -m "forge job $(date +%Y-%m-%d_%H%M)" || { echo "nothing new in jobs/"; exit 0; }
git push origin main && echo "SHIPPED - now tell Claude: pushed"
