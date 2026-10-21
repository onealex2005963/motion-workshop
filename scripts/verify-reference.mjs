#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),assets=path.join(root,'.claude/skills/motion-workshop/assets'),ctx=vm.createContext({window:{}});
for(const name of ['effects','effects-extra','effects-pro','motion-reference','reference-templates','layers','audio','engine','library','reference-recipes']){
  const code=await fs.readFile(path.join(root,'web',name+'.js'),'utf8');assert.equal(code,await fs.readFile(path.join(assets,'runtime',name+'.js'),'utf8'));vm.runInContext(code,ctx);
}
const {MotionReference:R,MotionProject:P,MotionLayers:L,MotionLibrary:Library}=ctx.window;
assert.equal(R.catalog.count,144);assert.equal(R.catalog.elements.length,144);assert.equal(R.catalog.packs.length,6);assert.equal(R.recipeIds.length,20);
assert.equal(R.locale.names.length,144);assert.equal(R.search('錯開')[0].id,'002');assert.equal(R.search('#130')[0].id,'130');assert.equal(R.search('波浪')[0].id,'130');assert.equal(R.search('ポップイン')[0].id,'001');
for(const e of R.catalog.elements){assert.ok(R.label(e.id));assert.ok(R.meaning(e.id));assert.match(R.elementCode(e.id),new RegExp('Motion Prompt #'+e.id));assert.ok(R.get(e.id).includes(e.spec.en[0]));new vm.Script(R.kit(e.pack)+'\n'+R.elementCode(e.id));}
assert.throws(()=>R.entry('145'));assert.throws(()=>R.createClip('097'));
let templateCases=0;
for(const e of R.catalog.elements)for(const ratio of ['16:9','9:16','1:1']){
  const clip=R.createTemplate(e.id,{ratio,text:'保留繁體中文標題',duration:7,sound:true});
  clip.referenceTemplate={fit:'cover',labels:false,loop:false};
  const project=P.validate({version:2,ratio,fps:60,clips:[clip]}),saved=project.clips[0];
  assert.equal(saved.effect,'mp-'+e.id);assert.equal(saved.text,'保留繁體中文標題');assert.equal(saved.duration,7);
  assert.equal(saved.reference.id,e.id);assert.equal(saved.reference.kind,'original-template');assert.equal(saved.reference.sourceCommit,R.origin.commit);
  assert.equal(JSON.stringify(saved.referenceTemplate),JSON.stringify(clip.referenceTemplate));
  assert.equal(saved.audio.length,1);assert.ok(Library.createPrompt(project).includes('Motion Prompt #'+e.id));templateCases++;
}
const html=await fs.readFile(path.join(root,'web/index.html'),'utf8');assert.match(html,/<option id="reference-adapted-option" value="adapted">/);
let cases=0;
for(const id of R.recipeIds)for(const ratio of ['16:9','9:16','1:1'])for(const fps of [30,60])for(const duration of [1,5,20])for(const strength of [.2,2]){
  const clip=R.createClip(id,{ratio,fps,duration,strength,stagger:.5,text:'完整保留這段測試文字',items:['一','二','三','四','五','六'],sound:true}),project=P.validate({version:2,ratio,fps,clips:[clip]});
  assert.equal(clip.text,'完整保留這段測試文字');assert.equal(P.duration(project),duration);assert.equal(clip.reference.id,id);assert.equal(clip.reference.sourceCommit,R.origin.commit);assert.ok(clip.layers.length>0&&clip.layers.length<=12);assert.equal(clip.audio.length,1);
  for(const layer of clip.layers){assert.ok(layer.keyframes.length<=60);for(let i=0;i<layer.keyframes.length;i++){const k=layer.keyframes[i];assert.ok(k.time>=0&&k.time<=duration);if(i)assert.ok(k.time>layer.keyframes[i-1].time);for(const p of L.properties)assert.ok(Number.isFinite(k[p]));}const before=JSON.stringify(L.sample(layer,duration*.55));L.sample(layer,0);assert.equal(JSON.stringify(L.sample(layer,duration*.55)),before);}
  assert.ok(Library.createPrompt(project).includes('Motion Prompt #'+id));cases++;
}
const long='繁體中文字完整保留'.repeat(5).slice(0,60);for(const id of ['130','131']){const clip=R.createClip(id,{text:long});assert.equal(clip.layers.filter(l=>l.name.startsWith('文字段')).map(l=>l.text).join(''),long);}
const prompt=R.handoff([{id:'001',note:'片頭'},{id:'130',note:'第二幕'},{id:'001',note:'Logo'}],{brief:'製作品牌影片'});assert.equal((prompt.match(/## #001/g)||[]).length,1);assert.ok(prompt.includes('Logo'));assert.ok(prompt.includes('第二幕'));assert.ok(prompt.includes(R.entry('130').spec.en[0]));assert.throws(()=>R.handoff([]));
const hashes=JSON.parse(await fs.readFile(path.join(assets,'motion-reference/SHA256SUMS.json'),'utf8'));for(const [file,hash] of Object.entries(hashes.sha256))assert.equal(createHash('sha256').update(await fs.readFile(path.join(assets,'motion-reference',file))).digest('hex'),hash);
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'motion-reference-'));try{
  const cli=path.join(assets,'motion-reference.mjs'),out=path.join(temp,'clip.motion.json');
  for(const args of [['info'],['search','錯開'],['get','005'],['kit','motion']]){const result=spawnSync(process.execPath,[cli,...args],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.ok(result.stdout.length>10);}
  const args=[cli,'create','002','--text','保持文字','--duration','5','--ratio','9:16','--sound','--output',out],result=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(await fs.readFile(out,'utf8')).clips[0].reference.id,'002');assert.notEqual(spawnSync(process.execPath,args).status,0);
  const templateOut=path.join(temp,'template.motion.json');
  const template=spawnSync(process.execPath,[cli,'template','105','--text','原版套版標題','--ratio','1:1','--output',templateOut],{encoding:'utf8'});
  assert.equal(template.status,0,template.stderr);const templateClip=JSON.parse(await fs.readFile(templateOut,'utf8')).clips[0];assert.equal(templateClip.effect,'mp-105');assert.equal(templateClip.reference.kind,'original-template');assert.equal(templateClip.text,'原版套版標題');
}finally{await fs.rm(temp,{recursive:true,force:true});}
console.log(JSON.stringify({ok:true,references:144,templateConfigurations:templateCases,recipeConfigurations:cases,offlineCLI:true,sourceHashes:true,sourceExtractionSyntax:true}));
