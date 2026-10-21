// Included inside the generated offline library; all dependencies are local.
const lookup=new Map(catalog.elements.map(e=>[e.id,e]));
const idOf=id=>String(id).replace(/^#/, '').padStart(3,'0');
function entry(id){const value=lookup.get(idOf(id));if(!value)throw new Error('找不到動效編號：'+id);return value;}
function label(id){const e=entry(id);return locale.names[Number(e.id)-1]||e.name['zh-Hant']||e.name.en;}
function meaning(id){const e=entry(id);return locale.meanings[e.id]||e.meaning['zh-Hant']||e.meaning.en;}
function search(query='',pack='all'){
  const words=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return catalog.elements.filter(e=>(pack==='all'||e.pack===pack)&&words.every(q=>[e.id,'#'+e.id,label(e.id),...Object.values(e.name),meaning(e.id),...e.tags].join(' ').toLowerCase().includes(q)));
}
function blocks(pack){
  if(!factories[pack])throw new Error('找不到分類：'+pack);
  const source=factories[pack].toString(),matches=[...source.matchAll(/^  \/\/ @(kit|shared|element|end)(?: (\d+))?\s*$/gm)];
  return matches.map((m,i)=>({kind:m[1],no:m[2],code:source.slice(m.index+m[0].length,matches[i+1]?.index??source.length).trim()})).filter(b=>b.kind!=='end');
}
const license=id=>`// Motion Prompt #${id} · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#${id}`;
function kit(pack){const p=catalog.packs.find(p=>p.pack===pack);if(!p)throw new Error('找不到分類：'+pack);return license(p.first+'-'+p.last)+'\n'+blocks(pack).filter(b=>['kit','shared'].includes(b.kind)).map(b=>b.code).join('\n\n');}
function elementCode(id){const e=entry(id),block=blocks(e.pack).find(b=>b.kind==='element'&&Number(b.no)===Number(e.no));if(!block)throw new Error('缺少原始程式：'+e.id);return license(e.id)+'\n'+block.code;}
function get(id){const e=entry(id);return [license(e.id),`#${e.id} ${label(e.id)} / ${e.name.en}`,meaning(e.id),`Pack: ${e.pack}; ${e.width}×${e.height}; cycle ${e.cycle}s. Needs: kit ${e.pack}.`,...e.spec.en.map(s=>'- '+s),'\nReference implementation:\n'+elementCode(e.id)].join('\n');}
function render(id,canvas,seconds,view={}){
  const e=entry(id);if(!Number.isFinite(seconds))throw new Error('預覽時間無效。');
  // Photo demos reuse offscreen contexts whose drawing state survives a seek in WebKit.
  // Recreate that pack for each still; the pinned upstream sources stay unchanged.
  const pack=['photo','motion2'].includes(e.pack)?factories[e.pack]():(packs[e.pack]||(packs[e.pack]=factories[e.pack]())),c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,x=view.x||0,y=view.y||0,vw=view.width||w,vh=view.height||h,scale=(view.fit==='cover'?Math.max(vw/e.width,vh/e.height):Math.min(vw/e.width,vh/e.height))*(view.zoom||1);
  c.save();try{c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.filter='none';c.clearRect(0,0,w,h);c.fillStyle=view.background||'#10171c';c.fillRect(0,0,w,h);c.beginPath();c.rect(x,y,vw,vh);c.clip();c.translate(x+(vw-e.width*scale)/2,y+(vh-e.height*scale)/2);c.scale(scale,scale);c.beginPath();c.rect(0,0,e.width,e.height);c.clip();pack.cells[Number(e.no)-1](c,e.width,e.height,((seconds%e.cycle)+e.cycle)%e.cycle);}finally{c.restore();}
}
function handoff(picks,options={}){
  const unique=[...new Map(picks.map(p=>{const e=entry(typeof p==='string'?p:p.id);return[e.id,{id:e.id,note:typeof p==='string'?'':String(p.note||'').slice(0,300)}];})).values()];
  if(!unique.length)throw new Error('請先挑選動效。');
  const lines=['# 動畫小工坊 1.5 · Motion Prompt 動效選擇',String(options.brief||'請依下列動效選擇完成我的作品。').slice(0,2000),`用途：${options.mode||'影片／網站／軟體'}。以下是參考規格，不代表已完成整部作品。`,'修改既有作品時，請另附 .motion.json 專案；請一併讀取 Skill ZIP 的 SKILL.md 與 references/motion-prompt.md。所有來源與程式都在 ZIP 內，不需要連到我的電腦。',`上游快照：${origin.commit}（${origin.retrieved}）；作者 Shohei Ohtaki，MIT。`,'先確認專案框架、畫面比例、FPS、內容與場景邊界。替換動畫時保留原場景長度與前後轉場；維持原始動作的先後與緩動，若改變節奏，請列出差異。','保留原始程式第一行授權。互動 UI 必須改為真正可操作的 DOM 元件；photo 類只用於圖像／影片提示詞，示範不是照片濾鏡。',''];
  for(const p of unique){const e=entry(p.id);lines.push(`## #${e.id} ${label(e.id)} / ${e.name.en}`,`用途備註：${p.note||'由製作需求決定'}`,meaning(e.id),`精確規格與程式：assets/motion-reference/packs/${e.pack}.js；查詢：node assets/motion-reference.mjs get ${e.id}；共用程式：node assets/motion-reference.mjs kit ${e.pack}`,`原版示範：https://showheyohtaki.github.io/motion-prompt/#${e.id}`,...e.spec.en.map(s=>'- '+s),'');}
  lines.push('請交付可編輯原始碼／專案，列出使用的動效編號、場景位置、調整與實際驗證結果。無法渲染時請說明，不要把參考示範當成已完成的成品。');
  return lines.join('\n');
}
window.MotionReference={catalog,origin,locale,entry,label,meaning,search,kit,elementCode,get,render,handoff};
