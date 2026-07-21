#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
repo_root="$(cd -- "$script_dir/.." && pwd -P)"
smoke_root="$(mktemp -d "${TMPDIR:-/tmp}/alpha-goal-install-smoke.XXXXXX")"

cleanup() {
  local status=$?
  local residue=""
  trap - EXIT

  residue="$(find "$smoke_root" -type d \( \
    -name 'alpha-goal-install-transaction.*' -o \
    -name 'alpha-goal-install-preflight.*' -o \
    -name '.alpha-goal-skill-stage.*' -o \
    -name '.alpha-goal-custom-agent-stage.*' -o \
    -name '.alpha-goal-write.*' -o \
    -name '.alpha-goal-hooks-uninstall.*' -o \
    -name '.alpha-goal-hooks-backup.*' \
  \) -print 2>/dev/null || true)"
  if [[ -n "$residue" ]]; then
    echo "Unexpected installer temporary residue before smoke cleanup:" >&2
    printf '%s\n' "$residue" >&2
    status=1
  fi
  rm -rf -- "$smoke_root"
  exit "$status"
}
trap cleanup EXIT

mkdir -p "$smoke_root/home" "$smoke_root/codex-home" "$smoke_root/tmp"
export HOME="$smoke_root/home"
export CODEX_HOME="$smoke_root/codex-home"
export TMPDIR="$smoke_root/tmp"
cd "$repo_root"

if ! command -v codex >/dev/null 2>&1; then
  echo "codex is required for install smoke strict-config checks." >&2
  exit 1
fi

run_installer() {
  local home_dir="$1"
  local -a installer_env
  shift
  if [[ "${UNSET_HOME:-false}" == true ]]; then
    installer_env=(env -u HOME -u CODEX_HOME)
    if [[ -n "${INSTALL_CODEX_HOME+x}" ]]; then
      installer_env=(env -u HOME "CODEX_HOME=$INSTALL_CODEX_HOME")
    fi
  else
    installer_env=(env -u CODEX_HOME "HOME=$home_dir")
    if [[ -n "${INSTALL_CODEX_HOME+x}" ]]; then
      installer_env=(env "HOME=$home_dir" "CODEX_HOME=$INSTALL_CODEX_HOME")
    fi
  fi
  "${installer_env[@]}" python3 - "$repo_root/scripts/install.sh" "$@" <<'PY'
import os
import pty
import select
import subprocess
import sys
import time

script = sys.argv[1]
args = sys.argv[2:]
target = os.environ.get("TARGET_CHOICE", "codex")
is_uninstall = "--uninstall" in args
codex_home_input = os.environ.get("CODEX_HOME_INPUT", "")
template_input = os.environ.get("TEMPLATE_INPUT", "")
hook_input = os.environ.get("HOOK_INPUT", "")
verbose_input = os.environ.get("VERBOSE_INPUT", "")
optional_roles_input = os.environ.get("OPTIONAL_ROLES_INPUT", "")
custom_agents_input = os.environ.get("CUSTOM_AGENTS_INPUT", "")
wizard_mode = os.environ.get("WIZARD_MODE", "install")

if target == "codex":
    target_action = [b"\r"]
elif target == "claude":
    target_action = [b"\x1b[B", b"\r"]
elif target == "all":
    target_action = [b"\x1b[B", b"\x1b[B", b"\r"]
else:
    raise SystemExit(f"unknown TARGET_CHOICE: {target}")

actions = []
if not is_uninstall:
    actions.append((b"Step 1 of 3", target_action))
    feature_action = []
    if optional_roles_input.lower() in {"n", "no"}:
        feature_action.append(b" ")
    if target in {"codex", "all"} and custom_agents_input.lower() in {"n", "no"}:
        feature_action.extend([b"\x1b[B", b" "])
    if wizard_mode == "cancel-features-esc":
        feature_action.append(b"\x1b")
    else:
        feature_action.append(b"\r")
    actions.append((b"Step 2 of 3", feature_action))
    if wizard_mode == "cancel-target":
        actions = [(b"Step 1 of 3", [b"q"])]
    elif wizard_mode == "cancel-features-esc":
        pass
    elif wizard_mode == "cancel":
        actions.append((b"Step 3 of 3", [b"q"]))
    elif wizard_mode == "back-disable-roles":
        actions.extend([
            (b"Step 3 of 3", [b"b"]),
            (b"Choose features", [b" ", b"\r"]),
            (b"Review installation", [b"\r"]),
        ])
    else:
        actions.append((b"Step 3 of 3", [b"\r"]))
else:
    actions.append((b"Choose which app configuration", target_action))
    if target in {"codex", "all"}:
        actions.extend([
            (b"Codex home", [codex_home_input.encode(), b"\r"]),
            (b"Clean up Codex custom agents", [custom_agents_input.encode(), b"\r"]),
        ])
    actions.append((b"Clean up user templates", [template_input.encode(), b"\r"]))
    if target in {"codex", "all"}:
        actions.append((b"Clean up Codex user hooks", [hook_input.encode(), b"\r"]))
    actions.append((b"Print detailed", [verbose_input.encode(), b"\r"]))

master, slave = pty.openpty()
proc = subprocess.Popen(
    ["bash", script, *args],
    stdin=slave,
    stdout=slave,
    stderr=slave,
    close_fds=True,
)
os.close(slave)

output = bytearray()
action_index = 0
action_cursor = 0
deadline = time.time() + 120
while True:
    if time.time() > deadline:
        proc.kill()
        sys.stdout.buffer.write(output)
        raise SystemExit("interactive installer timed out")
    ready, _, _ = select.select([master], [], [], 0.1)
    if ready:
        try:
            chunk = os.read(master, 4096)
        except OSError:
            chunk = b""
        if not chunk:
            break
        output.extend(chunk)
        if action_index < len(actions):
            pattern, chunks = actions[action_index]
            match_at = output.find(pattern, action_cursor)
            if match_at != -1:
                for item in chunks:
                    os.write(master, item)
                    time.sleep(0.05)
                action_index += 1
                action_cursor = len(output)
    if proc.poll() is not None:
        while True:
            ready, _, _ = select.select([master], [], [], 0)
            if not ready:
                break
            try:
                chunk = os.read(master, 4096)
            except OSError:
                break
            if not chunk:
                break
            output.extend(chunk)
        break

os.close(master)
sys.stdout.buffer.write(output)
if proc.returncode is None:
    returncode = proc.wait(timeout=5)
else:
    returncode = proc.returncode
raise SystemExit(returncode)
PY
}

expect_invalid_arg() {
  local tmp_invalid
  tmp_invalid="$(mktemp -d)"
  if env -u CODEX_HOME HOME="$tmp_invalid" "$repo_root/scripts/install.sh" "$@" >"$smoke_root/invalid.out" 2>"$smoke_root/invalid.err"; then
    echo "expected invalid argument failure: $*" >&2
    exit 1
  fi
  grep -q "only --uninstall is supported" "$smoke_root/invalid.err"
  rm -rf "$tmp_invalid"
}

assert_simple_success_output() {
  local output="$1"
  local message="$2"
  local message_count
  local completion_count

  grep -q "$message" <<<"$output"
  message_count="$(grep -F -o "$message" <<<"$output" | wc -l | tr -d ' ')"
  test "$message_count" -eq 1
  completion_count="$(grep -E -o "Alpha Goal [[:alnum:] _-]+ completed\\." <<<"$output" | wc -l | tr -d ' ')"
  test "$completion_count" -eq 1
  ! grep -q "Alpha Goal install summary" <<<"$output"
  ! grep -q "Alpha Goal uninstall summary" <<<"$output"
  ! grep -q "Codex skills root:" <<<"$output"
  ! grep -q "Claude skills root:" <<<"$output"
  ! grep -q "Skills root:" <<<"$output"
  ! grep -q "Codex home:" <<<"$output"
  ! grep -q "Claude home:" <<<"$output"
  ! grep -q "Templates" <<<"$output"
  ! grep -q "Hooks" <<<"$output"
  ! grep -q "╭─" <<<"$output"
  ! grep -q "╰─" <<<"$output"
}

assert_skill_tree_matches() {
  local source="$1"
  local target="$2"
  local source_count
  local target_count

  source_count="$(find "$source" -type f | wc -l | tr -d ' ')"
  target_count="$(find "$target" -type f ! -name '.alpha-goal-skill-copy' | wc -l | tr -d ' ')"
  test "$source_count" -eq "$target_count"
  while IFS= read -r source_file; do
    local relative_file="${source_file#"$source"/}"
    cmp "$source_file" "$target/$relative_file"
  done < <(find "$source" -type f | sort)
}

contract_agent_names() {
  node -e 'const c=require(process.argv[1]); for (const name of Object.keys(c.customAgents || {}).sort()) console.log(name)' "$repo_root/tools/validation/alpha-goal.json"
}


assert_custom_agents_match() {
  local codex_home="$1"
  local expected_agents
  local actual_agents
  node - "$codex_home" "$repo_root" "$repo_root/vendor/smol-toml/dist/index.cjs" "$repo_root/tools/validation/alpha-goal.json" <<'JS'
const fs = require("node:fs");
const path = require("node:path");
const [codexHome, repoRoot, tomlPath, contractPath] = process.argv.slice(2);
const toml = require(tomlPath);
const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const profiles = contract.customAgents;
if (!profiles || typeof profiles !== "object" || Array.isArray(profiles)) process.exit(1);
for (const [name, profile] of Object.entries(profiles)) {
  const source = path.join(repoRoot, "agents", `${name}.toml`);
  const target = path.join(codexHome, "agents", `${name}.toml`);
  if (!fs.statSync(target).isFile() || fs.lstatSync(target).isSymbolicLink()) process.exit(1);
  if (fs.readFileSync(source, "utf8") !== fs.readFileSync(target, "utf8")) process.exit(1);
  if (fs.readFileSync(target, "utf8").split(/\r?\n/, 1)[0] !== "# alpha-goal-managed-custom-agent:v1") process.exit(1);
  const data = toml.parse(fs.readFileSync(target, "utf8"));
  if (data.name !== name || data.model !== profile.model || data.model_reasoning_effort !== profile.effort) process.exit(1);
  if (profile.sandbox === null ? Object.hasOwn(data, "sandbox_mode") : data.sandbox_mode !== profile.sandbox) process.exit(1);
  if (!data.description || !data.developer_instructions) process.exit(1);
}
JS
  expected_agents="$(contract_agent_names)"
  actual_agents="$(for file in "$codex_home"/agents/*.toml; do basename "$file" .toml; done | sort)"
  test "$actual_agents" = "$expected_agents"
  grep -q '<!-- alpha-goal-managed-custom-agent-routing:v1 -->' "$codex_home/AGENTS.md"
  test "$(grep -c '<!-- generate-with-template:custom-agent-routing -->' "$codex_home/AGENTS.md")" -eq 1
  while IFS= read -r agent; do
    grep -q "\`$agent\`" "$codex_home/AGENTS.md"
  done < <(contract_agent_names)
}

tmp_codex="$(mktemp -d)"
codex_output="$(run_installer "$tmp_codex")"
assert_simple_success_output "$codex_output" "Alpha Goal install completed."
grep -q "Step 1 of 3" <<<"$codex_output"
grep -q "Step 2 of 3" <<<"$codex_output"
grep -q "Step 3 of 3" <<<"$codex_output"
grep -q "Review installation" <<<"$codex_output"
grep -q "$tmp_codex/.codex/skills" <<<"$codex_output"
grep -q "executor + verifier" <<<"$codex_output"
grep -q "Codex Custom Agents" <<<"$codex_output"
! grep -q "Install executor and verifier \[Y/n\]" <<<"$codex_output"
! grep -q "Install Codex custom agents \[Y/n\]" <<<"$codex_output"
! grep -q "Codex home \\[" <<<"$codex_output"
! grep -q "Replace external" <<<"$codex_output"
! grep -q "Sync user templates" <<<"$codex_output"
! grep -q "Sync Codex user hooks" <<<"$codex_output"
! grep -q "Print detailed" <<<"$codex_output"
for skill in alpha-goal executor verifier; do
  test -d "$tmp_codex/.codex/skills/$skill"
  test ! -L "$tmp_codex/.codex/skills/$skill"
  test -f "$tmp_codex/.codex/skills/$skill/SKILL.md"
  assert_skill_tree_matches "$repo_root/skills/$skill" "$tmp_codex/.codex/skills/$skill"
done
test -x "$tmp_codex/.codex/skills/alpha-goal/scripts/authority-digest.js"
test "$(node "$repo_root/skills/alpha-goal/scripts/authority-digest.js" "$repo_root/skills/alpha-goal/references/goal-contract-book.md")" = "$(node "$tmp_codex/.codex/skills/alpha-goal/scripts/authority-digest.js" "$tmp_codex/.codex/skills/alpha-goal/references/goal-contract-book.md")"
test -f "$tmp_codex/.codex/AGENTS.md"
test -f "$tmp_codex/.codex/config.toml"
test -f "$tmp_codex/.codex/hooks.json"
assert_custom_agents_match "$tmp_codex/.codex"
env HOME="$tmp_codex" CODEX_HOME="$tmp_codex/.codex" codex app-server --strict-config --listen stdio:// </dev/null >/dev/null 2>&1
node - "$tmp_codex/.codex/config.toml" "$repo_root/vendor/smol-toml/dist/index.cjs" <<'JS'
const fs = require("node:fs");
const toml = require(process.argv[3]);
const data = toml.parse(fs.readFileSync(process.argv[2], "utf8"));
if (data.features?.multi_agent !== true) process.exit(1);
if (data.features?.default_mode_request_user_input !== true) process.exit(1);
if (Object.hasOwn(data.features || {}, "child_agents_md")) process.exit(1);
if (Object.hasOwn(data.features || {}, "multi_agent_v2")) process.exit(1);
if (data.agents?.max_threads !== 6 || data.agents?.max_depth !== 1) process.exit(1);
JS
test ! -e "$tmp_codex/.claude/CLAUDE.md"
test ! -e "$tmp_codex/.claude/skills/alpha-goal"
! grep -q "references/claude-adapter.md" "$tmp_codex/.codex/skills/alpha-goal/SKILL.md"
python3 -m json.tool "$tmp_codex/.codex/hooks.json" >/dev/null
grep -q "codex-alpha-goal-compact-recovery:v4" "$tmp_codex/.codex/hooks.json"
grep -q "Use only an explicit current artifact path" "$tmp_codex/.codex/hooks.json"
grep -q "follow top-level active_owner" "$tmp_codex/.codex/hooks.json"
grep -q "Re-read before any sequential write" "$tmp_codex/.codex/hooks.json"
grep -q "Legacy alpha-goal owner loads executor only to terminate it to caller" "$tmp_codex/.codex/hooks.json"
grep -q "caller reports PASS/BLOCKED/GOAL_CHANGED as terminal" "$tmp_codex/.codex/hooks.json"
grep -q "Later work uses a new Alpha Goal task directory" "$tmp_codex/.codex/hooks.json"
grep -q "accepted with valid completeness/digest loads alpha-goal to confirm the goal is unchanged" "$tmp_codex/.codex/hooks.json"
! grep -q "technical_design.md" "$tmp_codex/.codex/hooks.json"
grep -q "checkpoint.md" "$tmp_codex/.codex/hooks.json"

tmp_codex_override="$(mktemp -d)"
override_codex_home="$tmp_codex_override/config/codex"
override_output="$(INSTALL_CODEX_HOME="$override_codex_home" run_installer "$tmp_codex_override")"
assert_simple_success_output "$override_output" "Alpha Goal install completed."
test -f "$override_codex_home/AGENTS.md"
test -f "$override_codex_home/config.toml"
test -f "$override_codex_home/hooks.json"
assert_custom_agents_match "$override_codex_home"
for skill in alpha-goal executor verifier; do
  assert_skill_tree_matches "$repo_root/skills/$skill" "$override_codex_home/skills/$skill"
done
test ! -e "$tmp_codex_override/.codex"
test ! -e "$tmp_codex_override/.claude"

tmp_codex_no_home="$(mktemp -d)"
codex_no_home_root="$tmp_codex_no_home/codex"
codex_no_home_output="$(UNSET_HOME=true INSTALL_CODEX_HOME="$codex_no_home_root" run_installer "$tmp_codex_no_home")"
assert_simple_success_output "$codex_no_home_output" "Alpha Goal install completed."
test -f "$codex_no_home_root/config.toml"
test -f "$codex_no_home_root/skills/alpha-goal/SKILL.md"
grep -q 'claude unavailable (HOME unset)' <<<"$codex_no_home_output"
codex_no_home_uninstall_output="$(UNSET_HOME=true INSTALL_CODEX_HOME="$codex_no_home_root" run_installer "$tmp_codex_no_home" --uninstall)"
assert_simple_success_output "$codex_no_home_uninstall_output" "Alpha Goal uninstall completed."
test ! -e "$codex_no_home_root/skills/alpha-goal"

tmp_no_home_targets="$(mktemp -d)"
for target in claude all; do
  if no_home_output="$(UNSET_HOME=true INSTALL_CODEX_HOME="$tmp_no_home_targets/codex" TARGET_CHOICE="$target" run_installer "$tmp_no_home_targets" 2>&1)"; then
    echo "$target install should require HOME for Claude paths" >&2
    exit 1
  fi
  grep -q 'HOME is unavailable; cannot resolve \$HOME/.claude' <<<"$no_home_output"
  ! grep -q 'empty path is not valid' <<<"$no_home_output"
done

tmp_nested_overlap="$(mktemp -d)"
nested_codex_home="$tmp_nested_overlap/.claude/skills/alpha-goal"
if nested_overlap_output="$(INSTALL_CODEX_HOME="$nested_codex_home" TARGET_CHOICE=all run_installer "$tmp_nested_overlap" 2>&1)"; then
  echo "all install should reject ancestor/descendant target overlap" >&2
  exit 1
fi
grep -q 'Install targets overlap' <<<"$nested_overlap_output"
test ! -e "$nested_codex_home/AGENTS.md"

for skill in executor verifier; do
  mkdir -p "$tmp_codex/.codex/skills/$skill/scripts"
  printf 'obsolete script\n' > "$tmp_codex/.codex/skills/$skill/scripts/obsolete.js"
done
codex_repeat_output="$(run_installer "$tmp_codex")"
assert_simple_success_output "$codex_repeat_output" "Alpha Goal install completed."
test "$(grep -o "codex-alpha-goal-compact-recovery:v4" "$tmp_codex/.codex/hooks.json" | wc -l | tr -d ' ')" -eq 1
test ! -e "$tmp_codex/.codex/skills/executor/scripts"
test ! -e "$tmp_codex/.codex/skills/verifier/scripts"

printf '\n# preserve-on-No\n' >> "$tmp_codex/.codex/agents/scout.toml"
scout_before_skip="$(shasum -a 256 "$tmp_codex/.codex/agents/scout.toml" | awk '{print $1}')"
architect_before_skip="$(shasum -a 256 "$tmp_codex/.codex/agents/architect.toml" | awk '{print $1}')"
builder_before_skip="$(shasum -a 256 "$tmp_codex/.codex/agents/builder.toml" | awk '{print $1}')"
reviewer_before_skip="$(shasum -a 256 "$tmp_codex/.codex/agents/reviewer.toml" | awk '{print $1}')"
routing_before_skip="$(shasum -a 256 "$tmp_codex/.codex/AGENTS.md" | awk '{print $1}')"
custom_agents_skip_output="$(CUSTOM_AGENTS_INPUT=n run_installer "$tmp_codex")"
assert_simple_success_output "$custom_agents_skip_output" "Alpha Goal install completed."
test "$scout_before_skip" = "$(shasum -a 256 "$tmp_codex/.codex/agents/scout.toml" | awk '{print $1}')"
test "$architect_before_skip" = "$(shasum -a 256 "$tmp_codex/.codex/agents/architect.toml" | awk '{print $1}')"
test "$builder_before_skip" = "$(shasum -a 256 "$tmp_codex/.codex/agents/builder.toml" | awk '{print $1}')"
test "$reviewer_before_skip" = "$(shasum -a 256 "$tmp_codex/.codex/agents/reviewer.toml" | awk '{print $1}')"
test "$routing_before_skip" = "$(shasum -a 256 "$tmp_codex/.codex/AGENTS.md" | awk '{print $1}')"

custom_agents_upgrade_output="$(run_installer "$tmp_codex")"
assert_simple_success_output "$custom_agents_upgrade_output" "Alpha Goal install completed."
assert_custom_agents_match "$tmp_codex/.codex"

hooks_before_skip="$(shasum -a 256 "$tmp_codex/.codex/hooks.json" | awk '{print $1}')"
for skill in executor verifier; do
  printf 'preserve me\n' > "$tmp_codex/.codex/skills/$skill/preserve-sentinel"
done
codex_skip_roles_output="$(OPTIONAL_ROLES_INPUT=n run_installer "$tmp_codex")"
assert_simple_success_output "$codex_skip_roles_output" "Alpha Goal install completed."
test "$hooks_before_skip" = "$(shasum -a 256 "$tmp_codex/.codex/hooks.json" | awk '{print $1}')"
for skill in executor verifier; do
  grep -q "preserve me" "$tmp_codex/.codex/skills/$skill/preserve-sentinel"
done

tmp_alpha_only="$(mktemp -d)"
alpha_only_output="$(OPTIONAL_ROLES_INPUT=n CUSTOM_AGENTS_INPUT=n run_installer "$tmp_alpha_only")"
assert_simple_success_output "$alpha_only_output" "Alpha Goal install completed."
assert_skill_tree_matches "$repo_root/skills/alpha-goal" "$tmp_alpha_only/.codex/skills/alpha-goal"
test ! -e "$tmp_alpha_only/.codex/skills/executor"
test ! -e "$tmp_alpha_only/.codex/skills/verifier"
test -f "$tmp_alpha_only/.codex/AGENTS.md"
test -f "$tmp_alpha_only/.codex/config.toml"
test ! -e "$tmp_alpha_only/.codex/hooks.json"
test ! -e "$tmp_alpha_only/.codex/agents"
! grep -q 'alpha-goal-managed-custom-agent-routing' "$tmp_alpha_only/.codex/AGENTS.md"

tmp_wizard_back="$(mktemp -d)"
wizard_back_output="$(WIZARD_MODE=back-disable-roles run_installer "$tmp_wizard_back")"
assert_simple_success_output "$wizard_back_output" "Alpha Goal install completed."
test ! -e "$tmp_wizard_back/.codex/skills/executor"
test ! -e "$tmp_wizard_back/.codex/skills/verifier"
test ! -e "$tmp_wizard_back/.codex/hooks.json"
assert_custom_agents_match "$tmp_wizard_back/.codex"

tmp_wizard_cancel="$(mktemp -d)"
mkdir -p "$tmp_wizard_cancel/.codex" "$tmp_wizard_cancel/.claude"
printf 'codex sentinel\n' > "$tmp_wizard_cancel/.codex/sentinel"
printf 'claude sentinel\n' > "$tmp_wizard_cancel/.claude/sentinel"
cancel_before="$(find "$tmp_wizard_cancel" -type f -exec sha256sum {} \; | sort)"
if wizard_cancel_output="$(WIZARD_MODE=cancel run_installer "$tmp_wizard_cancel" 2>&1)"; then
  echo "cancelled install should exit non-zero" >&2
  exit 1
fi
grep -q "Installation cancelled." <<<"$wizard_cancel_output"
test "$cancel_before" = "$(find "$tmp_wizard_cancel" -type f -exec sha256sum {} \; | sort)"
test "$(find "$tmp_wizard_cancel" -type f | wc -l | tr -d ' ')" -eq 2

for cancel_mode in cancel-target cancel-features-esc; do
  tmp_cancel_page="$(mktemp -d)"
  mkdir -p "$tmp_cancel_page/.codex"
  printf 'sentinel\n' > "$tmp_cancel_page/.codex/sentinel"
  if cancel_page_output="$(WIZARD_MODE="$cancel_mode" run_installer "$tmp_cancel_page" 2>&1)"; then
    echo "$cancel_mode should exit non-zero" >&2
    exit 1
  fi
  grep -q "Installation cancelled." <<<"$cancel_page_output"
  test "$(find "$tmp_cancel_page" -type f | wc -l | tr -d ' ')" -eq 1
  grep -q sentinel "$tmp_cancel_page/.codex/sentinel"
done

tmp_no_color="$(mktemp -d)"
no_color_output="$(NO_COLOR=1 TERM=dumb run_installer "$tmp_no_color")"
assert_simple_success_output "$no_color_output" "Alpha Goal install completed."
if [[ "$no_color_output" == *$'\033'* ]]; then
  echo "TERM=dumb output should not contain ANSI escape sequences" >&2
  exit 1
fi
grep -q "Step 3 of 3" <<<"$no_color_output"

tmp_hooks_backup="$(mktemp -d)"
mkdir -p "$tmp_hooks_backup/.codex"
cat > "$tmp_hooks_backup/.codex/hooks.json" <<'EOF'
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "printf user-hook"
          }
        ]
      }
    ]
  }
}
EOF
cp "$tmp_hooks_backup/.codex/hooks.json" "$tmp_hooks_backup/hooks-before.json"
hooks_backup_output="$(run_installer "$tmp_hooks_backup")"
assert_simple_success_output "$hooks_backup_output" "Alpha Goal install completed."
hooks_backup_count="$(find "$tmp_hooks_backup/.codex" -maxdepth 1 -type f -name 'hooks.json.bak-*' | wc -l | tr -d ' ')"
test "$hooks_backup_count" -eq 1
hooks_backup_file="$(find "$tmp_hooks_backup/.codex" -maxdepth 1 -type f -name 'hooks.json.bak-*')"
cmp "$tmp_hooks_backup/hooks-before.json" "$hooks_backup_file"
grep -q 'codex-alpha-goal-compact-recovery' "$tmp_hooks_backup/.codex/hooks.json"

tmp_claude="$(mktemp -d)"
mkdir -p "$tmp_claude/.codex/agents"
printf 'claude-must-not-touch\n' > "$tmp_claude/.codex/agents/scout.toml"
claude_agent_before="$(shasum -a 256 "$tmp_claude/.codex/agents/scout.toml" | awk '{print $1}')"
claude_output="$(INSTALL_CODEX_HOME="$tmp_claude/custom-codex" TARGET_CHOICE=claude run_installer "$tmp_claude")"
assert_simple_success_output "$claude_output" "Alpha Goal install completed."
for skill in alpha-goal executor verifier; do
  test -d "$tmp_claude/.claude/skills/$skill"
  test ! -L "$tmp_claude/.claude/skills/$skill"
  test -f "$tmp_claude/.claude/skills/$skill/SKILL.md"
  assert_skill_tree_matches "$repo_root/skills/$skill" "$tmp_claude/.claude/skills/$skill"
done
test -f "$tmp_claude/.claude/CLAUDE.md"
test ! -e "$tmp_claude/custom-codex"
test ! -e "$tmp_claude/.codex/AGENTS.md"
test ! -e "$tmp_claude/.codex/skills/alpha-goal"
test "$claude_agent_before" = "$(shasum -a 256 "$tmp_claude/.codex/agents/scout.toml" | awk '{print $1}')"
test ! -e "$tmp_claude/.codex/agents/architect.toml"
test ! -e "$tmp_claude/.codex/agents/builder.toml"
test ! -e "$tmp_claude/.codex/agents/reviewer.toml"
! grep -q "Install Codex custom agents" <<<"$claude_output"
! grep -q "references/claude-adapter.md" "$tmp_claude/.claude/skills/alpha-goal/SKILL.md"
grep -q '\$HOME/.claude/skills/alpha-goal/references/claude-adapter.md' "$tmp_claude/.claude/CLAUDE.md"
cmp "$repo_root/skills/alpha-goal/references/claude-adapter.md" "$tmp_claude/.claude/skills/alpha-goal/references/claude-adapter.md"

tmp_all="$(mktemp -d)"
all_install_output="$(TARGET_CHOICE=all run_installer "$tmp_all")"
assert_simple_success_output "$all_install_output" "Alpha Goal install completed."
! grep -q "Codex home \\[" <<<"$all_install_output"
! grep -q "Replace external" <<<"$all_install_output"
! grep -q "Sync user templates" <<<"$all_install_output"
! grep -q "Sync Codex user hooks" <<<"$all_install_output"
! grep -q "Print detailed" <<<"$all_install_output"
for skill in alpha-goal executor verifier; do
  test -d "$tmp_all/.codex/skills/$skill"
  test -d "$tmp_all/.claude/skills/$skill"
done
test -f "$tmp_all/.codex/AGENTS.md"
test -f "$tmp_all/.codex/config.toml"
test -f "$tmp_all/.codex/hooks.json"
test -f "$tmp_all/.claude/CLAUDE.md"
assert_custom_agents_match "$tmp_all/.codex"
! grep -q "references/claude-adapter.md" "$tmp_all/.codex/skills/alpha-goal/SKILL.md"
! grep -q "references/claude-adapter.md" "$tmp_all/.claude/skills/alpha-goal/SKILL.md"
grep -q '\$HOME/.claude/skills/alpha-goal/references/claude-adapter.md' "$tmp_all/.claude/CLAUDE.md"

tmp_alpha_only_all="$(mktemp -d)"
alpha_only_all_output="$(TARGET_CHOICE=all OPTIONAL_ROLES_INPUT=n CUSTOM_AGENTS_INPUT=n run_installer "$tmp_alpha_only_all")"
assert_simple_success_output "$alpha_only_all_output" "Alpha Goal install completed."
for root in "$tmp_alpha_only_all/.codex/skills" "$tmp_alpha_only_all/.claude/skills"; do
  assert_skill_tree_matches "$repo_root/skills/alpha-goal" "$root/alpha-goal"
  test ! -e "$root/executor"
  test ! -e "$root/verifier"
done
test -f "$tmp_alpha_only_all/.codex/AGENTS.md"
test -f "$tmp_alpha_only_all/.codex/config.toml"
test ! -e "$tmp_alpha_only_all/.codex/hooks.json"
test -f "$tmp_alpha_only_all/.claude/CLAUDE.md"
test ! -e "$tmp_alpha_only_all/.codex/agents"
! grep -q 'alpha-goal-managed-custom-agent-routing' "$tmp_alpha_only_all/.codex/AGENTS.md"

tmp_upgrade="$(mktemp -d)"
mkdir -p "$tmp_upgrade/.codex"
python3 - "$tmp_upgrade/.codex/hooks.json" <<'PY'
import json
import sys

data = {
    "hooks": {
        "PostCompact": [
            {"hooks": [{"type": "command", "command": ": 'codex-alpha-goal-compact-recovery:v1'; printf old"}]},
            {"hooks": [{"type": "command", "command": ": 'codex-alpha-goal-compact-recovery:v2'; printf old2"}]},
            {"hooks": [{"type": "command", "command": ": 'codex-alpha-goal-compact-recovery:v3'; printf old3"}]},
            {"hooks": [{"type": "command", "command": ": 'codex-compact-skill-recovery:experimental'; printf experimental"}]},
            {"hooks": [{"type": "command", "command": "printf unmanaged"}]},
        ]
    }
}
with open(sys.argv[1], "w") as handle:
    json.dump(data, handle)
PY
upgrade_output="$(run_installer "$tmp_upgrade")"
assert_simple_success_output "$upgrade_output" "Alpha Goal install completed."
! grep -q "codex-alpha-goal-compact-recovery:v1" "$tmp_upgrade/.codex/hooks.json"
! grep -q "codex-alpha-goal-compact-recovery:v2" "$tmp_upgrade/.codex/hooks.json"
! grep -q "codex-alpha-goal-compact-recovery:v3" "$tmp_upgrade/.codex/hooks.json"
! grep -q "codex-compact-skill-recovery:experimental" "$tmp_upgrade/.codex/hooks.json"
test "$(grep -o "codex-alpha-goal-compact-recovery:v4" "$tmp_upgrade/.codex/hooks.json" | wc -l | tr -d ' ')" -eq 1
grep -q "printf unmanaged" "$tmp_upgrade/.codex/hooks.json"

tmp_config_upgrade="$(mktemp -d)"
mkdir -p "$tmp_config_upgrade/.codex"
cat > "$tmp_config_upgrade/.codex/config.toml" <<'EOF'
[features]
multi_agent = true
default_mode_request_user_input = true
child_agents_md = true

[agents]
max_threads = 6
max_depth = 1

[features.multi_agent_v2]
usage_hint_enabled = true
usage_hint_text = '''
Use `spawn_agent` autonomously when delegation materially improves the task.
Repository or workspace instructions such as AGENTS.md may define when and how delegation is appropriate.
Treat those instructions as the user's standing delegation policy for the workspace.
Do not require a separate live user request before spawning subagents.
'''
EOF
config_upgrade_output="$(run_installer "$tmp_config_upgrade")"
assert_simple_success_output "$config_upgrade_output" "Alpha Goal install completed."
env HOME="$tmp_config_upgrade" CODEX_HOME="$tmp_config_upgrade/.codex" codex app-server --strict-config --listen stdio:// </dev/null >/dev/null 2>&1
node - "$tmp_config_upgrade/.codex/config.toml" "$repo_root/vendor/smol-toml/dist/index.cjs" <<'JS'
const fs = require("node:fs");
const toml = require(process.argv[3]);
const data = toml.parse(fs.readFileSync(process.argv[2], "utf8"));
if (Object.hasOwn(data.features || {}, "child_agents_md")) process.exit(1);
if (data.features?.default_mode_request_user_input !== true) process.exit(1);
if (Object.hasOwn(data.features || {}, "multi_agent_v2")) process.exit(1);
JS

tmp_config_quoted_upgrade="$(mktemp -d)"
mkdir -p "$tmp_config_quoted_upgrade/.codex"
cat > "$tmp_config_quoted_upgrade/.codex/config.toml" <<'EOF'
["features"]
# keep quoted feature formatting
"multi_agent"   = false # user value stays
'child_agents_md' = false
"default_mode_request_user_input" = true
'multi_agent_v2' = { usage_hint_enabled = true, usage_hint_text = "Use `spawn_agent` autonomously when delegation materially improves the task.\nRepository or workspace instructions such as AGENTS.md may define when and how delegation is appropriate.\nTreat those instructions as the user's standing delegation policy for the workspace.\nDo not require a separate live user request before spawning subagents.\n" }

['agents']
# keep quoted agent formatting
"max_threads" = 4 # user value stays
EOF
quoted_upgrade_output="$(run_installer "$tmp_config_quoted_upgrade")"
assert_simple_success_output "$quoted_upgrade_output" "Alpha Goal install completed."
env HOME="$tmp_config_quoted_upgrade" CODEX_HOME="$tmp_config_quoted_upgrade/.codex" codex app-server --strict-config --listen stdio:// </dev/null >/dev/null 2>&1
grep -Fq '# keep quoted feature formatting' "$tmp_config_quoted_upgrade/.codex/config.toml"
grep -Fq '"multi_agent"   = false # user value stays' "$tmp_config_quoted_upgrade/.codex/config.toml"
grep -Fq '# keep quoted agent formatting' "$tmp_config_quoted_upgrade/.codex/config.toml"
grep -Fq '"max_threads" = 4 # user value stays' "$tmp_config_quoted_upgrade/.codex/config.toml"
! grep -q '^\[agents\]$' "$tmp_config_quoted_upgrade/.codex/config.toml"
node - "$tmp_config_quoted_upgrade/.codex/config.toml" "$repo_root/vendor/smol-toml/dist/index.cjs" <<'JS'
const fs = require("node:fs");
const toml = require(process.argv[3]);
const data = toml.parse(fs.readFileSync(process.argv[2], "utf8"));
if (data.features?.multi_agent !== false) process.exit(1);
if (Object.hasOwn(data.features || {}, "child_agents_md")) process.exit(1);
if (data.features?.default_mode_request_user_input !== true) process.exit(1);
if (Object.hasOwn(data.features || {}, "multi_agent_v2")) process.exit(1);
if (data.agents?.max_threads !== 4 || data.agents?.max_depth !== 1) process.exit(1);
JS

tmp_config_dotted_upgrade="$(mktemp -d)"
mkdir -p "$tmp_config_dotted_upgrade/.codex"
cat > "$tmp_config_dotted_upgrade/.codex/config.toml" <<'EOF'
# keep dotted custom formatting
features.multi_agent = false # user value stays
features.child_agents_md = true
features.default_mode_request_user_input = true
features.multi_agent_v2.usage_hint_enabled = true
features.multi_agent_v2.usage_hint_text = '''
Use `spawn_agent` autonomously when delegation materially improves the task.
Repository or workspace instructions such as AGENTS.md may define when and how delegation is appropriate.
Treat those instructions as the user's standing delegation policy for the workspace.
Do not require a separate live user request before spawning subagents.
'''
# keep comment after retired multiline assignment

[agents]
max_threads = 5 # user value stays
EOF
dotted_upgrade_output="$(run_installer "$tmp_config_dotted_upgrade")"
assert_simple_success_output "$dotted_upgrade_output" "Alpha Goal install completed."
env HOME="$tmp_config_dotted_upgrade" CODEX_HOME="$tmp_config_dotted_upgrade/.codex" codex app-server --strict-config --listen stdio:// </dev/null >/dev/null 2>&1
grep -Fq '# keep dotted custom formatting' "$tmp_config_dotted_upgrade/.codex/config.toml"
grep -Fq 'features.multi_agent = false # user value stays' "$tmp_config_dotted_upgrade/.codex/config.toml"
grep -Fq '# keep comment after retired multiline assignment' "$tmp_config_dotted_upgrade/.codex/config.toml"
grep -Fq 'max_threads = 5 # user value stays' "$tmp_config_dotted_upgrade/.codex/config.toml"
! grep -q 'spawn_agent' "$tmp_config_dotted_upgrade/.codex/config.toml"
node - "$tmp_config_dotted_upgrade/.codex/config.toml" "$repo_root/vendor/smol-toml/dist/index.cjs" <<'JS'
const fs = require("node:fs");
const toml = require(process.argv[3]);
const data = toml.parse(fs.readFileSync(process.argv[2], "utf8"));
if (data.features?.multi_agent !== false) process.exit(1);
if (Object.hasOwn(data.features || {}, "child_agents_md")) process.exit(1);
if (data.features?.default_mode_request_user_input !== true) process.exit(1);
if (Object.hasOwn(data.features || {}, "multi_agent_v2")) process.exit(1);
if (data.agents?.max_threads !== 5 || data.agents?.max_depth !== 1) process.exit(1);
JS

tmp_inline_features="$(mktemp -d)"
mkdir -p "$tmp_inline_features/.codex"
cat > "$tmp_inline_features/.codex/config.toml" <<'EOF'
features = { multi_agent = true, child_agents_md = true, default_mode_request_user_input = true }

[agents]
max_threads = 6
max_depth = 1

[custom]
keep = "inline-parent"
EOF
inline_features_before="$(shasum -a 256 "$tmp_inline_features/.codex/config.toml" | awk '{print $1}')"
if inline_features_output="$(run_installer "$tmp_inline_features" 2>&1)"; then
  echo "inline features table with retired fields should fail preflight" >&2
  exit 1
fi
grep -q 'Cannot safely migrate retired features' <<<"$inline_features_output"
test "$inline_features_before" = "$(shasum -a 256 "$tmp_inline_features/.codex/config.toml" | awk '{print $1}')"
test ! -e "$tmp_inline_features/.codex/AGENTS.md"
test ! -e "$tmp_inline_features/.codex/agents"
test ! -e "$tmp_inline_features/.codex/skills"

tmp_merge="$(mktemp -d)"
mkdir -p "$tmp_merge/.codex"
cat > "$tmp_merge/.codex/config.toml" <<'EOF'
[features]
multi_agent = false
default_mode_request_user_input = false
child_agents_md = false

[agents]
max_threads = 2

[features.multi_agent_v2]
usage_hint_enabled = false
usage_hint_text = "user-owned"
extra = "keep"

[custom]
keep = "yes"
EOF
merge_install_output="$(run_installer "$tmp_merge")"
assert_simple_success_output "$merge_install_output" "Alpha Goal install completed."
node - "$tmp_merge/.codex/config.toml" "$repo_root/vendor/smol-toml/dist/index.cjs" <<'JS'
const fs = require("node:fs");
const toml = require(process.argv[3]);
const data = toml.parse(fs.readFileSync(process.argv[2], "utf8"));
if (data.features?.multi_agent !== false) process.exit(1);
if (Object.hasOwn(data.features || {}, "child_agents_md")) process.exit(1);
if (data.features?.default_mode_request_user_input !== false) process.exit(1);
if (data.features?.multi_agent_v2?.usage_hint_enabled !== false) process.exit(1);
if (data.features?.multi_agent_v2?.usage_hint_text !== "user-owned") process.exit(1);
if (data.features?.multi_agent_v2?.extra !== "keep") process.exit(1);
if (data.agents?.max_threads !== 2 || data.agents?.max_depth !== 1) process.exit(1);
if (data.custom?.keep !== "yes") process.exit(1);
JS
merge_uninstall_output="$(run_installer "$tmp_merge" --uninstall)"
assert_simple_success_output "$merge_uninstall_output" "Alpha Goal uninstall completed."
test -f "$tmp_merge/.codex/config.toml"
grep -q 'keep = "yes"' "$tmp_merge/.codex/config.toml"
grep -q 'multi_agent = false' "$tmp_merge/.codex/config.toml"
for skill in alpha-goal executor verifier; do
  test ! -e "$tmp_merge/.codex/skills/$skill"
done
test ! -e "$tmp_merge/.codex/AGENTS.md"
test ! -e "$tmp_merge/.codex/hooks.json"
test ! -e "$tmp_merge/.codex/agents"

all_uninstall_output="$(TARGET_CHOICE=all run_installer "$tmp_all" --uninstall)"
assert_simple_success_output "$all_uninstall_output" "Alpha Goal uninstall completed."
for skill in alpha-goal executor verifier; do
  test ! -e "$tmp_all/.codex/skills/$skill"
  test ! -e "$tmp_all/.claude/skills/$skill"
done
test ! -e "$tmp_all/.codex/AGENTS.md"
test ! -e "$tmp_all/.codex/config.toml"
test ! -e "$tmp_all/.codex/hooks.json"
test ! -e "$tmp_all/.claude/CLAUDE.md"
test ! -e "$tmp_all/.codex/agents"

tmp_custom_uninstall_no="$(mktemp -d)"
run_installer "$tmp_custom_uninstall_no" >/dev/null
scout_before_uninstall_skip="$(shasum -a 256 "$tmp_custom_uninstall_no/.codex/agents/scout.toml" | awk '{print $1}')"
routing_before_uninstall_skip="$(shasum -a 256 "$tmp_custom_uninstall_no/.codex/AGENTS.md" | awk '{print $1}')"
custom_uninstall_no_output="$(CUSTOM_AGENTS_INPUT=n run_installer "$tmp_custom_uninstall_no" --uninstall)"
assert_simple_success_output "$custom_uninstall_no_output" "Alpha Goal uninstall completed."
test "$scout_before_uninstall_skip" = "$(shasum -a 256 "$tmp_custom_uninstall_no/.codex/agents/scout.toml" | awk '{print $1}')"
while IFS= read -r agent; do
  test -f "$tmp_custom_uninstall_no/.codex/agents/$agent.toml"
done < <(contract_agent_names)
grep -q 'alpha-goal-managed-custom-agent-routing:v1' "$tmp_custom_uninstall_no/.codex/AGENTS.md"
test "$routing_before_uninstall_skip" != "$(shasum -a 256 "$tmp_custom_uninstall_no/.codex/AGENTS.md" | awk '{print $1}')"
test ! -e "$tmp_custom_uninstall_no/.codex/skills/alpha-goal"

tmp_markdown_mix="$(mktemp -d)"
mkdir -p "$tmp_markdown_mix/.codex"
cat > "$tmp_markdown_mix/.codex/AGENTS.md" <<'EOF'
# User-owned guidance

Keep this text.
EOF
run_installer "$tmp_markdown_mix" >/dev/null
grep -q 'Keep this text.' "$tmp_markdown_mix/.codex/AGENTS.md"
test "$(grep -c '<!-- generate-with-template:agents-md -->' "$tmp_markdown_mix/.codex/AGENTS.md")" -eq 1
test "$(grep -c '<!-- generate-with-template:custom-agent-routing -->' "$tmp_markdown_mix/.codex/AGENTS.md")" -eq 1
run_installer "$tmp_markdown_mix" >/dev/null
test "$(grep -c '<!-- generate-with-template:agents-md -->' "$tmp_markdown_mix/.codex/AGENTS.md")" -eq 1
test "$(grep -c '<!-- generate-with-template:custom-agent-routing -->' "$tmp_markdown_mix/.codex/AGENTS.md")" -eq 1
run_installer "$tmp_markdown_mix" --uninstall >/dev/null
grep -q 'Keep this text.' "$tmp_markdown_mix/.codex/AGENTS.md"
! grep -q 'generate-with-template:agents-md' "$tmp_markdown_mix/.codex/AGENTS.md"
! grep -q 'generate-with-template:custom-agent-routing' "$tmp_markdown_mix/.codex/AGENTS.md"
test ! -e "$tmp_markdown_mix/.codex/agents"

tmp_noninteractive_install="$(mktemp -d)"
tmp_noninteractive_uninstall="$(mktemp -d)"
if noninteractive_install_output="$(env -u CODEX_HOME HOME="$tmp_noninteractive_install" "$repo_root/scripts/install.sh" </dev/null 2>&1)"; then
  echo "non-interactive install should fail" >&2
  exit 1
fi
grep -q "Interactive terminal required" <<<"$noninteractive_install_output"
test ! -e "$tmp_noninteractive_install/.codex/skills/alpha-goal"
if noninteractive_uninstall_output="$(env -u CODEX_HOME HOME="$tmp_noninteractive_uninstall" "$repo_root/scripts/install.sh" --uninstall </dev/null 2>&1)"; then
  echo "non-interactive uninstall should fail" >&2
  exit 1
fi
grep -q "Interactive terminal required" <<<"$noninteractive_uninstall_output"
test ! -e "$tmp_noninteractive_uninstall/.codex/skills/alpha-goal"

tmp_conflict="$(mktemp -d)"
if conflict_output="$(TARGET_CHOICE=all CODEX_HOME_INPUT="$tmp_conflict/.claude" run_installer "$tmp_conflict" --uninstall 2>&1)"; then
  echo "interactive all uninstall should reject identical skill roots" >&2
  exit 1
fi
grep -q "requires distinct Codex and Claude skill roots" <<<"$conflict_output"

tmp_link_conflict="$(mktemp -d)"
mkdir -p "$tmp_link_conflict/.claude"
ln -s "$tmp_link_conflict/.claude" "$tmp_link_conflict/.codex"
if link_conflict_output="$(TARGET_CHOICE=all run_installer "$tmp_link_conflict" 2>&1)"; then
  echo "interactive all should reject symlinked identical skill roots" >&2
  exit 1
fi
grep -q "requires distinct Codex and Claude skill roots" <<<"$link_conflict_output"

tmp_agent_unmanaged="$(mktemp -d)"
mkdir -p "$tmp_agent_unmanaged/.codex/agents"
printf 'user-owned\n' > "$tmp_agent_unmanaged/.codex/agents/builder.toml"
agent_unmanaged_before="$(shasum -a 256 "$tmp_agent_unmanaged/.codex/agents/builder.toml" | awk '{print $1}')"
if agent_unmanaged_output="$(run_installer "$tmp_agent_unmanaged" 2>&1)"; then
  echo "install should refuse an unmanaged same-name custom agent" >&2
  exit 1
fi
grep -q "Refusing to replace unmanaged or non-regular custom agent" <<<"$agent_unmanaged_output"
test "$agent_unmanaged_before" = "$(shasum -a 256 "$tmp_agent_unmanaged/.codex/agents/builder.toml" | awk '{print $1}')"
test ! -e "$tmp_agent_unmanaged/.codex/agents/architect.toml"
test ! -e "$tmp_agent_unmanaged/.codex/agents/scout.toml"
test ! -e "$tmp_agent_unmanaged/.codex/agents/reviewer.toml"
test ! -e "$tmp_agent_unmanaged/.codex/AGENTS.md"
test ! -e "$tmp_agent_unmanaged/.codex/config.toml"
test ! -e "$tmp_agent_unmanaged/.codex/skills"

tmp_agent_symlink="$(mktemp -d)"
mkdir -p "$tmp_agent_symlink/.codex/agents"
printf 'external\n' > "$tmp_agent_symlink/external-scout.toml"
ln -s "$tmp_agent_symlink/external-scout.toml" "$tmp_agent_symlink/.codex/agents/scout.toml"
if agent_symlink_output="$(run_installer "$tmp_agent_symlink" 2>&1)"; then
  echo "install should refuse a same-name custom agent symlink" >&2
  exit 1
fi
grep -q "Refusing to replace custom agent symlink" <<<"$agent_symlink_output"
test -L "$tmp_agent_symlink/.codex/agents/scout.toml"
grep -q external "$tmp_agent_symlink/external-scout.toml"
test ! -e "$tmp_agent_symlink/.codex/agents/architect.toml"
test ! -e "$tmp_agent_symlink/.codex/agents/builder.toml"
test ! -e "$tmp_agent_symlink/.codex/AGENTS.md"

tmp_agent_nonregular="$(mktemp -d)"
mkdir -p "$tmp_agent_nonregular/.codex/agents/reviewer.toml"
printf 'keep\n' > "$tmp_agent_nonregular/.codex/agents/reviewer.toml/sentinel"
if agent_nonregular_output="$(run_installer "$tmp_agent_nonregular" 2>&1)"; then
  echo "install should refuse a non-regular same-name custom agent" >&2
  exit 1
fi
grep -q "Refusing to replace unmanaged or non-regular custom agent" <<<"$agent_nonregular_output"
grep -q keep "$tmp_agent_nonregular/.codex/agents/reviewer.toml/sentinel"
test ! -e "$tmp_agent_nonregular/.codex/agents/architect.toml"
test ! -e "$tmp_agent_nonregular/.codex/agents/scout.toml"
test ! -e "$tmp_agent_nonregular/.codex/AGENTS.md"

tmp_legacy_unmanaged="$(mktemp -d)"
mkdir -p "$tmp_legacy_unmanaged/.codex/skills/tools" "$tmp_legacy_unmanaged/.codex/skills/templates"
printf 'unreadable-user-tools\n' > "$tmp_legacy_unmanaged/.codex/skills/tools/sentinel"
printf 'ordinary-user-templates\n' > "$tmp_legacy_unmanaged/.codex/skills/templates/sentinel"
chmod 000 "$tmp_legacy_unmanaged/.codex/skills/tools"
legacy_unmanaged_output="$(run_installer "$tmp_legacy_unmanaged")"
assert_simple_success_output "$legacy_unmanaged_output" "Alpha Goal install completed."
python3 - "$tmp_legacy_unmanaged/.codex/skills/tools" <<'PY'
import os
import stat
import sys

if stat.S_IMODE(os.stat(sys.argv[1]).st_mode) != 0:
    raise SystemExit(1)
PY
test -d "$tmp_legacy_unmanaged/.codex/skills/templates"
grep -q 'ordinary-user-templates' "$tmp_legacy_unmanaged/.codex/skills/templates/sentinel"
chmod 700 "$tmp_legacy_unmanaged/.codex/skills/tools"
grep -q 'unreadable-user-tools' "$tmp_legacy_unmanaged/.codex/skills/tools/sentinel"

tmp_external="$(mktemp -d)"
mkdir -p "$tmp_external/.codex/skills" "$tmp_external/external-alpha-goal"
ln -s "$tmp_external/external-alpha-goal" "$tmp_external/.codex/skills/alpha-goal"
if external_output="$(run_installer "$tmp_external" 2>&1)"; then
  echo "install should refuse external skill symlinks without an override" >&2
  exit 1
fi
grep -q "External skill symlinks are not replaced during install" <<<"$external_output"
test -L "$tmp_external/.codex/skills/alpha-goal"

tmp_unmanaged="$(mktemp -d)"
mkdir -p "$tmp_unmanaged/.codex/skills/alpha-goal"
printf 'user-owned\n' > "$tmp_unmanaged/.codex/skills/alpha-goal/sentinel"
if unmanaged_output="$(run_installer "$tmp_unmanaged" 2>&1)"; then
  echo "install should refuse an unmanaged same-name skill directory" >&2
  exit 1
fi
grep -q "Refusing to replace unmanaged or malformed skill directory" <<<"$unmanaged_output"
grep -q "user-owned" "$tmp_unmanaged/.codex/skills/alpha-goal/sentinel"
test ! -e "$tmp_unmanaged/.codex/skills/alpha-goal/.alpha-goal-skill-copy"
test ! -e "$tmp_unmanaged/.codex/AGENTS.md"
test ! -e "$tmp_unmanaged/.codex/config.toml"
test ! -e "$tmp_unmanaged/.codex/hooks.json"
test ! -e "$tmp_unmanaged/.codex/agents"
test ! -e "$tmp_unmanaged/.codex/skills/executor"
test ! -e "$tmp_unmanaged/.codex/skills/verifier"

tmp_malformed="$(mktemp -d)"
mkdir -p "$tmp_malformed/.codex/skills/alpha-goal"
printf 'not-a-managed-marker\n' > "$tmp_malformed/.codex/skills/alpha-goal/.alpha-goal-skill-copy"
printf 'keep-me\n' > "$tmp_malformed/.codex/skills/alpha-goal/sentinel"
if malformed_output="$(run_installer "$tmp_malformed" 2>&1)"; then
  echo "install should refuse a malformed managed marker" >&2
  exit 1
fi
grep -q "Refusing to replace unmanaged or malformed skill directory" <<<"$malformed_output"
grep -q "keep-me" "$tmp_malformed/.codex/skills/alpha-goal/sentinel"

tmp_write_fault="$(mktemp -d)"
mkdir -p "$tmp_write_fault/fake-bin"
real_python="$(command -v python3)"
python3 - "$tmp_write_fault/fake-bin/python3" <<'PYWRAP'
import os
import sys

wrapper = r'''#!/usr/bin/env bash
if [[ "$1" == "-" && "$2" == *"/.alpha-goal-skill-stage."*"/executor" && "$3" == *"/skills/executor" && ! -e "$FAIL_MARKER" ]]; then
  : > "$FAIL_MARKER"
  exit 71
fi
exec "$REAL_PYTHON" "$@"
'''
with open(sys.argv[1], "w") as handle:
    handle.write(wrapper)
os.chmod(sys.argv[1], 0o755)
PYWRAP
if write_fault_output="$(PATH="$tmp_write_fault/fake-bin:$PATH" REAL_PYTHON="$real_python" FAIL_MARKER="$tmp_write_fault/fault-fired" run_installer "$tmp_write_fault" 2>&1)"; then
  echo "write-fault injection should fail" >&2
  exit 1
fi
test -f "$tmp_write_fault/fault-fired"
grep -q "Failed to activate staged skill copy" <<<"$write_fault_output"
grep -q "restored all managed targets changed by this run" <<<"$write_fault_output"
test ! -e "$tmp_write_fault/.codex"

tmp_uninstall_fault="$(mktemp -d)"
TARGET_CHOICE=all run_installer "$tmp_uninstall_fault" >/dev/null
chmod 0711 "$tmp_uninstall_fault/.codex/agents"
mkdir -p "$tmp_uninstall_fault/external"
rm "$tmp_uninstall_fault/.codex/config.toml"
printf 'external config\n' > "$tmp_uninstall_fault/external/config.toml"
ln "$tmp_uninstall_fault/external/config.toml" "$tmp_uninstall_fault/external/config-alias.toml"
ln -s "$tmp_uninstall_fault/external/config.toml" "$tmp_uninstall_fault/.codex/config.toml"
rm -rf "$tmp_uninstall_fault/.codex/skills/verifier"
printf 'external skill\n' > "$tmp_uninstall_fault/external/skill"
ln "$tmp_uninstall_fault/external/skill" "$tmp_uninstall_fault/.codex/skills/verifier"
printf 'user sidecar\n' > "$tmp_uninstall_fault/.codex/hooks.json.tmp"
node - "$tmp_uninstall_fault/.codex/hooks.json" <<'JS'
const fs = require("node:fs");
const hooksPath = process.argv[2];
const hooks = JSON.parse(fs.readFileSync(hooksPath, "utf8"));
hooks.userOwned = { preserve: true };
fs.writeFileSync(hooksPath, `${JSON.stringify(hooks, null, 2)}\n`);
JS
mkdir -p "$tmp_uninstall_fault/before"
cp -a "$tmp_uninstall_fault/.codex" "$tmp_uninstall_fault/before/codex"
cp -a "$tmp_uninstall_fault/.claude" "$tmp_uninstall_fault/before/claude"
mkdir -p "$tmp_uninstall_fault/fake-bin"
real_rm="$(command -v rm)"
cat > "$tmp_uninstall_fault/fake-bin/rm" <<'SH'
#!/usr/bin/env bash
for argument in "$@"; do
  if [[ "$argument" == "$FAIL_TARGET" && ! -e "$FAIL_MARKER" ]]; then
    : > "$FAIL_MARKER"
    exit 72
  fi
done
exec "$REAL_RM" "$@"
SH
chmod +x "$tmp_uninstall_fault/fake-bin/rm"
if uninstall_fault_output="$(
  PATH="$tmp_uninstall_fault/fake-bin:$PATH" \
  REAL_RM="$real_rm" \
  FAIL_MARKER="$tmp_uninstall_fault/fault-fired" \
  FAIL_TARGET="$tmp_uninstall_fault/.claude/skills/executor" \
  TARGET_CHOICE=all \
  run_installer "$tmp_uninstall_fault" --uninstall 2>&1
)"; then
  echo "uninstall-fault injection should fail" >&2
  exit 1
fi
test -f "$tmp_uninstall_fault/fault-fired"
grep -q "restored all managed targets changed by this run" <<<"$uninstall_fault_output"
diff -r --no-dereference "$tmp_uninstall_fault/before/codex" "$tmp_uninstall_fault/.codex"
diff -r --no-dereference "$tmp_uninstall_fault/before/claude" "$tmp_uninstall_fault/.claude"
test "$(stat -c '%a' "$tmp_uninstall_fault/.codex/agents")" = "711"
test "$tmp_uninstall_fault/external/config.toml" -ef "$tmp_uninstall_fault/external/config-alias.toml"
test "$tmp_uninstall_fault/external/skill" -ef "$tmp_uninstall_fault/.codex/skills/verifier"
grep -q 'user sidecar' "$tmp_uninstall_fault/.codex/hooks.json.tmp"

unmanaged_fault_agent="$(contract_agent_names | tail -1)"
rm "$tmp_uninstall_fault/.codex/agents/$unmanaged_fault_agent.toml"
printf 'external agent\n' > "$tmp_uninstall_fault/external/agent.toml"
ln "$tmp_uninstall_fault/external/agent.toml" "$tmp_uninstall_fault/.codex/agents/$unmanaged_fault_agent.toml"
mkdir -p "$tmp_uninstall_fault/before-unmanaged"
cp -a "$tmp_uninstall_fault/.codex" "$tmp_uninstall_fault/before-unmanaged/codex"
cp -a "$tmp_uninstall_fault/.claude" "$tmp_uninstall_fault/before-unmanaged/claude"
rm "$tmp_uninstall_fault/fault-fired"
if unmanaged_fault_output="$(
  PATH="$tmp_uninstall_fault/fake-bin:$PATH" \
  REAL_RM="$real_rm" \
  FAIL_MARKER="$tmp_uninstall_fault/fault-fired" \
  FAIL_TARGET="$tmp_uninstall_fault/.claude/skills/executor" \
  TARGET_CHOICE=all \
  run_installer "$tmp_uninstall_fault" --uninstall 2>&1
)"; then
  echo "unmanaged uninstall-fault injection should fail" >&2
  exit 1
fi
test -f "$tmp_uninstall_fault/fault-fired"
grep -q "restored all managed targets changed by this run" <<<"$unmanaged_fault_output"
diff -r --no-dereference "$tmp_uninstall_fault/before-unmanaged/codex" "$tmp_uninstall_fault/.codex"
diff -r --no-dereference "$tmp_uninstall_fault/before-unmanaged/claude" "$tmp_uninstall_fault/.claude"
test "$tmp_uninstall_fault/external/agent.toml" -ef "$tmp_uninstall_fault/.codex/agents/$unmanaged_fault_agent.toml"
test -z "$(find "$TMPDIR" -maxdepth 1 -type d -name 'alpha-goal-install-transaction.*' -print -quit)"

unmanaged_uninstall_agent="$(contract_agent_names | tail -1)"
rm "$tmp_codex/.codex/agents/$unmanaged_uninstall_agent.toml"
printf 'user-owned uninstall agent\n' > "$tmp_codex/.codex/agents/$unmanaged_uninstall_agent.toml"
codex_uninstall_output="$(run_installer "$tmp_codex" --uninstall)"
assert_simple_success_output "$codex_uninstall_output" "Alpha Goal uninstall completed."
for skill in alpha-goal executor verifier; do
  test ! -e "$tmp_codex/.codex/skills/$skill"
done
test ! -e "$tmp_codex/.codex/AGENTS.md"
test ! -e "$tmp_codex/.codex/config.toml"
test ! -e "$tmp_codex/.codex/hooks.json"
while IFS= read -r agent; do
  if [[ "$agent" == "$unmanaged_uninstall_agent" ]]; then
    grep -q 'user-owned uninstall agent' "$tmp_codex/.codex/agents/$agent.toml"
  else
    test ! -e "$tmp_codex/.codex/agents/$agent.toml"
  fi
done < <(contract_agent_names)

claude_uninstall_output="$(TARGET_CHOICE=claude run_installer "$tmp_claude" --uninstall)"
assert_simple_success_output "$claude_uninstall_output" "Alpha Goal uninstall completed."
for skill in alpha-goal executor verifier; do
  test ! -e "$tmp_claude/.claude/skills/$skill"
done
test ! -e "$tmp_claude/.claude/CLAUDE.md"
grep -q 'claude-must-not-touch' "$tmp_claude/.codex/agents/scout.toml"

expect_invalid_arg --target
expect_invalid_arg --target codex
expect_invalid_arg --target claude
expect_invalid_arg --target all
expect_invalid_arg --target=codex
expect_invalid_arg --target=claude
expect_invalid_arg --target=all
expect_invalid_arg --codex-home
expect_invalid_arg --codex-home /tmp/x
expect_invalid_arg --codex-home=/tmp/x
expect_invalid_arg --uninstall --target codex
expect_invalid_arg --uninstall --target claude
expect_invalid_arg --force
expect_invalid_arg --sync-user-templates
expect_invalid_arg --no-sync-user-templates
expect_invalid_arg --sync-user-hooks
expect_invalid_arg --no-sync-user-hooks
expect_invalid_arg --verbose
expect_invalid_arg -h
expect_invalid_arg --help
expect_invalid_arg positional

for shell_file in "$repo_root/scripts/install.sh" "$repo_root/scripts/test-install.sh" "$repo_root"/scripts/install/*.sh; do
  bash -n "$shell_file"
done
node "$repo_root/tools/validate_skills.js" "$repo_root"
node "$repo_root/tools/validate_skills.js" --fixtures

echo "Alpha Goal install smoke passed."
