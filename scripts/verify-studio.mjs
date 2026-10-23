import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),ctx=vm.createContext({window:{}});
for(const name of ['effects','effects-extra','effects-pro','motion-reference','reference-templates','vector','layers','audio','engine','library'])vm.runInContext(await fs.readFile(path.join(root,'web',name+'.js'),'utf8'),ctx);
const L=ctx.window.MotionLayers,P=ctx.window.MotionProject,close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`),copy=v=>JSON.parse(JSON.stringify(v));
const project=P.blankProject(),layer=L.defaultLayer('star');layer.end=5;layer.transform.x=10;
L.setKey(layer,'x',0,10,{fps:30});L.setKey(layer,'x',2,90,{fps:30,easing:'linear'});L.setKey(layer,'opacity',1,0,{fps:30});L.setKey(layer,'opacity',3,1,{fps:30,easing:'linear'});
close(L.sample(layer,1).x,50);close(L.sample(layer,1).opacity,0);close(L.sample(layer,2).opacity,.5);assert.equal(L.sample(layer,.5).width,45);
L.setKey(layer,'fill',0,'#000000',{fps:30});L.setKey(layer,'fill',2,'#ffffff',{fps:30,easing:'linear'});assert.equal(L.sample(layer,1).fill,'#808080');
const rawKeys=JSON.stringify(layer.tracks);L.addMotion(layer,'float',{start:0,duration:4,sceneDuration:5,repeat:2});L.addMotion(layer,'pop',{start:0,duration:.6,sceneDuration:5});assert.equal(JSON.stringify(layer.tracks),rawKeys);assert.ok(L.sample(layer,.1).scale<1);
for(const [id,definition] of Object.entries(L.motionPresets))for(const fps of [30,60]){
  let l={...L.defaultLayer('rect'),end:5};L.setKey(l,'x',0,15,{fps});L.setKey(l,'x',5,75,{fps,easing:'cubic',curve:[.2,-.2,.8,1.2]});L.addMotion(l,id,{start:definition.phase==='out'?4:0,duration:definition.phase==='loop'?4:1,sceneDuration:5,fps,strength:1.2,repeat:2});l=L.normalizeLayers([l],5,fps)[0];
  const poses=Array.from({length:5*fps+1},(_,i)=>L.sample(l,i/fps));for(const pose of poses)for(const p of L.properties)assert.ok(Number.isFinite(pose[p]),id+' '+p);const again=JSON.stringify(L.sample(l,1.5));L.sample(l,0);assert.equal(JSON.stringify(L.sample(l,1.5)),again);
  const baked=copy(l);assert.equal(L.bake(baked,5,fps),true);for(let i=0;i<poses.length;i++)for(const p of L.properties)close(L.sample(baked,i/fps)[p],poses[i][p]);
}
const shift={...L.defaultLayer('rect'),start:1,end:4};L.setKey(shift,'x',1,10);L.setKey(shift,'x',2,50);L.setKey(shift,'x',3,90);L.addMotion(shift,'fade',{start:1,duration:.5,sceneDuration:6});
assert.equal(L.shiftKeys(shift,'x',[1],1,6,30),false);assert.equal(shift.tracks.x[0].time,1);assert.equal(L.shiftKeys(shift,'x',[1,2],.5,6,30),true);assert.equal(shift.tracks.x[0].time,1.5);assert.equal(L.shiftLayer(shift,1,6,30),1);assert.equal(shift.start,2);assert.equal(shift.motions[0].start,2);assert.equal(shift.tracks.x[0].time,2.5);
for(const type of Object.keys(L.types)){const p=P.validate({version:2,clips:[{...P.defaultClip(),duration:5,layers:[{...L.defaultLayer(type),tracks:layer.tracks,motions:layer.motions}]}]});assert.equal(p.clips[0].layers[0].type,type);assert.ok(p.clips[0].layers[0].tracks.x.length);}
const thirtyTwo=P.validate({version:2,clips:[{...P.defaultClip(),layers:Array.from({length:32},()=>L.defaultLayer())}]});assert.equal(thirtyTwo.clips[0].layers.length,32);
const schema=JSON.parse(await fs.readFile(path.join(root,'.claude/skills/motion-workshop/assets/project.schema.json'),'utf8'));assert.equal(schema.properties.clips.items.properties.layers.maxItems,L.maxLayers);assert.equal(schema.properties.clips.items.properties.layers.properties,undefined);
console.log(JSON.stringify({ok:true,motionPresets:16,bakeConfigurations:32,independentTracks:true,keyCollisionProtection:true,layerTiming:true,backwardsSeeking:true,shapeTypes:Object.keys(L.types).length}));
