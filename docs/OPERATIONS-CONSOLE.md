# Frontend operations console

Run `npm run console` or `bash scripts/console.sh`. You can also call the Bash script by absolute path from another directory. It is a standalone terminal app, not a browser/admin route.

```sh
bash scripts/console.sh --help
bash scripts/console.sh --list
bash scripts/console.sh --env .env.local
bash scripts/console.sh --dry-run --action build
bash scripts/console.sh --action dev
```

Use Bash 3.2+, Node.js 20.19+ or 22.12+, and npm. `--manager pnpm` is available when a matching pnpm lockfile already exists. Locked dependency installs use `npm ci --include=dev` or `pnpm install --frozen-lockfile`. Select the manager matching the repository lockfile; the console does not invent one.

## Menus

| Menu | Operations |
|---|---|
| Setup and diagnostics | Create an environment template, show redacted configuration/tool diagnostics, install locked dependencies, install Chromium |
| Development and quality | Dev server, production build/start, lint/check/fix, type check, unit tests, browser tests, console tests, source UI/permission audit, combined verification, production dependency audit |
| Maintenance | Bounded backend-health check through the frontend proxy, explicit local `.next` cache cleanup, open the sibling backend console |

The default env file is `.env.local`; choose another with `--env FILE`. Relative paths use the invocation directory. **Selected file values override inherited environment values.** Files are parsed as dotenv data, never sourced or executed. Initialization copies `.env.example` with permissions 0600 and refuses overwrite. Doctor reports configuration presence, not secret values, and flags environment files with overly broad permissions. Configure values manually before using services.

`--dry-run` prints a plan without executing commands or contacting services. `--action ID` uses the same input/confirmation handling as the menus. Unknown actions are rejected. Errors report their status and leave the interactive menu available; combined verification stops on the first error. EOF exits/cancels cleanly. Ctrl-C stops the foreground server/command.

Dev runs with `NODE_ENV=development`; builds/production start use `NODE_ENV=production`; tests use `NODE_ENV=test`. Frontend servers bind to `127.0.0.1` and prompt for a validated port (default 3000). Build before starting production or running browser tests. Browser tests use the repository's configured local production server; install Chromium first. Lint fixes are explicit and separate from lint checks. Cache cleanup requires `CLEAN .next`, removes only the repository-local `.next` directory, and requires a rebuild before production start. Health accepts the frontend base URL and uses its same-origin backend proxy with a ten-second bound; timeout/degraded health is reported as failure.

## Administrator and database operations

`open-backend` launches `../ChurchOS-Backend/scripts/console.sh` when the sibling checkout exists. It deliberately selects the backend's own default environment, not the frontend file. For another layout, open that repository's console directly:

```sh
bash /path/to/ChurchOS-Backend/scripts/console.sh --env /secure/backend-production.env
```

The backend console creates super admins/church admins, manages reference permissions and permission-cache invalidation, migrations, backups, database clear/reset/restore, worker startup, demo-login retirement and storage/encryption maintenance. Keep Supabase service-role keys and database credentials in backend/operator environments; they are not needed in the frontend application or browser. See the backend `docs/OPERATIONS-CONSOLE.md` for those safeguards.

## Tests and deployment limits

```sh
npm run ops:test
```

Tests cover all action plans, argument rejection, dotenv injection resistance, target confirmation/cancellation, non-overwriting private environment templates, subprocess failures, Ctrl-C and bounded health behavior. Native tests use local fixtures and stubbed lifecycle commands. They do not deploy applications, contact production services or certify browser/provider/hosting behavior.

These consoles run local commands and foreground services. They do not silently deploy to Vercel, change cloud environment values or install a production process supervisor. A persistent backend worker and real provider delivery still need verification in the hosting environment.

Validation for this change: 11 frontend console/unit tests passed; the backend has 18 console/unit tests and 13 PostgreSQL workflow cases. Both production builds and changed-file lint passed. Actual frontend startup through the console and the hydrated production login were verified in Chromium, including absence of the development login helper. `python3 test/ops/terminal.test.py` optionally checks real controlling-terminal input on POSIX without contacting services.
