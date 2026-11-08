import { existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DEFAULT_AE_PATHS = {
  darwin: ['2026', '2025', '2024'].map(y => `/Applications/Adobe After Effects ${y}/Adobe After Effects ${y}.app`),
  win32: ['2026', '2025', '2024'].map(y => `C:/Program Files/Adobe/Adobe After Effects ${y}/Support Files/AfterFX.exe`),
};

function check(name, ok, detail, { optional = false, hint } = {}) {
  return { name, ok, ...(optional ? { optional: true } : {}), ...(detail ? { detail } : {}), ...(!ok && hint ? { hint } : {}) };
}

function usableAePath(candidate, platform, fileExists, stat) {
  if (!fileExists(candidate)) return false;
  if (platform !== 'darwin' || !candidate.endsWith('.app')) return true;
  try { return stat(candidate).isDirectory(); } catch { return false; }
}

function resolveAeCandidate({ env, platform, fileExists, stat }) {
  const overrides = [env.AE_MCP_EXE, env.AE_EXE].map(value => value?.trim()).filter(Boolean);
  const candidates = [...overrides, ...(DEFAULT_AE_PATHS[platform] || [])];
  return candidates.find(candidate => usableAePath(candidate, platform, fileExists, stat)) || null;
}

export function diagnose({
  root = dirname(fileURLToPath(import.meta.url)),
  nodeVersion = process.versions.node,
  platform = process.platform,
  env = process.env,
  fileExists = existsSync,
  stat = statSync,
  run = (name) => spawnSync(name, ['-version'], { encoding: 'utf8', timeout: 5_000 }),
} = {}) {
  const checks = [];
  const major = Number(nodeVersion.split('.')[0]);
  checks.push(check('Node.js 24+', Number.isFinite(major) && major >= 24, nodeVersion, {
    hint: 'Install Node.js 24 or newer, then run this check again. Restart the agent host if it keeps using an older Node executable.',
  }));
  checks.push(check('Supported operating system', ['darwin', 'win32'].includes(platform), platform, {
    hint: 'Use the currently supported macOS or Windows environment. Other platforms have not been verified.',
  }));

  const runtimePath = join(root, '..', 'runtime', 'dist', 'index.js');
  const libraryPath = join(root, '..', 'library', 'manifest.json');
  checks.push(check('Bundled runtime', fileExists(runtimePath), runtimePath, {
    hint: 'Restore plugin/runtime/dist/index.js from the complete After Effects Studio package, then reinstall the plugin.',
  }));
  checks.push(check('Motion library manifest', fileExists(libraryPath), libraryPath, {
    hint: 'Restore plugin/library/manifest.json and the packaged library folder, then reinstall the plugin.',
  }));

  const ae = resolveAeCandidate({ env, platform, fileExists, stat });
  const configuredPath = [env.AE_MCP_EXE, env.AE_EXE].map(value => value?.trim()).find(Boolean);
  checks.push(check('After Effects path', ae !== null, ae || configuredPath || 'No supported default installation found', {
    hint: configuredPath
      ? `The configured path was not found or is not a usable After Effects app: ${configuredPath}. Correct AE_MCP_EXE (or legacy AE_EXE) to the .app bundle on macOS or AfterFX.exe on Windows, then restart the agent host.`
      : platform === 'darwin'
        ? 'Install After Effects 2024, 2025, or 2026 in /Applications, or set AE_MCP_EXE to its .app bundle. Restart the agent host after changing it.'
        : 'Install After Effects 2024, 2025, or 2026 in the default Adobe folder, or set AE_MCP_EXE to the full AfterFX.exe path. Restart the agent host after changing it.',
  }));

  for (const executable of ['ffmpeg', 'ffprobe']) {
    let result;
    try { result = run(executable); } catch (error) { result = { status: null, error }; }
    const found = result.status === 0;
    checks.push(check(executable, found, found ? 'available on PATH' : result.error?.code || 'not available on PATH', {
      optional: true,
      hint: `Install ${executable} and make it available on PATH only if you plan to use the export verifier; it is not required to start the plugin or control After Effects.`,
    }));
  }

  const requiredFailures = checks.filter(c => !c.ok && !c.optional);
  const optionalFailures = checks.filter(c => !c.ok && c.optional);
  return {
    ok: requiredFailures.length === 0,
    summary: requiredFailures.length
      ? `${requiredFailures.length} required check(s) need attention.`
      : optionalFailures.length
        ? 'Ready for After Effects control. Optional export tools are unavailable.'
        : 'Prerequisites found. Live connection and permissions have not been checked.',
    checks,
    notes: [
      'This check does not launch After Effects, inspect an open project, or change project contents.',
      'A live connection is required to verify macOS Automation permission and After Effects scripting file access.',
      'ffmpeg and ffprobe are only required by the optional movie export verifier.',
    ],
  };
}
