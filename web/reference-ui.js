/* Offline motion dictionary, editable recipes and explicit Claude handoff. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),R=window.MotionReference,P=window.MotionProject,ed=window.WorkshopEditor,dialog=$('reference-dialog');
  const picks=new Map();let active='001',pack='all',page=0,seconds=0,playing=false,start=0,raf=0,last=-1,project;
  try{for(const item of JSON.parse(localStorage.getItem('motion-reference-picks-v1')||'[]').slice(0,144)){R.entry(item.id);picks.set(item.id,String(item.note||'').slice(0,300));}}catch{picks.clear();}
  const persist=()=>{try{localStorage.setItem('motion-reference-picks-v1',JSON.stringify([...picks].map(([id,note])=>({id,note}))));}catch{}};
  function options(){return{...ed.project.clips[ed.selected],ratio:ed.project.ratio,fps:ed.project.fps,text:$('reference-text').value,subtitle:$('reference-subtitle').value,duration:Number($('reference-duration').value),strength:Number($('reference-strength').value),stagger:Number($('reference-stagger').value),sound:$('reference-sound').checked};}
  function refreshPrompt(){
    $('reference-count').textContent=`已選 ${picks.size} 項`;$('reference-copy').disabled=$('reference-save').disabled=!picks.size;
    $('reference-output').value=picks.size?R.handoff([...picks].map(([id,note])=>({id,note})),{mode:$('reference-purpose').value,brief:$('reference-brief').value}):'先按「加入選擇」，可為不同效果分別填寫用途備註。';
    $('reference-picked').textContent=[...picks.keys()].map(id=>'#'+id+' '+R.label(id)).join(' · ')||'尚未選擇動效';
  }
  function renderList(){
    const entries=R.search($('reference-search').value,pack).filter(e=>!$('reference-editable-only').checked||R.recipeIds.includes(e.id));
    const pages=Math.max(1,Math.ceil(entries.length/24));page=Math.min(page,pages-1);
    $('reference-results').textContent=`找到 ${entries.length} / 144 項 · 可編輯配方 20 組`;$('reference-list').replaceChildren();
    $('reference-page').textContent=`第 ${page+1} / ${pages} 頁`;$('reference-prev').disabled=page===0;$('reference-next').disabled=page>=pages-1;
    for(const e of entries.slice(page*24,(page+1)*24)){
      const row=document.createElement('div');row.className='reference-row';
      const b=document.createElement('button');b.className='reference-entry';b.setAttribute('aria-pressed',String(active===e.id));b.setAttribute('aria-label',`預覽 #${e.id} ${R.label(e.id)}`);
      const title=document.createElement('strong');title.textContent=`#${e.id} ${R.label(e.id)}`;const en=document.createElement('small');en.textContent=e.name.en+(R.recipeIds.includes(e.id)?' · 可編輯':'');const desc=document.createElement('span');desc.textContent=R.meaning(e.id);b.append(title,en,desc);b.onclick=()=>{active=e.id;seconds=0;showEntry();renderList();};
      const check=document.createElement('input');check.type='checkbox';check.checked=picks.has(e.id);check.setAttribute('aria-label',`選擇 #${e.id} ${R.label(e.id)}`);check.onchange=()=>{if(check.checked)picks.set(e.id,'');else picks.delete(e.id);persist();refreshPrompt();if(active===e.id)refreshPick();};row.append(b,check);$('reference-list').append(row);
    }
    if(!entries.length){const empty=document.createElement('p');empty.className='muted';empty.textContent='沒有符合的動效。可搜尋編號、繁中、英文、日文或關鍵字。';$('reference-list').append(empty);}
  }
  function refreshPick(){const picked=picks.has(active);$('reference-pick').textContent=picked?'✓ 已選擇，點此移除':'＋ 加入選擇';$('reference-pick').setAttribute('aria-pressed',String(picked));$('reference-note').disabled=!picked;$('reference-note').value=picks.get(active)||'';}
  function showEntry(){
    const e=R.entry(active),editable=R.recipeIds.includes(active);$('reference-name').textContent=`#${e.id} ${R.label(e.id)}`;$('reference-english').textContent=e.name.en+' · '+e.name.ja;$('reference-meaning').textContent=R.meaning(active);
    $('reference-template-insert').disabled=ed.project.clips.length>=24;$('reference-template-apply').disabled=ed.exporting;
    $('reference-adapted-option').disabled=!editable;if(!editable)$('reference-view').value='original';
    $('reference-insert').disabled=!editable||ed.project.clips.length>=24;$('reference-insert').textContent=editable?'插入可編輯場景 →':'此項提供原版參考與 Claude 規格';$('reference-recipe-note').textContent=editable?'配方是小工坊的圖層改編，可修改文字、配色、位置與關鍵格；原版示範可在上方切換。':e.pack==='photo'?'攝影風格用於圖像／影片提示詞。此示範不會替匯入照片套濾鏡。':'原版是動作示意。可複製規格交給 Claude，依你的網站、軟體或影片重建。';
    $('reference-spec').replaceChildren(...e.spec.en.map(line=>{const li=document.createElement('li');li.textContent=line;return li;}));
    $('reference-origin').textContent=`Motion Prompt · Shohei Ohtaki · MIT · #${e.id} · 原版 ${e.width}×${e.height}，循環 ${e.cycle} 秒`;
    seconds=$('reference-view').value==='adapted'&&editable?Number($('reference-duration').value)*.55:e.cycle*.3;
    refreshPick();rebuildPreview();
  }
  function rebuildPreview(){
    try{project=R.recipeIds.includes(active)?P.validate({version:2,ratio:ed.project.ratio,fps:ed.project.fps,clips:[R.createClip(active,options())]}):null;
      const canvas=$('reference-preview'),adapted=$('reference-view').value==='adapted'&&project;
      [canvas.width,canvas.height]=adapted?ed.project.ratio==='9:16'?[360,640]:ed.project.ratio==='1:1'?[600,600]:[960,540]:[1078,416];
      $('reference-seek').max=adapted?project.clips[0].duration:R.entry(active).cycle;seconds=Math.min(seconds,Number($('reference-seek').max));start=performance.now()-seconds*1000;draw();
    }catch(e){ed.notify(e.message);}
  }
  function draw(){
    try{const adapted=$('reference-view').value==='adapted'&&project;if(adapted)P.render(project,seconds,$('reference-preview'));else R.render(active,$('reference-preview'),seconds);$('reference-seek').value=seconds;$('reference-clock').textContent=seconds.toFixed(2)+' / '+Number($('reference-seek').max).toFixed(2)+' 秒';}
    catch(e){stop();$('reference-recipe-note').textContent='預覽失敗：'+e.message;}
  }
  function tick(timestamp){if(!dialog.open||!playing)return;if(timestamp-last>70){seconds=((timestamp-start)/1000)%Number($('reference-seek').max);last=timestamp;draw();}if(playing)raf=requestAnimationFrame(tick);}
  function stop(){playing=false;cancelAnimationFrame(raf);$('reference-play').textContent='播放預覽';$('reference-play').setAttribute('aria-pressed','false');}
  function play(){cancelAnimationFrame(raf);playing=true;start=performance.now()-seconds*1000;$('reference-play').textContent='暫停預覽';$('reference-play').setAttribute('aria-pressed','true');raf=requestAnimationFrame(tick);}
  $('motion-reference').onclick=()=>{if(ed.exporting)return;ed.pause();const c=ed.project.clips[ed.selected];$('reference-text').value=c.text||'讓想法，自由動起來';$('reference-subtitle').value=c.subtitle;$('reference-duration').value=c.duration;dialog.showModal();try{renderList();showEntry();refreshPrompt();if(!matchMedia('(prefers-reduced-motion: reduce)').matches)play();}catch(error){$('reference-meaning').textContent='字典載入失敗：'+error.message;}};
  $('reference-close').onclick=()=>dialog.close();dialog.addEventListener('close',stop);
  $('reference-search').oninput=()=>{page=0;renderList();};$('reference-editable-only').onchange=()=>{page=0;renderList();};
  $('reference-prev').onclick=()=>{page--;renderList();$('reference-list').scrollTop=0;};$('reference-next').onclick=()=>{page++;renderList();$('reference-list').scrollTop=0;};
  for(const p of [{pack:'all',name:'全部'},...R.catalog.packs.map(p=>({pack:p.pack,name:R.locale.packs[p.pack]}))]){const b=document.createElement('button');b.textContent=p.name;b.setAttribute('aria-pressed',String(pack===p.pack));b.onclick=()=>{pack=p.pack;page=0;for(const x of $('reference-packs').children)x.setAttribute('aria-pressed',String(x===b));renderList();};$('reference-packs').append(b);}
  $('reference-pick').onclick=()=>{if(picks.has(active))picks.delete(active);else picks.set(active,'');persist();refreshPick();refreshPrompt();renderList();};
  $('reference-note').oninput=()=>{if(picks.has(active)){picks.set(active,$('reference-note').value);persist();refreshPrompt();}};
  $('reference-clear').onclick=()=>{picks.clear();persist();refreshPick();refreshPrompt();renderList();};
  for(const id of ['reference-purpose','reference-brief'])$(id).oninput=refreshPrompt;
  for(const id of ['reference-text','reference-subtitle','reference-duration','reference-strength','reference-stagger','reference-sound','reference-view'])$(id).onchange=rebuildPreview;
  $('reference-play').onclick=()=>playing?stop():play();$('reference-seek').oninput=()=>{stop();seconds=Number($('reference-seek').value);draw();};
  $('reference-insert').onclick=()=>{try{const clip=R.createClip(active,options());if(ed.insert(clip)){dialog.close();document.querySelector('[data-inspector-tab="layers"]').click();ed.seek(P.timeline(ed.project)[ed.selected].start+clip.duration*.55);ed.notify(`已插入 #${active} 的可編輯改編，原場景已保留。`);}}catch(e){ed.notify(e.message);}};
  $('reference-template-insert').onclick=()=>{try{const clip=R.createTemplate(active,{...options(),layers:[],audio:[]});if(ed.insert(clip)){dialog.close();document.querySelector('[data-inspector-tab="template"]').click();ed.seek(P.timeline(ed.project)[ed.selected].start+Math.min(clip.duration*.55,R.entry(active).cycle*.3));ed.notify(`已插入 #${active} 套版。可修改標題、速度、縮放與圖層。`);}}catch(e){ed.notify(e.message);}};
  $('reference-template-apply').onclick=()=>{if(ed.applyEffect('mp-'+active)){dialog.close();document.querySelector('[data-inspector-tab="template"]').click();ed.seek(P.timeline(ed.project)[ed.selected].start+Math.min(ed.project.clips[ed.selected].duration*.55,R.entry(active).cycle*.3));ed.notify('已套用套版，保留場景長度、轉場與現有圖層。可按復原回到原作。');}};
  $('reference-copy').onclick=async()=>{refreshPrompt();const text=$('reference-output').value;try{if(ed.native)await ed.native({type:'copyText',text});else await navigator.clipboard.writeText(text);ed.notify('已複製動效選擇與規格。請同時提供最新版 Skill ZIP。');}catch{$('reference-output-details').open=true;$('reference-output').focus();$('reference-output').select();ed.notify('請按 ⌘C 或 Ctrl+C 複製已選取的指令。');}};
  $('reference-save').onclick=async()=>{try{refreshPrompt();const data=$('reference-output').value;if(ed.native){const result=await ed.native({type:'save',kind:'text',name:'給Claude的動效選擇.md',data});if(result.cancelled)return;}else{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'text/markdown;charset=utf-8'}));a.download='給Claude的動效選擇.md';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000);}ed.notify('動效選擇與規格已儲存。');}catch(e){ed.notify(e.message);}};
})();
