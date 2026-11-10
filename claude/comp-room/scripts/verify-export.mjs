import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
const file=process.argv[2];
if(!file){console.error('Usage: node scripts/verify-export.mjs <video>');process.exit(2);}
const probe=spawnSync('ffprobe',['-v','error','-show_format','-show_streams','-of','json',resolve(file)],{encoding:'utf8',maxBuffer:8*1024*1024});
if(probe.error||probe.status!==0){console.error(probe.error?.message||probe.stderr);process.exit(1);}
const decode=spawnSync('ffmpeg',['-nostdin','-v','error','-xerror','-i',resolve(file),'-f','null','-'],{encoding:'utf8',maxBuffer:8*1024*1024});
const ok=!decode.error&&decode.status===0;
console.log(JSON.stringify({file:resolve(file),metadata:JSON.parse(probe.stdout),fullDecodePassed:ok,decodeError:decode.error?.message||decode.stderr||null,visualPlaybackReviewed:false},null,2));
if(!ok)process.exitCode=1;
