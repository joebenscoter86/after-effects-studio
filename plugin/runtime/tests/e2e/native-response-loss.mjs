// Opt-in native AFT-9 probe. Run only with a clean, saved, owned AE fixture.
// The transport is production code; only its response-read method is replaced
// on one test instance. A real dispatcher still consumes and executes the write.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { FileIpcTransport } from '../../dist/transport/FileIpcTransport.js';
import { RUNTIME_DIR, RESPONSE_PREFIX } from '../../dist/config.js';

const expectedPath = process.argv[2];
const compName = process.argv[3];
assert(expectedPath && compName, 'usage: node native-response-loss.mjs <owned-aep-path> <comp-name>');
const tag = randomUUID().slice(0, 8);
const controlName = `AFT9_CONTROL_${tag}`;
const faultName = `AFT9_FAULT_${tag}`;
const quote = JSON.stringify;
const inspectCode = `var p=app.project;var c=AE.findCompByNameOrId(${quote(compName)});if(!c)throw new Error('owned comp missing');var names=[];for(var i=1;i<=c.numLayers;i++)names.push(c.layer(i).name);return {file:p.file?p.file.fsName:null,dirty:p.dirty,numItems:p.numItems,compId:c.id,layers:names};`;
const createCode = (name) => `var c=AE.findCompByNameOrId(${quote(compName)});if(!c)throw new Error('owned comp missing');var l=c.layers.addNull();l.name=${quote(name)};return {compId:c.id,layerId:l.id,name:l.name};`;
const transport = new FileIpcTransport();
const execute = (code, label, timeoutMs = 10_000) => transport.execute({ code, label, timeoutMs });
const before = await execute(inspectCode, `aft9_before_${tag}`);
assert(before.ok, `baseline read failed: ${before.error}`);
assert.equal(before.result.file, expectedPath, 'different AE project is open');
assert.equal(before.result.dirty, false, 'owned fixture must be saved and clean');
assert(!before.result.layers.some((name) => name.startsWith('AFT9_')), 'fixture contains an earlier AFT9 probe');
console.log(JSON.stringify({ phase: 'baseline', result: before.result }));

const control = await execute(createCode(controlName), `aft9_control_${tag}`);
assert(control.ok, `control write failed: ${control.error}`);
assert.equal(control.result.name, controlName);
const afterControl = await execute(inspectCode, `aft9_control_read_${tag}`);
assert(afterControl.ok, `control read failed: ${afterControl.error}`);
assert.equal(afterControl.result.layers.filter((name) => name === controlName).length, 1);
console.log(JSON.stringify({ phase: 'control', result: control.result, state: afterControl.result }));

const responseFilesBefore = new Set((await fs.readdir(RUNTIME_DIR)).filter((name) => name.startsWith(RESPONSE_PREFIX)));
const fault = new FileIpcTransport();
const originalRead = fault.tryReadResponse.bind(fault);
fault.tryReadResponse = async () => null;
const faultResult = await fault.execute({ code: createCode(faultName), label: `aft9_fault_${tag}`, timeoutMs: 4_000 });
fault.tryReadResponse = originalRead;
assert.equal(faultResult.ok, false);
assert.equal(faultResult.errorCode, 'TIMEOUT');
assert.match(faultResult.error, /WAS picked up|operation may still be running/);
const responseFilesAfter = (await fs.readdir(RUNTIME_DIR)).filter((name) => name.startsWith(RESPONSE_PREFIX) && !responseFilesBefore.has(name));
const lateResponses = [];
for (const name of responseFilesAfter) {
  const body = JSON.parse(await fs.readFile(`${RUNTIME_DIR}/${name}`, 'utf8'));
  if (body?.result?.name === faultName) lateResponses.push({ file: name, body });
}
assert.equal(lateResponses.length, 1, 'one real late response for the fault write');
assert.equal(lateResponses[0].body.ok, true);
console.log(JSON.stringify({ phase: 'uncertain', result: faultResult, lateResponse: lateResponses[0].body }));

// Push transport conservatively retains its busy lock after a consumed-timeout.
// Wait for the production 90s stale-lock recovery instead of removing it here.
await new Promise((resolve) => setTimeout(resolve, 95_000));
const recovered = new FileIpcTransport();
const final = await recovered.execute({ code: inspectCode, label: `aft9_recovery_read_${tag}`, timeoutMs: 12_000 });
assert(final.ok, `recovery read failed: ${final.error}`);
assert.equal(final.result.file, expectedPath);
assert.equal(final.result.compId, before.result.compId);
// addNull can add or reuse AE source items, so compare owned layer IDs/names
// rather than expecting a fixed project-item delta.
assert(final.result.numItems >= afterControl.result.numItems);
assert.equal(final.result.layers.filter((name) => name === controlName).length, 1);
assert.equal(final.result.layers.filter((name) => name === faultName).length, 1);
assert.equal(final.result.layers.length, before.result.layers.length + 2);
console.log(JSON.stringify({ phase: 'recovered', result: final.result, controlName, faultName }));
