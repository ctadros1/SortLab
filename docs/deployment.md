# Deployment

## Environment

- Host: `dev-lab` (`192.168.75.59`)
- Project: `/srv/docker/projects/sorting-playground`
- LAN port: `8787`
- Arcane project watcher: `/srv/docker/projects`
- Backup root: `/srv/docker/backups`

Port 8787 was selected only after checking host listeners and Docker port allocations. The project does not alter Arcane, `arcane-test`, reverse proxies, Docker daemon settings, or public networking.

## Deploy

```bash
cd /srv/docker/projects/sorting-playground
chmod 600 .env
docker compose config
docker compose build
docker compose up -d
docker compose ps
curl -fsS http://127.0.0.1:8787/healthz || curl -fsS http://192.168.75.59:8787/healthz
```

The published socket is intentionally bound to `192.168.75.59`, so loopback access may not work. The LAN-address check is authoritative.

## Verify

```bash
docker inspect -f '{{.State.Health.Status}}' sorting-playground
curl -I http://192.168.75.59:8787/
docker compose logs --tail=200 web
docker compose ls
```

Confirm Arcane shows `sorting-playground` using the same `compose.yaml`. If it does not appear after the filesystem watcher interval, refresh Arcane; do not manipulate its database.

## Backup

Create archives from the project root and exclude `.env`, `.git`, `node_modules`, `dist`, coverage, and browser artifacts:

```bash
tar --exclude=.env --exclude=.git --exclude=node_modules --exclude=dist --exclude=coverage \
  -czf /srv/docker/backups/sorting-playground-$(date +%Y%m%d-%H%M%S).tar.gz .
```

List the archive before relying on it:

```bash
tar -tzf /srv/docker/backups/<archive>.tar.gz | head
```

## Rollback

Keep the current `.env`, stop only this project, restore a reviewed archive, validate Compose, then rebuild and start. Never restart Docker or reboot the VM unless a separate infrastructure failure requires it.
