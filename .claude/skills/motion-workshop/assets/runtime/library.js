/* Offline effect discovery, original story recipes and prompt composition. MIT. */
(() => {
  'use strict';
  const E=window.MotionEffects,P=window.MotionProject;
  const itemEffects=['text-morph','card-flyin','card-flip','orbit-cards','bento-grid','chart-build','path-draw','phone-scroll','tab-indicator','cursor-click','beat-sync','line-chart','donut-chart','network-flow','timeline-story','code-window','terminal-run','isometric-stack','notification-stack'];
  const valueEffects=['chart-build','line-chart','donut-chart'];
  const palettes=[['#d8f36a','#a59bff','#10171c'],['#ff805a','#78b7ff','#151b26'],['#f394be','#80dbc4','#172329'],['#ede5d7','#c1a35b','#232320']];
  const tags={
    'product-launch':['logo-reveal','bento-grid','isometric-stack','mask-reveal'],
    'app-demo':['split-title','phone-scroll','notification-stack','card-flyin'],
    'data-report':['number-roll','line-chart','donut-chart','quote-card'],
    'explainer':['mask-reveal','network-flow','timeline-story','path-draw'],
    'type-showreel':['kinetic-zoom','split-title','type','text-morph'],
    'brand-intro':['gradient-mesh','logo-reveal','quote-card','particles'],
    'developer-release':['code-window','terminal-run','network-flow','mask-reveal'],
    'social-reel':['split-title','notification-stack','beat-sync','logo-reveal']
  };
  const stories=[
    ['product-launch','產品發表','從品牌開場、功能總覽到產品價值。','產品','16:9'],
    ['app-demo','App 介紹','手機畫面、操作回饋與功能卡片。','介面','9:16'],
    ['data-report','數據報告','計數、趨勢、比例與一段重點結論。','資料','16:9'],
    ['explainer','概念解說','以資料網絡、時間軸與步驟說清楚想法。','解說','16:9'],
    ['type-showreel','文字動態集錦','用大字、分割標題與關鍵字建立節奏。','文字','16:9'],
    ['brand-intro','品牌形象','漸層開場、幾何標誌、引言與粒子收尾。','品牌','16:9'],
    ['developer-release','軟體更新','程式視窗、指令演示與資料連結。','開發','16:9'],
    ['social-reel','直式短影音','四個短段落帶出重點，適合社群格式。','社群','9:16']
  ].map(([id,name,description,category,ratio])=>({id,name,description,category,ratio,effects:tags[id]}));
  function metadata(id){
    const d=E.definitions.find(e=>e.id===id);if(!d)throw new Error('Unknown effect: '+id);
    const parameters=['text','subtitle','color','secondary','background','duration','speed','size','transition','base','layers','audio'];
    if(itemEffects.includes(id))parameters.push('items');if(valueEffects.includes(id))parameters.push('values');
    if(id==='number-roll')parameters.push('value','suffix');if(id==='beat-sync')parameters.push('bpm');
    if(['particles','reaction','halftone','physics'].includes(id))parameters.push('amount');
    if(id.startsWith('mp-'))return {...d,parameters:[...parameters,'referenceTemplate'],tags:[d.category,window.MotionReference.entry(id.slice(3)).pack,...window.MotionReference.entry(id.slice(3)).tags],source:'reference-templates.js'};
    const tags=[d.category,...(itemEffects.includes(id)?['可換標籤']:[]),...(valueEffects.includes(id)?['真實數值']:[]),...(id.includes('code')||id==='terminal-run'?['程式展示']:[])];
    return {...d,parameters,tags,source:['line-chart','donut-chart','network-flow','timeline-story','code-window','terminal-run','logo-reveal','split-title','quote-card','gradient-mesh','isometric-stack','notification-stack'].includes(id)?'effects-pro.js':E.definitions.indexOf(d)<12?'effects.js':'effects-extra.js'};
  }
  function createStory(id,options={}){
    const recipe=stories.find(s=>s.id===id);if(!recipe)throw new Error('Unknown story: '+id);
    const brand=String(options.brand||'你的品牌').slice(0,40),headline=String(options.headline||'讓每個想法，清楚被看見').slice(0,60);
    const items=(Array.isArray(options.items)?options.items:['簡單上手','清楚呈現','流暢體驗']).map(s=>String(s).trim().slice(0,24)).filter(Boolean).slice(0,6);
    if(!items.length)items.push('開始創作');
    const fps=options.fps===60?60:30,duration=options.duration===undefined?15:Number(options.duration);
    if(![12,15,20,30].includes(duration))throw new Error('故事長度請使用 12、15、20 或 30 秒。');
    const palette=palettes[Number(options.palette)]||palettes[0],n=recipe.effects.length,overlap=Math.round(.6*fps),budget=duration*fps+(n-1)*overlap;
    const transitions=['push','blur','circle','cut'];
    const clips=recipe.effects.map((effect,i)=>{
      const clip={...P.defaultClip(effect),text:i===0?brand:i===n-1?headline:items[(i-1)%items.length],subtitle:i===0?headline:i===n-1?brand:'',items:[...items],values:items.map((_,j)=>[35,70,55,90,60,80][j]),duration:(Math.floor(budget/n)+(i<budget%n?1:0))/fps,color:palette[0],secondary:palette[1],background:palette[2],transition:{type:transitions[i%4],duration:.6}};
      if(valueEffects.includes(effect)){clip.text=effect==='donut-chart'?'比例分布':'成長趨勢';clip.subtitle='示意數據，請替換成你的實際資料';}
      if(effect==='number-roll'){clip.text='關鍵指標';clip.value=100;clip.suffix='%';clip.subtitle='示意數據';}
      if(effect==='code-window'){clip.items=['const idea = "create";','const motion = build(idea);','render(motion);'];clip.text=brand;}
      if(effect==='terminal-run'){clip.items=['build project','verify frames','ready to share'];clip.text='從想法到成品';}
      if(effect==='quote-card'){clip.text=headline;clip.subtitle=brand;}
      return clip;
    });
    return P.validate({version:2,ratio:options.ratio||recipe.ratio,quality:720,fps,clips});
  }
  function createPrompt(rawProject,options={}){
    const project=P.validate(rawProject),mode=options.mode||'video',rows=P.timeline(project);
    const scope=mode==='website'?'網站動畫':mode==='software'?'軟體介面動效':'影片與可編輯分鏡';
    const brief=String(options.brief||'請依這份分鏡與效果庫完成作品。').trim().slice(0,2000);
    const lines=[`# 動畫小工坊：${scope}`,'',brief,'','## 隨附資源','請先解壓縮隨附的 motion-workshop-skill.zip，閱讀 SKILL.md、assets/catalog.json，以及相關 references 文件。所有路徑相對於 skill 根目錄。','',`## 製作規格`,`畫面 ${project.ratio}，${project.quality}p，${project.fps} FPS，共 ${P.duration(project).toFixed(2)} 秒。`,'配色：'+[...new Set(project.clips.flatMap(c=>[c.color,c.secondary,c.background]))].join('、'),'','## 分鏡'];
    project.clips.forEach((clip,i)=>{const m=metadata(clip.effect),row=rows[i];lines.push(`${i+1}. ${row.start.toFixed(2)}–${row.end.toFixed(2)} 秒｜${m.name}（${clip.effect}）｜${clip.text.replace(/\n/g,' / ')}\n   實作：assets/runtime/${m.source}。接下一幕：${i===project.clips.length-1?'結束':P.transitionNames[row.transition]+'，重疊 '+row.overlap.toFixed(2)+' 秒'}。`);});
    for(const [i,c] of project.clips.entries())if(c.reference)lines.push(`場景 ${i+1} 使用 Motion Prompt #${c.reference.id} （${c.reference.kind}）；讀 references/motion-prompt.md 與 assets/runtime/reference-recipes.js，保留原版 ID 並說明改編。`);
    lines.push('','## 實作與驗證');
    if(mode==='website'||mode==='software')lines.push('參考 references/web-ui.md 與 assets/examples/software-ui/。保留主要內容的語意 HTML、鍵盤操作、焦點狀態與 prefers-reduced-motion；真實按鈕與標籤應由使用者操作觸發。Canvas 的手機、游標與程式視窗是示意畫面，不能冒充真實控制項。依現有專案框架改寫並清理動畫與事件監聽。');
    else lines.push('讀 references/video.md。使用 frame / fps 取得每格秒數；以 MotionProject.timeline() 分配時間與重疊。先交付可編輯 .motion.json 並執行 render.mjs --validate。具備 macOS App 與本機執行能力時才匯出 MP4；環境無法執行時，提供專案與必要步驟。2.0 支援多軌時間軸、獨立屬性關鍵格、動作片段、9 種圖層與 16 個 CC0 音效；先讀 references/timeline-and-motions.md 與 references/layers-and-audio.md。尚未支援外部音樂、旁白、影片匯入或透明影片。');
    lines.push('圖層、tracks 獨立關鍵影格、motions 動作片段與音效設定以專案 JSON 為準，讀 references/timeline-and-motions.md 與 references/layers-and-audio.md。動作疊加於手動軌道，請勿用套版覆蓋使用者的調整。若含內嵌圖片，下方指令省略圖片資料，請同時提供原始 .motion.json，保留其中的 image data URI。');
    lines.push('保留使用者提供的數字與文案；標示並替換示意資料。不要宣稱完成尚未產生的影片。檢查首尾影格、轉場中點與完整播放。','使用下列 JSON 作為可編輯起點：','','```json',JSON.stringify(project,(key,value)=>key==='image'&&value?'':value,2),'```');return lines.join('\n');
  }
  function createVectorDemo(options={}){
    const V=window.MotionVector,L=window.MotionLayers,p=P.blankProject({ratio:options.ratio||'16:9',fps:options.fps||30,duration:6,background:'#10171c'}),portrait=p.ratio==='9:16',square=p.ratio==='1:1';
    const heart=L.defaultLayer('path');heart.name='自由形狀 · 可拖曳節點';heart.end=6;heart.width=portrait?44:square?30:24;heart.height=portrait?27:square?34:45;heart.transform.x=portrait?50:square?25:27;heart.transform.y=portrait?34:square?42:50;heart.fill='#ff805a';heart.fillSecondary='#a59bff';heart.fillMode='linear';heart.gradientAngle=40;
    heart.path={closed:true,segments:[{...V.point(50,30),inX:30,inY:-30,outX:-30,outY:-30},{...V.point(15,55),inX:-15,inY:-25,outX:15,outY:25},{...V.point(50,95),inX:-20,inY:-15,outX:20,outY:-15},{...V.point(85,55),inX:-15,inY:25,outX:15,outY:-25}]};
    const shape=JSON.parse(JSON.stringify(heart.path));shape.segments[0].y=12;shape.segments[1].x=6;shape.segments[3].x=94;for(const [time,value] of [[0,heart.path],[3,shape],[6,heart.path]])L.setKey(heart,'path',time,value,{fps:p.fps,easing:'ease-in-out'});
    const title=L.defaultLayer('text');title.name='主標題';title.text='一個節點，無限種可能';title.end=6;title.width=portrait?90:55;title.height=18;title.fontSize=portrait?4.5:square?3.3:4.8;title.transform.x=portrait?50:67;title.transform.y=portrait?62:40;
    const caption=L.defaultLayer('text');caption.name='操作提示';caption.text='拖節點改輪廓，拉把手改路徑';caption.end=6;caption.fill='#a7b5c5';caption.width=portrait?90:55;caption.fontSize=portrait?2.5:square?2.2:2.8;caption.transform.x=portrait?50:67;caption.transform.y=portrait?75:57;
    const arrow=L.defaultLayer('arrow');arrow.name='軌跡箭頭 · 可拖曳路徑';arrow.end=6;arrow.width=portrait?9:6;arrow.height=portrait?4:8;arrow.fill='#83d9d0';arrow.orientToPath=true;
    const points=portrait?[[0,20,86,0,0,15,-5],[3,50,88,-10,0,10,0],[6,80,83,-12,8,0,0]]:[[0,45,82,0,0,12,-12],[3,67,80,-8,-5,8,5],[6,88,68,-8,12,0,0]];
    for(const [time,x,y,inX,inY,outX,outY] of points)L.setKey(arrow,'position',time,{x,y,inX,inY,outX,outY},{fps:p.fps,easing:'ease-in-out'});
    p.clips[0].layers=[heart,arrow,title,caption];p.clips[0].audio=[{sound:'expand',time:.2,volume:.5,rate:1,fadeIn:0,fadeOut:.05},{sound:'confirm',time:3,volume:.4,rate:1,fadeIn:0,fadeOut:.08}];return P.validate(p);
  }
  window.MotionLibrary={version:'2.1.1',stories,palettes,itemEffects,valueEffects,metadata,createStory,createPrompt,createVectorDemo};
})();
