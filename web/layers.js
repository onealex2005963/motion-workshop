/* Editable Canvas layers and deterministic keyframes. MIT. Coordinates are percentages. */
(() => {
  'use strict';
  const number=(v,a,b,d)=>typeof v==='number'&&Number.isFinite(v)?Math.max(a,Math.min(b,v)):d;
  const color=(v,d)=>/^#[0-9a-f]{6}$/i.test(v||'')?v:d;
  const easingNames={linear:'線性','ease-in':'漸入','ease-out':'漸出','ease-in-out':'平滑進出',back:'回彈',bounce:'彈跳',step:'保持／跳切'};
  const types={text:'文字',rect:'圓角矩形',ellipse:'橢圓',line:'線條',image:'圖片'};
  const properties=['x','y','scale','rotation','opacity'];
  function transform(v={}){return {x:number(v.x,-100,200,50),y:number(v.y,-100,200,50),scale:number(v.scale,.05,5,1),rotation:number(v.rotation,-1080,1080,0),opacity:number(v.opacity,0,1,1)};}
  function defaultLayer(type='text'){
    return {id:'layer',name:types[type]||types.text,type:types[type]?type:'text',visible:true,locked:false,text:'你的文字',fill:'#d8f36a',stroke:'#ffffff',strokeWidth:0,width:type==='line'?40:45,height:type==='line'?1:20,radius:18,fontSize:7,fontFamily:'sans',weight:700,align:'center',blend:'source-over',start:0,end:20,transform:transform(),keyframes:[]};
  }
  function normalizeLayers(raw,duration,fps){
    if(!Array.isArray(raw))return [];
    return raw.slice(0,12).map((v,i)=>{
      v=v&&typeof v==='object'?v:{};const d=defaultLayer(v.type),base=transform(v.transform),frames=new Map();
      for(const k of Array.isArray(v.keyframes)?v.keyframes.slice(0,60):[]){
        if(!k||!Number.isFinite(k.time))continue;
        const time=Math.round(number(k.time,0,duration,0)*fps)/fps;
        frames.set(time,{time,...transform({...base,...k}),easing:easingNames[k.easing]?k.easing:'ease-in-out'});
      }
      return {...d,id:'layer-'+i,name:typeof v.name==='string'?v.name.slice(0,40):d.name,type:d.type,visible:v.visible!==false,locked:v.locked===true,text:typeof v.text==='string'?v.text.slice(0,400):d.text,image:typeof v.image==='string'&&v.image.length<=2000000&&/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(v.image)?v.image:'',fill:color(v.fill,d.fill),stroke:color(v.stroke,d.stroke),strokeWidth:number(v.strokeWidth,0,30,0),width:number(v.width,1,200,d.width),height:number(v.height,1,200,d.height),radius:number(v.radius,0,100,18),fontSize:number(v.fontSize,1,50,7),fontFamily:['sans','serif','mono'].includes(v.fontFamily)?v.fontFamily:'sans',weight:[400,700,900].includes(v.weight)?v.weight:700,align:['left','center','right'].includes(v.align)?v.align:'center',blend:['source-over','multiply','screen','overlay'].includes(v.blend)?v.blend:'source-over',start:number(v.start,0,duration,0),end:number(v.end,0,duration,duration),transform:base,keyframes:[...frames.values()].sort((a,b)=>a.time-b.time)};
    });
  }
  function ease(name,t){
    t=Math.max(0,Math.min(1,t));
    if(name==='step')return t===1?1:0;
    if(name==='ease-in')return t*t*t;
    if(name==='ease-out')return 1-(1-t)**3;
    if(name==='ease-in-out')return t*t*(3-2*t);
    if(name==='back'){const c=1.70158;return 1+(c+1)*(t-1)**3+c*(t-1)**2;}
    if(name==='bounce'){const n=7.5625,d=2.75;if(t<1/d)return n*t*t;if(t<2/d){t-=1.5/d;return n*t*t+.75;}if(t<2.5/d){t-=2.25/d;return n*t*t+.9375;}t-=2.625/d;return n*t*t+.984375;}
    return t;
  }
  function sample(layer,time){
    const keys=layer.keyframes||[];
    if(!keys.length)return {...layer.transform};
    if(time<=keys[0].time)return transform(keys[0]);
    for(let i=1;i<keys.length;i++)if(time<keys[i].time){const a=keys[i-1],b=keys[i],u=ease(b.easing,(time-a.time)/(b.time-a.time)),out={};for(const key of properties)out[key]=a[key]+(b[key]-a[key])*u;out.opacity=Math.max(0,Math.min(1,out.opacity));out.scale=Math.max(.01,out.scale);return out;}
    return transform(keys.at(-1));
  }
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
    const m=sample(layer,t),lw=w*layer.width/100,lh=h*layer.height/100;
    ctx.save();ctx.translate(w*m.x/100,h*m.y/100);ctx.rotate(m.rotation*Math.PI/180);ctx.scale(m.scale,m.scale);ctx.globalAlpha=m.opacity;ctx.globalCompositeOperation=layer.blend;ctx.fillStyle=layer.fill;ctx.strokeStyle=layer.stroke;ctx.lineWidth=layer.strokeWidth*h/720;ctx.beginPath();
    if(layer.type==='image'){
      if(layer.image){const entry=imageAsset(layer.image);if(entry.ready){const image=entry.image,scale=Math.min(lw/image.width,lh/image.height);ctx.drawImage(image,-image.width*scale/2,-image.height*scale/2,image.width*scale,image.height*scale);}}
    }else if(layer.type==='text'){
      const size=h*layer.fontSize/100;ctx.font=`${layer.weight} ${size}px ${fonts[layer.fontFamily]}`;ctx.textAlign=layer.align;ctx.textBaseline='middle';
      const lines=textLines(ctx,layer.text,lw),lineHeight=size*1.2,x=layer.align==='left'?-lw/2:layer.align==='right'?lw/2:0;
      lines.forEach((text,i)=>{const y=(i-(lines.length-1)/2)*lineHeight;if(layer.strokeWidth)ctx.strokeText(text,x,y);ctx.fillText(text,x,y);});
    }else{
      if(layer.type==='ellipse')ctx.ellipse(0,0,lw/2,lh/2,0,0,Math.PI*2);
      else if(layer.type==='line'){ctx.moveTo(-lw/2,0);ctx.lineTo(lw/2,0);ctx.strokeStyle=layer.fill;ctx.lineWidth=Math.max(h/720,lh);ctx.lineCap='round';}
      else {const r=Math.min(layer.radius*h/720,lw/2,lh/2);ctx.roundRect(-lw/2,-lh/2,lw,lh,r);}
      if(layer.type==='line')ctx.stroke();else {ctx.fill();if(layer.strokeWidth)ctx.stroke();}
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
    const m=sample(layer,time),r=-m.rotation*Math.PI/180,dx=(x-m.x)*ratio,dy=y-m.y,px=(dx*Math.cos(r)-dy*Math.sin(r))/m.scale,py=(dx*Math.sin(r)+dy*Math.cos(r))/m.scale;
    return Math.abs(px)<=layer.width*ratio/2&&Math.abs(py)<=Math.max(layer.height,layer.type==='text'?layer.fontSize*1.5:2)/2;
  }
  window.MotionLayers={properties,types,easingNames,transform,defaultLayer,normalizeLayers,ease,sample,renderClip,hitTest,prepare};
})();
