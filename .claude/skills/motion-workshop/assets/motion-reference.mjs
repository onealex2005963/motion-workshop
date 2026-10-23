#!/usr/bin/env node
// Offline Motion Prompt lookup and editable project generation. No dependencies/network.
import {readFile,writeFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=dirname(fileURLToPath(import.meta.url)),args=process.argv.slice(2),command=args.shift();
const ctx=vm.createContext({window:{}});
for(const file of ['effects','effects-extra','effects-pro','motion-reference','reference-templates','vector','layers','audio','engine','library','reference-recipes'])vm.runInContext(await readFile(join(root,'runtime',file+'.js'),'utf8'),ctx,{filename:file+'.js'});
const R=ctx.window.MotionReference,P=ctx.window.MotionProject;
try{
  if(command==='list'||command==='search'){
    let pack='all',editable=false;const query=[];
    for(let i=0;i<args.length;i++){if(args[i]==='--pack')pack=args[++i];else if(args[i]==='--editable')editable=true;else if(args[i].startsWith('--'))throw new Error('Unknown option: '+args[i]);else query.push(args[i]);}
    if(pack!=='all'&&!R.catalog.packs.some(p=>p.pack===pack))throw new Error('Unknown pack: '+pack);
    console.log(R.search(command==='search'?query.join(' '):'',pack).filter(e=>!editable||R.recipeIds.includes(e.id)).map(e=>`#${e.id}\t${e.pack}\t${R.label(e.id)}\t${e.name.en}\t${R.meaning(e.id)}${R.recipeIds.includes(e.id)?' [editable]':''}`).join('\n'));
  }else if(command==='get'){if(args.length!==1)throw new Error('get needs one ID');console.log(R.get(args[0]));
  }else if(command==='kit'){if(args.length!==1)throw new Error('kit needs one pack');console.log(R.kit(args[0]));
  }else if(command==='info'){console.log(JSON.stringify({count:R.catalog.count,packs:R.catalog.packs.length,editableRecipes:R.recipeIds.length,source:R.origin,offline:true},null,2));
  }else if(command==='create'||command==='template'){
    const id=args.shift(),o={},flags=new Set(['--text','--subtitle','--duration','--strength','--stagger','--ratio','--fps','--items','--output']);
    for(let i=0;i<args.length;i++){if(args[i]==='--sound'){o.sound=true;continue;}if(!flags.has(args[i])||args[i+1]===undefined)throw new Error('Invalid option: '+args[i]);o[args[i].slice(2)]=args[++i];}
    if(!o.output)throw new Error('create requires --output');if(o.ratio&&!['16:9','9:16','1:1'].includes(o.ratio))throw new Error('Invalid ratio');if(o.fps&&!['30','60'].includes(o.fps))throw new Error('FPS must be 30 or 60');
    for(const key of ['duration','strength','stagger','fps'])if(o[key]!==undefined){o[key]=Number(o[key]);if(!Number.isFinite(o[key]))throw new Error('Invalid number: '+key);}
    if(o.items)o.items=o.items.split(/[,，]/);const project=P.validate({version:2,ratio:o.ratio,fps:o.fps,clips:[command==='template'?R.createTemplate(id,o):R.createClip(id,o)]}),output=resolve(o.output);
    await writeFile(output,JSON.stringify(project,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({ok:true,output,reference:R.entry(id).id,duration:P.duration(project),frames:Math.round(P.duration(project)*project.fps),layers:project.clips[0].layers.length,kind:project.clips[0].reference.kind,exportableTemplate:true},null,2));
  }else{
    console.log('motion-reference.mjs info | list [--pack motion2] [--editable] | search 關鍵字 | get 005 | kit motion | create 002 --text 標題 --duration 5 --ratio 16:9 --output scene.motion.json [--sound]');process.exitCode=command?1:0;
  }
}catch(e){console.error(e.message);process.exitCode=1;}
