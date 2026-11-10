#!/usr/bin/env node
import { diagnose } from './doctor-core.mjs';

const report = diagnose();
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
