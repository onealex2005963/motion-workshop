#!/usr/bin/env node
// Build the offline reference from the pinned, vendored MIT sources. No network.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const vendor=path.join(root,'web/motion-reference');
const catalog=JSON.parse(await fs.readFile(path.join(vendor,'catalog.json'),'utf8'));
const locale=JSON.parse(await fs.readFile(path.join(vendor,'zh-Hant.json'),'utf8'));
const origin=JSON.parse(await fs.readFile(path.join(vendor,'origin.json'),'utf8'));
const hashes={};for(const file of ['catalog.json','LICENSE.txt','THIRD-PARTY-NOTICES.md',...catalog.packs.map(p=>'packs/'+p.pack+'.js')])hashes[file]=createHash('sha256').update(await fs.readFile(path.join(vendor,file))).digest('hex');
await fs.writeFile(path.join(vendor,'SHA256SUMS.json'),JSON.stringify({commit:origin.commit,sha256:hashes},null,2)+'\n');
let code='/* Offline Motion Prompt reference. Upstream MIT notices are retained below. */\n(() => {\n\'use strict\';\nconst packs={},factories={};\nconst MotionPrompt={pack(id,setup){factories[id]=setup;}};\n';
for(const pack of catalog.packs)code+=await fs.readFile(path.join(vendor,'packs',pack.pack+'.js'),'utf8')+'\n';
code+='const catalog='+JSON.stringify(catalog)+';\nconst locale='+JSON.stringify(locale)+';\nconst origin='+JSON.stringify(origin)+';\n';
code+=await fs.readFile(path.join(root,'scripts/reference-api.js'),'utf8');
code+='\n})();\n';
await fs.writeFile(path.join(root,'web/motion-reference.js'),code);
const assets=path.join(root,'.claude/skills/motion-workshop/assets');
await fs.cp(vendor,path.join(assets,'motion-reference'),{recursive:true});
await fs.writeFile(path.join(assets,'runtime/motion-reference.js'),code);
await fs.copyFile(path.join(root,'web/reference-recipes.js'),path.join(assets,'runtime/reference-recipes.js'));
await fs.copyFile(path.join(root,'web/reference-templates.js'),path.join(assets,'runtime/reference-templates.js'));
console.log(JSON.stringify({count:catalog.count,packs:catalog.packs.length,commit:origin.commit,bytes:Buffer.byteLength(code)}));
