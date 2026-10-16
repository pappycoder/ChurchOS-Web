#!/usr/bin/env bash
# Interactive operations console. Bash 3.2+; Node 20.19+/22.12+.
set +x  # Never trace secret-bearing prompts or stdin pipes.
set -uo pipefail
umask 077
OPS_CALLER_DIR=$(pwd -P)
OPS_ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P) || exit 1
OPS_KIND=frontend
OPS_ENV_FILE="$OPS_ROOT/.env.local"
OPS_MANAGER=npm
OPS_DRY_RUN=0
OPS_SINGLE_ACTION=''
ops_help() {
  cat <<'HELP'
ChurchOS Frontend interactive operations console
Usage: bash scripts/console.sh [--env FILE] [--manager npm|pnpm] [--dry-run]
       bash scripts/console.sh [options] --action ACTION
       bash scripts/console.sh --list
Options:
  --env FILE       Select dotenv file; it overrides inherited values, never executes shell code.
  --manager NAME   Choose npm (default) or pnpm; installation requires its existing lockfile.
  --dry-run        Print the selected action plan without any commands/network/writes.
  --action ACTION  Run one menu action; confirmations and hidden passwords still apply.
  --list           List all action IDs.
  --help           Show this help.
Database/auth operations belong to the backend console. No --yes bypass is provided.
HELP
}
OPS_LIST=0
while (($#)); do
  case "$1" in
    --help|-h) ops_help; exit 0 ;;
    --env|--manager|--action)
      [[ $# -ge 2 && -n "$2" ]] || { printf 'Missing value for %s\n' "$1" >&2; exit 2; }
      case "$1" in
        --env) case "$2" in /*) OPS_ENV_FILE=$2 ;; *) OPS_ENV_FILE="$OPS_CALLER_DIR/$2" ;; esac ;;
        --manager) [[ "$2" == npm || "$2" == pnpm ]] || { printf 'Choose npm or pnpm.\n' >&2; exit 2; }; OPS_MANAGER=$2 ;;
        --action) OPS_SINGLE_ACTION=$2 ;;
      esac
      shift 2 ;;
    --dry-run) OPS_DRY_RUN=1; shift ;;
    --list) OPS_LIST=1; shift ;;
    *) printf 'Unknown argument: %s\n' "$1" >&2; exit 2 ;;
  esac
done
command -v node >/dev/null 2>&1 || { printf 'Install Node.js 20.19+ or 22.12+ first.\n' >&2; exit 1; }
cd -- "$OPS_ROOT" || exit 1
ops_helper() { node "$OPS_ROOT/scripts/ops/cli.cjs" "$OPS_ENV_FILE" "$OPS_MANAGER" "$@"; }
ops_read() {
  printf '%s' "$1" >&2
  IFS= read -r OPS_ANSWER || return 130
}
ops_confirm() {
  printf '\nType exactly: %s\n' "$1" >&2
  ops_read '> ' || return 130
  if [[ "$OPS_ANSWER" != "$1" ]]; then printf 'Cancelled; confirmation did not match.\n' >&2; return 130; fi
  OPS_CONFIRM=$OPS_ANSWER
}
ops_dispatch() {
  local action=$1 input value status
  input=$(ops_helper input "$action") || return $?
  if ((OPS_DRY_RUN)); then ops_helper plan "$action"; return $?; fi
  case "$action" in
    open-backend)
      if [[ ! -f "$OPS_ROOT/../ChurchOS-Backend/scripts/console.sh" ]]; then printf 'Sibling backend console not found. Open its scripts/console.sh separately.\n' >&2; return 1; fi
      bash "$OPS_ROOT/../ChurchOS-Backend/scripts/console.sh" --manager "$OPS_MANAGER"; return $? ;;
  esac
  case "$input" in
    port)
      ops_read 'Port [3000]: ' || return 130
      printf '%s\0' "${OPS_ANSWER:-3000}" | ops_helper run "$action" ;;
    url)
      value='http://127.0.0.1:3000'
      ops_read "Base URL [$value]: " || return 130
      printf '%s\0' "${OPS_ANSWER:-$value}" | ops_helper run "$action" ;;
    clean)
      ops_confirm 'CLEAN .next' || return $?
      printf '%s\0' "$OPS_CONFIRM" | ops_helper run "$action" ;;
    none) ops_helper run "$action" ;;
    *) printf 'Unsupported input mode.\n' >&2; return 2 ;;
  esac
  status=$?
  return "$status"
}
# Keep the terminal UI small; the helpers parse dotenv safely and protect DB/auth work.
RESET='' BOLD='' CYAN='' GREEN='' YELLOW='' RED='' DIM=''
if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
  RESET=$'\033[0m'; BOLD=$'\033[1m'; CYAN=$'\033[36m'
  GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RED=$'\033[31m'; DIM=$'\033[2m'
fi
ops_title() { printf '\n%b== %s%b\n\n' "$BOLD$CYAN" "$1" "$RESET"; }
ops_pause() { ops_read 'Press Enter to continue… ' || return 130; }
ops_result() {
  local status=$1
  case "$status" in
    0) printf '\n%bFinished OK.%b\n' "$GREEN" "$RESET" ;;
    130) printf '\n%bAction cancelled.%b\n' "$YELLOW" "$RESET" ;;
    *) printf '\n%bCommand exited %s. The menu remains available.%b\n' "$RED" "$status" "$RESET" >&2 ;;
  esac
}
ops_production() {
  if ((!OPS_DRY_RUN)) && [[ ! -f "$OPS_ROOT/.next/BUILD_ID" ]]; then
    printf '\nNo production build found.\n'
    ops_read 'Build now? [Y/n]: ' || return 130
    case "$OPS_ANSWER" in
      ''|y|Y|yes|YES) ops_dispatch build || return $? ;;
      n|N|no|NO) printf 'Production start cancelled.\n'; return 130 ;;
      *) printf 'Choose y or n.\n' >&2; return 2 ;;
    esac
  fi
  ops_dispatch start
}
ops_more() {
  local group=$1 heading=$2
  local listing id label choice index status
  local ids=() labels=()
  listing=$(ops_helper menu "$group") || return $?
  while IFS=$'\t' read -r id label; do ids+=("$id"); labels+=("$label"); done <<< "$listing"
  while true; do
    ops_title "$heading"
    for ((index=0; index<${#ids[@]}; index++)); do printf ' [%2d] %s\n' "$((index+1))" "${labels[$index]}"; done
    printf '  [b] Back\n\n'
    ops_read '> ' || return 0; choice=$OPS_ANSWER
    case "$choice" in b|B|0|q|Q) return 0 ;; esac
    if [[ ! "$choice" =~ ^[1-9][0-9]*$ || ${#choice} -gt 3 ]] || ((choice>${#ids[@]})); then
      printf 'Choose a listed number.\n'; continue
    fi
    if [[ "${ids[$((choice-1))]}" == start ]]; then ops_production; else ops_dispatch "${ids[$((choice-1))]}"; fi
    status=$?; ops_result "$status"
    ops_pause || return 0
  done
}
ops_tools() {
  while true; do
    ops_title 'Tools'
    cat <<'MENU'
  [1] Setup
  [2] Quality checks
  [3] Maintenance & backend console
  [b] Back
MENU
    ops_read '> ' || return 0
    case "$OPS_ANSWER" in
      1) ops_more setup 'Setup' ;;
      2) ops_more quality 'Quality checks' ;;
      3) ops_more maintenance 'Maintenance & backend console' ;;
      b|B|q|Q|0) return 0 ;;
      *) printf 'Choose a listed number.\n' ;;
    esac
  done
}
trap 'printf "\nInterrupted; returning to console when the foreground action exits.\n" >&2' INT
if ((OPS_LIST)); then ops_helper list; exit $?; fi
if [[ -n "$OPS_SINGLE_ACTION" ]]; then
  # Scripted actions retain their existing explicit behavior (no automatic build).
  ops_dispatch "$OPS_SINGLE_ACTION"; OPS_STATUS=$?; ops_result "$OPS_STATUS"; exit "$OPS_STATUS"
fi
while true; do
  ops_title 'ChurchOS Frontend'
  printf '%bEnv: %s | %s%b\n\n' "$DIM" "$OPS_ENV_FILE" "$OPS_MANAGER" "$RESET"
  cat <<'MENU'
  [1] Run dev
  [2] Run production
  [3] Build
  [4] Run tests
  [5] Tools
  [q] Quit
MENU
  ops_read '> ' || exit 0
  case "$OPS_ANSWER" in
    1) ops_dispatch dev ;;
    2) ops_production ;;
    3) ops_dispatch build ;;
    4) ops_dispatch test ;;
    5) ops_tools; continue ;;
    q|Q|0) printf 'Bye!\n'; exit 0 ;;
    *) printf 'Choose a listed number.\n'; continue ;;
  esac
  OPS_STATUS=$?; ops_result "$OPS_STATUS"
  ops_pause || exit 0
done
