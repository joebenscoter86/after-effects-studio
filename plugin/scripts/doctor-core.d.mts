export interface DoctorCheck {
  name: string;
  ok: boolean;
  optional?: boolean;
  detail?: string;
  hint?: string;
}

export interface DoctorReport {
  ok: boolean;
  summary: string;
  checks: DoctorCheck[];
  notes: string[];
}

export interface DoctorOptions {
  root?: string;
  nodeVersion?: string;
  platform?: NodeJS.Platform;
  env?: NodeJS.ProcessEnv;
  fileExists?: (path: string) => boolean;
  stat?: (path: string) => { isDirectory(): boolean };
  run?: (name: string) => { status: number | null; error?: { code?: string } };
}

export function diagnose(options?: DoctorOptions): DoctorReport;
