/* Direct manipulation of geometry and spatial animation, independent of preset text. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),ed=window.WorkshopEditor,U=window.WorkshopLayers,L=window.MotionLayers,V=window.MotionVector,P=window.MotionProject;
  const sample=(layer,time)=>L.sample(layer,time,$('preview').width/$('preview').height);
  const copy=v=>JSON.parse(JSON.stringify(v)),clip=()=>ed.project.clips[ed.selected],layer=()=>U.layer,local=()=>U.local(),ratio=()=>$('preview').width/$('preview').height;
  const modes={select:'選取 V',rect:'矩形 R',ellipse:'橢圓 E',star:'星形 S',pen:'鋼筆 P',pencil:'手繪 B',nodes:'節點 A',add:'新增節點 N',trajectory:'移動路徑 M',hand:'平移 H'};
  let mode='select',draft=[],gesture,nodeIndex=0,zoom=1,pan={x:0,y:0},scene=-1,selected=-1,lastRender='';
  const toolbar=document.createElement('div');toolbar.className='vector-toolbar';toolbar.innerHTML='<div id="vector-tools" role="toolbar" aria-label="自由畫布工具"></div><div class="vector-view"><button id="vector-zoom-out" aria-label="縮小畫布">−</button><span id="vector-zoom-label">100%</span><button id="vector-zoom-in" aria-label="放大畫布">＋</button><button id="vector-fit">符合畫面</button><button id="vector-finish">完成路徑 Enter</button></div><p id="vector-status" role="status">直接在畫布拖曳繪圖；鋼筆點選加節點、拖曳拉出曲線把手。</p>';
  document.querySelector('.canvas-toolbar').after(toolbar);
  for(const [id,label] of Object.entries(modes)){const b=document.createElement('button');b.textContent=label;b.dataset.mode=id;b.setAttribute('aria-pressed',String(id===mode));b.onclick=()=>setMode(id);$('vector-tools').append(b);}
  const panel=document.createElement('fieldset');panel.id='vector-panel';panel.innerHTML=`<legend>自由形狀／移動路徑</legend><p id="vector-node-summary" class="muted"></p><div class="two-fields"><label>節點 X<input id="vector-node-x" type="number" step="0.1"></label><label>節點 Y<input id="vector-node-y" type="number" step="0.1"></label></div><div class="studio-button-grid"><button id="vector-smooth">平滑節點</button><button id="vector-corner">尖角節點</button><button id="vector-add-node">插入線段中點</button><button id="vector-place-node">在畫布新增節點</button><button id="vector-delete-node">刪除節點</button><button id="vector-record-shape">記錄形狀關鍵格</button><button id="vector-export-svg">匯出所選 SVG</button></div><label class="check-row"><input id="vector-closed" type="checkbox">封閉形狀</label><label class="check-row"><input id="vector-filled" type="checkbox" checked>填色</label><label class="check-row"><input id="vector-position-enabled" type="checkbox" checked>啟用移動路徑</label><label class="check-row"><input id="vector-orient" type="checkbox">沿路徑方向旋轉</label><p class="muted">選節點後拖曳圓形把手改曲率；Alt 可獨立拉一側。新增／刪除形狀節點會同步所有形狀關鍵格。位置路徑會優先於 X／Y 軌道，套版動作仍另外疊加。</p>`;
  $('layers-panel').insertBefore(panel,$('layers-panel').firstChild);panel.hidden=true;
  const example=document.createElement('button');example.id='insert-vector-demo';example.className='full-button';example.textContent='插入自由繪圖示範';$('insert-studio-demo').after(example);example.onclick=()=>{const p=window.MotionLibrary.createVectorDemo({ratio:ed.project.ratio,fps:ed.project.fps});if(ed.insert(p.clips[0])){U.select(0);ed.seek(P.timeline(ed.project)[ed.selected].start+2.5);setMode('nodes');ed.notify('已新增自由繪圖示範；拖節點或切換移動路徑即可修改。');}};
  const NS='http://www.w3.org/2000/svg',svg=document.createElementNS(NS,'svg');svg.id='vector-overlay';svg.setAttribute('aria-label','自由路徑編輯畫布');$('stage').append(svg);
  function status(text){$('vector-status').textContent=text;}
  function view(){const stage=$('stage');stage.style.transform=`translate(${pan.x}px,${pan.y}px) scale(${zoom})`;$('vector-zoom-label').textContent=Math.round(zoom*100)+'%';render();}
  function setZoom(value){zoom=Math.max(.25,Math.min(4,value));view();}
  $('vector-zoom-in').onclick=()=>setZoom(zoom*1.25);$('vector-zoom-out').onclick=()=>setZoom(zoom/1.25);$('vector-fit').onclick=()=>{zoom=1;pan={x:0,y:0};view();};
  $('stage').parentElement.addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();setZoom(zoom*(e.deltaY<0?1.1:1/1.1));},{passive:false});
  function convert(){const l=layer();if(!l||l.locked)return false;if(l.type==='path')return true;if(['text','image'].includes(l.type)){ed.notify('文字與圖片不能直接轉成路徑，請先選取形狀。');return false;}const m=sample(l,local());l.path=V.fromShape(l,m,ratio());if(l.type==='line'){l.stroke=l.fill;l.strokeWidth=Math.min(30,m.height*7.2);l.fillEnabled=false;}l.type='path';U.commit();return true;}
  function createTrajectory(){const l=layer();if(!l||l.locked)return false;if(l.tracks?.position?.length){if(l.positionEnabled===false){l.positionEnabled=true;U.commit();}return true;}const m=L.sampleBase(l,local()),end=Math.max(l.start+1/ed.project.fps,l.end);L.setKey(l,'position',l.start,{...V.point(m.x,m.y),outX:10,outY:-15},{fps:ed.project.fps,duration:clip().duration,easing:'linear'});L.setKey(l,'position',end,{...V.point(Math.min(95,m.x+30),m.y),inX:-10,inY:15},{fps:ed.project.fps,duration:clip().duration,easing:'linear'});l.positionEnabled=true;U.commit();return true;}
  function setMode(next){if(next==='add'){if(layer()?.locked){ed.notify('請先解鎖圖層，再新增節點。');return;}if(layer()&&['text','image'].includes(layer().type))U.select(-1);else if(layer()&&!convert())return;}if(gesture)finishGesture(true);draft=[];if(next==='nodes'&&!layer()){const index=clip().layers.map((l,i)=>({l,i})).filter(v=>v.l.visible&&!v.l.locked&&!['text','image'].includes(v.l.type)).at(-1)?.i;if(index!==undefined)U.select(index);else{ed.notify('先在畫布繪製或選取形狀，再編輯節點。');next='select';}}if(next==='nodes'&&layer()&&!convert())next='select';if(next==='trajectory'&&!createTrajectory()){ed.notify('先選取可編輯的圖層，再建立移動路徑。');next='select';}mode=next;if(next!=='hand')U.setTab('layers');ed.pause();for(const b of toolbar.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===mode));svg.classList.toggle('editing',mode!=='select');$('layer-selection').classList.toggle('vector-hidden',mode==='nodes'||mode==='add'||mode==='trajectory');panel.hidden=!layer()||!['nodes','add','trajectory'].includes(mode);status(mode==='add'?'點線段精準插入；點空白在所選節點後新增。無形狀時逐點建立路徑，Enter 完成、Esc 取消。':mode==='pen'?'點一下加節點，按住拖曳拉把手；點起點封閉，Enter 完成開放路徑，Esc 取消。':mode==='nodes'?'拖曳方形節點與圓形把手；雙擊線段或按 N 新增節點；勾選自動記錄可製作形狀變形。':mode==='trajectory'?'拖曳路徑點及把手來改變移動方向；下方菱形可調整到達時間。':mode==='hand'?'在畫布上拖曳平移；符合畫面可重設。':'在畫布拖曳繪圖；切換選取工具可移動物件。');render();}
  function world(e){const r=svg.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*100,y:(e.clientY-r.top)/r.height*100};}
  function geometry(){return layer()?copy(sample(layer(),local()).path):null;}
  function keys(){return layer()?.tracks?.position||[];}
  const motionPoint=()=>keys()[Math.min(nodeIndex,keys().length-1)];
  function writePath(path,commit=true){const l=layer();if(!l||l.locked)return;L.edit(l,local(),{path},{key:!!$('auto-key').checked,fps:ed.project.fps,duration:clip().duration,easing:$('keyframe-easing').value,curve:window.WorkshopStudio.curve()});if(commit)U.commit();else ed.refresh();}
  function nodeChange(fn){if(!layer()||layer().locked)return;if(mode==='trajectory'){const key=motionPoint();if(!key)return;fn(key.value);U.commit();}else {const path=geometry();if(!path?.segments[nodeIndex])return;fn(path.segments[nodeIndex]);writePath(path);}render();}
  for(const axis of ['x','y'])$('vector-node-'+axis).onchange=()=>nodeChange(p=>{p[axis]=Number($('vector-node-'+axis).value);});
  $('vector-smooth').onclick=()=>{if(mode==='trajectory'){const k=keys(),i=Math.min(nodeIndex,k.length-1),path={closed:false,segments:k.map(k=>k.value)};if(path.segments[i])V.smooth(path,i);U.commit();}else{const path=geometry();if(path){V.smooth(path,nodeIndex);writePath(path);}}render();};
  $('vector-corner').onclick=()=>nodeChange(p=>{p.inX=p.inY=p.outX=p.outY=0;});
  function topology(fn){const l=layer();if(!l||l.locked||l.type!=='path')return false;const paths=[l.path,...(l.tracks?.path||[]).map(k=>k.value)],n=paths[0].segments.length;if(paths.some(p=>p.segments.length!==n||p.closed!==paths[0].closed)){ed.notify('各形狀關鍵格的節點數或封閉設定不同，請先復原不一致的編輯。');return false;}for(const path of paths)fn(path);U.commit();render();return true;}
  $('vector-place-node').onclick=()=>setMode('add');
  $('vector-add-node').onclick=()=>{if(mode==='trajectory'){const t=Math.round(local()*ed.project.fps)/ed.project.fps;if(keys().some(k=>Math.abs(k.time-t)<.5/ed.project.fps)){ed.notify('目前時間已有路徑點，請先移動播放頭。');return;}L.setKey(layer(),'position',t,L.sampleBase(layer(),t).position,{fps:ed.project.fps,duration:clip().duration,easing:'linear'});nodeIndex=keys().findIndex(k=>k.time===t);U.commit();render();}else{const path=geometry();if(!path||path.segments.length>=64){ed.notify('每條路徑最多 64 個節點。');return;}const index=Math.min(nodeIndex,path.segments.length-(path.closed?1:2));topology(p=>V.split(p,index,.5));nodeIndex=index+1;render();}};
  function nearest(worldPoint){
    const m=sample(layer(),local()),p=V.toLocal(layer(),m,worldPoint,ratio()),r=svg.getBoundingClientRect();
    const map=q=>{const v=V.toWorld(layer(),m,q,ratio());return{x:v.x*r.width/100,y:v.y*r.height/100};};
    return {point:p,...V.closest(geometry(),p,map)};
  }
  function placeNode(worldPoint,onCurveOnly=false){
    const l=layer();if(!l||l.type!=='path'||l.locked)return false;
    const path=geometry();if(path.segments.length>=64){ed.notify('每條路徑最多 64 個節點。');return false;}
    const hit=nearest(worldPoint),near=hit.distance<=12;
    if(onCurveOnly&&!near)return false;
    if(near&&(hit.u<.01||hit.u>.99)){nodeIndex=(hit.index+(hit.u>.5?1:0))%path.segments.length;render();ed.notify('這裡已有節點，請點線段其他位置。');return false;}
    const index=near?hit.index:Math.min(nodeIndex,path.segments.length-1),before=nodeIndex;nodeIndex=index+1;
    const ok=topology(p=>near?V.split(p,index,hit.u):V.insert(p,index,V.point(hit.point.x,hit.point.y)));
    if(!ok){nodeIndex=before;return false;}
    svg.querySelector(`[data-node="${nodeIndex}"][data-part="anchor"]`)?.focus({preventScroll:true});
    ed.notify(near?'已在線段新增節點，可直接拖曳；⌘Z 復原。':'已在點選位置新增節點，可直接拖曳；⌘Z 復原。');return true;
  }
  $('vector-delete-node').onclick=()=>{if(mode==='trajectory'){if(keys().length<=2){ed.notify('移動路徑至少需要兩個點。');return;}keys().splice(nodeIndex,1);nodeIndex=Math.max(0,nodeIndex-1);U.commit();render();}else{const p=geometry();if(!p||p.segments.length<=(p.closed?3:2)){ed.notify('節點數已達此路徑的最小值。');return;}topology(p=>p.segments.splice(nodeIndex,1));nodeIndex=Math.max(0,nodeIndex-1);render();}};
  $('vector-record-shape').onclick=()=>{if(layer()?.type!=='path')return;L.edit(layer(),local(),{path:geometry()},{key:true,fps:ed.project.fps,duration:clip().duration,easing:$('keyframe-easing').value});U.commit();ed.notify('已記錄此刻形狀，換時間後拖曳節點即可變形。');};
  $('vector-closed').onchange=()=>topology(p=>{p.closed=$('vector-closed').checked;});$('vector-filled').onchange=()=>{if(layer()){layer().fillEnabled=$('vector-filled').checked;U.commit();}};
  $('vector-position-enabled').onchange=()=>{if(layer()){layer().positionEnabled=$('vector-position-enabled').checked;U.commit();}};$('vector-orient').onchange=()=>{if(layer()){layer().orientToPath=$('vector-orient').checked;U.commit();}};
  function element(tag,attrs,parent=svg){const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));parent.append(el);return el;}
  const fmt=n=>Number(n.toFixed(4));
  function pathD(path,map){const s=path.segments,f=p=>{const q=map(p);return fmt(q.x)+' '+fmt(q.y);};let d='M '+f(s[0]);for(let i=1;i<s.length+(path.closed?1:0);i++){const a=s[(i-1)%s.length],b=s[i%s.length];d+=' C '+f({x:a.x+a.outX,y:a.y+a.outY})+' '+f({x:b.x+b.inX,y:b.y+b.inY})+' '+f(b);}return d+(path.closed?' Z':'');}
  $('vector-export-svg').onclick=async()=>{if(layer()?.type!=='path')return;const l=layer(),m=sample(l,local()),text=V.toSVG(l,m,ratio());try{if(ed.native)await ed.native({type:'save',kind:'svg',name:'自由形狀.svg',data:text});else{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type:'image/svg+xml'}));a.href=url;a.download='自由形狀.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}catch(e){ed.notify(e.message);}};
  function render(){
    if(!ed.project)return;const w=$('preview').width,h=$('preview').height,r=svg.getBoundingClientRect(),unit=w/Math.max(1,r.width),handle=4.5*unit;
    const stamp=JSON.stringify([mode,ed.selected,U.chosen,layer()?.locked,layer()?.anchorX,layer()?.anchorY,layer()?.fillEnabled,layer()?.positionEnabled,layer()?.orientToPath,layer()?sample(layer(),local()):null,mode==='trajectory'?keys():null,draft,gesture?.kind==='shape'?[gesture.start,gesture.current]:null,w,h,r.width,nodeIndex]);if(stamp===lastRender)return;lastRender=stamp;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.replaceChildren();$('vector-finish').hidden=!draft.length;
    const toPixels=p=>({x:p.x/100*w,y:p.y/100*h});
    if(draft.length){element('path',{d:pathD({closed:false,segments:draft},p=>toPixels(p)),class:'vector-draft','stroke-width':1.5*unit});draft.forEach((p,i)=>{const q=toPixels(p);element('circle',{cx:q.x,cy:q.y,r:handle,class:'vector-anchor',fill:i===0?'#d8f36a':'#a59bff'});if(p.outX||p.outY){const end=toPixels({x:p.x+p.outX,y:p.y+p.outY});element('line',{x1:q.x,y1:q.y,x2:end.x,y2:end.y,class:'vector-handle-line','stroke-width':unit});element('circle',{cx:end.x,cy:end.y,r:handle*.75,class:'vector-handle'});}});}
    if(gesture?.kind==='shape'){const a=gesture.start,b=gesture.current,x=Math.min(a.x,b.x)/100*w,y=Math.min(a.y,b.y)/100*h,ww=Math.abs(a.x-b.x)/100*w,hh=Math.abs(a.y-b.y)/100*h;element(mode==='ellipse'?'ellipse':'rect',mode==='ellipse'?{cx:x+ww/2,cy:y+hh/2,rx:ww/2,ry:hh/2,class:'vector-draft','stroke-width':unit}:{x,y,width:ww,height:hh,class:'vector-draft','stroke-width':unit});}
    const l=layer();if(!l||!['nodes','add','trajectory'].includes(mode)){panel.hidden=true;return;}panel.hidden=false;
    $('vector-place-node').setAttribute('aria-pressed',String(mode==='add'));
    const trajectory=mode==='trajectory',m=sample(l,local()),path=trajectory?{closed:false,segments:keys().map(k=>k.value)}:m.path;if(!path?.segments?.length)return;
    const map=trajectory?p=>toPixels(p):p=>toPixels(V.toWorld(l,m,p,ratio()));element('path',{d:pathD(path,map),class:'vector-outline','stroke-width':1.5*unit});
    nodeIndex=Math.max(0,Math.min(nodeIndex,path.segments.length-1));
    path.segments.forEach((p,i)=>{const a=map(p),selected=i===nodeIndex;
      for(const side of ['in','out']){const dx=p[side+'X'],dy=p[side+'Y'];if(!selected&&!dx&&!dy)continue;if(!dx&&!dy)continue;const q=map({x:p.x+dx,y:p.y+dy});element('line',{x1:a.x,y1:a.y,x2:q.x,y2:q.y,class:'vector-handle-line','stroke-width':unit});element('circle',{cx:q.x,cy:q.y,r:handle*.85,class:'vector-handle','data-node':i,'data-part':side,role:'button',tabindex:0,'aria-label':`節點 ${i+1} ${side==='in'?'進入':'離開'}曲線把手`});}
      element('rect',{x:a.x-handle,y:a.y-handle,width:handle*2,height:handle*2,rx:unit,class:'vector-anchor'+(selected?' active':''),'data-node':i,'data-part':'anchor',role:'button',tabindex:0,'aria-label':`${trajectory?'移動':'形狀'}節點 ${i+1}${trajectory?' '+keys()[i].time.toFixed(3)+' 秒':''}`});
      if(trajectory)element('text',{x:a.x+handle*1.8,y:a.y-handle*1.8,'font-size':10*unit,fill:'#e9f7ff','pointer-events':'none'}).textContent=keys()[i].time.toFixed(2)+'s';
    });
    const p=path.segments[nodeIndex];$('vector-node-summary').textContent=(trajectory?'場景座標 % · 到達 '+keys()[nodeIndex].time.toFixed(3)+' 秒':'形狀局部座標 %')+' · 節點 '+(nodeIndex+1)+' / '+path.segments.length;
    for(const axis of ['x','y'])if(document.activeElement!==$('vector-node-'+axis))$('vector-node-'+axis).value=fmt(p[axis]);
    $('vector-add-node').textContent=trajectory?'在播放頭新增路徑點':'插入線段中點';
    for(const id of ['vector-closed','vector-filled','vector-record-shape','vector-export-svg','vector-place-node'])$(id).closest('label')?$(id).closest('label').hidden=trajectory:$(id).hidden=trajectory;
    for(const id of ['vector-position-enabled','vector-orient'])$(id).closest('label').hidden=!trajectory;
    $('vector-closed').checked=path.closed;$('vector-filled').checked=l.fillEnabled!==false;$('vector-position-enabled').checked=l.positionEnabled!==false;$('vector-orient').checked=l.orientToPath;
    for(const field of panel.querySelectorAll('input,button'))field.disabled=l.locked;
  }
  function addPath(points,closed=false){if(points.length<2)return;const xs=points.flatMap(p=>[p.x,p.x+p.inX,p.x+p.outX]),ys=points.flatMap(p=>[p.y,p.y+p.inY,p.y+p.outY]),minX=Math.min(...xs),minY=Math.min(...ys),w=Math.max(1,Math.max(...xs)-minX),h=Math.max(1,Math.max(...ys)-minY),l=L.defaultLayer('path');l.name=closed?'自繪形狀':'自繪曲線';l.width=w;l.height=h;l.transform.x=minX+w/2;l.transform.y=minY+h/2;l.end=clip().duration;l.fill=clip().color;l.stroke=clip().color;l.strokeWidth=closed?0:4;l.fillEnabled=closed;l.path={closed,segments:points.map(p=>({...p,x:(p.x-minX)/w*100,y:(p.y-minY)/h*100,inX:p.inX/w*100,inY:p.inY/h*100,outX:p.outX/w*100,outY:p.outY/h*100}))};U.addLayer(l);U.setTab('layers');}
  function finishPen(closed=false){if(draft.length<2){ed.notify('請至少新增兩個節點，再完成路徑。');return;}const points=draft;draft=[];addPath(points,closed);if(mode==='add'){setMode('nodes');nodeIndex=points.length-1;}render();}
  $('vector-finish').onclick=()=>finishPen();
  svg.addEventListener('pointerdown',e=>{
    if(e.button!==0||ed.exporting||mode==='select')return;e.preventDefault();e.stopPropagation();ed.pause();const p=world(e);if(mode==='hand'){gesture={kind:'pan',x:e.clientX,y:e.clientY,before:{...pan},pointer:e.pointerId};svg.setPointerCapture(e.pointerId);return;}
    if(['rect','ellipse','star'].includes(mode)){gesture={kind:'shape',start:p,current:p,pointer:e.pointerId};svg.setPointerCapture(e.pointerId);return;}
    if(mode==='pencil'){gesture={kind:'pencil',points:[V.point(p.x,p.y)],pointer:e.pointerId};draft=gesture.points;svg.setPointerCapture(e.pointerId);render();return;}
    if(mode==='pen'||(mode==='add'&&(draft.length||!layer()))){if(e.detail>1)return;if(draft.length>=3&&Math.hypot((draft[0].x-p.x)*svg.clientWidth/100,(draft[0].y-p.y)*svg.clientHeight/100)<12){finishPen(true);return;}if(draft.length>=64){ed.notify('每條路徑最多 64 個節點。');return;}draft.push(V.point(p.x,p.y));gesture={kind:'pen',index:draft.length-1,pointer:e.pointerId};svg.setPointerCapture(e.pointerId);render();return;}
    const target=e.target.closest('[data-node]');if(!target){if(mode==='add'){placeNode(p);return;}if(mode==='nodes'){if(layer()?.type==='path'&&nearest(p).distance<=12)return;for(let i=clip().layers.length-1;i>=0;i--)if(L.hitTest(clip().layers[i],local(),p.x,p.y,ratio())){U.select(i);if(convert())render();break;}}return;}
    if(!layer()||layer().locked)return;nodeIndex=Number(target.dataset.node);gesture={kind:'node',part:target.dataset.part,index:nodeIndex,before:copy(layer()),path:geometry(),pointer:e.pointerId,scene:ed.selected,chosen:U.chosen,moved:false};svg.setPointerCapture(e.pointerId);if(mode==='trajectory')ed.seek(P.timeline(ed.project)[ed.selected].start+keys()[nodeIndex].time);render();svg.querySelector(`[data-node="${nodeIndex}"][data-part="${gesture.part}"]`)?.focus({preventScroll:true});
  });
  svg.addEventListener('pointermove',e=>{
    const g=gesture;if(!g||g.pointer!==e.pointerId)return;const p=world(e);if(g.kind==='pan'){pan={x:g.before.x+e.clientX-g.x,y:g.before.y+e.clientY-g.y};view();return;}if(g.kind==='shape'){g.current=p;render();return;}if(g.kind==='pen'){const a=draft[g.index];a.outX=p.x-a.x;a.outY=p.y-a.y;a.inX=-a.outX;a.inY=-a.outY;render();return;}if(g.kind==='pencil'){const prev=g.points.at(-1);if(Math.hypot(p.x-prev.x,p.y-prev.y)>.2){g.points.push(V.point(p.x,p.y));render();}return;}
    if(g.kind==='node'){
      if(g.scene!==ed.selected||g.chosen!==U.chosen){finishGesture(true);return;}g.moved=true;
      const trajectory=mode==='trajectory',path=trajectory?null:copy(g.path),node=trajectory?keys()[g.index].value:path.segments[g.index],v=trajectory?p:V.toLocal(layer(),sample(layer(),local()),p,ratio());
      if(g.part==='anchor'){node.x=v.x;node.y=v.y;}else{node[g.part+'X']=v.x-node.x;node[g.part+'Y']=v.y-node.y;if(!e.altKey){const other=g.part==='in'?'out':'in',length=Math.hypot(node[other+'X'],node[other+'Y']),d=Math.max(.0001,Math.hypot(v.x-node.x,v.y-node.y));node[other+'X']=-(v.x-node.x)/d*length;node[other+'Y']=-(v.y-node.y)/d*length;}}
      if(!trajectory)writePath(path,false);else ed.refresh();render();
    }
  });
  function finishGesture(cancel=false){if(!gesture)return;const g=gesture;gesture=undefined;if(cancel){if(g.before&&g.kind==='node'){ed.project.clips[g.scene].layers[g.chosen]=g.before;U.refresh();ed.refresh();}if(g.kind==='pan'){pan=g.before;view();}if(g.kind==='pen'||g.kind==='pencil')draft=[];render();return;}
    if(g.kind==='node'&&g.moved)U.commit();
    if(g.kind==='shape'){const a=g.start,b=g.current;if(Math.abs(a.x-b.x)<.5||Math.abs(a.y-b.y)<.5)return;const l=L.defaultLayer(mode);l.end=clip().duration;l.width=Math.abs(a.x-b.x);l.height=Math.abs(a.y-b.y);l.transform.x=(a.x+b.x)/2;l.transform.y=(a.y+b.y)/2;l.fill=clip().color;U.addLayer(l);}
    if(g.kind==='pencil'){let points=V.simplify(g.points,.3);if(points.length>64)points=Array.from({length:64},(_,i)=>points[Math.round(i*(points.length-1)/63)]);const path={closed:false,segments:points};points.forEach((_,i)=>V.smooth(path,i));addPath(points);draft=[];}
    render();
  }
  window.addEventListener('pointerup',()=>finishGesture());svg.addEventListener('pointercancel',()=>finishGesture(true));svg.addEventListener('lostpointercapture',()=>finishGesture(true));
  svg.addEventListener('dblclick',e=>{if(mode==='pen'||(mode==='add'&&draft.length)){finishPen();return;}if(mode!=='nodes'||!layer()||layer().locked||e.target.closest('[data-node]'))return;placeNode(world(e),true);});
  document.addEventListener('keydown',e=>{
    if(ed.exporting||document.querySelector('dialog[open]')||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'&&(gesture||draft.length)){e.preventDefault();e.stopImmediatePropagation();finishGesture(true);draft=[];render();return;}
    if(e.key==='Escape'&&(gesture||draft.length)){e.preventDefault();e.stopImmediatePropagation();finishGesture(true);draft=[];render();return;}
    if(e.target.closest?.('#vector-overlay [data-node]')&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();const target=e.target.closest('[data-node]'),index=Number(target.dataset.node),part=target.dataset.part;nodeIndex=index;const axis=e.key==='ArrowLeft'||e.key==='ArrowRight'?'X':'Y',delta=(e.shiftKey?5:.5)*(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1);nodeChange(p=>{const field=part==='anchor'?axis.toLowerCase():part+axis;p[field]+=delta;});svg.querySelector(`[data-node="${index}"][data-part="${part}"]`)?.focus({preventScroll:true});return;}
    if(e.key==='Escape'&&mode==='add'){e.preventDefault();e.stopImmediatePropagation();setMode(layer()?.type==='path'?'nodes':'select');return;}
    if(e.key==='Enter'&&draft.length){e.preventDefault();e.stopImmediatePropagation();finishPen();return;}
    if(['nodes','add','trajectory'].includes(mode)&&['Delete','Backspace'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();$('vector-delete-node').click();return;}
    if(!e.metaKey&&!e.ctrlKey&&!e.altKey){const next={v:'select',r:'rect',e:'ellipse',s:'star',p:'pen',b:'pencil',a:'nodes',n:'add',m:'trajectory',h:'hand'}[(e.code?.startsWith('Key')?e.code.slice(3):e.key).toLowerCase()];if(next){e.preventDefault();e.stopImmediatePropagation();setMode(next);}}
  },true);
  document.addEventListener('workshop-frame',render);document.addEventListener('workshop-change',()=>{if(!gesture)render();});document.addEventListener('workshop-layer-selection',()=>{if(gesture)return;if(selected!==U.chosen){nodeIndex=0;selected=U.chosen;}if((['nodes','add'].includes(mode)&&layer()&&layer().type!=='path')||(mode==='trajectory'&&!layer()?.tracks?.position?.length)){setMode('select');return;}render();});
  document.addEventListener('workshop-selection',()=>{if(scene!==ed.selected){finishGesture(true);draft=[];scene=ed.selected;nodeIndex=0;}queueMicrotask(render);});window.addEventListener('resize',render);window.addEventListener('blur',()=>{if(gesture)finishGesture(true);});
  window.WorkshopVector={setMode,render,convert,createTrajectory};render();
})();
