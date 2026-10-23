import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),ctx=vm.createContext({window:{}});
for(const file of ['effects','effects-extra','effects-pro','motion-reference','reference-templates','vector','layers','audio','engine','library'])vm.runInContext(await fs.readFile(path.join(root,'web',file+'.js'),'utf8'),ctx);
const V=ctx.window.MotionVector,L=ctx.window.MotionLayers,P=ctx.window.MotionProject,copy=v=>JSON.parse(JSON.stringify(v)),close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
for(const curved of [false,true]){
 const a={...V.point(5,20),outX:curved?30:0,outY:curved?-10:0},b={...V.point(90,80),inX:curved?-10:0,inY:curved?30:0};
 const p={closed:false,segments:[copy(a),copy(b)]};V.split(p,0,.35);
 for(let i=0;i<=100;i++){const u=i/100,expected=V.cubic(a,b,u),actual=u<=.35?V.cubic(p.segments[0],p.segments[1],u/.35):V.cubic(p.segments[1],p.segments[2],(u-.35)/.65);close(actual.x,expected.x);close(actual.y,expected.y);}
}
// Placement must use displayed pixels: tiny, rotated or non-uniform shapes must
// locate the same point on the curve at different canvas zoom levels.
let placementCases=0;
for(const aspect of [16/9,9/16,1])for(const zoom of [.25,1,4]){
 const p={closed:false,segments:[{...V.point(0,0),outX:30,outY:-20},{...V.point(100,70),inX:-10,inY:30}]};
 const map=q=>({x:(q.x*aspect*.8-q.y*.6)*zoom,y:(q.x*.6+q.y*.8)*zoom*.3});
 const q=V.cubic(p.segments[0],p.segments[1],.37),before=JSON.stringify(p),hit=V.closest(p,q,map);
 assert.equal(hit.index,0);assert.ok(Math.abs(hit.u-.37)<1e-4);assert.ok(hit.distance<.001);assert.equal(JSON.stringify(p),before);placementCases++;
}
const manual={closed:false,segments:[V.point(0,0),V.point(100,100)]};
assert.equal(V.insert(manual,1,V.point(120,50)),true);assert.equal(manual.segments.length,3);close(manual.segments[2].x,120);
manual.closed=true;assert.equal(V.insert(manual,0,V.point(25,-15)),true);close(manual.segments[1].y,-15);
const full={closed:false,segments:Array.from({length:64},(_,i)=>V.point(i,0))},unchanged=JSON.stringify(full);
assert.equal(V.insert(full,1,V.point(2,5)),false);assert.equal(JSON.stringify(full),unchanged);
assert.equal(V.insert(manual,-1,V.point(0,0)),false);assert.equal(V.insert(manual,1,{x:NaN,y:0}),false);
for(const type of ['rect','ellipse','triangle','polygon','star','arrow','line']){
 const l=L.defaultLayer(type),m=L.sample(l,0),p=V.fromShape(l,m,16/9);assert.ok(p.segments.length>=2);assert.ok(p.segments.every(s=>Object.values(s).every(Number.isFinite)));
}
for(let i=0;i<50;i++){const l=L.defaultLayer('path');l.anchorX=i*2;l.anchorY=100-i;l.scaleX=.5+i/20;l.scaleY=2-i/40;l.transform.rotation=i*7;l.transform.scale=.3+i/30;const m=L.sample(l,0),p={x:i*3-20,y:i*2-10},world=V.toWorld(l,m,p,16/9),again=V.toLocal(l,m,world,16/9);close(again.x,p.x);close(again.y,p.y);}
const layer=L.defaultLayer('path');layer.end=5;layer.path=V.fromShape(L.defaultLayer('star'),L.sample(L.defaultLayer('star'),0),16/9);
const target=copy(layer.path);target.segments[0].x+=15;L.setKey(layer,'path',0,layer.path,{fps:30});L.setKey(layer,'path',2,target,{fps:30,easing:'linear'});close(L.sample(layer,1).path.segments[0].x,(layer.path.segments[0].x+target.segments[0].x)/2);
const placed=copy(layer);for(const p of [placed.path,...placed.tracks.path.map(k=>k.value)])assert.equal(V.insert(p,0,V.point(20,25)),true);
const restored=P.validate({version:2,clips:[{...P.defaultClip(),layers:[placed]}]}).clips[0].layers[0];
assert.equal(restored.path.segments.length,11);for(const k of restored.tracks.path)assert.equal(k.value.segments.length,11);close(L.sample(restored,1).path.segments[1].x,20);
L.setKey(layer,'position',0,V.point(10,20),{fps:30});L.setKey(layer,'position',4,V.point(90,80),{fps:30,easing:'linear'});close(L.sample(layer,2).x,50);close(L.sample(layer,2).y,50);
layer.orientToPath=true;close(L.sample(layer,2,16/9).rotation,Math.atan2(60,80*16/9)*180/Math.PI);
L.addMotion(layer,'float',{start:0,duration:5,sceneDuration:5});const saved=JSON.stringify(layer.tracks.path);L.edit(layer,2,{x:65},{fps:30,duration:5,ratio:16/9});close(L.sample(layer,2,16/9).x,65);assert.equal(saved,JSON.stringify(layer.tracks.path));
const baked=copy(layer);L.bake(baked,5,30,16/9);for(let i=0;i<=150;i++)for(const p of L.properties)close(L.sample(baked,i/30,16/9)[p],L.sample(layer,i/30,16/9)[p]);
const project=P.validate({version:2,clips:[{...P.defaultClip(),layers:[layer]}]});assert.equal(project.clips[0].layers[0].type,'path');assert.ok(project.clips[0].layers[0].tracks.path.length);assert.ok(project.clips[0].layers[0].tracks.position.length);
const again=JSON.stringify(L.sample(layer,1.3));L.sample(layer,0);assert.equal(JSON.stringify(L.sample(layer,1.3)),again);
const circle=V.fromShape(L.defaultLayer('ellipse'),L.sample(L.defaultLayer('ellipse'),0),16/9),box=V.bounds(circle);close(box.minX,0);close(box.maxX,100);close(box.minY,0);close(box.maxY,100);
const svgLayer=project.clips[0].layers[0];svgLayer.fillMode='linear';svgLayer.fillSecondary='#a59bff';const svg=V.toSVG(svgLayer,L.sample(svgLayer,1,16/9),16/9);assert.ok(svg.includes('viewBox="0 0 1280 720"'));assert.ok(svg.includes('<linearGradient'));assert.ok(svg.includes('transform="matrix('));assert.ok(!svg.includes('NaN'));
const catalog=JSON.parse(await fs.readFile(path.join(root,'.claude/skills/motion-workshop/assets/catalog.json'),'utf8'));assert.deepEqual(catalog.customization.layerTypes,[...Object.keys(L.types)]);assert.deepEqual(catalog.customization.animatedProperties,[...L.animatedProperties]);assert.equal(catalog.customization.maxLayersPerClip,L.maxLayers);assert.equal(catalog.customization.maxKeyframesPerProperty,L.maxKeys);assert.equal(catalog.runtimeOrder.length,10);
for(const ratio of ['16:9','9:16','1:1']){const demo=ctx.window.MotionLibrary.createVectorDemo({ratio});assert.equal(demo.clips[0].layers[0].type,'path');assert.equal(demo.clips[0].layers[0].tracks.path.length,3);assert.equal(demo.clips[0].layers[1].tracks.position.length,3);}
console.log(JSON.stringify({ok:true,curveSplitComparisons:202,manualNodePlacement:true,placementCases,morphTopologyRoundtrip:true,shapeConversions:7,transformInverseCases:50,shapeMorph:true,spatialMotion:true,aspectCorrectOrientation:true,spatialBakeFrames:151,svgExport:true,catalogContract:true}));
