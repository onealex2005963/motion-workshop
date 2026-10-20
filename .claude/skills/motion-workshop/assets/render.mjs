#!/usr/bin/env node
import {readFile,writeFile,access,unlink,mkdir,copyFile,rm} from 'node:fs/promises';
import {constants} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
const root=dirname(fileURLToPath(import.meta.url)),args=process.argv.slice(2),option=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
const exists=path=>access(path).then(()=>true,()=>false);
if(args.includes('--list')){process.stdout.write(await readFile(join(root,'catalog.json'),'utf8'));process.exit(0);}
if(!option('--project')){console.log('用法：node render.mjs --list\n      node render.mjs --project 專案.json --validate\n      node render.mjs --project 專案.json --output 影片.mp4 [--app /路徑/動畫小工坊.app] [--overwrite]');process.exit(0);}
const projectPath=resolve(option('--project')),raw=await readFile(projectPath,'utf8');
const sandbox={window:{}};vm.createContext(sandbox);for(const file of ["effects.js","effects-extra.js","effects-pro.js","engine.js","library.js"])vm.runInContext(await readFile(join(root,'runtime',file),'utf8'),sandbox,{filename:file});
const Engine=sandbox.window.MotionProject,project=Engine.validate(JSON.parse(raw)),timeline=Engine.timeline(project);
if(args.includes('--validate')){console.log(JSON.stringify({ok:true,normalizedProject:project,frames:Math.round(Engine.duration(project)*project.fps),duration:Engine.duration(project),timeline},null,2));process.exit(0);}
if(process.platform!=='darwin')throw new Error('MP4 匯出需要在有桌面登入的 macOS 執行；效果清單與專案驗證可以跨平台使用。');
const output=option('--output')&&resolve(option('--output'));if(!output||!output.toLowerCase().endsWith('.mp4'))throw new Error('請用 --output 指定 .mp4 路徑。');
if(await exists(output)&&!args.includes('--overwrite'))throw new Error('輸出檔已存在。要覆蓋請加 --overwrite。');
await access(dirname(output));
const app=option('--app')?resolve(option('--app')):join(process.env.HOME,'Applications','動畫小工坊.app');await access(join(app,'Contents','MacOS','MotionWorkshop'));
const jobs=join(process.env.HOME,'Library','Application Support','動畫小工坊','jobs');
async function appActive(){try{const h=JSON.parse(await readFile(join(jobs,'heartbeat.json'),'utf8'));return h.active&&Date.now()-h.updatedAt*1000<10000;}catch{return false;}}
if(await appActive()){
  const job=join(jobs,Date.now()+'-'+randomUUID()+'.mwjob');await mkdir(job);
  await writeFile(join(job,'project.json'),JSON.stringify(project));await writeFile(join(job,'ready.json'),JSON.stringify({createdAt:new Date().toISOString(),version:1}));
  const reportPath=join(job,'report.json'),deadline=Date.now()+30*60*1000;
  while(!await exists(reportPath)){if(Date.now()>deadline)throw new Error('本機任務逾時，請確認 App 保持開啟。任務位於：'+job);await new Promise(r=>setTimeout(r,500));}
  const result=JSON.parse(await readFile(reportPath,'utf8'));
  if(result.ok){await copyFile(join(job,'result.mp4'),output,args.includes('--overwrite')?0:constants.COPYFILE_EXCL);result.output=output;result.transport='local-job-queue';await rm(job,{recursive:true,force:true});}
  else result.jobFolder=job;
  console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;
  process.exit();
}
const report=join(dirname(output),`.motion-render-${process.pid}-${Date.now()}.json`);
const command=['-n',app,'--args','--render',projectPath,'--output',output,'--report',report,...(args.includes('--overwrite')?['--overwrite']:[])];
const launched=spawnSync('/usr/bin/open',command,{encoding:'utf8'});if(launched.status!==0)throw new Error('目前環境無法啟動桌面程式。請先雙擊開啟「動畫小工坊」，讓本機任務佇列就緒，再重新執行。');
const deadline=Date.now()+30*60*1000;
while(!await exists(report)){if(Date.now()>deadline)throw new Error('等待匯出逾時，請檢查 App 與輸出資料夾。');await new Promise(r=>setTimeout(r,500));}
const result=JSON.parse(await readFile(report,'utf8'));await unlink(report);console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;
