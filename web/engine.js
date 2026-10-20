/* Public composition API. Shared by the editor, Claude projects and MP4 export. */
(() => {
  const E=window.MotionEffects,L=window.MotionLayers,A=window.MotionAudio,types=['cut','crossfade','push','wipe','circle','zoom','slide-up','diagonal','blur','flash'];
  const transitionNames={cut:'直接切換',crossfade:'柔和交疊',push:'水平推移',wipe:'側向揭幕',circle:'圓形擴散',zoom:'縮放接續','slide-up':'垂直推移',diagonal:'斜角揭幕',blur:'失焦交疊',flash:'閃光接續'};
  const bounded=(v,min,max,f)=>typeof v==='number'&&Number.isFinite(v)?Math.max(min,Math.min(max,v)):f;
  const color=(v,f)=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)?v:f;
  const defaultClip=effect=>({effect:effect||'bounce',text:'讓想法\n動起來',subtitle:'一點靈感，無限可能。',color:'#d8f36a',secondary:'#a59bff',background:'#10171c',speed:1,size:1,amount:50,duration:5,items:['靈感','創作','分享','可能'],values:[35,70,55,90],value:100,suffix:'',bpm:120,transition:{type:'crossfade',duration:.6},base:{visible:true,...L.transform()},layers:[],audio:[]});
  function validate(raw){
    if(!raw||![1,2].includes(raw.version)||!Array.isArray(raw.clips)||raw.clips.length<1||raw.clips.length>24)throw new Error('這不是有效的動畫小工坊專案（版本 1 或 2）。');
    const fps=raw.fps===60?60:30;
    return {version:2,ratio:['16:9','9:16','1:1'].includes(raw.ratio)?raw.ratio:'16:9',quality:raw.quality===1080?1080:720,fps,audio:{enabled:raw.audio?.enabled!==false,volume:bounded(raw.audio?.volume,0,1,.8)},clips:raw.clips.map(c=>{
      if(!c||!E.definitions.some(e=>e.id===c.effect))throw new Error('專案含有無法辨識的效果：'+String(c?.effect));
      const d=defaultClip(c.effect),duration=Math.round(bounded(c.duration,1,20,5)*fps)/fps;
      return {...d,text:typeof c.text==='string'?c.text.slice(0,60):'',subtitle:typeof c.subtitle==='string'?c.subtitle.slice(0,80):'',color:color(c.color,d.color),secondary:color(c.secondary,d.secondary),background:color(c.background,d.background),speed:bounded(c.speed,.25,2.5,1),size:bounded(c.size,.6,1.5,1),amount:Math.round(bounded(c.amount,0,100,50)/5)*5,duration:Math.round(bounded(c.duration,1,20,5)*fps)/fps,
        items:Array.isArray(c.items)&&c.items.length?c.items.filter(v=>typeof v==='string'&&v.trim()).slice(0,6).map(v=>v.slice(0,24)):d.items,values:Array.isArray(c.values)&&c.values.length?c.values.slice(0,6).map(v=>bounded(v,0,1e9,0)):d.values,value:bounded(c.value,0,1e9,100),suffix:typeof c.suffix==='string'?c.suffix.slice(0,12):'',bpm:bounded(c.bpm,40,240,120),
        transition:{type:types.includes(c.transition?.type)?c.transition.type:'crossfade',duration:bounded(c.transition?.duration,.1,1.5,.6)},base:{visible:c.base?.visible!==false,...L.transform(c.base||{})},layers:L.normalizeLayers(c.layers,duration,fps),audio:A.normalizeCues(c.audio,duration,fps) };
    })};
  }
  function timeline(project){
    const fps=project.fps;let start=0;
    return project.clips.map((clip,i)=>{
      const frames=Math.round(clip.duration*fps),next=project.clips[i+1],tr=clip.transition||{type:'crossfade',duration:.6};
      const overlap=next&&tr.type!=='cut'?Math.round(Math.min(tr.duration,clip.duration*.45,next.duration*.45)*fps):0;
      const row={index:i,startFrame:start,endFrame:start+frames,start:start/fps,end:(start+frames)/fps,frames,overlapFrames:overlap,overlap:overlap/fps,transition:tr.type};start+=frames-overlap;return row;
    });
  }
  const duration=p=>timeline(p).at(-1).end;
  function locate(project,t){
    const rows=timeline(project);t=Math.max(0,Math.min(duration(project),t));let index=0;
    for(let i=1;i<rows.length;i++)if(t>=rows[i].start)index=i;
    const row=rows[index],previous=rows[index-1];
    const progress=previous&&previous.overlap>0&&t<previous.end?(t-row.start)/previous.overlap:null;
    return {clip:project.clips[index],index,time:t-row.start,previous:progress===null?null:{clip:project.clips[index-1],time:t-previous.start,type:previous.transition,progress:Math.max(0,Math.min(1,progress))}};
  }
  const buffers=new WeakMap();
  function render(project,t,target){
    if(!Number.isFinite(t))throw new Error('播放時間必須是有效數字。');
    const state=locate(project,t),c=target.getContext('2d',{alpha:false}),w=target.width,h=target.height;
    if(!state.previous){L.renderClip(c,w,h,state.time,state.clip);return state;}
    let pair=buffers.get(target);if(!pair){pair=[document.createElement('canvas'),document.createElement('canvas')];buffers.set(target,pair);}
    for(const canvas of pair)if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    L.renderClip(pair[0].getContext('2d',{alpha:false}),w,h,state.previous.time,state.previous.clip);L.renderClip(pair[1].getContext('2d',{alpha:false}),w,h,state.time,state.clip);
    const p=state.previous.progress,u=p*p*(3-2*p);
    c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.filter='none';
    switch(state.previous.type){
      case 'push':c.drawImage(pair[0],0,0);c.drawImage(pair[0],-u*w,0,w,h);c.drawImage(pair[1],(1-u)*w,0,w,h);break;
      case 'wipe':c.drawImage(pair[0],0,0);c.beginPath();c.rect(0,0,w*u,h);c.clip();c.drawImage(pair[1],0,0);break;
      case 'circle':c.drawImage(pair[0],0,0);c.beginPath();c.arc(w/2,h/2,Math.hypot(w,h)*.5*u,0,Math.PI*2);c.clip();c.drawImage(pair[1],0,0);break;
      case 'zoom':{const a=1+u*.18,b=.86+u*.14;c.drawImage(pair[0],w*(1-a)/2,h*(1-a)/2,w*a,h*a);c.globalAlpha=u;c.drawImage(pair[1],w*(1-b)/2,h*(1-b)/2,w*b,h*b);break;}
      case 'slide-up':c.drawImage(pair[0],0,-u*h,w,h);c.drawImage(pair[1],0,(1-u)*h,w,h);break;
      case 'diagonal':{const d=(w+h)*u;c.drawImage(pair[0],0,0);c.beginPath();c.moveTo(0,0);c.lineTo(d,0);c.lineTo(0,d);c.closePath();c.clip();c.drawImage(pair[1],0,0);break;}
      case 'blur':{c.fillStyle=state.clip.background;c.fillRect(0,0,w,h);const r=Math.sin(Math.PI*u)*Math.min(w,h)*.018;c.filter=r>.001?`blur(${r}px)`:'none';c.drawImage(pair[0],0,0);c.globalAlpha=u;c.drawImage(pair[1],0,0);break;}
      case 'flash':c.drawImage(pair[0],0,0);c.globalAlpha=u;c.drawImage(pair[1],0,0);c.globalAlpha=Math.sin(Math.PI*u)**8*.6;c.fillStyle='#ffffff';c.fillRect(0,0,w,h);break;
      default:c.drawImage(pair[0],0,0);c.globalAlpha=u;c.drawImage(pair[1],0,0);
    }c.restore();return state;
  }
  window.MotionProject={version:2,transitionNames,transitionTypes:types,defaultClip,validate,timeline,duration,locate,render};
})();
