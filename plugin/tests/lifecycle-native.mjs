// Opt-in AFT-33 native lifecycle client. Run one stage at a time against an
// installed plugin cache and an owned AE project. Uses only Node built-ins.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function value(flag) { const i = process.argv.indexOf(flag); return i < 0 ? null : process.argv[i + 1]; }
const pluginRoot = value('--plugin-root');
const mode = value('--mode');
const projectPath = value('--project');
const output = value('--output');
assert(pluginRoot && ['create', 'revise', 'adjust', 'reopen'].includes(mode) && projectPath && output,
  'usage: node lifecycle-native.mjs --plugin-root DIR --mode create|revise|adjust|reopen --project AEP --output DIR');
mkdirSync(output, { recursive: true });
const config = JSON.parse(readFileSync(resolve(pluginRoot, '.mcp.json'), 'utf8')).mcpServers['after-effects-studio'];
assert(config && config.cwd === '.');
const child = spawn(config.command, config.args, {
  cwd: pluginRoot, env: { ...process.env, ...config.env, AE_MCP_READONLY: '0' }, stdio: ['pipe', 'pipe', 'pipe'],
});
let next = 1, buffer = '', stderr = '';
const pending = new Map();
child.stderr.on('data', (d) => { stderr += d; });
child.stdout.on('data', (d) => {
  buffer += d;
  let i;
  while ((i = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, i); buffer = buffer.slice(i + 1);
    if (!line.trim()) continue;
    let response;
    try { response = JSON.parse(line); } catch (error) { for (const p of pending.values()) p.reject(error); continue; }
    const p = pending.get(response.id);
    if (p) { clearTimeout(p.timer); pending.delete(response.id); response.error ? p.reject(new Error(JSON.stringify(response.error))) : p.resolve(response.result); }
  }
});
child.on('exit', (code) => {
  for (const p of pending.values()) { clearTimeout(p.timer); p.reject(new Error(`server exited ${code}: ${stderr}`)); }
  pending.clear();
});
function rpc(method, params = {}) {
  const id = next++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`uncertain ${method} timeout; inspect AE before retry`)); }, 90_000);
    pending.set(id, { resolve, reject, timer });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}
function unpack(r) {
  if (r.isError) throw new Error(JSON.stringify(r));
  return r.structuredContent || JSON.parse(r.content.find((c) => c.type === 'text').text);
}
async function tool(name, args = {}) { return unpack(await rpc('tools/call', { name, arguments: args })); }
const report = { mode, pluginRoot, projectPath, checks: [], stderr: null };
try {
  const init = await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'aft33-lifecycle-native', version: '1.0' } });
  assert.equal(init.serverInfo.name, 'after-effects-studio');
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  const before = (await tool('ae_context')).result.project;
  report.before = before;
  const compName = 'AFT-33 lifecycle owned fixture';
  if (mode === 'create') {
    assert.equal(before.file, null); assert.equal(before.numItems, 0); assert.equal(before.dirty, false);
    const code = `var c=app.project.items.addComp(${JSON.stringify(compName)},640,360,1,3,24);var l=c.layers.addText('AFT-33 prior version');return {compId:c.id,layerId:l.id,name:c.name};`;
    const created = await tool('ae_do', { operation: 'eval.run', args: { code } });
    report.created = created.result;
    assert(created.ok && created.result);
    report.checks.push('created editable native comp/text from prior installed package');
  } else {
    assert.equal(before.file, null); assert.equal(before.numItems, 0); assert.equal(before.dirty, false);
    const opened = await tool('ae_do', { operation: 'project.open', args: { path: projectPath, save: false } });
    assert(opened.ok, JSON.stringify(opened));
    report.checks.push('reopened owned AEP from disk');
  }
  const context = (await tool('ae_context')).result.project;
  if (mode !== 'create') assert.equal(context.file, projectPath);
  if (mode === 'revise') {
    const code = `var c=AE.findCompByNameOrId(${JSON.stringify(compName)});if(!c)throw new Error('owned comp missing');var l=c.layers.addText('AFT-33 updated version');return {compId:c.id,layerId:l.id,name:l.name};`;
    const revised = await tool('ae_do', { operation: 'eval.run', args: { code } });
    assert(revised.ok, JSON.stringify(revised));
    report.revised = revised.result;
    report.checks.push('added one editable native text layer from updated installed package');
  }
  if (mode === 'adjust') {
    const code = `var c=AE.findCompByNameOrId(${JSON.stringify(compName)});if(!c)throw new Error('owned comp missing');var l=AE.findLayerInComp(c,'AFT-33 updated version');if(!l)l=AE.findLayerInComp(c,'AFT-33 updated');if(!l)throw new Error('owned revision missing');var p=l.property('ADBE Text Properties').property('ADBE Text Document');var d=p.value;d.text='AFT-33 updated';p.setValue(d);l.name='AFT-33 updated';l.property('ADBE Transform Group').property('ADBE Position').setValue([320,245]);return {compId:c.id,layerId:l.id,position:[320,245]};`;
    const adjusted = await tool('ae_do', { operation: 'eval.run', args: { code } });
    assert(adjusted.ok, JSON.stringify(adjusted));
    report.adjusted = adjusted.result;
    report.checks.push('moved the overlapping updated layer to a readable position');
  }
  const comp = await tool('ae_do', { operation: 'comp.info', args: { comp: compName } });
  assert(comp.ok && comp.result?.found, JSON.stringify(comp));
  report.comp = { id: comp.result.id, name: comp.result.name, layers: comp.result.layers?.map((l) => ({ id: l.id, name: l.name })) };
  assert.equal(report.comp.layers.length, mode === 'create' ? 1 : 2);
  if (mode !== 'reopen') {
    const saved = await tool('ae_save_project', { path: projectPath });
    assert(saved.ok && saved.result?.saved, JSON.stringify(saved));
    const rendered = await tool('ae_render_frame', { compNameOrId: comp.result.id, times: [1], outPath: resolve(output, `${mode}.png`), analyze: true, colorManaged: 'off' });
    assert(rendered.ok && rendered.result?.frames?.[0]?.writtenTo, JSON.stringify(rendered));
    report.render = rendered.result.frames[0].writtenTo;
    report.checks.push('saved owned AEP and exported native PNG');
  }
  report.after = (await tool('ae_context')).result.project;
  assert.equal(report.after.file, projectPath);
  report.ok = true;
} catch (error) {
  report.ok = false; report.error = String(error); process.exitCode = 1;
} finally {
  report.stderr = stderr;
  writeFileSync(resolve(output, `${mode}-report.json`), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ ok: report.ok, mode, checks: report.checks, error: report.error }, null, 2));
  child.stdin.end(); child.kill('SIGTERM');
}
