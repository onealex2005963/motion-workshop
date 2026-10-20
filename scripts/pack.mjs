#!/usr/bin/env node
// Reproducible ZIP archives using Node built-ins only (no system zip required).
import fs from 'node:fs/promises';
import path from 'node:path';
import { deflateRawSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const skill=path.join(root,'.claude/skills/motion-workshop');
const dist=path.join(root,'dist');await fs.mkdir(dist,{recursive:true});await fs.mkdir(path.join(root,'downloads'),{recursive:true});
const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
const crc32=data=>{let crc=0xffffffff;for(const byte of data)crc=crcTable[(crc^byte)&255]^(crc>>>8);return(crc^0xffffffff)>>>0;};
async function walk(dir,relative='',exclude=new Set()){
  let out=[];for(const entry of (await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name,'en'))){
    if(exclude.has(entry.name))continue;const name=relative+entry.name,full=path.join(dir,entry.name);
    if(entry.isSymbolicLink())throw new Error('Symlinks are not portable: '+name);
    if(entry.isDirectory())out.push(...await walk(full,name+'/',exclude));else out.push({name,full});
  }return out;
}
async function zip(base,files,target){
  const local=[],central=[];let offset=0;
  for(const file of files){
    const name=Buffer.from(base+'/'+file.name),data=await fs.readFile(file.full),compressed=deflateRawSync(data,{level:9}),crc=crc32(data);
    const header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt16LE(8,8);header.writeUInt16LE(0x21,12);header.writeUInt32LE(crc,14);header.writeUInt32LE(compressed.length,18);header.writeUInt32LE(data.length,22);header.writeUInt16LE(name.length,26);
    const directory=Buffer.alloc(46);directory.writeUInt32LE(0x02014b50);directory.writeUInt16LE(0x314,4);directory.writeUInt16LE(20,6);directory.writeUInt16LE(0x800,8);directory.writeUInt16LE(8,10);directory.writeUInt16LE(0x21,14);directory.writeUInt32LE(crc,16);directory.writeUInt32LE(compressed.length,20);directory.writeUInt32LE(data.length,24);directory.writeUInt16LE(name.length,28);
    const mode=file.name.endsWith('.sh')?0o100755:0o100644;directory.writeUInt32LE((mode*65536)>>>0,38);directory.writeUInt32LE(offset,42);
    local.push(header,name,compressed);central.push(directory,name);offset+=header.length+name.length+compressed.length;
  }
  const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
  const buffer=Buffer.concat([...local,directory,end]);await fs.writeFile(target,buffer);
  return{file:path.basename(target),files:files.length,bytes:buffer.length,sha256:createHash('sha256').update(buffer).digest('hex')};
}
const skillZip=path.join(root,'downloads/motion-workshop-skill.zip');
const results=[await zip('motion-workshop',await walk(skill),skillZip)];
await fs.copyFile(skillZip,path.join(dist,'motion-workshop-skill.zip'));
results.push(await zip('motion-workshop',await walk(root,'',new Set(['.git','build','dist','node_modules','.DS_Store'])),path.join(dist,'motion-workshop-source.zip')));
await fs.writeFile(path.join(dist,'SHA256SUMS'),results.map(r=>r.sha256+'  '+r.file).join('\n')+'\n');console.log(JSON.stringify(results,null,2));
