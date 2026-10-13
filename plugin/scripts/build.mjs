import { build } from '../runtime/node_modules/esbuild/lib/main.js';
import { fileURLToPath } from 'node:url';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import path from 'node:path';
await import('./manifest.mjs');
const runtime=fileURLToPath(new URL('../runtime/',import.meta.url));
const built=await build({absWorkingDir:runtime,entryPoints:['src/index.ts'],outfile:'dist/index.js',bundle:true,metafile:true,platform:'node',format:'esm',target:'node24',legalComments:'eof',banner:{js:"import { createRequire as __aesRequire } from 'node:module'; var require = __aesRequire(import.meta.url);"}});
const packages=new Set();
for(const input of Object.keys(built.metafile.inputs)){
  if(!input.includes('node_modules/'))continue;
  let dir=path.dirname(path.resolve(runtime,input));
  while(dir!==path.dirname(dir)){
    if(existsSync(path.join(dir,'package.json'))){
      const pkg=JSON.parse(readFileSync(path.join(dir,'package.json'),'utf8'));
      if(pkg.name){packages.add(dir);break;}
    }
    dir=path.dirname(dir);
  }
}
const notices=['Native AE runtime\n'+readFileSync(path.join(runtime,'LICENSE'),'utf8')];
for(const dir of [...packages].sort()){
 const pkg=JSON.parse(readFileSync(path.join(dir,'package.json'),'utf8'));
 const license=['LICENSE','LICENSE.md','LICENSE.txt','LICENSE-MIT','license','license.md'].find(n=>existsSync(path.join(dir,n)));
 if(!license)throw new Error(`Missing license notice for bundled dependency ${pkg.name}`);
 notices.push(`${pkg.name}@${pkg.version}\n${readFileSync(path.join(dir,license),'utf8')}`);
}
writeFileSync(new URL('../THIRD-PARTY-NOTICES.txt',import.meta.url),notices.join('\n\n========================================\n\n'));
console.log('Built self-contained MCP server. No npm install required by plugin users.');
