"""Run one frozen planning case against the installed candidate, without prior context."""
import argparse
import hashlib
import json
import pathlib
import subprocess
import tempfile
import time
import tomllib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
parser = argparse.ArgumentParser()
parser.add_argument("case")
parser.add_argument("--resume")
args = parser.parse_args()
frozen = json.loads((HERE / "frozen-input.json").read_text())
case = next(c for c in frozen["cases"] if c["id"] == args.case)
config = tomllib.loads((pathlib.Path.home() / ".codex/config.toml").read_text())
raw = ROOT / "release/packages/aft56-lock-planning-2026-11-02"
raw.mkdir(exist_ok=True)
suffix = "correction" if args.resume else "first"
label = args.case + "-" + suffix
workspace = (pathlib.Path(json.loads((HERE / (args.case + "-first-run.json")).read_text())["workspace"])
             if args.resume else pathlib.Path(tempfile.mkdtemp(prefix="aft56-" + label + "-")))
prompt = ((case["correction"] if args.resume else frozen["boundary"] + "\n\n" + case["prompt"]))
command = ["codex", "exec", "--ignore-user-config"]
overrides = {
    "features.memories": False,
    "model": frozen["approvedModel"],
    "model_reasoning_effort": frozen["approvedReasoningEffort"],
    "web_search": "live",
    "memories.use_memories": False,
    "memories.generate_memories": False,
    "features.multi_agent": False,
    "approval_policy": "never",
    "sandbox_mode": "read-only",
    "marketplaces.aft56-local-test.source_type": "local",
    "marketplaces.aft56-local-test.source": config["marketplaces"]["aft56-local-test"]["source"],
}
for plugin in config.get("plugins", {}):
    overrides['plugins.' + plugin + '.enabled'] = plugin == frozen["candidate"]
overrides['plugins.' + frozen["candidate"] + '.enabled'] = True
for key, value in overrides.items():
    command += ["-c", key + "=" + json.dumps(value)]
if args.resume:
    command += ["resume", args.resume]
else:
    command += ["--cd", str(workspace), "--sandbox", "read-only"]
command += ["--skip-git-repo-check", "--json", "--output-last-message", str(HERE / (label + "-answer.md")), "-"]
start = time.monotonic()
session = None
calls = 0
reason = None
with (raw / (label + ".jsonl")).open("w") as log, (raw / (label + ".stderr")).open("w") as err:
    process = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=log, stderr=err, text=True)
    process.stdin.write(prompt)
    process.stdin.close()
    while process.poll() is None:
        time.sleep(1)
        events = []
        for line in (raw / (label + ".jsonl")).read_text().splitlines():
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError:
                pass
        session = next((e.get("thread_id") for e in events if e.get("type") == "thread.started"), session)
        calls = sum(e.get("type") == "item.started" and e.get("item", {}).get("type") in ("command_execution", "mcp_tool_call", "web_search") for e in events)
        if time.monotonic() - start > frozen["limits"]["secondsPerTurn"] or calls > frozen["limits"]["toolCallsPerTurn"]:
            reason = "bounded evaluation limit"
            process.terminate()
            break
    try:
        exit_code = process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        process.kill()
        exit_code = process.wait()
metadata = {
    "label": label, "session": session, "workspace": str(workspace),
    "modelSource": "explicit user-approved model and effort; stale saved config excluded", "model": "resolve from session turn_context",
    "candidate": frozen["candidate"], "version": frozen["version"],
    "promptSHA256": hashlib.sha256(prompt.encode()).hexdigest(),
    "command": command, "exitCode": exit_code, "stopReason": reason,
    "toolCalls": calls, "elapsedSeconds": round(time.monotonic() - start, 2),
    "rawTrace": str(raw / (label + ".jsonl")),
    "rawTraceSHA256": hashlib.sha256((raw / (label + ".jsonl")).read_bytes()).hexdigest(),
}
if session:
    sessions = pathlib.Path.home() / ".codex/sessions"
    # Locate only this evaluator's trace, never prior planning content.
    for trace in sessions.glob("2026/11/02/*" + session + "*"):
        for line in trace.read_text().splitlines():
            event = json.loads(line)
            if event.get("type") == "turn_context":
                context = event["payload"]
                metadata["model"] = context.get("model")
                metadata["reasoningEffort"] = context.get("effort")
                metadata["sandboxPolicy"] = context.get("sandbox_policy")
                metadata["workspace"] = context.get("cwd", metadata["workspace"])
(HERE / (label + "-run.json")).write_text(json.dumps(metadata, indent=2) + "\n")
print(json.dumps(metadata, indent=2))
raise SystemExit(exit_code)
