#!/bin/sh
set -eu

prisma() {
  node node_modules/prisma/dist/prisma.js "$@"
}

# Reject a corrupt graph or a migration that can remove/alter existing data
# before connecting it to the production database.
prisma migration check --json
node scripts/check-migration-safety.mjs

# This preview is read-only. Applying a Prisma migration is transactional on
# Postgres; a failure leaves its migration marker unchanged.
prisma db migrate --show --db "$DATABASE_URL"
prisma db migrate --db "$DATABASE_URL"
