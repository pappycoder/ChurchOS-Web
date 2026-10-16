# Frontend console

Run `npm run console` or `bash scripts/console.sh`. The script also works by absolute path from another directory.

| Option | Action |
|---|---|
| 1 | Dev build: run the development server in watch mode |
| 2 | Production build: compile the application |
| 3 | Run unit tests |

Press Enter after a command to return to the menu; `q` quits. Failures return to the menu. There are no Tools submenus or extra action shortcuts. Production build only compiles; it does not start a production server or deploy the app. Vercel handles application deployment.

Use Node.js 20.19+ or 22.12+, Bash 3.2+ and installed project dependencies. npm is the default; `--manager pnpm` is supported.

```sh
bash scripts/console.sh --help
bash scripts/console.sh --list
bash scripts/console.sh --dry-run --action build
```

The default environment is `.env.local`. Select another with `--env FILE`, relative to your invocation directory. Selected dotenv values override inherited values; files are parsed as data, never sourced or evaluated. Dry runs do not execute commands, contact services or write data. Passwords and credentials are not included in printed commands.

Dev build prompts for a validated port (default 3000) and binds to `127.0.0.1`. `--action` accepts only `dev`, `build` and `test`. Run the backend console directly for migrations and administrator creation; backend credentials are not needed in the frontend environment.

## Verification

Run `npm run ops:test` for command routing, menu/CLI allowlists, dry runs, failure handling, safe environment parsing and Ctrl-C regressions. Commands are stubbed and no live accounts or databases are changed. Backend tests also cover admin provisioning safeguards and backup-before-migration ordering. `python3 test/ops/terminal.test.py` checks terminal input handling.
