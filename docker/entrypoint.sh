#!/bin/sh
set -e

echo "Node app container gestart — workspace: /app"

# Wacht tot package.json in de project-root staat (agent kan die na docker up aanmaken).
waited=0
while [ ! -f /app/package.json ]; do
  if [ "$waited" -eq 0 ]; then
    echo "Wachten op package.json in workspace-root (/app)..."
  elif [ $((waited % 30)) -eq 0 ]; then
    echo "Nog steeds wachten op package.json (${waited}s)..."
  fi
  sleep 3
  waited=$((waited + 3))
done

echo "package.json gevonden — npm install en npm run dev"
cd /app
npm install
exec npm run dev
