#!/bin/sh
set -eu

# The migration graph is part of the image. Re-running this is a no-op after
# the database reaches the current contract, which makes ordinary upgrades safe.
node node_modules/prisma/dist/prisma.js db migrate --db "$DATABASE_URL"
exec node server.js
