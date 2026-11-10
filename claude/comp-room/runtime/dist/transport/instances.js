import { promises as fs } from "node:fs";
import * as path from "node:path";
import {
  HEARTBEAT_BUSY_STALE_MS,
  HEARTBEAT_FILENAME,
  HEARTBEAT_STALE_MS,
  INSTANCE_DIR_SWEEP_MS,
  INSTANCES_DIR,
  sanitizeInstanceId
} from "../config.js";
function isAlive(heartbeat, now = Date.now()) {
  if (heartbeat === null || typeof heartbeat.ts !== "number") return false;
  const age = now - heartbeat.ts;
  return age < (heartbeat.busy ? HEARTBEAT_BUSY_STALE_MS : HEARTBEAT_STALE_MS);
}
async function readInstance(dir, now = Date.now()) {
  const id = path.basename(dir);
  let heartbeat = null;
  try {
    const raw = await fs.readFile(path.join(dir, HEARTBEAT_FILENAME), "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.ts === "number") {
      heartbeat = {
        ...parsed,
        id: typeof parsed.id === "string" ? parsed.id : id,
        project: typeof parsed.project === "string" ? parsed.project : null,
        projectName: typeof parsed.projectName === "string" ? parsed.projectName : null,
        ts: parsed.ts
      };
    }
  } catch {
  }
  return {
    id,
    dir,
    heartbeat,
    ageMs: heartbeat ? now - heartbeat.ts : null,
    alive: isAlive(heartbeat, now)
  };
}
async function listInstances(instancesDir = INSTANCES_DIR, now = Date.now()) {
  let entries;
  try {
    entries = await fs.readdir(instancesDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const infos = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    infos.push(await readInstance(path.join(instancesDir, entry.name), now));
  }
  return infos.sort((a, b) => a.id.localeCompare(b.id));
}
function projectStem(name) {
  return path.basename(name).toLowerCase().replace(/\.aepx?$/i, "");
}
function projectPathKey(p) {
  return path.resolve(p).replace(/\\/g, "/").toLowerCase();
}
function matchesTarget(instance, target) {
  const wanted = target.trim();
  if (wanted.length === 0) return false;
  if (instance.id === wanted || instance.id === sanitizeInstanceId(wanted)) return true;
  const hb = instance.heartbeat;
  if (/[\\/]/.test(wanted)) {
    return hb?.project ? projectPathKey(hb.project) === projectPathKey(wanted) : false;
  }
  const project = hb?.projectName ?? (hb?.project ? path.basename(hb.project) : null);
  if (!project) return false;
  return projectStem(project) === projectStem(wanted);
}
const INSTALL_HINT = "Each instance needs the resident agent: run `npx @kumoproductions/mcp-aftereffects install-agent` once per After Effects version, then (re)start After Effects \u2014 the agent registers about ten seconds after launch. To name an instance, set AE_MCP_INSTANCE in the environment that launches it (works with `AfterFX.exe -m`); the server-side AE_MCP_INSTANCE can also name the project file it has open.";
function instanceLabel(instance) {
  const project = instance.heartbeat?.projectName ?? "untitled";
  return `${project} [${instance.id}]`;
}
function describeInstance(instance) {
  const hb = instance.heartbeat;
  const state = instance.alive ? hb?.busy ? "busy" : "live" : "stale";
  const seen = instance.ageMs === null ? "never seen" : `seen ${Math.round(instance.ageMs / 1e3)}s ago`;
  return `${instanceLabel(instance)} (${state}, ${seen})`;
}
function instanceSummary(instances) {
  return instances.length === 0 ? "none" : instances.map(describeInstance).join("; ");
}
async function resolveTarget(target, instancesDir = INSTANCES_DIR, now = Date.now()) {
  const all = await listInstances(instancesDir, now);
  const live = all.filter((i) => i.alive);
  if (target === null) {
    if (live.length === 0) return { mode: "push" };
    if (live.length === 1) return { mode: "pull", instance: live[0] };
    return {
      mode: "error",
      message: `${live.length} After Effects instances are live and none was named \u2014 set AE_MCP_INSTANCE to one of: ${live.map(instanceLabel).join(", ")}`,
      hint: `Name the instance by its id or by the project file it has open (e.g. "shotA" or "shotA.aep"): AE_MCP_INSTANCE on the server picks its default, and every tool takes an \`instance\` argument to address another for one call. Live instances: ${instanceSummary(live)}.`
    };
  }
  const matches = live.filter((i) => matchesTarget(i, target));
  if (matches.length === 1) return { mode: "pull", instance: matches[0] };
  if (matches.length > 1) {
    return {
      mode: "error",
      message: `'${target}' matches ${matches.length} live After Effects instances: ` + matches.map(instanceLabel).join(", "),
      hint: `Address one of them by id instead. Live instances: ${instanceSummary(live)}.`
    };
  }
  const stale = all.filter((i) => !i.alive && matchesTarget(i, target));
  const why = stale.length > 0 ? ` \u2014 it was last seen ${Math.round((stale[0].ageMs ?? 0) / 1e3)}s ago and has stopped ticking (After Effects quit, crashed, or is stuck in a modal dialog)` : live.length > 0 ? `; live instances: ${instanceSummary(live)}` : "; no instance has a live agent";
  return {
    mode: "error",
    message: `no live After Effects instance matches '${target}'${why}`,
    hint: INSTALL_HINT
  };
}
async function sweepDeadInstanceDirs(instancesDir = INSTANCES_DIR, now = Date.now()) {
  const removed = [];
  for (const instance of await listInstances(instancesDir, now)) {
    let lastActivity = instance.heartbeat?.ts ?? null;
    if (lastActivity === null) {
      try {
        lastActivity = (await fs.stat(instance.dir)).mtimeMs;
      } catch {
        continue;
      }
    }
    if (now - lastActivity < INSTANCE_DIR_SWEEP_MS) continue;
    try {
      await fs.rm(instance.dir, { recursive: true, force: true });
      removed.push(instance.id);
    } catch {
    }
  }
  return removed;
}
export {
  describeInstance,
  instanceLabel,
  instanceSummary,
  isAlive,
  listInstances,
  matchesTarget,
  readInstance,
  resolveTarget,
  sweepDeadInstanceDirs
};
