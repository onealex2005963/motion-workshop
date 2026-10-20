/* Native/browser editor controls for layers, keyframes and local sounds. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),ed=window.WorkshopEditor,L=window.MotionLayers,P=window.MotionProject,A=window.MotionAudio;
  let tab='template',chosen=-1,scene=-1,drag,preview=false,player,playerKey='',generation=0,refreshTimer;
  const clip=()=>ed.project.clips[ed.selected];
  const local=()=>Math.max(0,Math.min(clip().duration,ed.time-P.timeline(ed.project)[ed.selected].start));
  const frameTime=()=>Math.round(local()*ed.project.fps)/ed.project.fps;
  const layer=()=>clip().layers?.[chosen];
  const clone=v=>JSON.parse(JSON.stringify(v));
  const round=n=>Number(n.toFixed(3));
  const activeKey=()=>layer()?.keyframes.find(k=>Math.abs(k.time-frameTime())<.5/ed.project.fps);
  function commit(){ed.change();refresh();}
  function select(index){chosen=index;ed.pause();refresh();}
  function setTab(value){
    tab=value;for(const b of document.querySelectorAll('[data-inspector-tab]')){const active=b.dataset.inspectorTab===tab;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;}
    for(const id of ['template','layers','audio'])$(id+'-panel').hidden=id!==tab;
    if(tab==='layers'){ed.pause();const row=P.timeline(ed.project)[ed.selected];if(ed.time<row.start||ed.time>=row.end)ed.seek(row.start);}
    refresh();
  }
  document.querySelectorAll('[data-inspector-tab]').forEach(b=>{b.onclick=()=>setTab(b.dataset.inspectorTab);b.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=[...document.querySelectorAll('[data-inspector-tab]')],index=tabs.indexOf(b),next=e.key==='Home'?0:e.key==='End'?2:(index+(e.key==='ArrowRight'?1:2))%3;tabs[next].click();tabs[next].focus();};});
  function refreshLayers(){
    const o=clip();o.layers??=[];o.base??={visible:true,...L.transform()};
    if(scene!==ed.selected){scene=ed.selected;chosen=o.layers.length-1;}if(chosen>=o.layers.length)chosen=o.layers.length-1;
    $('base-visible').checked=o.base.visible;for(const key of L.properties)$('base-'+key).value=o.base[key];
    $('layer-list').replaceChildren();
    o.layers.forEach((item,index)=>{
      const row=document.createElement('div');row.className='layer-row'+(index===chosen?' selected':'');
      const pick=document.createElement('button');pick.className='layer-pick';pick.textContent=`${index+1}. ${item.name}`;pick.title=L.types[item.type];pick.setAttribute('aria-pressed',String(index===chosen));pick.onclick=()=>select(index);
      const visible=document.createElement('button');visible.textContent=item.visible?'◉':'○';visible.setAttribute('aria-label',(item.visible?'隱藏':'顯示')+item.name);visible.setAttribute('aria-pressed',String(item.visible));visible.onclick=()=>{item.visible=!item.visible;commit();};
      const lock=document.createElement('button');lock.textContent=item.locked?'鎖':'編';lock.setAttribute('aria-label',(item.locked?'解鎖':'鎖定')+item.name);lock.setAttribute('aria-pressed',String(item.locked));lock.onclick=()=>{item.locked=!item.locked;commit();};row.append(pick,visible,lock);$('layer-list').append(row);
    });
    if(!o.layers.length){const text=document.createElement('p');text.className='muted';text.textContent='還沒有圖層。加入文字、圖形或自己的圖片。';$('layer-list').append(text);}
    const item=layer();$('layer-properties').hidden=!item;
    $('layer-down').disabled=chosen<=0;$('layer-up').disabled=chosen<0||chosen>=o.layers.length-1;for(const id of ['layer-copy','layer-delete'])$(id).disabled=!item;
    $('add-layer').disabled=o.layers.length>=12;$('import-image').disabled=o.layers.length>=12;
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
    $('keyframe-note').textContent=item.locked?'圖層已鎖定，先在圖層清單解鎖。':item.keyframes.length?`${item.keyframes.length} 個關鍵格。修改位置、縮放、旋轉或透明度，會記錄在目前時間。`:'目前是靜態圖層。記錄起點，移動時間後調整位置，建立下一格。';
    const track=$('keyframe-track'),signature=JSON.stringify([scene,chosen,item.keyframes.map(k=>[k.time,k.easing])]);if(track.dataset.signature!==signature){track.dataset.signature=signature;track.replaceChildren();for(const k of item.keyframes){const b=document.createElement('button');b.className='key-marker'+(k===key?' active':'');b.style.left=(k.time/clip().duration*100)+'%';b.dataset.time=k.time;b.textContent='◆';b.title=`${round(k.time)} 秒 · ${L.easingNames[k.easing]}`;b.setAttribute('aria-label','移到 '+round(k.time)+' 秒的關鍵影格');b.onclick=()=>ed.seek(P.timeline(ed.project)[ed.selected].start+k.time);track.append(b);}}for(const b of track.children)b.classList.toggle('active',Math.abs(parseFloat(b.dataset.time)-t)<.5/ed.project.fps);
    track.style.setProperty('--playhead',(t/clip().duration*100)+'%');
    const state=P.locate(ed.project,ed.time),box=$('layer-selection');box.hidden=tab!=='layers'||!item.visible||t<item.start||t>item.end||state.index!==ed.selected||!!state.previous;
    box.style.left=m.x+'%';box.style.top=m.y+'%';box.style.width=(item.width*m.scale)+'%';box.style.height=(Math.max(item.height,item.type==='text'?item.fontSize*1.5:1)*m.scale)+'%';box.style.transform=`translate(-50%,-50%) rotate(${m.rotation}deg)`;box.classList.toggle('locked',item.locked);
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
  function refresh(){if(!ed.project||ed.exporting)return;refreshLayers();refreshAudio();refreshTime();}
  for(const key of L.properties)$('base-'+key).onchange=()=>{ed.pause();clip().base[key]=Number($('base-'+key).value);commit();};
  $('base-visible').onchange=()=>{clip().base.visible=$('base-visible').checked;commit();};$('reset-base').onclick=()=>{clip().base={visible:true,...L.transform()};commit();};
  function addLayer(item){if((clip().layers||[]).length>=12){ed.notify('每幕最多 12 個圖層。');return;}clip().layers??=[];clip().layers.push(item);chosen=clip().layers.length-1;ed.pause();commit();}
  $('add-layer').onclick=()=>{const item=L.defaultLayer($('new-layer-type').value);item.end=clip().duration;item.fill=clip().color;addLayer(item);};
  $('layer-delete').onclick=()=>{if(!layer())return;clip().layers.splice(chosen,1);chosen--;commit();};$('layer-copy').onclick=()=>{if(!layer())return;const copy=clone(layer());copy.name+=' 副本';addLayer(copy);};
  function reorder(delta){const next=chosen+delta;if(next<0||next>=clip().layers.length)return;[clip().layers[next],clip().layers[chosen]]=[clip().layers[chosen],clip().layers[next]];chosen=next;commit();}
  $('layer-down').onclick=()=>reorder(-1);$('layer-up').onclick=()=>reorder(1);
  for(const key of ['name','text','fill','stroke','strokeWidth','width','height','radius','fontSize','fontFamily','weight','align','blend','start','end'])$('layer-'+key).onchange=()=>{if(!layer()||layer().locked)return;ed.pause();layer()[key]=['name','text','fill','stroke','fontFamily','align','blend'].includes(key)?$('layer-'+key).value:Number($('layer-'+key).value);commit();};
  function record(values){
    const item=layer();if(!item||item.locked)return;const t=frameTime(),k=activeKey(),snapshot={time:t,...L.sample(item,t),...values,easing:$('keyframe-easing').value};
    if(k)Object.assign(k,snapshot);else if(item.keyframes.length<60)item.keyframes.push(snapshot);else ed.notify('每層最多 60 個關鍵格。');item.keyframes.sort((a,b)=>a.time-b.time);
  }
  for(const key of L.properties)$('layer-'+key).onchange=()=>{if(!layer()||layer().locked)return;ed.pause();const value=Number($('layer-'+key).value);if(layer().keyframes.length)record({[key]:value});else layer().transform[key]=value;commit();};
  $('add-keyframe').onclick=()=>{ed.pause();record({});commit();};$('remove-keyframe').onclick=()=>{const key=activeKey();if(!key)return;layer().keyframes.splice(layer().keyframes.indexOf(key),1);commit();};
  $('keyframe-easing').onchange=()=>{if(activeKey()){record({});commit();}};
  $('layer-seek-go').onclick=()=>ed.seek(P.timeline(ed.project)[ed.selected].start+Number($('layer-seek').value));
  $('layer-seek').onkeydown=e=>{if(e.key==='Enter')$('layer-seek-go').click();};
  $('clear-keyframes').onclick=()=>{if(!layer())return;layer().transform=L.sample(layer(),frameTime());layer().keyframes=[];commit();};
  $('apply-motion').onclick=()=>{
    const item=layer();if(!item||item.locked)return;ed.pause();const end=clip().duration,d=Math.min(1,end*.3),b={...item.transform},preset=$('motion-preset').value;
    let from={...b,opacity:0},ease='ease-out';if(preset==='rise')from.y=b.y+18;if(preset==='slide')from.x=b.x-30;if(preset==='pop'){from.scale=b.scale*.25;ease='back';}if(preset==='spin'){from.scale=b.scale*.6;from.rotation=b.rotation-180;ease='back';}
    item.keyframes=[{time:0,...from,easing:'linear'},{time:Math.round(d*ed.project.fps)/ed.project.fps,...b,easing:ease}];
    if(preset==='fade')item.keyframes.push({time:end-d,...b,easing:'linear'},{time:end,...b,opacity:0,easing:'ease-in'});
    ed.seek(P.timeline(ed.project)[ed.selected].start);commit();
  };
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
    if(tab!=='layers'||ed.exporting||P.locate(ed.project,ed.time).previous)return;
    ed.pause();const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*100,y=(e.clientY-rect.top)/rect.height*100;
    const items=clip().layers||[];let index=-1;for(let i=items.length-1;i>=0;i--)if(L.hitTest(items[i],frameTime(),x,y,rect.width/rect.height)){index=i;break;}
    chosen=index;refresh();if(index<0)return;const m=L.sample(layer(),frameTime());drag={x,y,m,rect};canvas.setPointerCapture(e.pointerId);e.preventDefault();
  });
  canvas.addEventListener('pointermove',e=>{if(!drag)return;const x=drag.m.x+(e.clientX-drag.rect.left)/drag.rect.width*100-drag.x,y=drag.m.y+(e.clientY-drag.rect.top)/drag.rect.height*100-drag.y;
    const values={x:Math.max(-100,Math.min(200,x)),y:Math.max(-100,Math.min(200,y))};if(layer().keyframes.length)record(values);else Object.assign(layer().transform,values);ed.refresh();refreshTime();});
  const finishDrag=()=>{if(!drag)return;drag=null;commit();};canvas.addEventListener('pointerup',finishDrag);canvas.addEventListener('pointercancel',finishDrag);
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
  document.addEventListener('workshop-change',()=>{clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{refresh();syncAudio();L.prepare(ed.project).then(()=>ed.refresh()).catch(e=>ed.notify(e.message));},100);});
  document.addEventListener('workshop-selection',()=>{queueMicrotask(refresh);});document.addEventListener('workshop-frame',()=>{if(tab!=='template')refreshTime();});
  $('insert-custom-demo').onclick=()=>{
    const o=P.defaultClip('gradient-mesh');o.duration=5;o.text='';o.subtitle='';o.base.visible=false;
    const rect=L.defaultLayer('rect');rect.name='品牌色塊';rect.fill='#a59bff';rect.width=62;rect.height=36;rect.end=5;rect.transform={...rect.transform,y:48};rect.keyframes=[{time:0,...rect.transform,scale:.3,rotation:-12,opacity:0,easing:'linear'},{time:1,...rect.transform,easing:'back'}];
    const title=L.defaultLayer('text');title.name='主標題';title.text='讓想法，自由動起來';title.fill='#10171c';title.width=58;title.fontSize=6;title.end=5;title.transform.y=48;title.keyframes=[{time:0,...title.transform,y:65,opacity:0,easing:'linear'},{time:1.2,...title.transform,easing:'ease-out'},{time:4,...title.transform,easing:'linear'},{time:5,...title.transform,y:40,opacity:0,easing:'ease-in'}];
    const tag=L.defaultLayer('text');tag.name='小字說明';tag.text='圖層 × 關鍵影格 × 聲音';tag.fontSize=3;tag.width=80;tag.end=5;tag.transform.y=78;tag.keyframes=[{time:0,...tag.transform,opacity:0,easing:'linear'},{time:1.5,...tag.transform,easing:'ease-out'}];
    o.layers=[rect,title,tag];o.audio=[{sound:'expand',time:0,volume:.6,rate:1,fadeIn:0,fadeOut:.05},{sound:'confirm',time:1.2,volume:.55,rate:1,fadeIn:0,fadeOut:.1},{sound:'close',time:4.3,volume:.45,rate:1,fadeIn:0,fadeOut:.1}];
    if(ed.insert(o)){scene=ed.selected;chosen=1;ed.seek(P.timeline(ed.project)[ed.selected].start+1.5);refresh();ed.notify('已新增示範場景，可直接修改圖層、關鍵格與音效。');}
  };
  document.addEventListener('keydown',e=>{if(ed.exporting||document.querySelector('dialog[open]')||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(['ArrowLeft','ArrowRight'].includes(e.key)&&!e.metaKey&&!e.ctrlKey){e.preventDefault();ed.seek(ed.time+(e.key==='ArrowRight'?1:-1)*(e.shiftKey?10:1)/ed.project.fps);}});
  refresh();
})();
