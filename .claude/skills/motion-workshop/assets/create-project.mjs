#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=dirname(fileURLToPath(import.meta.url)),args=process.argv.slice(2),options={};
const flags=new Set(['--story','--brand','--headline','--items','--duration','--ratio','--palette','--fps','--output']);
for(let i=0;i<args.length;i++){
  const key=args[i];if(key==='--list'||key==='--overwrite'){options[key]=true;continue;}
  if(!flags.has(key)||!args[i+1]||args[i+1].startsWith('--'))throw new Error('Invalid option: '+key);options[key]=args[++i];
}
const sandbox=vm.createContext({window:{}});
for(const file of ['effects.js','effects-extra.js','effects-pro.js','motion-reference.js','reference-templates.js','layers.js','audio.js','engine.js','library.js'])vm.runInContext(await readFile(join(root,'runtime',file),'utf8'),sandbox,{filename:file});
const library=sandbox.window.MotionLibrary,engine=sandbox.window.MotionProject;
if(options['--list']){console.log(JSON.stringify(library.stories,null,2));process.exit();}
if(!options['--story']||!options['--output']){console.log('Usage: node create-project.mjs --story product-launch --brand 品牌 --headline 主題 --items 重點一,重點二 --duration 15 --ratio 16:9 --output project.motion.json\n       node create-project.mjs --list');process.exit(args.length?1:0);}
if(options['--ratio']&&!['16:9','9:16','1:1'].includes(options['--ratio']))throw new Error('Unsupported aspect ratio');
if(options['--fps']&&!['30','60'].includes(options['--fps']))throw new Error('FPS must be 30 or 60');
if(options['--palette']&&!['0','1','2','3'].includes(options['--palette']))throw new Error('Palette must be 0, 1, 2 or 3');
const project=library.createStory(options['--story'],{brand:options['--brand'],headline:options['--headline'],items:options['--items']?.split(/[,，]/),duration:options['--duration']===undefined?15:Number(options['--duration']),ratio:options['--ratio'],fps:Number(options['--fps']),palette:Number(options['--palette'])});
const output=resolve(options['--output']);await writeFile(output,JSON.stringify(project,null,2)+'\n',{flag:options['--overwrite']?'w':'wx'});
console.log(JSON.stringify({ok:true,output,story:options['--story'],frames:Math.round(engine.duration(project)*project.fps),duration:engine.duration(project)},null,2));
