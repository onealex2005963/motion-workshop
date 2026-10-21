(() => {
  'use strict';
  const $ = id => document.getElementById(id), E = window.MotionEffects, Engine=window.MotionProject, Library=window.MotionLibrary;
  const bridge = window.webkit?.messageHandlers?.workshop;
  const native = message => bridge.postMessage(message);
  const palettes = [['#d8f36a','#a59bff','#10171c'],['#ff805a','#78b7ff','#151b26'],['#f394be','#80dbc4','#172329'],['#ede5d7','#c1a35b','#232320']];
  const defaultClip = Engine.defaultClip;
  let project={version:2,ratio:'16:9',quality:720,fps:30,clips:[defaultClip()]};
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  let selected=0,playing=!reducedMotion.matches,loop=true,time=0,lastTime=0,filter='全部',saveTimer,toastTimer,exporting=false,cancelled=false,dirty=false;
  let history=[],historyIndex=-1,favorites=new Set(),favoritesOnly=false,previews=!reducedMotion.matches,hoverPreview=null,previewTick=0,storyID='product-launch',detailTick=0,tileObserver;
  try{const saved=JSON.parse(localStorage.getItem('motion-workshop-favorites')||'[]');if(Array.isArray(saved))favorites=new Set(saved.filter(id=>E.definitions.some(e=>e.id===id)));}catch{}
  const canvas=$('preview'),ctx=canvas.getContext('2d',{alpha:false});
  const current=()=>project.clips[selected];
  const total=()=>Engine.duration(project);
  const startOf=index=>Engine.timeline(project)[index].start;
  const definition=id=>E.definitions.find(e=>e.id===id)||E.definitions[0];
  const dimensions=quality=>{const q=Number(quality);return project.ratio==='9:16'?[q,q*16/9]:project.ratio==='1:1'?[q,q]:[q*16/9,q];};
  const frameSize=quality=>dimensions(quality).map(n=>Math.round(n/2)*2);
  const tc=seconds=>`${String(Math.floor(seconds/60)).padStart(2,'0')}:${(seconds%60).toFixed(1).padStart(4,'0')}`;
  function notify(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3800);}
  function locate(t){return Engine.locate(project,t);}
  function renderAt(t,target=canvas){const result=Engine.render(project,t,target);if(target===canvas)document.dispatchEvent(new CustomEvent('workshop-frame'));return result;}
  function historyUI(){$('undo').disabled=historyIndex<1;$('redo').disabled=historyIndex>=history.length-1;}
  function remember(){const data=JSON.stringify(project);if(history[historyIndex]===data)return;history=history.slice(0,historyIndex+1);history.push(data);while(history.length>2&&(history.length>80||history.reduce((sum,item)=>sum+item.length,0)>40000000))history.shift();historyIndex=history.length-1;historyUI();}
  function restoreHistory(delta){const next=historyIndex+delta;if(exporting||next<0||next>=history.length)return;historyIndex=next;project=Engine.validate(JSON.parse(history[next]));selected=Math.min(selected,project.clips.length-1);time=Math.min(time,total());setPlaying(false);updateAll();saveSoon(false);historyUI();}
  function saveSoon(record=true){project=validate(project);document.dispatchEvent(new CustomEvent('workshop-change'));if(record)remember();dirty=true;renderAt(time);$('save-state').textContent='正在儲存…';clearTimeout(saveTimer);saveTimer=setTimeout(async()=>{try{const data=JSON.stringify(project);if(bridge)await native({type:'autosave',data});else localStorage.setItem('motion-workshop-project',data);dirty=false;$('save-state').textContent='已自動儲存';}catch(e){$('save-state').textContent='自動儲存失敗，請儲存專案';}},350);}
  const validate=Engine.validate;
  function resizePreview(){
    const [w,h]=frameSize(540);canvas.width=w;canvas.height=h;
    const stage=$('stage'),area=$('stage').parentElement,availableW=area.clientWidth-(innerWidth<1100?40:60),availableH=area.clientHeight-66;
    const ratio=w/h,sw=Math.min(availableW,availableH*ratio);stage.style.width=Math.max(100,sw)+'px';stage.style.height=Math.max(100,sw/ratio)+'px';stage.style.aspectRatio=String(ratio);
    const [ew,eh]=frameSize(project.quality);$('dimensions').textContent=`${ew} × ${eh}`;$('preview-format').textContent=project.ratio+({'16:9':' 橫式','9:16':' 直式','1:1':' 方形'}[project.ratio]);renderAt(time);
  }
  function renderLibrary(){
    hoverPreview=null;tileObserver?.disconnect();$('effect-list').replaceChildren();let count=0;
    if(window.IntersectionObserver)tileObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.drawThumbnail();tileObserver.unobserve(entry.target);}},{root:$('effect-list'),rootMargin:'100px'});
    const effects=[...E.definitions],sort=$('effect-sort').value;
    if(sort==='new')effects.reverse();if(sort==='name')effects.sort((a,b)=>a.name.localeCompare(b.name,'zh-Hant'));
    for(const effect of effects){if(filter!=='全部'&&effect.category!==filter||favoritesOnly&&!favorites.has(effect.id))continue;const search=$('effect-search').value.trim().toLowerCase();if(search&&!`${effect.name} ${effect.id} ${effect.description} ${effect.category} ${Library.metadata(effect.id).tags.join(' ')}`.toLowerCase().includes(search))continue;count++;
      const tile=document.createElement('div');tile.className='effect-tile';
      const button=document.createElement('button');button.className='effect-card'+(current().effect===effect.id?' active':'');button.dataset.effect=effect.id;button.setAttribute('aria-label',`套用${effect.name}`);button.setAttribute('aria-pressed',String(current().effect===effect.id));
      const thumb=document.createElement('canvas');thumb.width=176;thumb.height=112;const name=document.createElement('span');name.className='card-name';
      const idx=document.createElement('span');idx.className='card-index';idx.textContent=String(E.definitions.indexOf(effect)+1).padStart(2,'0');name.append(idx,document.createTextNode(effect.name));button.append(thumb,name);
      const opt={...defaultClip(effect.id),text:['type','mask-reveal','kinetic-zoom','typewriter','glass-card'].includes(effect.id)?'動起來':'',subtitle:'',size:1,amount:25};
      thumb.drawThumbnail=()=>{if(thumb.dataset.drawn)return;E.render(thumb.getContext('2d'),176,112,1.65,opt);thumb.dataset.drawn='true';};
      if(tileObserver)tileObserver.observe(thumb);else thumb.drawThumbnail();
      button.addEventListener('click',()=>applyEffect(effect.id));
      const star=document.createElement('button');star.className='favorite-button';const favorite=favorites.has(effect.id);star.textContent=favorite?'★':'☆';star.setAttribute('aria-label',(favorite?'取消收藏':'收藏')+effect.name);star.setAttribute('aria-pressed',String(favorite));star.onclick=()=>{favorite?favorites.delete(effect.id):favorites.add(effect.id);if(bridge)native({type:'savePreferences',favorites:[...favorites]}).catch(()=>notify('收藏暫時無法儲存。'));else try{localStorage.setItem('motion-workshop-favorites',JSON.stringify([...favorites]));}catch{notify('收藏暫時無法儲存。');}renderLibrary();};
      const startPreview=()=>{thumb.drawThumbnail();hoverPreview={canvas:thumb,options:opt,start:performance.now()};};const stopPreview=()=>{if(hoverPreview?.canvas===thumb)hoverPreview=null;};
      button.addEventListener('mouseenter',startPreview);button.addEventListener('focus',startPreview);button.addEventListener('mouseleave',stopPreview);button.addEventListener('blur',stopPreview);tile.append(button,star);$('effect-list').append(tile);
    }
    $('library-status').textContent=`顯示 ${count} / ${E.definitions.length} 個效果`;
    if(!count){const empty=document.createElement('p');empty.className='library-empty';empty.textContent=favoritesOnly?'這個分類尚無收藏。點效果右上方的 ☆ 即可加入。':'沒有符合的效果，試試其他關鍵字或分類。';$('effect-list').append(empty);}
  }
  function applyEffect(id){
    if(exporting||!E.definitions.some(e=>e.id===id))return false;
    current().effect=id;if(current().base)current().base.visible=true;
    if(id.startsWith('mp-'))current().reference={library:'motion-prompt',id:id.slice(3),kind:'original-template',sourceCommit:window.MotionReference.origin.commit};
    else if(current().reference?.kind==='original-template')delete current().reference;
    time=startOf(selected);setPlaying(false);updateInspector();renderLibrary();renderClips();saveSoon();renderAt(time);return true;
  }
  function renderClips(){
    $('clips').replaceChildren();project.clips.forEach((clip,i)=>{
      const b=document.createElement('button'),d=definition(clip.effect);b.className='clip'+(i===selected?' active':'');b.style.setProperty('--clip-color',clip.color);b.setAttribute('aria-label',`選取場景 ${i+1}：${d.name}`);b.setAttribute('aria-pressed',String(i===selected));
      const icon=document.createElement('span');icon.className='clip-icon';icon.textContent=d.icon;const info=document.createElement('div'),name=document.createElement('strong'),sub=document.createElement('small');name.textContent=`${String(i+1).padStart(2,'0')} ${clip.base?.visible===false?'自由構圖':d.name}`;sub.textContent=`${Number(clip.duration.toFixed(2))} 秒 · ${clip.text.replace(/\n/g,' ').slice(0,10)||'無文字'}`;info.append(name,sub);if(i<project.clips.length-1){const tr=document.createElement('span');tr.className='transition-chip';const row=Engine.timeline(project)[i];tr.textContent=`↔ ${Engine.transitionNames[row.transition]}${row.overlap?' '+Number(row.overlap.toFixed(2))+'s':''}`;info.append(tr);}b.append(icon,info);
      b.addEventListener('click',()=>{if(exporting)return;selected=i;time=startOf(i);document.dispatchEvent(new CustomEvent('workshop-play'));updateInspector();renderLibrary();renderClips();renderAt(time);});$('clips').append(b);
    });
    $('total-duration').textContent=`${project.clips.length} 個場景 · ${Number(total().toFixed(2))} 秒`;$('scrubber').max=total();$('remove').disabled=project.clips.length===1;$('move-left').disabled=selected===0;$('move-right').disabled=selected===project.clips.length-1;
  }
  function updateInspector(){
    document.dispatchEvent(new CustomEvent('workshop-selection'));
    const o=current();$('scene-name').textContent=o.base?.visible===false?'自由構圖':definition(o.effect).name;$('scene-count').textContent=`場景 ${String(selected+1).padStart(2,'0')}`;$('effect-description').textContent=definition(o.effect).description;
    const reference=o.effect.startsWith('mp-');$('reference-template-controls').hidden=!reference;
    if(reference){const e=window.MotionReference.entry(o.effect.slice(3));$('reference-template-origin').textContent=`#${e.id} ${e.name.en} · Shohei Ohtaki / MIT · ${e.cycle} 秒原版循環`;$('reference-template-fit').value=o.referenceTemplate?.fit||'contain';$('reference-template-labels').checked=o.referenceTemplate?.labels!==false;$('reference-template-loop').checked=o.referenceTemplate?.loop!==false;}
    for(const [id,key] of [['title-text','text'],['subtitle-text','subtitle'],['primary-color','color'],['secondary-color','secondary'],['background-color','background'],['speed','speed'],['size','size'],['amount','amount'],['duration','duration']])$(id).value=key==='duration'?Number(o[key].toFixed(3)):o[key];
    $('duration').step='any';
    $('speed-value').textContent=o.speed.toFixed(1)+'×';$('size-value').textContent=Math.round(o.size*100)+'%';$('amount-value').textContent=o.amount;
    $('ratio').value=project.ratio;$('quality').value=project.quality;$('fps').value=project.fps;
    $('amount').disabled=!['particles','reaction','halftone','physics'].includes(o.effect);
    $('size').disabled=['rhythm','glass','tunnel'].includes(o.effect);
    const withItems=Library.itemEffects.includes(o.effect);
    $('template-data').hidden=!withItems&&!['number-roll','beat-sync'].includes(o.effect);$('labels-fields').hidden=!withItems;$('chart-fields').hidden=!Library.valueEffects.includes(o.effect);$('number-fields').hidden=o.effect!=='number-roll';$('beat-fields').hidden=o.effect!=='beat-sync';
    $('item-labels').value=o.items.join(',');$('chart-values').value=o.values.join(',');$('target-value').value=o.value;$('value-suffix').value=o.suffix;$('bpm').value=o.bpm;
    const last=selected===project.clips.length-1;$('transition-type').value=o.transition.type;$('transition-duration').value=String(o.transition.duration);$('transition-type').disabled=last;$('transition-duration').disabled=last||o.transition.type==='cut';$('preview-transition').disabled=last;
    $('transition-note').textContent=last?'這是最後一幕。新增下一幕後即可設定轉場。':`兩幕會重疊 ${Number(Engine.timeline(project)[selected].overlap.toFixed(2))} 秒，動畫持續播放。`;
  }
  for(const [id,key] of [['reference-template-fit','fit'],['reference-template-labels','labels'],['reference-template-loop','loop']])$(id).onchange=()=>{if(exporting||!current().effect.startsWith('mp-'))return;current().referenceTemplate??={fit:'contain',labels:true,loop:true};current().referenceTemplate[key]=key==='fit'?$(id).value:$(id).checked;saveSoon();};
  function updateAll(){$('effect-count').textContent=E.definitions.length;updateInspector();renderLibrary();renderClips();resizePreview();historyUI();}
  function setPlaying(value){playing=value;$('play').textContent=playing?'Ⅱ':'▶';$('play').setAttribute('aria-label',playing?'暫停':'播放');document.dispatchEvent(new CustomEvent('workshop-play'));}
  function animate(timestamp){
    if(!lastTime)lastTime=timestamp;const dt=Math.min(.1,(timestamp-lastTime)/1000);lastTime=timestamp;
    if(!exporting&&!document.hidden){if(playing){time+=dt;if(time>=total()){if(loop){time%=total();document.dispatchEvent(new CustomEvent('workshop-play'));}else{time=total();setPlaying(false);}}renderAt(time);}$('scrubber').value=time;$('timecode').innerHTML=`${tc(time)} <em>/ ${tc(total())}</em>`;
      if(previews&&hoverPreview&&timestamp-previewTick>120&&!document.querySelector('dialog[open]')){const p=hoverPreview;E.render(p.canvas.getContext('2d'),p.canvas.width,p.canvas.height,(performance.now()-p.start)/1000,p.options);previewTick=timestamp;}
      if($('detail-dialog').open&&previews&&timestamp-detailTick>120){const out=$('detail-preview');E.render(out.getContext('2d'),out.width,out.height,timestamp/1000,current());detailTick=timestamp;}
    }
    requestAnimationFrame(animate);
  }
  for(const [id,key] of [['title-text','text'],['subtitle-text','subtitle'],['primary-color','color'],['secondary-color','secondary'],['background-color','background'],['speed','speed'],['size','size'],['amount','amount'],['duration','duration']]){
    $(id).addEventListener(id==='duration'?'change':'input',()=>{if(exporting)return;current()[key]=['speed','size','amount','duration'].includes(key)?Number($(id).value):$(id).value;
      $('speed-value').textContent=current().speed.toFixed(1)+'×';$('size-value').textContent=Math.round(current().size*100)+'%';$('amount-value').textContent=current().amount;
      if(key==='duration'){current().duration=Math.max(1,Math.min(20,current().duration||1));$(id).value=current().duration;time=Math.min(time,total());}renderClips();saveSoon();renderAt(time);
    });
  }
  for(const id of ['ratio','quality','fps'])$(id).addEventListener('change',()=>{project[id]=id==='ratio'?$(id).value:Number($(id).value);resizePreview();saveSoon();});
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(e=>e.classList.toggle('active',e===b));renderLibrary();}));
  $('effect-search').addEventListener('input',renderLibrary);
  for(const id of ['item-labels','chart-values','target-value','value-suffix','bpm'])$(id).addEventListener('change',()=>{
    const o=current(),v=$(id).value;
    if(id==='item-labels')o.items=v.split(/[,，\n]/).map(s=>s.trim().slice(0,24)).filter(Boolean).slice(0,6);
    if(id==='chart-values')o.values=v.split(/[,，\s]+/).filter(Boolean).slice(0,6).map(n=>Math.max(0,Math.min(1e9,Number(n)||0)));
    if(id==='target-value')o.value=Math.max(0,Math.min(1e9,Number(v)||0));if(id==='value-suffix')o.suffix=v.slice(0,12);if(id==='bpm')o.bpm=Math.max(40,Math.min(240,Number(v)||120));
    if(!o.items.length)o.items=['創作'];if(!o.values.length)o.values=[0];updateInspector();saveSoon();renderAt(time);
  });
  for(const id of ['transition-type','transition-duration'])$(id).addEventListener('change',()=>{current().transition={type:$('transition-type').value,duration:Number($('transition-duration').value)||.6};time=Math.min(time,total());updateInspector();renderClips();saveSoon();});
  $('preview-transition').onclick=()=>{const row=Engine.timeline(project)[selected];time=Math.max(row.start,row.end-row.overlap-.65);setPlaying(true);};
  $('claude-kit').onclick=async()=>{if(bridge){try{await native({type:'toolkit'});notify('已開啟完整 Skill 資料夾。要交給雲端 Claude，請匯出 Skill ZIP。');}catch(e){notify(e.message);}}else notify('本專案 .claude/skills/motion-workshop 是完整 Skill，可使用 ZIP 交給 Claude。');};
  document.querySelectorAll('[data-palette]').forEach(b=>b.addEventListener('click',()=>{[current().color,current().secondary,current().background]=palettes[Number(b.dataset.palette)];updateInspector();renderLibrary();renderClips();saveSoon();}));
  $('play').onclick=()=>setPlaying(!playing);$('restart').onclick=()=>{time=0;renderAt(time);document.dispatchEvent(new CustomEvent('workshop-play'));};$('scrubber').oninput=()=>{setPlaying(false);time=Number($('scrubber').value);renderAt(time);};
  $('loop').onclick=()=>{loop=!loop;$('loop').classList.toggle('active',loop);$('loop').setAttribute('aria-pressed',String(loop));};
  $('safe-area').onclick=()=>{$('safe-overlay').hidden=!$('safe-overlay').hidden;$('safe-area').setAttribute('aria-pressed',String(!$('safe-overlay').hidden));};
  function add(duplicate){if(project.clips.length>=24){notify('一個專案最多 24 個場景。');return;}project.clips.splice(selected+1,0,duplicate?JSON.parse(JSON.stringify(current())):defaultClip());selected++;time=startOf(selected);updateAll();saveSoon();}
  $('add-scene').onclick=()=>add(false);$('duplicate').onclick=()=>add(true);
  $('remove').onclick=()=>{if(project.clips.length<2)return;project.clips.splice(selected,1);selected=Math.min(selected,project.clips.length-1);time=startOf(selected);updateAll();saveSoon();};
  function move(delta){const next=selected+delta;if(next<0||next>=project.clips.length)return;[project.clips[selected],project.clips[next]]=[project.clips[next],project.clips[selected]];selected=next;time=startOf(selected);updateAll();saveSoon();}
  $('move-left').onclick=()=>move(-1);$('move-right').onclick=()=>move(1);
  $('undo').onclick=()=>restoreHistory(-1);$('redo').onclick=()=>restoreHistory(1);
  $('favorite-filter').onclick=()=>{favoritesOnly=!favoritesOnly;$('favorite-filter').setAttribute('aria-pressed',String(favoritesOnly));renderLibrary();};
  $('effect-sort').onchange=renderLibrary;
  function previewPreference(){ $('preview-motion').setAttribute('aria-pressed',String(previews));$('preview-motion').textContent='動態預覽：'+(previews?'開':'關'); }
  $('preview-motion').onclick=()=>{previews=!previews;previewPreference();};previewPreference();
  reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches){setPlaying(false);previews=false;previewPreference();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)setPlaying(false);});
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
  function storyOptions(){return {brand:$('story-brand').value,headline:$('story-headline').value,items:$('story-items').value.split(/[,，\n]/),duration:Number($('story-duration').value),ratio:$('story-ratio').value,palette:Number($('story-palette').value),fps:project.fps};}
  function renderStories(){
    $('story-list').replaceChildren();for(const story of Library.stories){
      const button=document.createElement('button');button.className='story-card';button.setAttribute('aria-label','選擇'+story.name+'故事');button.setAttribute('aria-pressed',String(story.id===storyID));
      const preview=document.createElement('canvas');preview.width=320;preview.height=180;
      const demo=Library.createStory(story.id);E.render(preview.getContext('2d'),320,180,1.25,demo.clips[0]);
      const title=document.createElement('strong'),description=document.createElement('small');title.textContent=story.name;description.textContent=story.description;button.append(preview,title,description);
      button.onclick=()=>{storyID=story.id;$('story-selection').textContent=story.name;$('story-ratio').value=story.ratio;renderStories();};$('story-list').append(button);
    }
  }
  $('story-browser').onclick=()=>{setPlaying(false);renderStories();$('story-dialog').showModal();};
  $('story-form').onsubmit=e=>{e.preventDefault();try{project=Library.createStory(storyID,storyOptions());selected=0;time=0;setPlaying(false);$('story-dialog').close();updateAll();saveSoon();notify(`已套用 4 幕故事，共 ${Number(total().toFixed(2))} 秒。可按復原回到原作品。`);}catch(error){notify(error.message);}};
  function refreshPrompt(){const source=$('prompt-scope').value==='scene'?{...project,clips:[current()]}:project;$('prompt-result').value=Library.createPrompt(source,{mode:$('prompt-mode').value,brief:$('prompt-brief').value});}
  $('prompt-builder').onclick=()=>{setPlaying(false);refreshPrompt();$('prompt-dialog').showModal();};
  for(const id of ['prompt-mode','prompt-scope','prompt-brief'])$(id).addEventListener(id==='prompt-brief'?'input':'change',refreshPrompt);
  $('copy-prompt').onclick=async()=>{try{if(bridge)await native({type:'copyText',text:$('prompt-result').value});else await navigator.clipboard.writeText($('prompt-result').value);notify('Claude 指令已複製，請一併提供 Skill ZIP。');}catch{$('prompt-result').focus();$('prompt-result').select();notify('指令已選取，請按 ⌘C 或 Ctrl+C 複製。');}};
  $('save-prompt').onclick=async()=>{try{const data=$('prompt-result').value;if(bridge){const result=await native({type:'save',kind:'text',name:'給Claude的動畫指令.md',data});if(result.cancelled)return;}else download(data,'給Claude的動畫指令.md','text/markdown;charset=utf-8');notify('指令檔已儲存。');}catch(error){notify(error.message);}};
  $('export-skill').onclick=async()=>{try{if(bridge){const result=await native({type:'exportToolkit'});if(result.cancelled)return;}else{const link=document.createElement('a');link.href='../downloads/motion-workshop-skill.zip';link.download='motion-workshop-skill.zip';link.click();}notify('請將匯出的完整 ZIP 交給 Claude，並附上 Claude 指令。');}catch(error){notify('工具包匯出失敗：'+error.message);}};
  $('effect-details').onclick=()=>{
    setPlaying(false);const meta=Library.metadata(current().effect),out=$('detail-preview');E.render(out.getContext('2d'),640,360,1.2,current());
    $('detail-name').textContent=meta.name;$('detail-description').textContent=meta.description;$('detail-code').textContent=`${meta.id} · assets/runtime/${meta.source}`;$('detail-parameters').textContent='可調參數：'+meta.parameters.join('、');$('detail-tags').replaceChildren(...meta.tags.map(tag=>{const span=document.createElement('span');span.textContent=tag;return span;}));$('detail-dialog').showModal();
  };
  $('detail-prompt').onclick=()=>{$('detail-dialog').close();$('prompt-scope').value='scene';refreshPrompt();$('prompt-dialog').showModal();};
  function download(data,name,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);}
  $('save-project').onclick=async()=>{try{const data=JSON.stringify(project,null,2);if(bridge){const result=await native({type:'save',kind:'json',name:'我的動畫.motion.json',data});if(result.cancelled)return;}else download(data,'我的動畫.motion.json','application/json');notify('專案已儲存，之後可以重新開啟編輯。');}catch(e){notify('儲存失敗：'+e.message);}};
  async function loadData(data){const next=validate(JSON.parse(data));await window.MotionLayers.prepare(next);project=next;selected=0;time=0;updateAll();saveSoon();notify('專案已開啟。');}
  $('open-project').onclick=async()=>{try{if(bridge){const result=await native({type:'openProject'});if(!result.cancelled)await loadData(result.data);}else $('project-file').click();}catch(e){notify('開啟失敗：'+e.message);}};
  $('project-file').onchange=async e=>{try{if(e.target.files[0]){if(e.target.files[0].size>=20000000)throw new Error('專案需小於 20 MB。');await loadData(await e.target.files[0].text());}}catch(e){notify(e.message);}finally{e.target.value='';}};
  $('export-png').onclick=async()=>{try{await window.MotionLayers.prepare(project);const out=document.createElement('canvas');[out.width,out.height]=frameSize(project.quality);renderAt(time,out);const data=out.toDataURL('image/png').split(',')[1];if(bridge){const r=await native({type:'save',kind:'png',name:'我的動畫.png',data});if(r.cancelled)return;}else download(Uint8Array.from(atob(data),c=>c.charCodeAt(0)),'我的動畫.png','image/png');notify('目前畫面已儲存為 PNG。');}catch(e){notify('匯出失敗：'+e.message);}};
  function exportUI(active){
    exporting=active;document.querySelectorAll('button,input,textarea,select').forEach(el=>{if(el.id!=='cancel-export')el.disabled=active;});
    $('cancel-export').hidden=!active;$('export-progress').hidden=!active;
    if(!active){updateInspector();renderClips();historyUI();$('export-video').textContent='匯出 MP4 ↗';}
  }
  $('cancel-export').onclick=()=>{cancelled=true;if(bridge)native({type:'cancelVideo'}).catch(()=>{});$('cancel-export').disabled=true;$('export-status').textContent='正在取消…';};
  $('export-video').onclick=async()=>{
    if(!bridge){notify('請使用電腦上的「動畫小工坊」App 匯出 MP4。');return;}
    const wasPlaying=playing,oldTime=time;setPlaying(false);cancelled=false;
    const out=document.createElement('canvas');[out.width,out.height]=frameSize(project.quality);const frames=Math.round(total()*project.fps);
    exportUI(true);$('cancel-export').disabled=false;$('export-status').textContent='選擇影片儲存位置…';
    try{
      await window.MotionLayers.prepare(project);const begin=await native({type:'beginVideo',width:out.width,height:out.height,fps:project.fps,frames,name:'我的動畫.mp4'});if(begin.cancelled)return;
      for(let i=0;i<frames;i++){
        if(cancelled){await native({type:'cancelVideo'});notify('已取消匯出。');return;}
        renderAt(i/project.fps,out);const data=out.toDataURL('image/png').split(',')[1];await native({type:'videoFrame',index:i,data});
        const percent=Math.round((i+1)/frames*100);$('export-progress').firstElementChild.style.width=percent+'%';$('export-video').textContent=`正在匯出 ${percent}%`;$('export-status').textContent=`${i+1} / ${frames} 格 · 請保持 App 開啟`;
        if(i%3===0){ctx.drawImage(out,0,0,canvas.width,canvas.height);await new Promise(r=>setTimeout(r,0));}
      }
      $('export-status').textContent='正在混合音效與完成 MP4…';const audio=await window.MotionAudio.exportBase64(project);if(cancelled){await native({type:'cancelVideo'});return;}const result=await native({type:'finishVideo',audio});notify('MP4 已儲存完成。');$('export-status').textContent='影片已儲存 · '+result.name;
    }catch(e){await native({type:'cancelVideo'}).catch(()=>{});notify(cancelled?'已取消匯出。':'匯出失敗：'+e.message);$('export-status').textContent=cancelled?'已取消匯出。':'匯出失敗，可重新再試。';}
    finally{exportUI(false);time=oldTime;setPlaying(wasPlaying);renderAt(time);if($('export-status').textContent.includes('格')||$('export-status').textContent.includes('選擇')||cancelled)$('export-status').textContent='選效果 → 調整 → 匯出';}
  };
  $('help').onclick=()=>$('help-dialog').showModal();$('close-help').onclick=()=>$('help-dialog').close();
  $('source-link').onclick=()=>{const url='https://rar.design/posts/pure-code-animation-claude-code-12-effects';if(bridge)native({type:'source'});else window.open(url,'_blank','noopener');};
  document.addEventListener('keydown',e=>{const editing=/INPUT|TEXTAREA|SELECT/.test(e.target.tagName),dialogOpen=!!document.querySelector('dialog[open]');if(e.code==='Space'&&!editing&&!dialogOpen&&!exporting){e.preventDefault();setPlaying(!playing);}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'&&!editing&&!dialogOpen){e.preventDefault();restoreHistory(e.shiftKey?1:-1);}if((e.metaKey||e.ctrlKey)&&e.key==='s'&&!dialogOpen){e.preventDefault();if(!exporting)$('save-project').click();}});
  window.addEventListener('resize',resizePreview);
  window.addEventListener('error',e=>{console.error(e.error||e.message);notify('畫面發生錯誤，請重新開啟 App。');});
  async function boot(){try{let saved;if(bridge)saved=(await native({type:'loadAutosave'})).data;else saved=localStorage.getItem('motion-workshop-project');if(saved)project=validate(JSON.parse(saved));}catch(e){notify('先前專案無法載入，已建立新專案。');}if(bridge)try{const prefs=await native({type:'loadPreferences'});if(Array.isArray(prefs.favorites))favorites=new Set(prefs.favorites.filter(id=>E.definitions.some(e=>e.id===id)));}catch{notify('收藏設定暫時無法載入。');}try{await window.MotionLayers.prepare(project);}catch(e){notify(e.message);}remember();updateAll();setPlaying(playing);requestAnimationFrame(animate);}
  // A deterministic renderer check used by the native build verification mode.
  window.workshopSelfTest=async()=>{
    await ready;
    setPlaying(false);const out=document.createElement('canvas');out.width=640;out.height=360;const results=[];
    for(const e of E.definitions){const o=defaultClip(e.id);E.render(out.getContext('2d'),640,360,.35,o);const first=out.toDataURL();E.render(out.getContext('2d'),640,360,.35,o);if(first!==out.toDataURL())throw new Error('非固定影格：'+e.id);E.render(out.getContext('2d'),640,360,1.2,o);if(first===out.toDataURL())throw new Error('效果沒有移動：'+e.id);results.push(e.id);await native({type:'testImage',name:e.id+'.png',data:out.toDataURL().split(',')[1]});}
    const gl=E.getDiagnostics();if(!gl.webgl)throw new Error('WebGL 未啟用：'+gl.error);
    const shape=window.MotionLayers.defaultLayer('rect');shape.end=2;shape.width=20;shape.height=20;shape.keyframes=[{time:0,...shape.transform,x:20,easing:'linear'},{time:2,...shape.transform,x:80,easing:'linear'}];
    const logo=document.createElement('canvas');logo.width=16;logo.height=16;logo.getContext('2d').fillStyle='#a59bff';logo.getContext('2d').fillRect(0,0,16,16);
    const image=window.MotionLayers.defaultLayer('image');image.image=logo.toDataURL();image.width=10;image.height=10;image.end=2;image.transform.x=80;image.transform.y=80;
    const advanced=validate({version:2,fps:30,clips:[{...defaultClip('bounce'),duration:2,base:{visible:false},layers:[shape,image],audio:[{sound:'confirm',time:.3,volume:.7,rate:1,fadeIn:0,fadeOut:.05},{sound:'click',time:1.3,volume:.7,rate:1,fadeIn:0,fadeOut:0}]}]});
    await window.MotionLayers.prepare(advanced);Engine.render(advanced,1,out);const pixel=out.getContext('2d').getImageData(320,180,1,1).data;if(pixel[0]!==216||pixel[1]!==243||pixel[2]!==106)throw new Error('圖層合成畫素錯誤。');
    const imagePixel=out.getContext('2d').getImageData(512,288,1,1).data;if(imagePixel[0]!==165||imagePixel[1]!==155||imagePixel[2]!==255)throw new Error('內嵌圖片未繪製。');
    const advancedFrame=out.toDataURL();Engine.render(advanced,.4,out);Engine.render(advanced,1,out);if(out.toDataURL()!==advancedFrame)throw new Error('關鍵格倒退定位不穩定。');
    await native({type:'testImage',name:'layers-and-image.png',data:advancedFrame.split(',')[1]});
    await native({type:'beginTestVideo',width:640,height:360,fps:30,frames:60});
    for(let i=0;i<60;i++){Engine.render(advanced,i/30,out);await native({type:'videoFrame',index:i,data:out.toDataURL('image/png').split(',')[1]});}
    const audio=await window.MotionAudio.exportBase64(advanced);if(!audio)throw new Error('音效混音未產生。');await native({type:'finishVideo',audio});
    const transitions=[];
    for(const type of Engine.transitionTypes){
      const p=validate({version:2,ratio:'16:9',fps:30,quality:720,clips:[{...defaultClip('type'),duration:2,transition:{type,duration:.6}},{...defaultClip('card-flyin'),duration:2}]});
      const rows=Engine.timeline(p),expected=type==='cut'?4:3.4;if(Math.abs(Engine.duration(p)-expected)>.001)throw new Error('轉場長度錯誤：'+type);
      const sample=rows[1].start+(type==='cut'?.01:.3);Engine.render(p,sample,out);const image=out.toDataURL();Engine.render(p,sample,out);if(image!==out.toDataURL())throw new Error('轉場不穩定：'+type);
      const ref=document.createElement('canvas');ref.width=640;ref.height=360;
      Engine.render(p,rows[1].start,out);if(type==='cut')E.render(ref.getContext('2d'),640,360,0,p.clips[1]);else E.render(ref.getContext('2d'),640,360,rows[1].start,p.clips[0]);
      if(out.toDataURL()!==ref.toDataURL())throw new Error('轉場起點不連續：'+type);
      Engine.render(p,rows[0].end,out);E.render(ref.getContext('2d'),640,360,rows[0].end-rows[1].start,p.clips[1]);
      if(out.toDataURL()!==ref.toDataURL())throw new Error('轉場終點不連續：'+type);
      await native({type:'testImage',name:'transition-'+type+'.png',data:image.split(',')[1]});transitions.push(type);
    }
    return {effects:results,transitions,deterministic:true,animated:true,webgl:gl.webgl,videoFrames:60,customLayers:true,embeddedImage:true,keyframeSeeking:true,audioCues:2};
  };
  window.workshopRenderBatch=async raw=>{
    await ready;
    project=validate(typeof raw==='string'?JSON.parse(raw):raw);selected=0;time=0;setPlaying(false);updateAll();exportUI(true);$('cancel-export').hidden=true;$('export-status').textContent='正在自動產生影片…';
    const out=document.createElement('canvas');[out.width,out.height]=frameSize(project.quality);const frames=Math.round(total()*project.fps);
    await window.MotionLayers.prepare(project);await native({type:'beginBatchVideo',width:out.width,height:out.height,fps:project.fps,frames});
    for(let i=0;i<frames;i++){renderAt(i/project.fps,out);await native({type:'videoFrame',index:i,data:out.toDataURL('image/png').split(',')[1]});if(i%15===0){$('export-video').textContent=`自動匯出 ${Math.round((i+1)/frames*100)}%`;$('export-progress').firstElementChild.style.width=((i+1)/frames*100)+'%';await new Promise(r=>setTimeout(r,0));}}
    const audio=await window.MotionAudio.exportBase64(project);const result=await native({type:'finishVideo',audio});return {audioCues:window.MotionAudio.events(project).length,name:result.name,width:out.width,height:out.height,fps:project.fps,frames,duration:frames/project.fps,effects:project.clips.map(c=>c.effect),timeline:Engine.timeline(project)};
  };
  window.workshopProject=()=>JSON.parse(JSON.stringify(project));
  window.workshopQueueStatus=busy=>{$('export-video').disabled=busy;if(busy)$('export-status').textContent='Claude 正在背景產片，你可以繼續編輯。';else $('export-status').textContent='Claude 影片已處理完成。';};
  window.WorkshopEditor={
    get project(){return project;},get selected(){return selected;},get time(){return time;},get playing(){return playing;},get exporting(){return exporting;},
    notify,applyEffect,native:bridge?native:null,
    pause(){setPlaying(false);},seek(t){setPlaying(false);time=Math.max(0,Math.min(total(),t));$('scrubber').value=time;renderAt(time);},
    change(){saveSoon();renderClips();},refresh(){updateInspector();renderAt(time);},
    insert(clip){if(project.clips.length>=24){notify('一個專案最多 24 個場景。');return false;}project.clips.splice(selected+1,0,clip);selected++;time=startOf(selected);setPlaying(false);saveSoon();updateAll();return true;}
  };
  if(bridge)window.MotionAudio.setLoader(async file=>{const result=await native({type:'loadSound',file});const raw=atob(result.data);return Uint8Array.from(raw,c=>c.charCodeAt(0)).buffer;});
  const ready=boot();
})();
