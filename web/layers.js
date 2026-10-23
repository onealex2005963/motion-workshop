/* Editable Canvas layers and deterministic keyframes. MIT. Coordinates are percentages. */
(() => {
  'use strict';
  const V=window.MotionVector;
  const number=(v,a,b,d)=>typeof v==='number'&&Number.isFinite(v)?Math.max(a,Math.min(b,v)):d;
  const color=(v,d)=>/^#[0-9a-f]{6}$/i.test(v||'')?v:d;
  const easingNames={linear:'線性','ease-in':'漸入','ease-out':'漸出','ease-in-out':'平滑進出',back:'回彈',bounce:'彈跳',step:'保持／跳切'};
  const types={text:'文字',rect:'圓角矩形',ellipse:'橢圓',line:'線條',image:'圖片',triangle:'三角形',polygon:'多邊形',star:'星形',arrow:'箭頭',path:'自由路徑'};
  const properties=['x','y','scale','rotation','opacity'];
  const maxLayers=32,maxKeys=1201,maxMotions=12;
  const propertyNames={x:'X 位置',y:'Y 位置',scale:'整體縮放',scaleX:'水平縮放',scaleY:'垂直縮放',rotation:'旋轉',opacity:'透明度',width:'寬度',height:'高度',fill:'填色',strokeWidth:'描邊粗細',radius:'圓角',path:'形狀路徑',position:'移動路徑'};
  const animatedProperties=Object.keys(propertyNames);
  const ranges={x:[-100,200,50],y:[-100,200,50],scale:[.05,5,1],scaleX:[.05,5,1],scaleY:[.05,5,1],rotation:[-10800,10800,0],opacity:[0,1,1],width:[1,200,45],height:[1,200,20],strokeWidth:[0,30,0],radius:[0,100,18]};
  const motionPresets={rise:{name:'位移進場',phase:'in'},slide:{name:'側滑進場',phase:'in'},pop:{name:'彈跳進場',phase:'in'},spin:{name:'旋轉進場',phase:'in'},fade:{name:'淡入',phase:'in'},zoom:{name:'縮放進場',phase:'in'},drop:{name:'落下回彈',phase:'in'},float:{name:'輕盈漂浮',phase:'loop'},pulse:{name:'呼吸縮放',phase:'loop'},wiggle:{name:'搖擺',phase:'loop'},orbit:{name:'環繞',phase:'loop'},'spin-loop':{name:'持續旋轉',phase:'loop'},'fade-out':{name:'淡出',phase:'out'},'slide-out':{name:'位移退場',phase:'out'},shrink:{name:'縮小退場',phase:'out'},'spin-out':{name:'旋轉退場',phase:'out'}};
  const snap=(t,fps)=>Math.round(t*fps)/fps;
  const curveOf=v=>Array.isArray(v)&&v.length===4?v.map((n,i)=>number(n,i%2?-3:0,i%2?3:1,[.25,.1,.25,1][i])):[.25,.1,.25,1];
  const valueOf=(p,v,f)=>p==='path'?V.normalize(v||f):p==='position'?V.segment(v||f):p==='fill'?color(v,f||'#d8f36a'):number(v,...ranges[p].slice(0,2),f??ranges[p][2]);
  function normalizeTracks(raw,duration,fps){
    const out={};for(const p of animatedProperties)if(Array.isArray(raw?.[p])){const frames=new Map();for(const k of raw[p].slice(0,maxKeys)){if(!Number.isFinite(k?.time))continue;const time=snap(number(k.time,0,duration,0),fps);frames.set(time,{time,value:valueOf(p,k.value),easing:easingNames[k.easing]||k.easing==='cubic'?k.easing:'ease-in-out',...(k.easing==='cubic'?{curve:curveOf(k.curve)}:{})});}out[p]=[...frames.values()].sort((a,b)=>a.time-b.time);}return out;
  }
  function normalizeMotions(raw,duration,fps){return(Array.isArray(raw)?raw:[]).slice(0,maxMotions).filter(m=>motionPresets[m?.preset]).map((m,i)=>{const start=snap(number(m.start,0,Math.max(0,duration-1/fps),0),fps);return{id:'motion-'+i,preset:m.preset,start,duration:Math.max(1/fps,snap(number(m.duration,1/fps,duration-start,.6),fps)),strength:number(m.strength,.1,3,1),direction:['up','down','left','right'].includes(m.direction)?m.direction:'up',repeat:Math.round(number(m.repeat,1,20,1)),easing:easingNames[m.easing]||m.easing==='cubic'?m.easing:'ease-out',curve:curveOf(m.curve),enabled:m.enabled!==false};});}
  function transform(v={}){return {x:number(v.x,-100,200,50),y:number(v.y,-100,200,50),scale:number(v.scale,.05,5,1),rotation:number(v.rotation,-1080,1080,0),opacity:number(v.opacity,0,1,1)};}
  function defaultLayer(type='text'){
    return {id:'layer',name:types[type]||types.text,type:types[type]?type:'text',visible:true,locked:false,text:'你的文字',fill:'#d8f36a',stroke:'#ffffff',strokeWidth:0,width:type==='line'?40:45,height:type==='line'?1:20,radius:18,fontSize:7,fontFamily:'sans',weight:700,align:'center',blend:'source-over',start:0,end:20,transform:transform(),keyframes:[],tracks:{},motions:[],scaleX:1,scaleY:1,anchorX:50,anchorY:50,sides:5,innerRadius:.45,fillMode:'solid',fillSecondary:'#a59bff',gradientAngle:90,dash:0,path:V.normalize(),fillEnabled:true,positionEnabled:true,orientToPath:false};
  }
  function normalizeLayers(raw,duration,fps){
    if(!Array.isArray(raw))return [];
    return raw.slice(0,maxLayers).map((v,i)=>{
      v=v&&typeof v==='object'?v:{};const d=defaultLayer(v.type),base=transform(v.transform),frames=new Map();
      for(const k of Array.isArray(v.keyframes)?v.keyframes.slice(0,maxKeys):[]){
        if(!k||!Number.isFinite(k.time))continue;
        const time=Math.round(number(k.time,0,duration,0)*fps)/fps;
        frames.set(time,{time,...transform({...base,...k}),easing:easingNames[k.easing]||k.easing==='cubic'?k.easing:'ease-in-out',...(k.easing==='cubic'?{curve:curveOf(k.curve)}:{})});
      }
      return {...d,id:'layer-'+i,name:typeof v.name==='string'?v.name.slice(0,40):d.name,type:d.type,visible:v.visible!==false,locked:v.locked===true,text:typeof v.text==='string'?v.text.slice(0,400):d.text,image:typeof v.image==='string'&&v.image.length<=2000000&&/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(v.image)?v.image:'',fill:color(v.fill,d.fill),stroke:color(v.stroke,d.stroke),strokeWidth:number(v.strokeWidth,0,30,0),width:number(v.width,1,200,d.width),height:number(v.height,1,200,d.height),radius:number(v.radius,0,100,18),fontSize:number(v.fontSize,1,50,7),fontFamily:['sans','serif','mono'].includes(v.fontFamily)?v.fontFamily:'sans',weight:[400,700,900].includes(v.weight)?v.weight:700,align:['left','center','right'].includes(v.align)?v.align:'center',blend:['source-over','multiply','screen','overlay'].includes(v.blend)?v.blend:'source-over',start:snap(number(v.start,0,duration,0),fps),end:snap(Math.max(number(v.start,0,duration,0),number(v.end,0,duration,duration)),fps),scaleX:number(v.scaleX,.05,5,1),scaleY:number(v.scaleY,.05,5,1),anchorX:number(v.anchorX,0,100,50),anchorY:number(v.anchorY,0,100,50),sides:Math.round(number(v.sides,3,12,5)),innerRadius:number(v.innerRadius,.1,.9,.45),fillMode:['solid','linear','radial'].includes(v.fillMode)?v.fillMode:'solid',fillSecondary:color(v.fillSecondary,'#a59bff'),gradientAngle:number(v.gradientAngle,-360,360,90),dash:number(v.dash,0,40,0),path:V.normalize(v.path),fillEnabled:v.fillEnabled!==false,positionEnabled:v.positionEnabled!==false,orientToPath:v.orientToPath===true,tracks:normalizeTracks(v.tracks,duration,fps),motions:normalizeMotions(v.motions,duration,fps),transform:base,keyframes:[...frames.values()].sort((a,b)=>a.time-b.time)};
    });
  }
  function ease(name,t,curve){
    t=Math.max(0,Math.min(1,t));
    if(name==='cubic'){const [x1,y1,x2,y2]=curveOf(curve),b=(u,a,c)=>3*(1-u)**2*u*a+3*(1-u)*u*u*c+u**3;let lo=0,hi=1;for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(b(mid,x1,x2)<t)lo=mid;else hi=mid;}return b((lo+hi)/2,y1,y2);}
    if(name==='step')return t===1?1:0;
    if(name==='ease-in')return t*t*t;
    if(name==='ease-out')return 1-(1-t)**3;
    if(name==='ease-in-out')return t*t*(3-2*t);
    if(name==='back'){const c=1.70158;return 1+(c+1)*(t-1)**3+c*(t-1)**2;}
    if(name==='bounce'){const n=7.5625,d=2.75;if(t<1/d)return n*t*t;if(t<2/d){t-=1.5/d;return n*t*t+.75;}if(t<2.5/d){t-=2.25/d;return n*t*t+.9375;}t-=2.625/d;return n*t*t+.984375;}
    return t;
  }
  function legacySample(layer,time){
    const keys=layer.keyframes||[];
    if(!keys.length)return {...layer.transform};
    if(time<=keys[0].time)return transform(keys[0]);
    for(let i=1;i<keys.length;i++)if(time<keys[i].time){const a=keys[i-1],b=keys[i],u=ease(b.easing,(time-a.time)/(b.time-a.time),b.curve),out={};for(const key of properties)out[key]=a[key]+(b[key]-a[key])*u;out.opacity=Math.max(0,Math.min(1,out.opacity));out.scale=Math.max(.01,out.scale);return out;}
    return transform(keys.at(-1));
  }
  function baseValue(layer,p){if(p==='position')return V.segment(layer.transform);return valueOf(p,properties.includes(p)?layer.transform?.[p]:layer[p]);}
  function lerp(p,a,b,u){if(p==='path')return V.interpolate(a,b,u);if(p==='position')return V.cubic(a,b,u);if(p==='fill'){const ac=parseInt(a.slice(1),16),bc=parseInt(b.slice(1),16);return '#'+[16,8,0].map(n=>Math.round(Math.max(0,Math.min(255,((ac>>n)&255)+(((bc>>n)&255)-((ac>>n)&255))*u))).toString(16).padStart(2,'0')).join('');}return a+(b-a)*u;}
  function trackSample(p,keys,time,fallback){if(!keys.length)return fallback;if(time<=keys[0].time)return p==='position'?V.cubic(keys[0].value,keys[1]?.value||keys[0].value,0):keys[0].value;for(let i=1;i<keys.length;i++)if(time<keys[i].time){const a=keys[i-1],b=keys[i];return lerp(p,a.value,b.value,ease(b.easing,(time-a.time)/(b.time-a.time),b.curve));}return p==='position'?V.cubic(keys.at(-2)?.value||keys.at(-1).value,keys.at(-1).value,1):keys.at(-1).value;}
  function sampleBase(layer,time,ratio=1){const out={...legacySample(layer,time)};for(const p of animatedProperties){if(!(p in out))out[p]=baseValue(layer,p);if(Object.hasOwn(layer.tracks||{},p))out[p]=trackSample(p,layer.tracks[p],time,baseValue(layer,p));}if(layer.positionEnabled!==false&&layer.tracks?.position?.length){out.x=out.position.x;out.y=out.position.y;if(layer.orientToPath)out.rotation+=Math.atan2(out.position.tangentY||0,(out.position.tangentX||0)*ratio)*180/Math.PI;}return out;}
  function motionDelta(layer,time){const out={x:0,y:0,rotation:0,scale:1,opacity:1};for(const m of layer.motions||[]){if(!m.enabled)continue;const phase=motionPresets[m.preset].phase,raw=(time-m.start)/m.duration,u=Math.max(0,Math.min(1,raw)),v=phase==='loop'?u: ease(m.easing,u,m.curve),q=phase==='in'?1-v:v,amp=m.strength,vec={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[m.direction],offset=phase==='in'?-1:1;
      if(phase==='loop'){if(raw<0||raw>1)continue;const a=2*Math.PI*u*m.repeat;if(m.preset==='float')out.y-=Math.sin(a)*5*amp;if(m.preset==='pulse')out.scale*=1+Math.sin(a)*.09*amp;if(m.preset==='wiggle')out.rotation+=Math.sin(a)*12*amp;if(m.preset==='orbit'){out.x+=Math.sin(a)*8*amp;out.y+=(1-Math.cos(a))*5*amp;}if(m.preset==='spin-loop')out.rotation+=360*u*m.repeat+Math.sin(a)*30*(amp-1);continue;}
      out.opacity*=Math.max(0,Math.min(1,phase==='in'?u*3:(1-u)*3));
      if(['rise','slide','drop','slide-out'].includes(m.preset)){const dist=(m.preset==='slide'?30:18)*amp*q*offset;out.x+=vec[0]*dist;out.y+=vec[1]*dist;}
      if(['pop','zoom','shrink','spin','spin-out'].includes(m.preset))out.scale*=Math.max(.02,1-q*.8*Math.min(1.2,amp));
      if(['spin','spin-out'].includes(m.preset))out.rotation+=q*180*amp*offset;
      if(m.preset==='fade'||m.preset==='fade-out')out.opacity*=Math.max(0,Math.min(1,phase==='in'?v:1-v));
    }return out;}
  function sample(layer,time,ratio=1){const out=sampleBase(layer,time,ratio),m=motionDelta(layer,time);out.x+=m.x;out.y+=m.y;out.rotation+=m.rotation;out.scale=Math.max(.01,out.scale*m.scale);out.scaleX=Math.max(.01,out.scaleX);out.scaleY=Math.max(.01,out.scaleY);out.opacity=Math.max(0,Math.min(1,out.opacity*m.opacity));out.width=Math.max(1,out.width);out.height=Math.max(1,out.height);out.radius=Math.max(0,out.radius);out.strokeWidth=Math.max(0,out.strokeWidth);return out;}
  function propertyKeys(layer,p){if(Object.hasOwn(layer.tracks||{},p))return layer.tracks[p];return properties.includes(p)?(layer.keyframes||[]).map(k=>({time:k.time,value:k[p],easing:k.easing,...(k.curve?{curve:k.curve}:{})})):[];}
  function setKey(layer,p,time,value,options={}){if(!animatedProperties.includes(p))throw new Error('不支援的動畫屬性');layer.tracks??={};if(!Object.hasOwn(layer.tracks,p))layer.tracks[p]=propertyKeys(layer,p).map(k=>({...k}));const keys=layer.tracks[p],t=snap(number(time,0,options.duration??20,0),options.fps||30),existing=keys.find(k=>Math.abs(k.time-t)<.5/(options.fps||30));if(!existing&&keys.length>=maxKeys)throw new Error('這個屬性的關鍵格已達上限');const key={time:t,value:valueOf(p,value),easing:options.easing||'ease-in-out',...(options.easing==='cubic'?{curve:curveOf(options.curve)}:{})};if(existing)Object.assign(existing,key);else keys.push(key);keys.sort((a,b)=>a.time-b.time);return key;}
  function edit(layer,time,values,options={}){const m=motionDelta(layer,time);for(const [p,value] of Object.entries(values)){if(!animatedProperties.includes(p))continue;if((p==='x'||p==='y')&&layer.positionEnabled!==false&&layer.tracks?.position?.length){const at=propertyKeys(layer,'position').find(k=>Math.abs(k.time-time)<.5/(options.fps||30)),v={...(at?.value||sampleBase(layer,time).position),[p]:value-m[p]};setKey(layer,'position',time,v,options);continue;}let v=value;if(p==='rotation'&&layer.positionEnabled!==false&&layer.orientToPath&&layer.tracks?.position?.length)v-=Math.atan2(sampleBase(layer,time).position.tangentY||0,(sampleBase(layer,time).position.tangentX||0)*(options.ratio||1))*180/Math.PI;if(p==='x'||p==='y'||p==='rotation')v-=m[p];if(p==='scale'||p==='opacity')v/=Math.max(.001,m[p]);if(options.key||propertyKeys(layer,p).length){if(!propertyKeys(layer,p).length&&time>layer.start)setKey(layer,p,layer.start,baseValue(layer,p),options);setKey(layer,p,time,v,options);}else if(properties.includes(p))layer.transform[p]=valueOf(p,v);else layer[p]=valueOf(p,v);}return layer;}
  function addMotion(layer,preset,options={}){if(!motionPresets[preset])throw new Error('找不到動作範本');if((layer.motions||[]).length>=maxMotions)throw new Error('每層最多 12 段動作');const duration=options.sceneDuration||20,m={preset,start:options.start??layer.start,duration:options.duration??.6,strength:options.strength??1,direction:options.direction||'up',repeat:options.repeat??1,easing:options.easing||(preset==='pop'||preset==='drop'?'back':'ease-out'),enabled:true};layer.motions=normalizeMotions([...(layer.motions||[]),m],duration,options.fps||30);return layer.motions.at(-1);}
  function bake(layer,duration,fps,ratio=1){if(!layer.motions?.length)return false;const values=Array.from({length:Math.round(duration*fps)+1},(_,i)=>({time:i/fps,pose:sample(layer,i/fps,ratio)}));layer.tracks??={};for(const p of properties)layer.tracks[p]=values.map(v=>({time:v.time,value:v.pose[p],easing:'linear'}));layer.motions=[];if(layer.tracks.position?.length)layer.positionEnabled=false;return true;}
  function shiftLayer(layer,delta,duration,fps){const times=[layer.start,layer.end,...(layer.keyframes||[]).map(k=>k.time),...Object.values(layer.tracks||{}).flat().map(k=>k.time),...(layer.motions||[]).flatMap(m=>[m.start,m.start+m.duration])],d=snap(Math.max(-Math.min(...times),Math.min(duration-Math.max(...times),delta)),fps);layer.start=snap(layer.start+d,fps);layer.end=snap(layer.end+d,fps);for(const k of layer.keyframes||[])k.time=snap(k.time+d,fps);for(const keys of Object.values(layer.tracks||{}))for(const k of keys)k.time=snap(k.time+d,fps);for(const m of layer.motions||[])m.start=snap(m.start+d,fps);return d;}
  function shiftKeys(layer,property,times,delta,duration,fps){const source=property==='legacy'?layer.keyframes:layer.tracks?.[property];if(!source)return false;const selected=source.filter(k=>times.some(t=>Math.abs(t-k.time)<.5/fps));if(!selected.length)return false;const d=snap(delta,fps),other=source.filter(k=>!selected.includes(k));if(selected.some(k=>k.time+d<0||k.time+d>duration||other.some(o=>Math.abs(o.time-k.time-d)<.5/fps)))return false;for(const k of selected)k.time=snap(k.time+d,fps);source.sort((a,b)=>a.time-b.time);return true;}
  function corners(layer,time,ratio){const m=sample(layer,time,ratio);if(layer.type==='path'){const b=V.bounds(m.path);return [[b.minX,b.minY],[b.maxX,b.minY],[b.maxX,b.maxY],[b.minX,b.maxY]].map(([x,y])=>V.toWorld(layer,m,{x,y},ratio));}const r=m.rotation*Math.PI/180,ww=m.width*m.scale*m.scaleX*ratio,hh=Math.max(m.height,layer.type==='text'?layer.fontSize*1.5:1)*m.scale*m.scaleY,ax=layer.anchorX??50,ay=layer.anchorY??50;return[[0,0],[1,0],[1,1],[0,1]].map(([x,y])=>{const xx=(x-ax/100)*ww,yy=(y-ay/100)*hh;return{x:m.x+(xx*Math.cos(r)-yy*Math.sin(r))/ratio,y:m.y+xx*Math.sin(r)+yy*Math.cos(r)};});}
  const fonts={sans:'-apple-system, BlinkMacSystemFont, "PingFang TC", sans-serif',serif:'"Songti TC", Georgia, serif',mono:'Menlo, monospace'};
  const images=new Map();
  function imageAsset(data){
    if(images.has(data))return images.get(data);
    const image=new Image(),entry={image,ready:false};entry.promise=new Promise((resolve,reject)=>{image.onload=()=>{entry.ready=true;resolve(image);};image.onerror=()=>{images.delete(data);reject(new Error('圖片無法解碼，請重新匯入。'));};});
    entry.promise.catch(()=>{});images.set(data,entry);image.src=data;return entry;
  }
  async function prepare(project){
    const used=new Set(project.clips.flatMap(c=>(c.layers||[]).filter(l=>l.type==='image'&&l.image).map(l=>l.image)));
    for(const key of images.keys())if(!used.has(key))images.delete(key);
    await Promise.all([...used].map(data=>imageAsset(data).promise));
  }
  function textLines(ctx,text,maxWidth){
    const lines=[];for(const paragraph of text.split('\n')){let line='';for(const ch of Array.from(paragraph)){if(line&&ctx.measureText(line+ch).width>maxWidth){lines.push(line);line=ch;}else line+=ch;}lines.push(line);}return lines;
  }
  function drawLayer(ctx,w,h,t,layer){
    if(!layer.visible||t<layer.start||t>layer.end)return;
    const m=sample(layer,t,w/h),lw=w*m.width/100,lh=h*m.height/100;
    ctx.save();ctx.translate(w*m.x/100,h*m.y/100);ctx.rotate(m.rotation*Math.PI/180);ctx.scale(m.scale*m.scaleX,m.scale*m.scaleY);ctx.translate((50-(layer.anchorX??50))/100*lw,(50-(layer.anchorY??50))/100*lh);ctx.globalAlpha=m.opacity;ctx.globalCompositeOperation=layer.blend;ctx.fillStyle=m.fill;ctx.strokeStyle=layer.stroke;ctx.lineWidth=m.strokeWidth*h/720;if(layer.dash)ctx.setLineDash([layer.dash*h/720,layer.dash*h/720]);if(layer.fillMode&&layer.fillMode!=='solid'){const angle=(layer.gradientAngle||0)*Math.PI/180,dx=Math.cos(angle)*lw/2,dy=Math.sin(angle)*lh/2,g=layer.fillMode==='radial'?ctx.createRadialGradient(0,0,0,0,0,Math.max(lw,lh)/2):ctx.createLinearGradient(-dx,-dy,dx,dy);g.addColorStop(0,m.fill);g.addColorStop(1,layer.fillSecondary);ctx.fillStyle=g;}ctx.beginPath();
    if(layer.type==='image'){
      if(layer.image){const entry=imageAsset(layer.image);if(entry.ready){const image=entry.image,scale=Math.min(lw/image.width,lh/image.height);ctx.drawImage(image,-image.width*scale/2,-image.height*scale/2,image.width*scale,image.height*scale);}}
    }else if(layer.type==='text'){
      const size=h*layer.fontSize/100;ctx.font=`${layer.weight} ${size}px ${fonts[layer.fontFamily]}`;ctx.textAlign=layer.align;ctx.textBaseline='middle';
      const lines=textLines(ctx,layer.text,lw),lineHeight=size*1.2,x=layer.align==='left'?-lw/2:layer.align==='right'?lw/2:0;
      lines.forEach((text,i)=>{const y=(i-(lines.length-1)/2)*lineHeight;if(m.strokeWidth)ctx.strokeText(text,x,y);ctx.fillText(text,x,y);});
    }else{
      if(layer.type==='ellipse')ctx.ellipse(0,0,lw/2,lh/2,0,0,Math.PI*2);
      else if(layer.type==='line'){ctx.moveTo(-lw/2,0);ctx.lineTo(lw/2,0);ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=Math.max(h/720,lh);ctx.lineCap='round';}
      else if(['triangle','polygon','star'].includes(layer.type)){const n=layer.type==='triangle'?3:layer.sides||5,count=layer.type==='star'?n*2:n;for(let i=0;i<count;i++){const a=-Math.PI/2+i/count*Math.PI*2,r=layer.type==='star'&&i%2?layer.innerRadius:1,x=Math.cos(a)*lw/2*r,y=Math.sin(a)*lh/2*r;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.closePath();}
      else if(layer.type==='arrow'){ctx.moveTo(-lw/2,-lh*.2);ctx.lineTo(lw*.1,-lh*.2);ctx.lineTo(lw*.1,-lh/2);ctx.lineTo(lw/2,0);ctx.lineTo(lw*.1,lh/2);ctx.lineTo(lw*.1,lh*.2);ctx.lineTo(-lw/2,lh*.2);ctx.closePath();}
      else if(layer.type==='path')V.draw(ctx,m.path,lw,lh);
      else {const r=Math.min(m.radius*h/720,lw/2,lh/2);ctx.roundRect(-lw/2,-lh/2,lw,lh,r);}
      if(layer.type==='line')ctx.stroke();else {if(layer.fillEnabled!==false&&(layer.type!=='path'||m.path.closed))ctx.fill();if(m.strokeWidth)ctx.stroke();}
    }ctx.restore();
  }
  const buffers=new WeakMap();
  function renderClip(ctx,w,h,t,clip){
    const base=clip.base||{visible:true,...transform()};
    if(base.visible!==false){
      if(base.x===50&&base.y===50&&base.scale===1&&base.rotation===0&&base.opacity===1)window.MotionEffects.render(ctx,w,h,t,clip);
      else {
        let off=buffers.get(ctx.canvas);if(!off){off=document.createElement('canvas');buffers.set(ctx.canvas,off);}if(off.width!==w||off.height!==h){off.width=w;off.height=h;}
        window.MotionEffects.render(off.getContext('2d',{alpha:false}),w,h,t,clip);ctx.fillStyle=clip.background;ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(w*base.x/100,h*base.y/100);ctx.rotate(base.rotation*Math.PI/180);ctx.scale(base.scale,base.scale);ctx.globalAlpha=base.opacity;ctx.drawImage(off,-w/2,-h/2);ctx.restore();
      }
    }else {ctx.fillStyle=clip.background;ctx.fillRect(0,0,w,h);}
    for(const layer of clip.layers||[])drawLayer(ctx,w,h,t,layer);
  }
  function hitTest(layer,time,x,y,ratio){
    if(!layer.visible||layer.locked||time<layer.start||time>layer.end)return false;
    const m=sample(layer,time,ratio),r=-m.rotation*Math.PI/180,dx=(x-m.x)*ratio,dy=y-m.y,px=(dx*Math.cos(r)-dy*Math.sin(r))/(m.scale*m.scaleX)+(layer.anchorX??50)/100*m.width*ratio,py=(dx*Math.sin(r)+dy*Math.cos(r))/(m.scale*m.scaleY)+(layer.anchorY??50)/100*Math.max(m.height,layer.type==='text'?layer.fontSize*1.5:2);
    if(layer.type==='path'){const ss=m.path.segments,xx=ss.flatMap(p=>[p.x,p.x+p.inX,p.x+p.outX]),yy=ss.flatMap(p=>[p.y,p.y+p.inY,p.y+p.outY]),nx=px/(m.width*ratio)*100,ny=py/m.height*100;return nx>=Math.min(...xx)-3&&nx<=Math.max(...xx)+3&&ny>=Math.min(...yy)-3&&ny<=Math.max(...yy)+3;}
    return px>=0&&px<=m.width*ratio&&py>=0&&py<=Math.max(m.height,layer.type==='text'?layer.fontSize*1.5:2);
  }
  window.MotionLayers={properties,animatedProperties,propertyNames,motionPresets,maxLayers,maxKeys,maxMotions,types,easingNames,transform,defaultLayer,normalizeLayers,ease,sample,sampleBase,motionDelta,propertyKeys,setKey,edit,addMotion,bake,shiftLayer,shiftKeys,corners,renderClip,hitTest,prepare};
})();
