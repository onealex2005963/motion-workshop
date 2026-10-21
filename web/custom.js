/* Native/browser editor controls for layers, keyframes and local sounds. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),ed=window.WorkshopEditor,L=window.MotionLayers,P=window.MotionProject,A=window.MotionAudio;
  let tab='template',chosen=-1,scene=-1,selection=new Set(),drag,layerSort,sortFrame=0,suppressSortClick=false,preview=false,player,playerKey='',generation=0,refreshTimer;
  const clip=()=>ed.project.clips[ed.selected];
  const local=()=>Math.max(0,Math.min(clip().duration,ed.time-P.timeline(ed.project)[ed.selected].start));
  const frameTime=()=>Math.round(local()*ed.project.fps)/ed.project.fps;
  const layer=()=>clip().layers?.[chosen];
  const clone=v=>JSON.parse(JSON.stringify(v));
  const round=n=>Number(n.toFixed(3));
  const activeKey=()=>[...(layer()?.keyframes||[]),...Object.values(layer()?.tracks||{}).flat()].find(k=>Math.abs(k.time-frameTime())<.5/ed.project.fps);
  function commit(){ed.change();refresh();}
  function select(index,extend=false){chosen=index;if(extend){if(selection.has(index))selection.delete(index);else selection.add(index);if(!selection.has(chosen))chosen=[...selection].at(-1)??-1;}else selection=new Set(index>=0?[index]:[]);ed.pause();refresh();document.dispatchEvent(new CustomEvent('workshop-layer-selection'));}
  const selectedIndices=()=>[...selection].filter(i=>clip().layers[i]&&!clip().layers[i].locked);
  function editLayer(item,values,key=false){L.edit(item,frameTime(),values,{key:key||!!document.getElementById('auto-key')?.checked,duration:clip().duration,fps:ed.project.fps,easing:$('keyframe-easing').value,curve:window.WorkshopStudio?.curve?.()});}
  function setTab(value){
    if(layerSort)finishLayerSort(false);
    tab=value;for(const b of document.querySelectorAll('[data-inspector-tab]')){const active=b.dataset.inspectorTab===tab;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;}
    for(const id of ['template','layers','audio'])$(id+'-panel').hidden=id!==tab;
    if(tab==='layers'){ed.pause();const row=P.timeline(ed.project)[ed.selected];if(ed.time<row.start||ed.time>=row.end)ed.seek(row.start);}
    refresh();document.dispatchEvent(new CustomEvent('workshop-layer-selection'));
  }
  document.querySelectorAll('[data-inspector-tab]').forEach(b=>{b.onclick=()=>setTab(b.dataset.inspectorTab);b.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=[...document.querySelectorAll('[data-inspector-tab]')],index=tabs.indexOf(b),next=e.key==='Home'?0:e.key==='End'?2:(index+(e.key==='ArrowRight'?1:2))%3;tabs[next].click();tabs[next].focus();};});
  function refreshLayers(){
    const o=clip();o.layers??=[];o.base??={visible:true,...L.transform()};
    const focusClass=$('layer-list').contains(document.activeElement)?(document.activeElement.classList.contains('layer-handle')?'layer-handle':document.activeElement.classList.contains('layer-pick')?'layer-pick':null):null;
    if(scene!==ed.selected){scene=ed.selected;chosen=o.layers.length-1;selection=new Set(chosen>=0?[chosen]:[]);}if(chosen>=o.layers.length)chosen=o.layers.length-1;selection=new Set([...selection].filter(i=>i<o.layers.length));if(chosen>=0&&!selection.size)selection.add(chosen);
    $('base-visible').checked=o.base.visible;for(const key of L.properties)$('base-'+key).value=o.base[key];
    $('layer-list').replaceChildren();
    // Project arrays remain back-to-front; the editor shows the frontmost layer first.
    o.layers.map((item,index)=>({item,index})).reverse().forEach(({item,index})=>{
      const row=document.createElement('div');row.className='layer-row'+(selection.has(index)?' selected':'');row.dataset.index=index;row.setAttribute('role','listitem');
      const handle=document.createElement('button');handle.className='layer-handle';handle.textContent='⠿';handle.setAttribute('aria-label','拖曳排序：'+item.name);handle.setAttribute('aria-describedby','layer-order-hint');handle.title='拖曳調整上下層；Option / Alt + ↑ ↓ 也可移動';handle.onclick=()=>{select(index);focusLayerHandle();};
      const pick=document.createElement('button');pick.className='layer-pick';pick.textContent=`${o.layers.length-index}. ${item.name}`;pick.title=L.types[item.type];pick.setAttribute('aria-pressed',String(index===chosen));pick.onclick=e=>{select(index,e.shiftKey||e.metaKey);focusLayerHandle();};
      for(const button of [handle,pick])button.onkeydown=e=>{if(!e.altKey||!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();e.stopPropagation();chosen=index;reorder(e.key==='ArrowUp'?1:-1,true);};
      const visible=document.createElement('button');visible.textContent=item.visible?'◉':'○';visible.setAttribute('aria-label',(item.visible?'隱藏':'顯示')+item.name);visible.setAttribute('aria-pressed',String(item.visible));visible.onclick=()=>{item.visible=!item.visible;commit();};
      const lock=document.createElement('button');lock.textContent=item.locked?'鎖':'編';lock.setAttribute('aria-label',(item.locked?'解鎖':'鎖定')+item.name);lock.setAttribute('aria-pressed',String(item.locked));lock.onclick=()=>{item.locked=!item.locked;commit();};row.append(handle,pick,visible,lock);$('layer-list').append(row);
    });
    if(!o.layers.length){const text=document.createElement('p');text.className='muted';text.textContent='還沒有圖層。加入文字、圖形或自己的圖片。';$('layer-list').append(text);}
    if(focusClass)$('layer-list').querySelector(`[data-index="${chosen}"] .${focusClass}`)?.focus({preventScroll:true});
    const item=layer();$('layer-properties').hidden=!item;
    $('layer-down').disabled=chosen<=0;$('layer-up').disabled=chosen<0||chosen>=o.layers.length-1;for(const id of ['layer-copy','layer-delete'])$(id).disabled=!item;
    $('add-layer').disabled=o.layers.length>=L.maxLayers;$('import-image').disabled=o.layers.length>=12;
    if(!item)return;
    for(const key of ['name','text','fill','stroke','strokeWidth','width','height','radius','fontSize','fontFamily','weight','align','blend','start','end'])$('layer-'+key).value=item[key];
    $('layer-text-label').hidden=item.type!=='text';$('layer-fonts').hidden=item.type!=='text';
    for(const control of $('layer-properties').querySelectorAll('input,select,textarea,button'))control.disabled=item.locked||ed.exporting;
    refreshTime();
  }
  function refreshTime(){
    const t=frameTime(),item=layer();$('sound-playhead').textContent=`場景 ${ed.selected+1} · 目前 ${round(t)} 秒`;
    if(!item){$('layer-selection').hidden=true;return;}
    const m=L.sample(item,t),key=activeKey();
    for(const property of L.properties){const input=$('layer-'+property);if(document.activeElement!==input)input.value=round(m[property]);}
    if(document.activeElement!==$('layer-seek'))$('layer-seek').value=round(t);$('layer-seek').max=clip().duration;
    $('layer-local-time').textContent=`場景 ${ed.selected+1} · ${round(t)} / ${round(clip().duration)} 秒 · ${Math.round(t*ed.project.fps)} 格`;
    $('remove-keyframe').disabled=!key||item.locked||ed.exporting;
    if(key&&document.activeElement!==$('keyframe-easing'))$('keyframe-easing').value=key.easing;
    $('keyframe-note').textContent=item.locked?'圖層已鎖定，先在圖層清單解鎖。':item.keyframes.length||Object.values(item.tracks||{}).some(a=>a.length)?'屬性可獨立設關鍵格；下方多軌時間軸可拖曳調整。':'目前是靜態圖層。記錄起點，移動時間後調整位置，建立下一格。';
    const track=$('keyframe-track'),times=[...new Set([...(item.keyframes||[]),...Object.values(item.tracks||{}).flat()].map(k=>k.time))].sort((a,b)=>a-b),signature=JSON.stringify([scene,chosen,times]);if(track.dataset.signature!==signature){track.dataset.signature=signature;track.replaceChildren();for(const time of times){const button=document.createElement('button');button.className='key-marker';button.style.left=(time/clip().duration*100)+'%';button.dataset.time=time;button.textContent='◆';button.setAttribute('aria-label','移到 '+round(time)+' 秒的關鍵影格');button.onclick=()=>ed.seek(P.timeline(ed.project)[ed.selected].start+time);track.append(button);}}for(const button of track.children)button.classList.toggle('active',Math.abs(parseFloat(button.dataset.time)-t)<.5/ed.project.fps);
    track.style.setProperty('--playhead',(t/clip().duration*100)+'%');
    const state=P.locate(ed.project,ed.time),box=$('layer-selection');box.hidden=tab!=='layers'||!item.visible||t<item.start||t>item.end||state.index!==ed.selected||!!state.previous;
    box.style.left=m.x+'%';box.style.top=m.y+'%';box.style.width=(m.width*m.scale*m.scaleX)+'%';box.style.height=(Math.max(m.height,item.type==='text'?item.fontSize*1.5:1)*m.scale*m.scaleY)+'%';box.style.transformOrigin=`${item.anchorX??50}% ${item.anchorY??50}%`;box.style.transform=`translate(-${item.anchorX??50}%,-${item.anchorY??50}%) rotate(${m.rotation}deg)`;box.classList.toggle('locked',item.locked);
  }
  function refreshAudio(){
    const audio=ed.project.audio||{enabled:true,volume:.8};$('audio-enabled').checked=audio.enabled;$('master-volume').value=audio.volume;$('master-volume-value').textContent=Math.round(audio.volume*100)+'%';
    $('sound-cues').replaceChildren();const cues=clip().audio||[];
    if(!cues.length){const p=document.createElement('p');p.className='muted';p.textContent='尚未放置音效。選擇音效並加入目前時間。';$('sound-cues').append(p);}
    cues.forEach((cue,index)=>{
      const card=document.createElement('div');card.className='cue-card';const top=document.createElement('div');top.className='cue-heading';const title=document.createElement('strong');title.textContent=`${index+1}. ${A.sounds.find(s=>s.id===cue.sound).name}`;
      const jump=document.createElement('button');jump.textContent='定位';jump.onclick=()=>ed.seek(P.timeline(ed.project)[ed.selected].start+cue.time);
      const del=document.createElement('button');del.textContent='×';del.setAttribute('aria-label','刪除音效 '+title.textContent);del.onclick=()=>{clip().audio.splice(index,1);commit();};top.append(title,jump,del);card.append(top);
      const grid=document.createElement('div');grid.className='two-fields';for(const [key,name,min,max,step] of [['time','開始秒數',0,clip().duration,1/ed.project.fps],['volume','音量倍數',0,2,.05],['rate','播放速率',.5,2,.05],['fadeIn','淡入秒數',0,2,.01],['fadeOut','淡出秒數',0,2,.01]]){
        const label=document.createElement('label');label.textContent=name;const input=document.createElement('input');input.type='number';input.min=min;input.max=max;input.step=step;input.value=round(cue[key]);input.setAttribute('aria-label',title.textContent+' '+name);input.onchange=()=>{cue[key]=Number(input.value);commit();};label.append(input);grid.append(label);
      }card.append(grid);$('sound-cues').append(card);
    });$('add-sound').disabled=cues.length>=12;
  }
  function refresh(){if(!ed.project||ed.exporting||layerSort)return;refreshLayers();refreshAudio();refreshTime();}
  for(const key of L.properties)$('base-'+key).onchange=()=>{ed.pause();clip().base[key]=Number($('base-'+key).value);commit();};
  $('base-visible').onchange=()=>{clip().base.visible=$('base-visible').checked;commit();};$('reset-base').onclick=()=>{clip().base={visible:true,...L.transform()};commit();};
  function addLayer(item){if((clip().layers||[]).length>=L.maxLayers){ed.notify('每幕最多 32 個圖層。');return;}clip().layers??=[];clip().layers.push(item);chosen=clip().layers.length-1;selection=new Set([chosen]);ed.pause();commit();}
  $('add-layer').onclick=()=>{const item=L.defaultLayer($('new-layer-type').value);item.end=clip().duration;item.fill=clip().color;addLayer(item);};
  $('layer-delete').onclick=()=>{if(!layer())return;clip().layers.splice(chosen,1);chosen--;selection=new Set(chosen>=0?[chosen]:[]);commit();};$('layer-copy').onclick=()=>{if(!layer())return;const copy=clone(layer());copy.name+=' 副本';addLayer(copy);};
  function focusLayerHandle(){const handle=$('layer-list').querySelector(`[data-index="${chosen}"] .layer-handle`);handle?.focus({preventScroll:true});}
  function announceOrder(){const item=layer();if(item)$('layer-order-status').textContent=`${item.name} 已移到第 ${clip().layers.length-chosen} 層，共 ${clip().layers.length} 層。上方圖層顯示在前方。`;}
  function moveLayer(from,to,keyboard=false){
    const items=clip().layers;if(to<0||to>=items.length||from===to)return;
    const [item]=items.splice(from,1);items.splice(to,0,item);chosen=to;selection=new Set([chosen]);commit();announceOrder();if(keyboard)focusLayerHandle();
  }
  function reorder(delta,keyboard=false){moveLayer(chosen,chosen+delta,keyboard);}
  $('layer-down').onclick=()=>reorder(-1);$('layer-up').onclick=()=>reorder(1);
  // Use pointer events so internal sorting also works in the offline WKWebView.
  const list=$('layer-list');
  list.addEventListener('click',e=>{if(suppressSortClick){e.preventDefault();e.stopImmediatePropagation();}},true);
  list.addEventListener('pointerdown',e=>{
    const button=e.target.closest('.layer-handle,.layer-pick'),row=button?.closest('.layer-row');
    if(!row||ed.exporting||e.button!==0||e.isPrimary===false||clip().layers.length<2)return;
    if(layerSort)finishLayerSort(false);
    layerSort={pointer:e.pointerId,from:Number(row.dataset.index),scene:ed.selected,project:ed.project,row,button,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,active:false};
    button.setPointerCapture(e.pointerId);
  });
  function updateLayerSort(){
    const s=layerSort;if(!s?.active)return;
    const bounds=list.getBoundingClientRect(),viewport=list.closest('.inspector-scroll').getBoundingClientRect();
    s.valid=s.x>=bounds.left-24&&s.x<=bounds.right+24&&s.y>=Math.max(viewport.top,bounds.top-24)&&s.y<=Math.min(viewport.bottom,bounds.bottom+24);
    const rows=[...list.querySelectorAll('.layer-row')].filter(row=>row!==s.row);
    let slot=0;for(const row of rows){const r=row.getBoundingClientRect();if(s.y>r.top+r.height/2)slot++;}
    s.to=clip().layers.length-1-slot;
    const edge=slot<rows.length?rows[slot].getBoundingClientRect().top:rows[rows.length-1].getBoundingClientRect().bottom;
    s.line.style.top=(edge-bounds.top+(slot<rows.length?-3:3))+'px';s.line.hidden=!s.valid;
    s.ghost.style.top=(s.y-s.offsetY)+'px';s.ghost.classList.toggle('invalid',!s.valid);
  }
  function scrollLayerSort(){
    const s=layerSort;if(!s?.active)return;
    const scroll=list.closest('.inspector-scroll'),r=scroll.getBoundingClientRect(),b=list.getBoundingClientRect();
    if(s.x>=b.left-24&&s.x<=b.right+24&&s.y>=r.top&&s.y<=r.bottom){
      const speed=s.y<r.top+45?-Math.ceil((r.top+45-s.y)/5):s.y>r.bottom-45?Math.ceil((s.y-r.bottom+45)/5):0;
      if(speed)scroll.scrollTop+=speed;
    }
    updateLayerSort();sortFrame=requestAnimationFrame(scrollLayerSort);
  }
  list.addEventListener('pointermove',e=>{
    const s=layerSort;if(!s||e.pointerId!==s.pointer)return;s.x=e.clientX;s.y=e.clientY;
    if(!s.active&&Math.hypot(s.x-s.startX,s.y-s.startY)>=5){
      s.active=true;ed.pause();chosen=s.from;
      const rect=s.row.getBoundingClientRect();s.offsetY=s.startY-rect.top;
      s.ghost=s.row.cloneNode(true);s.ghost.className='layer-row layer-sort-ghost';s.ghost.setAttribute('aria-hidden','true');
      for(const button of s.ghost.querySelectorAll('button')){button.disabled=true;button.tabIndex=-1;}
      s.ghost.style.left=rect.left+'px';s.ghost.style.width=rect.width+'px';document.body.append(s.ghost);
      s.line=document.createElement('div');s.line.className='layer-drop-line';s.line.setAttribute('aria-hidden','true');list.append(s.line);
      for(const row of list.querySelectorAll('.layer-row'))row.classList.toggle('selected',row===s.row);
      s.row.classList.add('sorting');document.body.classList.add('layer-sorting');scrollLayerSort();
    }
    if(s.active){e.preventDefault();updateLayerSort();}
  });
  function finishLayerSort(apply){
    const s=layerSort;if(!s)return;
    if(s.active)updateLayerSort();layerSort=null;cancelAnimationFrame(sortFrame);
    s.ghost?.remove();s.line?.remove();s.row.classList.remove('sorting');document.body.classList.remove('layer-sorting');
    if(s.button.hasPointerCapture(s.pointer))s.button.releasePointerCapture(s.pointer);
    if(!s.active)return;
    suppressSortClick=true;setTimeout(()=>{suppressSortClick=false;},0);
    if(apply&&s.valid&&s.scene===ed.selected&&s.project===ed.project&&s.to!==s.from)moveLayer(s.from,s.to);
    else refresh();
  }
  list.addEventListener('pointerup',e=>{if(e.pointerId===layerSort?.pointer)finishLayerSort(true);});
  list.addEventListener('pointercancel',()=>finishLayerSort(false));
  list.addEventListener('lostpointercapture',()=>finishLayerSort(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&layerSort){e.preventDefault();finishLayerSort(false);}},true);
  window.addEventListener('blur',()=>finishLayerSort(false));
  for(const key of ['name','text','fill','stroke','strokeWidth','width','height','radius','fontSize','fontFamily','weight','align','blend','start','end'])$('layer-'+key).onchange=()=>{if(!layer()||layer().locked)return;ed.pause();layer()[key]=['name','text','fill','stroke','fontFamily','align','blend'].includes(key)?$('layer-'+key).value:Number($('layer-'+key).value);commit();};
  function record(values){if(!layer()||layer().locked)return;const all=Object.keys(values).length?values:Object.fromEntries(L.properties.map(p=>[p,L.sample(layer(),frameTime())[p]]));editLayer(layer(),all,true);}
  for(const key of L.properties)$('layer-'+key).onchange=()=>{if(!layer()||layer().locked)return;ed.pause();editLayer(layer(),{[key]:Number($('layer-'+key).value)});commit();};
  $('add-keyframe').onclick=()=>{ed.pause();record({});commit();};$('remove-keyframe').onclick=()=>{if(!layer()||layer().locked)return;const t=frameTime();layer().keyframes=layer().keyframes.filter(k=>Math.abs(k.time-t)>.5/ed.project.fps);for(const keys of Object.values(layer().tracks||{}))for(let i=keys.length-1;i>=0;i--)if(Math.abs(keys[i].time-t)<.5/ed.project.fps)keys.splice(i,1);commit();};
  $('keyframe-easing').onchange=()=>{if(!layer()||layer().locked)return;for(const k of [...layer().keyframes,...Object.values(layer().tracks||{}).flat()])if(Math.abs(k.time-frameTime())<.5/ed.project.fps){k.easing=$('keyframe-easing').value;if(k.easing==='cubic')k.curve=window.WorkshopStudio.curve();}commit();};
  $('layer-seek-go').onclick=()=>ed.seek(P.timeline(ed.project)[ed.selected].start+Number($('layer-seek').value));
  $('layer-seek').onkeydown=e=>{if(e.key==='Enter')$('layer-seek-go').click();};
  $('clear-keyframes').onclick=()=>{if(!layer())return;const pose=L.sample(layer(),frameTime());layer().transform=L.transform(pose);for(const p of L.animatedProperties.filter(p=>!L.properties.includes(p)))layer()[p]=pose[p];layer().keyframes=[];layer().tracks={};layer().motions=[];commit();};
  $('apply-motion').onclick=()=>window.WorkshopStudio.addMotion($('motion-preset').value);
  $('import-image').onclick=()=>$('image-file').click();$('image-file').onchange=async e=>{
    const file=e.target.files[0];e.target.value='';if(!file)return;
    try{
      if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>20000000)throw new Error('請選擇 20 MB 以內的 PNG、JPEG 或 WebP。');
      const url=URL.createObjectURL(file),image=new Image();try{image.src=url;await image.decode();const canvas=document.createElement('canvas'),scale=Math.min(1,1200/Math.max(image.width,image.height));canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
        let data=canvas.toDataURL(file.type==='image/jpeg'?'image/jpeg':'image/png',.9);if(data.length>2000000)throw new Error('圖片壓縮後仍過大，請先縮小圖片再匯入。');if(JSON.stringify(ed.project).length+data.length>18000000)throw new Error('專案圖片已接近容量上限，請先移除未使用圖片。');
        const item=L.defaultLayer('image');item.name=file.name.slice(0,40);item.image=data;item.width=40;const ratio=$('preview').width/$('preview').height;item.height=Math.min(160,40*ratio*image.height/image.width);item.end=clip().duration;addLayer(item);await L.prepare(ed.project);ed.refresh();
      }finally{URL.revokeObjectURL(url);}
    }catch(error){ed.notify(error.message);}
  };
  const canvas=$('preview');canvas.addEventListener('pointerdown',e=>{
    if(tab!=='layers'||ed.exporting||P.locate(ed.project,ed.time).previous||e.button!==0)return;
    ed.pause();const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*100,y=(e.clientY-rect.top)/rect.height*100,items=clip().layers||[];let index=-1;for(let i=items.length-1;i>=0;i--)if(L.hitTest(items[i],frameTime(),x,y,rect.width/rect.height)){index=i;break;}
    if(e.shiftKey||e.metaKey){select(index,true);return;}if(index<0){select(-1);return;}if(!selection.has(index))select(index);else{chosen=index;refresh();}
    drag={x,y,rect,items:selectedIndices().map(i=>({index:i,pose:L.sample(items[i],frameTime()),before:clone(items[i])})),pointer:e.pointerId,moved:false};canvas.setPointerCapture(e.pointerId);e.preventDefault();
  });
  canvas.addEventListener('pointermove',e=>{if(!drag||drag.pointer!==e.pointerId)return;const dx=(e.clientX-drag.rect.left)/drag.rect.width*100-drag.x,dy=(e.clientY-drag.rect.top)/drag.rect.height*100-drag.y;drag.moved=true;
    for(const part of drag.items){const item=clip().layers[part.index];editLayer(item,{x:Math.max(-100,Math.min(200,part.pose.x+dx)),y:Math.max(-100,Math.min(200,part.pose.y+dy))});}ed.refresh();refreshTime();});
  function finishDrag(cancel=false){if(!drag)return;const state=drag;drag=null;if(cancel){for(const part of state.items)clip().layers[part.index]=part.before;ed.refresh();refresh();}else if(state.moved)commit();}
  canvas.addEventListener('pointerup',()=>finishDrag());canvas.addEventListener('pointercancel',()=>finishDrag(true));canvas.addEventListener('lostpointercapture',()=>finishDrag(true));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag){finishDrag(true);e.preventDefault();}});
  for(const sound of A.sounds){const option=document.createElement('option');option.value=sound.id;option.textContent=sound.name;$('sound-choice').append(option);}
  $('audition-sound').onclick=()=>A.preview($('sound-choice').value).catch(e=>ed.notify(e.message));
  $('add-sound').onclick=()=>{clip().audio??=[];if(clip().audio.length>=12)return;clip().audio.push({sound:$('sound-choice').value,time:frameTime(),volume:.7,rate:1,fadeIn:0,fadeOut:.04});commit();};
  $('audio-enabled').onchange=()=>{ed.project.audio??={volume:.8};ed.project.audio.enabled=$('audio-enabled').checked;commit();};
  $('master-volume').onchange=()=>{ed.project.audio??={enabled:true};ed.project.audio.volume=Number($('master-volume').value);commit();};$('master-volume').oninput=()=>$('master-volume-value').textContent=Math.round(Number($('master-volume').value)*100)+'%';
  async function syncAudio(){
    const token=++generation;if(player)player.pause();if(!preview||!ed.playing||ed.exporting)return;
    try{const project=clone(ed.project),key=JSON.stringify({audio:project.audio,clips:project.clips.map(c=>({duration:c.duration,transition:c.transition,audio:c.audio})),fps:project.fps});
      if(key!==playerKey){const next=await A.createPlayer(project);if(token!==generation){next.dispose();return;}if(player)player.dispose();player=next;playerKey=key;}
      if(token===generation&&ed.playing&&preview)await player.play(ed.time);
    }catch(e){if(token===generation){preview=false;updatePreview();ed.notify('音效預覽失敗：'+e.message);}}
  }
  function updatePreview(){$('preview-audio').setAttribute('aria-pressed',String(preview));$('preview-audio').textContent='播放時預覽音效：'+(preview?'開':'關');}
  $('preview-audio').onclick=async()=>{try{await A.unlock();preview=!preview;updatePreview();syncAudio();}catch(e){ed.notify(e.message);}};
  document.addEventListener('workshop-play',syncAudio);
  document.addEventListener('workshop-change',()=>{if(layerSort)finishLayerSort(false);clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{refresh();syncAudio();L.prepare(ed.project).then(()=>ed.refresh()).catch(e=>ed.notify(e.message));},100);});
  document.addEventListener('workshop-selection',()=>{if(layerSort&&layerSort.scene!==ed.selected)finishLayerSort(false);queueMicrotask(refresh);});document.addEventListener('workshop-frame',()=>{if(tab!=='template')refreshTime();});
  $('insert-custom-demo').onclick=()=>{
    const o=P.defaultClip('gradient-mesh');o.duration=5;o.text='';o.subtitle='';o.base.visible=false;
    const rect=L.defaultLayer('rect');rect.name='品牌色塊';rect.fill='#a59bff';rect.width=62;rect.height=36;rect.end=5;rect.transform={...rect.transform,y:48};rect.keyframes=[{time:0,...rect.transform,scale:.3,rotation:-12,opacity:0,easing:'linear'},{time:1,...rect.transform,easing:'back'}];
    const title=L.defaultLayer('text');title.name='主標題';title.text='讓想法，自由動起來';title.fill='#10171c';title.width=58;title.fontSize=6;title.end=5;title.transform.y=48;title.keyframes=[{time:0,...title.transform,y:65,opacity:0,easing:'linear'},{time:1.2,...title.transform,easing:'ease-out'},{time:4,...title.transform,easing:'linear'},{time:5,...title.transform,y:40,opacity:0,easing:'ease-in'}];
    const tag=L.defaultLayer('text');tag.name='小字說明';tag.text='圖層 × 關鍵影格 × 聲音';tag.fontSize=3;tag.width=80;tag.end=5;tag.transform.y=78;tag.keyframes=[{time:0,...tag.transform,opacity:0,easing:'linear'},{time:1.5,...tag.transform,easing:'ease-out'}];
    o.layers=[rect,title,tag];o.audio=[{sound:'expand',time:0,volume:.6,rate:1,fadeIn:0,fadeOut:.05},{sound:'confirm',time:1.2,volume:.55,rate:1,fadeIn:0,fadeOut:.1},{sound:'close',time:4.3,volume:.45,rate:1,fadeIn:0,fadeOut:.1}];
    if(ed.insert(o)){scene=ed.selected;chosen=1;ed.seek(P.timeline(ed.project)[ed.selected].start+1.5);refresh();ed.notify('已新增示範場景，可直接修改圖層、關鍵格與音效。');}
  };
  document.addEventListener('keydown',e=>{if(e.defaultPrevented||ed.exporting||document.querySelector('dialog[open]')||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(['ArrowLeft','ArrowRight'].includes(e.key)&&!e.metaKey&&!e.ctrlKey){e.preventDefault();ed.seek(ed.time+(e.key==='ArrowRight'?1:-1)*(e.shiftKey?10:1)/ed.project.fps);}});
  window.WorkshopLayers={get tab(){return tab;},get chosen(){return chosen;},get layer(){return layer();},get selected(){return selectedIndices();},select,selectMany(indices){selection=new Set(indices);chosen=indices.at(-1)??-1;ed.pause();refresh();document.dispatchEvent(new CustomEvent('workshop-layer-selection'));},setTab,commit,refresh,refreshTime,editLayer,addLayer,local:frameTime};
  refresh();
})();
