/* Motion Prompt MIT source demos adapted as 144 exportable Workshop scene templates.
 * Original source headers, author and license remain in motion-reference.js and packs/. */
(() => {
  'use strict';
  const R=window.MotionReference,E=window.MotionEffects,base=E.render.bind(E);
  for(const e of R.catalog.elements)E.definitions.push({id:'mp-'+e.id,name:`#${e.id} ${R.label(e.id)}`,category:'動效套版',description:`${R.meaning(e.id)}。Motion Prompt ${R.locale.packs[e.pack]}原版套版，可調速度、縮放、填滿方式與標題，並可疊加圖片與圖層。${e.pack==='photo'?'攝影風格示範，非匯入照片濾鏡。':''}`,icon:'#'});
  function caption(c,value,x,y,size,width,color){
    const chars=Array.from(String(value||'')),lines=[];let line='';c.font=`700 ${size}px -apple-system,"PingFang TC",sans-serif`;c.textAlign='center';c.textBaseline='middle';
    for(const ch of chars){if(ch==='\n'||line&&c.measureText(line+ch).width>width){lines.push(line);line=ch==='\n'?'':ch;}else line+=ch;}if(line)lines.push(line);
    c.fillStyle=color;lines.slice(0,4).forEach((s,i,all)=>c.fillText(s,x,y+(i-(all.length-1)/2)*size*1.15,width));
  }
  E.render=(c,w,h,t,o)=>{
    if(!/^mp-\d{3}$/.test(o.effect))return base(c,w,h,t,o);
    const id=o.effect.slice(3),e=R.entry(id),settings=o.referenceTemplate||{},labels=settings.labels!==false,clock=settings.loop===false?Math.max(0,Math.min(e.cycle-1/60,t*o.speed)):t*o.speed;
    c.save();try{
      R.render(id,{width:w,height:h,getContext:()=>c},clock,{x:0,y:labels?h*.2:0,width:w,height:labels?h*.6:h,zoom:o.size,fit:settings.fit||'contain',background:o.background});
      if(labels){c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.filter='none';const s=Math.min(w,h);caption(c,o.text,w/2,h*.105,s*.052,w*.87,o.color);caption(c,o.subtitle,w/2,h*.91,s*.025,w*.87,o.secondary);}
    }finally{c.restore();}
  };
  R.createTemplate=(id,options={})=>{
    const e=R.entry(id),P=window.MotionProject,L=window.MotionLayers;
    const clip={...P.defaultClip('mp-'+e.id),...options,effect:'mp-'+e.id,duration:options.duration??e.cycle,base:{visible:true,...L.transform()},referenceTemplate:{fit:options.referenceTemplate?.fit||'contain',labels:options.referenceTemplate?.labels!==false,loop:options.referenceTemplate?.loop!==false},reference:{library:'motion-prompt',id:e.id,kind:'original-template',sourceCommit:R.origin.commit}};
    if(options.sound)clip.audio=[{sound:'confirm',time:.3,volume:.55,rate:1,fadeIn:0,fadeOut:.06}];
    return P.validate({version:2,ratio:options.ratio,fps:options.fps,clips:[clip]}).clips[0];
  };
})();
