(() => {
  'use strict';
  const $ = id => document.getElementById(id), E = window.MotionEffects, Engine=window.MotionProject;
  const bridge = window.webkit?.messageHandlers?.workshop;
  const native = message => bridge.postMessage(message);
  const palettes = [['#d8f36a','#a59bff','#10171c'],['#ff805a','#78b7ff','#151b26'],['#f394be','#80dbc4','#172329'],['#ede5d7','#c1a35b','#232320']];
  const defaultClip = Engine.defaultClip;
  let project={version:2,ratio:'16:9',quality:720,fps:30,clips:[defaultClip()]};
  let selected=0,playing=true,loop=true,time=0,lastTime=0,filter='全部',saveTimer,toastTimer,exporting=false,cancelled=false,dirty=false;
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
  function renderAt(t,target=canvas){return Engine.render(project,t,target);}
  function saveSoon(){dirty=true;$('save-state').textContent='正在儲存…';clearTimeout(saveTimer);saveTimer=setTimeout(async()=>{try{const data=JSON.stringify(project);if(bridge)await native({type:'autosave',data});else localStorage.setItem('motion-workshop-project',data);dirty=false;$('save-state').textContent='已自動儲存';}catch(e){$('save-state').textContent='自動儲存失敗，請儲存專案';}},350);}
  const validate=Engine.validate;
  function resizePreview(){
    const [w,h]=frameSize(540);canvas.width=w;canvas.height=h;
    const stage=$('stage'),area=$('stage').parentElement,availableW=area.clientWidth-(innerWidth<1100?40:60),availableH=area.clientHeight-66;
    const ratio=w/h,sw=Math.min(availableW,availableH*ratio);stage.style.width=Math.max(100,sw)+'px';stage.style.height=Math.max(100,sw/ratio)+'px';stage.style.aspectRatio=String(ratio);
    const [ew,eh]=frameSize(project.quality);$('dimensions').textContent=`${ew} × ${eh}`;$('preview-format').textContent=project.ratio+({'16:9':' 橫式','9:16':' 直式','1:1':' 方形'}[project.ratio]);renderAt(time);
  }
  function renderLibrary(){
    $('effect-list').replaceChildren();
    for(const effect of E.definitions){if(filter!=='全部'&&effect.category!==filter)continue;const search=$('effect-search').value.trim().toLowerCase();if(search&&!`${effect.name} ${effect.id} ${effect.description}`.toLowerCase().includes(search))continue;
      const button=document.createElement('button');button.className='effect-card'+(current().effect===effect.id?' active':'');button.dataset.effect=effect.id;button.setAttribute('aria-label',`套用${effect.name}`);button.setAttribute('aria-pressed',String(current().effect===effect.id));
      const thumb=document.createElement('canvas');thumb.width=176;thumb.height=112;const name=document.createElement('span');name.className='card-name';
      const idx=document.createElement('span');idx.className='card-index';idx.textContent=String(E.definitions.indexOf(effect)+1).padStart(2,'0');name.append(idx,document.createTextNode(effect.name));button.append(thumb,name);
      const opt={...defaultClip(effect.id),text:['type','mask-reveal','kinetic-zoom','typewriter','glass-card'].includes(effect.id)?'動起來':'',subtitle:'',size:1,amount:25};
      E.render(thumb.getContext('2d'),176,112,1.65,opt);
      button.addEventListener('click',()=>{if(exporting)return;current().effect=effect.id;time=startOf(selected);updateInspector();renderLibrary();renderClips();saveSoon();renderAt(time);});$('effect-list').append(button);
    }
  }
  function renderClips(){
    $('clips').replaceChildren();project.clips.forEach((clip,i)=>{
      const b=document.createElement('button'),d=definition(clip.effect);b.className='clip'+(i===selected?' active':'');b.style.setProperty('--clip-color',clip.color);b.setAttribute('aria-label',`選取場景 ${i+1}：${d.name}`);b.setAttribute('aria-pressed',String(i===selected));
      const icon=document.createElement('span');icon.className='clip-icon';icon.textContent=d.icon;const info=document.createElement('div'),name=document.createElement('strong'),sub=document.createElement('small');name.textContent=`${String(i+1).padStart(2,'0')} ${d.name}`;sub.textContent=`${clip.duration} 秒 · ${clip.text.replace(/\n/g,' ').slice(0,10)||'無文字'}`;info.append(name,sub);if(i<project.clips.length-1){const tr=document.createElement('span');tr.className='transition-chip';const row=Engine.timeline(project)[i];tr.textContent=`↔ ${Engine.transitionNames[row.transition]}${row.overlap?' '+Number(row.overlap.toFixed(2))+'s':''}`;info.append(tr);}b.append(icon,info);
      b.addEventListener('click',()=>{if(exporting)return;selected=i;time=startOf(i);updateInspector();renderLibrary();renderClips();renderAt(time);});$('clips').append(b);
    });
    $('total-duration').textContent=`${project.clips.length} 個場景 · ${Number(total().toFixed(2))} 秒`;$('scrubber').max=total();$('remove').disabled=project.clips.length===1;$('move-left').disabled=selected===0;$('move-right').disabled=selected===project.clips.length-1;
  }
  function updateInspector(){
    const o=current();$('scene-name').textContent=definition(o.effect).name;$('scene-count').textContent=`場景 ${String(selected+1).padStart(2,'0')}`;$('effect-description').textContent=definition(o.effect).description;
    for(const [id,key] of [['title-text','text'],['subtitle-text','subtitle'],['primary-color','color'],['secondary-color','secondary'],['background-color','background'],['speed','speed'],['size','size'],['amount','amount'],['duration','duration']])$(id).value=o[key];
    $('speed-value').textContent=o.speed.toFixed(1)+'×';$('size-value').textContent=Math.round(o.size*100)+'%';$('amount-value').textContent=o.amount;
    $('ratio').value=project.ratio;$('quality').value=project.quality;$('fps').value=project.fps;
    $('amount').disabled=!['particles','reaction','halftone','physics'].includes(o.effect);
    $('size').disabled=['rhythm','glass','tunnel'].includes(o.effect);
    const withItems=['text-morph','card-flyin','card-flip','orbit-cards','bento-grid','chart-build','path-draw','phone-scroll','tab-indicator','cursor-click','beat-sync'].includes(o.effect);
    $('template-data').hidden=!withItems&&!['number-roll','beat-sync'].includes(o.effect);$('labels-fields').hidden=!withItems;$('chart-fields').hidden=o.effect!=='chart-build';$('number-fields').hidden=o.effect!=='number-roll';$('beat-fields').hidden=o.effect!=='beat-sync';
    $('item-labels').value=o.items.join(',');$('chart-values').value=o.values.join(',');$('target-value').value=o.value;$('value-suffix').value=o.suffix;$('bpm').value=o.bpm;
    const last=selected===project.clips.length-1;$('transition-type').value=o.transition.type;$('transition-duration').value=String(o.transition.duration);$('transition-type').disabled=last;$('transition-duration').disabled=last||o.transition.type==='cut';$('preview-transition').disabled=last;
    $('transition-note').textContent=last?'這是最後一幕。新增下一幕後即可設定轉場。':`兩幕會重疊 ${Number(Engine.timeline(project)[selected].overlap.toFixed(2))} 秒，動畫持續播放。`;
  }
  function updateAll(){$('effect-count').textContent=E.definitions.length;updateInspector();renderLibrary();renderClips();resizePreview();}
  function setPlaying(value){playing=value;$('play').textContent=playing?'Ⅱ':'▶';$('play').setAttribute('aria-label',playing?'暫停':'播放');}
  function animate(timestamp){
    if(!lastTime)lastTime=timestamp;const dt=Math.min(.1,(timestamp-lastTime)/1000);lastTime=timestamp;
    if(!exporting){if(playing){time+=dt;if(time>=total()){if(loop)time%=total();else{time=total();setPlaying(false);}}}renderAt(time);$('scrubber').value=time;$('timecode').innerHTML=`${tc(time)} <em>/ ${tc(total())}</em>`;}
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
  $('claude-kit').onclick=async()=>{if(bridge){try{await native({type:'toolkit'});notify('已在 Finder 開啟 Claude 工具包。先閱讀 CLAUDE.md 即可使用。');}catch(e){notify(e.message);}}else notify('工具包位於 App 的 Resources/Claude-動畫工具包，可交給 Claude Code 讀取。');};
  document.querySelectorAll('[data-palette]').forEach(b=>b.addEventListener('click',()=>{[current().color,current().secondary,current().background]=palettes[Number(b.dataset.palette)];updateInspector();renderLibrary();renderClips();saveSoon();}));
  $('play').onclick=()=>setPlaying(!playing);$('restart').onclick=()=>{time=0;renderAt(time);};$('scrubber').oninput=()=>{setPlaying(false);time=Number($('scrubber').value);renderAt(time);};
  $('loop').onclick=()=>{loop=!loop;$('loop').classList.toggle('active',loop);$('loop').setAttribute('aria-pressed',String(loop));};
  $('safe-area').onclick=()=>{$('safe-overlay').hidden=!$('safe-overlay').hidden;$('safe-area').setAttribute('aria-pressed',String(!$('safe-overlay').hidden));};
  function add(duplicate){if(project.clips.length>=24){notify('一個專案最多 24 個場景。');return;}project.clips.splice(selected+1,0,duplicate?{...current()}:defaultClip());selected++;time=startOf(selected);updateAll();saveSoon();}
  $('add-scene').onclick=()=>add(false);$('duplicate').onclick=()=>add(true);
  $('remove').onclick=()=>{if(project.clips.length<2)return;project.clips.splice(selected,1);selected=Math.min(selected,project.clips.length-1);time=startOf(selected);updateAll();saveSoon();};
  function move(delta){const next=selected+delta;if(next<0||next>=project.clips.length)return;[project.clips[selected],project.clips[next]]=[project.clips[next],project.clips[selected]];selected=next;time=startOf(selected);updateAll();saveSoon();}
  $('move-left').onclick=()=>move(-1);$('move-right').onclick=()=>move(1);
  function download(data,name,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);}
  $('save-project').onclick=async()=>{try{const data=JSON.stringify(project,null,2);if(bridge){const result=await native({type:'save',kind:'json',name:'我的動畫.motion.json',data});if(result.cancelled)return;}else download(data,'我的動畫.motion.json','application/json');notify('專案已儲存，之後可以重新開啟編輯。');}catch(e){notify('儲存失敗：'+e.message);}};
  async function loadData(data){const next=validate(JSON.parse(data));project=next;selected=0;time=0;updateAll();saveSoon();notify('專案已開啟。');}
  $('open-project').onclick=async()=>{try{if(bridge){const result=await native({type:'openProject'});if(!result.cancelled)await loadData(result.data);}else $('project-file').click();}catch(e){notify('開啟失敗：'+e.message);}};
  $('project-file').onchange=async e=>{try{if(e.target.files[0])await loadData(await e.target.files[0].text());}catch(e){notify(e.message);}finally{e.target.value='';}};
  $('export-png').onclick=async()=>{try{const out=document.createElement('canvas');[out.width,out.height]=frameSize(project.quality);renderAt(time,out);const data=out.toDataURL('image/png').split(',')[1];if(bridge){const r=await native({type:'save',kind:'png',name:'我的動畫.png',data});if(r.cancelled)return;}else download(Uint8Array.from(atob(data),c=>c.charCodeAt(0)),'我的動畫.png','image/png');notify('目前畫面已儲存為 PNG。');}catch(e){notify('匯出失敗：'+e.message);}};
  function exportUI(active){
    exporting=active;document.querySelectorAll('button,input,textarea,select').forEach(el=>{if(el.id!=='cancel-export')el.disabled=active;});
    $('cancel-export').hidden=!active;$('export-progress').hidden=!active;
    if(!active){updateInspector();renderClips();$('export-video').textContent='匯出 MP4 ↗';}
  }
  $('cancel-export').onclick=()=>{cancelled=true;$('cancel-export').disabled=true;$('export-status').textContent='正在取消…';};
  $('export-video').onclick=async()=>{
    if(!bridge){notify('請使用電腦上的「動畫小工坊」App 匯出 MP4。');return;}
    const wasPlaying=playing,oldTime=time;setPlaying(false);cancelled=false;
    const out=document.createElement('canvas');[out.width,out.height]=frameSize(project.quality);const frames=Math.round(total()*project.fps);
    exportUI(true);$('cancel-export').disabled=false;$('export-status').textContent='選擇影片儲存位置…';
    try{
      const begin=await native({type:'beginVideo',width:out.width,height:out.height,fps:project.fps,frames,name:'我的動畫.mp4'});if(begin.cancelled)return;
      for(let i=0;i<frames;i++){
        if(cancelled){await native({type:'cancelVideo'});notify('已取消匯出。');return;}
        renderAt(i/project.fps,out);const data=out.toDataURL('image/png').split(',')[1];await native({type:'videoFrame',index:i,data});
        const percent=Math.round((i+1)/frames*100);$('export-progress').firstElementChild.style.width=percent+'%';$('export-video').textContent=`正在匯出 ${percent}%`;$('export-status').textContent=`${i+1} / ${frames} 格 · 請保持 App 開啟`;
        if(i%3===0){ctx.drawImage(out,0,0,canvas.width,canvas.height);await new Promise(r=>setTimeout(r,0));}
      }
      $('export-status').textContent='正在完成 MP4…';const result=await native({type:'finishVideo'});notify('MP4 已儲存完成。');$('export-status').textContent='影片已儲存 · '+result.name;
    }catch(e){await native({type:'cancelVideo'}).catch(()=>{});notify('匯出失敗：'+e.message);$('export-status').textContent='匯出失敗，可重新再試。';}
    finally{exportUI(false);time=oldTime;setPlaying(wasPlaying);renderAt(time);if($('export-status').textContent.includes('格')||$('export-status').textContent.includes('選擇')||cancelled)$('export-status').textContent='選效果 → 調整 → 匯出';}
  };
  $('help').onclick=()=>$('help-dialog').showModal();$('close-help').onclick=()=>$('help-dialog').close();
  $('source-link').onclick=()=>{const url='https://rar.design/posts/pure-code-animation-claude-code-12-effects';if(bridge)native({type:'source'});else window.open(url,'_blank','noopener');};
  document.addEventListener('keydown',e=>{if(e.code==='Space'&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&!$('help-dialog').open&&!exporting){e.preventDefault();setPlaying(!playing);}if((e.metaKey||e.ctrlKey)&&e.key==='s'){e.preventDefault();if(!exporting)$('save-project').click();}});
  window.addEventListener('resize',resizePreview);
  window.addEventListener('error',e=>{console.error(e.error||e.message);notify('畫面發生錯誤，請重新開啟 App。');});
  async function boot(){try{let saved;if(bridge)saved=(await native({type:'loadAutosave'})).data;else saved=localStorage.getItem('motion-workshop-project');if(saved)project=validate(JSON.parse(saved));}catch(e){notify('先前專案無法載入，已建立新專案。');}updateAll();requestAnimationFrame(animate);}
  // A deterministic renderer check used by the native build verification mode.
  window.workshopSelfTest=async()=>{
    setPlaying(false);const out=document.createElement('canvas');out.width=640;out.height=360;const results=[];
    for(const e of E.definitions){const o=defaultClip(e.id);E.render(out.getContext('2d'),640,360,.35,o);const first=out.toDataURL();E.render(out.getContext('2d'),640,360,.35,o);if(first!==out.toDataURL())throw new Error('非固定影格：'+e.id);E.render(out.getContext('2d'),640,360,1.2,o);if(first===out.toDataURL())throw new Error('效果沒有移動：'+e.id);results.push(e.id);await native({type:'testImage',name:e.id+'.png',data:out.toDataURL().split(',')[1]});}
    const gl=E.getDiagnostics();if(!gl.webgl)throw new Error('WebGL 未啟用：'+gl.error);
    await native({type:'beginTestVideo',width:640,height:360,fps:30,frames:60});
    for(let i=0;i<60;i++){E.render(out.getContext('2d'),640,360,i/30,defaultClip('bounce'));await native({type:'videoFrame',index:i,data:out.toDataURL('image/png').split(',')[1]});}
    await native({type:'finishVideo'});
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
    return {effects:results,transitions,deterministic:true,animated:true,webgl:gl.webgl,videoFrames:60};
  };
  window.workshopRenderBatch=async raw=>{
    project=validate(typeof raw==='string'?JSON.parse(raw):raw);selected=0;time=0;setPlaying(false);updateAll();exportUI(true);$('cancel-export').hidden=true;$('export-status').textContent='正在自動產生影片…';
    const out=document.createElement('canvas');[out.width,out.height]=frameSize(project.quality);const frames=Math.round(total()*project.fps);
    await native({type:'beginBatchVideo',width:out.width,height:out.height,fps:project.fps,frames});
    for(let i=0;i<frames;i++){renderAt(i/project.fps,out);await native({type:'videoFrame',index:i,data:out.toDataURL('image/png').split(',')[1]});if(i%15===0){$('export-video').textContent=`自動匯出 ${Math.round((i+1)/frames*100)}%`;$('export-progress').firstElementChild.style.width=((i+1)/frames*100)+'%';await new Promise(r=>setTimeout(r,0));}}
    const result=await native({type:'finishVideo'});return {name:result.name,width:out.width,height:out.height,fps:project.fps,frames,duration:frames/project.fps,effects:project.clips.map(c=>c.effect),timeline:Engine.timeline(project)};
  };
  window.workshopProject=()=>JSON.parse(JSON.stringify(project));
  window.workshopQueueStatus=busy=>{$('export-video').disabled=busy;if(busy)$('export-status').textContent='Claude 正在背景產片，你可以繼續編輯。';else $('export-status').textContent='Claude 影片已處理完成。';};
  boot();
})();
