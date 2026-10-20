#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const skill=path.join(root,'.claude/skills/motion-workshop'),assets=path.join(skill,'assets');
const read=p=>fs.readFile(p,'utf8'), parse=async p=>JSON.parse(await read(p));
const context=vm.createContext({window:{}});
for(const file of ['effects.js','effects-extra.js','engine.js']){
  const code=await read(path.join(assets,'runtime',file));
  assert.equal(code,await read(path.join(root,'web',file)),file+' runtime mismatch');
  vm.runInContext(code,context,{filename:file});
}
const E=context.window.MotionEffects,P=context.window.MotionProject,catalog=await parse(path.join(assets,'catalog.json'));
const ids=catalog.effects.map(e=>e.id);assert.equal(ids.length,28);assert.equal(new Set(ids).size,28);
assert.deepEqual([...E.definitions.map(e=>e.id)],ids);
const schema=await parse(path.join(assets,'project.schema.json'));
assert.deepEqual(schema.properties.clips.items.properties.effect.enum,ids);
for(const e of catalog.effects){
  assert.equal(e.example.effect,e.id);
  const normalized=P.validate({version:2,fps:30,clips:[e.example]});
  assert.equal(normalized.clips[0].effect,e.id);
  assert.ok(e.parameters.length>0);
}
for(const file of await fs.readdir(path.join(assets,'previews'))){
  const data=await fs.readFile(path.join(assets,'previews',file));
  assert.equal(data.subarray(1,4).toString(),'PNG');
  assert.equal(data.readUInt32BE(16),640);assert.equal(data.readUInt32BE(20),360);
}
for(const e of [...catalog.effects,...catalog.transitions])await fs.access(path.join(assets,e.preview));
for(const fps of [30,60])for(const type of P.transitionTypes){
  const project=P.validate({version:2,fps,clips:[{effect:'mask-reveal',duration:3,transition:{type,duration:.6}},{effect:'chart-build',duration:3}]});
  const rows=P.timeline(project),overlap=type==='cut'?0:Math.round(.6*fps);
  assert.equal(rows[1].startFrame,3*fps-overlap);
  assert.equal(Math.round(P.duration(project)*fps),6*fps-overlap);
  if(overlap){
    const midpoint=rows[1].start+.3,state=P.locate(project,midpoint);
    assert.ok(Math.abs(state.previous.progress-.5)<1e-9);
    assert.equal(state.previous.type,type);
  }
  assert.equal(P.locate(project,0).index,0);assert.equal(P.locate(project,6).index,1);
}
const short=P.validate({version:2,clips:[{effect:'bounce',duration:1,transition:{type:'zoom',duration:1.5}},{effect:'type',duration:2}]});
assert.equal(P.timeline(short)[0].overlapFrames,Math.round(.45*30));
assert.equal(P.timeline(short)[1].overlapFrames,0);
assert.throws(()=>P.validate({version:2,clips:[{effect:'unknown'}]}));
assert.throws(()=>P.validate({version:2,clips:[]}));
const clamped=P.validate({version:1,fps:5,clips:[{effect:'bounce',duration:100,speed:99,color:'bad'}]});
assert.equal(clamped.version,2);assert.equal(clamped.fps,30);assert.equal(clamped.clips[0].duration,20);assert.equal(clamped.clips[0].speed,2.5);assert.equal(clamped.clips[0].color,'#d8f36a');
const example=await parse(path.join(assets,'examples/三幕轉場.motion.json'));
assert.equal(Math.round(P.duration(P.validate(example))*30),234);
const skillText=await read(path.join(skill,'SKILL.md'));
assert.match(skillText,/^---\nname: motion-workshop\ndescription: .+\nlicense: MIT\n---/);
async function walk(dir){const out=[];for(const entry of await fs.readdir(dir,{withFileTypes:true})){if(['.git','build','dist','downloads','node_modules'].includes(entry.name))continue;const p=path.join(dir,entry.name);assert.ok(!entry.isSymbolicLink(),'No symlinks in portable package');out.push(...(entry.isDirectory()?await walk(p):[p]));}return out;}
const files=await walk(root);
for(const file of files){
  if(!/\.(?:md|json|js|mjs|html|css|swift|sh|plist)$/.test(file))continue;
  const text=await read(file);
  // Reject machine-specific absolute home paths and common credential forms.
  assert.ok(!new RegExp('/'+'Users/[^/\\s]+/').test(text),'Personal path: '+path.relative(root,file));
  assert.ok(!/(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----)/.test(text),'Credential-like content');
  if(file.endsWith('.md'))for(const match of text.matchAll(/\]\(([^)]+)\)/g)){
    const url=match[1];if(/^(?:https?:|#)/.test(url))continue;
    await fs.access(path.resolve(path.dirname(file),decodeURIComponent(url.split('#')[0])));
  }
}
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'motion-skill-check-'));
try{
  const install=spawnSync(process.execPath,[path.join(root,'scripts/install-skill.mjs'),'--project',temp],{encoding:'utf8'});
  assert.equal(install.status,0,install.stderr);
  const again=spawnSync(process.execPath,[path.join(root,'scripts/install-skill.mjs'),'--project',temp],{encoding:'utf8'});
  assert.notEqual(again.status,0,'Existing skill must not be overwritten');
  const portable=path.join(temp,'.claude/skills/motion-workshop/assets');
  const check=spawnSync(process.execPath,[path.join(portable,'render.mjs'),'--project',path.join(portable,'examples/三幕轉場.motion.json'),'--validate'],{encoding:'utf8'});
  assert.equal(check.status,0,check.stderr);assert.equal(JSON.parse(check.stdout).frames,234);
}finally{await fs.rm(temp,{recursive:true,force:true});}
console.log(JSON.stringify({ok:true,effects:ids.length,transitions:P.transitionTypes.length,files:files.length,checks:['runtime parity','catalog/schema/previews','30/60 FPS timelines','normalization','portable skill install','overwrite refusal','standalone CLI','local links','privacy scan']},null,2));
