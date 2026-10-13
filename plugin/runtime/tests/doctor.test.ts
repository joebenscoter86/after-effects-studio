import { describe, expect, it } from 'vitest';

import type { DoctorOptions } from '../../scripts/doctor-core.mjs';
import { diagnose } from '../../scripts/doctor-core.mjs';

function makeDoctor(overrides: Partial<DoctorOptions> = {}) {
  const files = new Set([
    '/pkg/runtime/dist/index.js',
    '/pkg/library/manifest.json',
    '/Applications/Adobe After Effects 2026/Adobe After Effects 2026.app',
    'C:/Program Files/Adobe/Adobe After Effects 2026/Support Files/AfterFX.exe',
  ]);
  const options: DoctorOptions = {
    root: '/pkg/scripts',
    nodeVersion: '24.1.0',
    platform: 'darwin',
    env: {},
    fileExists: (path) => files.has(path),
    stat: (path) => ({ isDirectory: () => path.endsWith('.app') }),
    run: () => ({ status: 0 }),
    ...overrides,
  };
  return diagnose(options);
}

describe('doctor diagnostics', () => {
  it('reports a ready local setup without claiming that AE permissions were checked', () => {
    const report = makeDoctor();
    expect(report.ok).toBe(true);
    expect(report.summary).toContain('Live connection and permissions have not been checked');
    expect(report.notes.join(' ')).toContain('does not launch After Effects');
  });

  it('gives a concrete fix for an old Node runtime', () => {
    const report = makeDoctor({ nodeVersion: '20.0.0' });
    const check = report.checks.find((item) => item.name === 'Node.js 24+');
    expect(report.ok).toBe(false);
    expect(check!.hint).toContain('Install Node.js 24 or newer');
  });

  it('identifies missing package files with restore and reinstall guidance', () => {
    const report = makeDoctor({ fileExists: () => false });
    expect(report.checks.find((item) => item.name === 'Bundled runtime')!.hint).toContain('reinstall');
    expect(report.checks.find((item) => item.name === 'Motion library manifest')!.hint).toContain('reinstall');
    expect(report.checks.find((item) => item.name === 'After Effects path')!.hint).toContain('AE_MCP_EXE');
  });

  it('uses AE_MCP_EXE first and accepts the legacy AE_EXE override like the runtime', () => {
    const custom = '/Applications/Custom AE.app';
    const fileExists = (path: string) => path === custom || path === '/pkg/runtime/dist/index.js' || path === '/pkg/library/manifest.json';
    const stat = (path: string) => ({ isDirectory: () => path === custom });
    expect(makeDoctor({ env: { AE_MCP_EXE: custom }, fileExists, stat }).checks.find((x) => x.name === 'After Effects path')!.detail).toBe(custom);
    expect(makeDoctor({ env: { AE_EXE: custom }, fileExists, stat }).checks.find((x) => x.name === 'After Effects path')!.detail).toBe(custom);
  });

  it('falls back to a valid legacy AE_EXE when AE_MCP_EXE points to a missing path', () => {
    const legacy = '/Applications/Legacy AE.app';
    const fileExists = (path: string) => path === legacy || path === '/pkg/runtime/dist/index.js' || path === '/pkg/library/manifest.json';
    const stat = (path: string) => ({ isDirectory: () => path === legacy });
    const report = makeDoctor({ env: { AE_MCP_EXE: '/missing/AE.app', AE_EXE: legacy }, fileExists, stat });
    expect(report.checks.find((x) => x.name === 'After Effects path')!.detail).toBe(legacy);
  });

  it('rejects a macOS .app override that is a file', () => {
    const custom = '/Applications/Not Really.app';
    const fileExists = (path: string) => path === custom || path === '/pkg/runtime/dist/index.js' || path === '/pkg/library/manifest.json';
    const report = makeDoctor({ env: { AE_MCP_EXE: custom }, fileExists, stat: () => ({ isDirectory: () => false }) });
    expect(report.checks.find((x) => x.name === 'After Effects path')!.ok).toBe(false);
  });

  it('treats absent export tools as optional and explains when they are needed', () => {
    const report = makeDoctor({ run: () => ({ status: null, error: { code: 'ENOENT' } }) });
    expect(report.ok).toBe(true);
    expect(report.summary).toContain('Optional export tools are unavailable');
    expect(report.checks.filter((item) => item.optional).every((item) => item.hint!.includes('export verifier'))).toBe(true);
  });

  it('gives guidance for unsupported operating systems', () => {
    const report = makeDoctor({ platform: 'linux' });
    expect(report.checks.find((x) => x.name === 'Supported operating system')!.hint).toContain('not been verified');
  });
});
