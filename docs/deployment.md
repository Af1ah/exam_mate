# Deployment reference

## Environments

| Purpose       | URL                         | Runtime                     |
| ------------- | --------------------------- | --------------------------- |
| Production    | Your canonical HTTPS URL    | Docker Compose behind Nginx |
| Local testing | Your development tunnel URL | Tunnel to local port `3000` |

Keep local tunnel routes separate from production deployment settings.

## Production server layout

- Persistent Compose environment file: `<remote-deploy-dir>/.env` (server-only; never commit it).
- Immutable releases: `<remote-deploy-dir>/releases/release-<UTC timestamp>`.
- Docker Compose project: `exam-mate`.
- Postgres data: Docker volume `exam_mate_postgres`.
- Nginx route: a host-managed site config for your canonical HTTPS domain.
- TLS: host-managed certificate with automatic renewal.

## Deploy an upgrade

From a checkout containing the current code, run:

```bash
python3 scripts/deploy.py \
  --host "$DEPLOY_HOST" \
  --user "$DEPLOY_USER" \
  --identity-file /path/to/deploy-key \
  --remote-dir "$DEPLOY_PATH"
```

The tool packages a source-only release, transfers it over SSH, and preserves the server `.env`. Under the server-side deployment lock it builds the release image, starts Postgres, and runs a one-off `migrate` container before replacing the app container. The migration gate verifies Prisma artifact integrity, rejects anything other than additive operations, previews the database route, and then applies it. A failure stops the deployment before the application is replaced. Deployments are serialized in both GitHub Actions and on the server, so concurrent runs cannot compete for container names. The app entrypoint runs the same gate as a safeguard for manual Compose starts.

## Initial question import only

The question seed is intentionally separate from upgrades. On a new database only:

```bash
cd <remote-deploy-dir>/releases/<release-name>
docker compose --profile seed run --rm seed
```

It skips loading when questions already exist.

## CI/CD

GitHub Actions checks for leaked production details, verifies migration artifact integrity, permits only additive migration operations, checks types and lint, and runs the production build for every pull request and push to `main`. Successful `main` runs can deploy automatically after configuring these repository secrets:

- `DEPLOY_HOST` = SSH host for the production server
- `DEPLOY_USER` = SSH user for deployments
- `DEPLOY_PATH` = absolute deploy directory on the production server
- `DEPLOY_SSH_KEY` = private key permitted to SSH to the server

Do not put real hosts, server users, private paths, tokens, or generated secrets in Git. Keep them in GitHub repository secrets and the server-local `.env` only. The workflows are in `.github/workflows/`.
