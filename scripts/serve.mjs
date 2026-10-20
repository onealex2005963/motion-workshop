#!/usr/bin/env node
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const repository=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const root=resolve(repository,'.claude/skills/motion-workshop/assets');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.zip':'application/zip'};
const port=Number(process.env.MOTION_DEMO_PORT||4173);
const server=createServer(async(req,res)=>{
  try{
    let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(path==='/'){res.writeHead(302,{Location:'/editor/index.html'});res.end();return;}
    if(path.startsWith('/editor/')){
      const web=resolve(repository,'web'),file=resolve(web,'.'+path.slice('/editor'.length));
      if(!file.startsWith(web+sep)){res.writeHead(403);res.end();return;}
      res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(await readFile(file));return;
    }
    if(path==='/downloads/motion-workshop-skill.zip'){res.writeHead(200,{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="motion-workshop-skill.zip"'});res.end(await readFile(resolve(repository,'downloads/motion-workshop-skill.zip')));return;}
    let file=resolve(root,'.'+path);
    if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
    if((await stat(file)).isDirectory())file=resolve(file,'index.html');
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(await readFile(file));
  }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Demo: http://127.0.0.1:${port}/`));
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
