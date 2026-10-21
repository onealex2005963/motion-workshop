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
for(const file of ["effects.js","effects-extra.js","effects-pro.js","motion-reference.js","reference-templates.js","layers.js","audio.js","engine.js","library.js"]){
  const code=await read(path.join(assets,'runtime',file));
  assert.equal(code,await read(path.join(root,'web',file)),file+' runtime mismatch');
  vm.runInContext(code,context,{filename:file});
}
const E=context.window.MotionEffects,P=context.window.MotionProject,catalog=await parse(path.join(assets,'catalog.json'));
const ids=catalog.effects.map(e=>e.id);assert.equal(ids.length,184);assert.equal(new Set(ids).size,184);
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
const L=context.window.MotionLayers,A=context.window.MotionAudio;
const custom=P.validate({version:2,fps:30,clips:[{effect:'bounce',duration:2,base:{visible:false,x:80},layers:[{type:'rect',transform:{x:20},keyframes:[{time:1,x:80,easing:'linear'},{time:0,x:20,easing:'linear'},{time:1,x:90,easing:'linear'}]}],audio:[{sound:'click',time:.5,volume:1,rate:1,fadeIn:0,fadeOut:0}]}]});
assert.equal(custom.clips[0].base.visible,false);assert.equal(custom.clips[0].base.x,80);
const animated=custom.clips[0].layers[0];assert.equal(animated.keyframes.length,2);assert.equal(L.sample(animated,.5).x,55);assert.equal(L.sample(animated,-1).x,20);assert.equal(L.sample(animated,5).x,90);
for(const easing of Object.keys(L.easingNames)){assert.ok(Math.abs(L.ease(easing,0))<1e-12);assert.ok(Math.abs(L.ease(easing,1)-1)<1e-12);assert.ok(Number.isFinite(L.ease(easing,.5)));}
assert.equal(L.hitTest(animated,1,90,50,16/9),true);assert.equal(L.hitTest(animated,1,5,5,16/9),false);
const stripped=P.validate({version:2,clips:[{effect:'bounce',layers:[{type:'image',image:'https://example.com/a.png',transform:{scale:100,opacity:-1}}],audio:[{sound:'unknown'},{sound:'click',rate:99}]}]});
assert.equal(stripped.clips[0].layers[0].image,'');assert.equal(stripped.clips[0].layers[0].transform.scale,5);assert.equal(stripped.clips[0].layers[0].transform.opacity,0);assert.equal(stripped.clips[0].audio.length,1);assert.equal(stripped.clips[0].audio[0].rate,2);
const sources=new Map([['click',new Float32Array([.2,.4,.6,.8])]]),pcm=A.mix(custom,sources),start=Math.round(.5*A.sampleRate);
assert.equal(pcm.length,44100);assert.equal(pcm[start-1],0);assert.ok(Math.abs(pcm[start+1]-.32)<1e-6);assert.equal(pcm[start+4],0);
const bytes=Buffer.from(A.wav(pcm));assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.readUInt32LE(24),22050);assert.equal(bytes.length,44+pcm.length*2);
const muted=P.validate({...custom,audio:{enabled:false,volume:1}});assert.equal(A.events(muted).length,0);assert.ok(A.mix(muted,new Map()).every(v=>v===0));
const soundCatalog=await parse(path.join(assets,'runtime/sounds/catalog.json'));assert.equal(soundCatalog.sounds.length,16);
for(const sound of soundCatalog.sounds){const data=await fs.readFile(path.join(assets,'runtime/sounds',sound.file));assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.readUInt32LE(24),22050);assert.equal(data.readUInt16LE(22),1);}
const advancedExample=P.validate(await parse(path.join(assets,'examples/自由圖層與音效.motion.json')));assert.equal(P.duration(advancedExample),10);assert.equal(A.events(advancedExample).length,5);
const withOverlap=P.validate({version:2,clips:[{effect:'bounce',duration:3,transition:{type:'push',duration:1}},{effect:'type',duration:3,audio:[{sound:'click',time:.5}]}]});assert.equal(A.events(withOverlap)[0].start,2.5);
const example=await parse(path.join(assets,'examples/三幕轉場.motion.json'));
assert.equal(Math.round(P.duration(P.validate(example))*30),234);
const Library=context.window.MotionLibrary;
assert.equal(Library.stories.length,8);assert.equal(catalog.transitions.length,10);
for(const story of Library.stories){
  await fs.access(path.join(assets,'examples/stories/'+story.id+'.motion.json'));
  for(const duration of [12,15,20,30])for(const fps of [30,60])for(const ratio of ['16:9','9:16','1:1']){
    const project=Library.createStory(story.id,{duration,fps,ratio,brand:'Example Studio',headline:'Keep this exact message',items:['One','Two','Three']});
    assert.equal(project.clips.length,4);assert.equal(project.ratio,ratio);assert.equal(project.fps,fps);
    assert.equal(Math.round(P.duration(project)*fps),duration*fps);
    assert.ok(project.clips.some(c=>c.text==='Keep this exact message'));
    for(const mode of ['video','website','software']){
      const prompt=Library.createPrompt(project,{mode,brief:'Build this example'});
      assert.ok(prompt.includes('Build this example'));assert.ok(prompt.includes('Keep this exact message'));
      assert.ok(prompt.includes('assets/runtime/'));assert.ok(prompt.includes('SKILL.md'));
    }
  }
}
assert.throws(()=>Library.createStory('missing'));
assert.throws(()=>Library.createStory('product-launch',{duration:0}));
assert.throws(()=>Library.createStory('product-launch',{duration:NaN}));
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
  const storyFile=path.join(temp,'generated.motion.json');
  const generate=spawnSync(process.execPath,[path.join(portable,'create-project.mjs'),'--story','developer-release','--brand','Example Studio','--duration','20','--fps','60','--output',storyFile],{encoding:'utf8'});
  assert.equal(generate.status,0,generate.stderr);assert.equal(JSON.parse(generate.stdout).frames,1200);
  const wavOutput=path.join(temp,'sound.wav');
  const wavRender=spawnSync(process.execPath,[path.join(portable,'render-audio.mjs'),'--project',path.join(portable,'examples/自由圖層與音效.motion.json'),'--output',wavOutput],{encoding:'utf8'});assert.equal(wavRender.status,0,wavRender.stderr);assert.equal(JSON.parse(wavRender.stdout).samples,220500);assert.equal((await fs.stat(wavOutput)).size,441044);
  const wavAgain=spawnSync(process.execPath,[path.join(portable,'render-audio.mjs'),'--project',path.join(portable,'examples/自由圖層與音效.motion.json'),'--output',wavOutput],{encoding:'utf8'});assert.notEqual(wavAgain.status,0,'WAV export must not overwrite');
  const duplicate=spawnSync(process.execPath,[path.join(portable,'create-project.mjs'),'--story','product-launch','--output',storyFile],{encoding:'utf8'});
  assert.notEqual(duplicate.status,0,'Generated project must not overwrite an existing file');
}finally{await fs.rm(temp,{recursive:true,force:true});}
console.log(JSON.stringify({ok:true,effects:ids.length,transitions:P.transitionTypes.length,stories:Library.stories.length,storyConfigurations:192,files:files.length,checks:['layers/keyframes/easing/hit testing','PCM WAV mixing and sound assets','overlap audio timing','runtime parity','catalog/schema/previews','30/60 FPS timelines','exact story duration at all ratios','prompt composition','normalization','portable skill install','overwrite refusal','standalone CLI generation','local links','privacy scan']},null,2));
