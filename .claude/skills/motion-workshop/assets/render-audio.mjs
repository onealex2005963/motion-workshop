#!/usr/bin/env node
// Portable, offline WAV mixing. Requires Node 20+, no external packages or macOS app.
import {readFile,writeFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=dirname(fileURLToPath(import.meta.url)),args=process.argv.slice(2),option=key=>{const i=args.indexOf(key);return i<0?undefined:args[i+1];};
if(!option('--project')||!option('--output')){console.log('node render-audio.mjs --project project.motion.json --output sound.wav [--overwrite]');process.exit(0);}
const output=resolve(option('--output'));if(!output.toLowerCase().endsWith('.wav'))throw new Error('輸出副檔名必須是 .wav。');
const sandbox=vm.createContext({window:{}});
for(const file of ['effects.js','effects-extra.js','effects-pro.js','motion-reference.js','reference-templates.js','vector.js','layers.js','audio.js','engine.js'])vm.runInContext(await readFile(join(root,'runtime',file),'utf8'),sandbox,{filename:file});
const P=sandbox.window.MotionProject,A=sandbox.window.MotionAudio,project=P.validate(JSON.parse(await readFile(resolve(option('--project')),'utf8')));
A.setLoader(async file=>{const data=await readFile(join(root,'runtime/sounds',file));return data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);});
const samples=await A.renderMix(project);await writeFile(output,Buffer.from(A.wav(samples)),{flag:args.includes('--overwrite')?'w':'wx'});
console.log(JSON.stringify({ok:true,output,duration:P.duration(project),sampleRate:A.sampleRate,channels:1,cues:A.events(project).length,samples:samples.length},null,2));
