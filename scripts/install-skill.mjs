#!/usr/bin/env node
// Copy only this self-contained skill into an explicitly selected project.
import { cp, mkdir, lstat } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const args=process.argv.slice(2), i=args.indexOf('--project');
if(i<0 || !args[i+1]){
  console.log('Usage: node scripts/install-skill.mjs --project /absolute/your-project');
  process.exit(args.length?1:0);
}
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const target=resolve(args[i+1]), destination=join(target,'.claude','skills','motion-workshop');
if(!(await lstat(target)).isDirectory()) throw new Error('Target project must already exist.');
// Refuse symlink parents; do not accidentally write outside the selected project.
for(const parent of [join(target,'.claude'),join(target,'.claude','skills'),destination]){
  try { const stat=await lstat(parent); if(stat.isSymbolicLink())throw new Error('Symlink target refused: '+parent);if(parent===destination)throw new Error('Skill already exists; choose a different project or review it manually.'); }
  catch(error){if(error.code!=='ENOENT')throw error;}
}
await mkdir(dirname(destination),{recursive:true});
await cp(join(root,'.claude','skills','motion-workshop'),destination,{recursive:true,errorOnExist:true,force:false});
console.log('Installed '+destination+'\nRestart Claude Code in that project, then use /motion-workshop.');
