import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(s=>s.trim());
if(!scripts.length){console.error('No inline JavaScript found in index.html');process.exit(1)}
const file=join(tmpdir(),'mosaic-inline-'+randomUUID()+'.js');
writeFileSync(file,scripts.join('\n'));
const result=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});
try{unlinkSync(file)}catch{}
if(result.status!==0)process.exit(result.status||1);
console.log('Checked',scripts.length,'inline script block(s).');
