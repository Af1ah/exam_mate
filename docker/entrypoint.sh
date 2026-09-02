#!/bin/sh
set -eu

# Keep manual Compose starts subject to the same migration gate as CI/CD.
./docker/migrate.sh
exec node server.js
