/* Original editable Workshop interpretations of common motion techniques. MIT.
 * These recipes use Workshop layers; they are not pixel-identical upstream demos. */
(() => {
  'use strict';
  const R=window.MotionReference,L=window.MotionLayers,P=window.MotionProject;
  const recipeIds=['001','002','003','010','014','016','024','121','122','123','124','125','126','127','128','130','131','134','143','144'];
  const bounded=(v,a,b,f)=>Number.isFinite(Number(v))?Math.max(a,Math.min(b,Number(v))):f;
  function createClip(id,options={}){
    id=R.entry(id).id;if(!recipeIds.includes(id))throw new Error('此編號提供原版參考；尚未提供圖層配方。');
    const fps=options.fps===60?60:30,d=Math.round(bounded(options.duration,1,20,5)*fps)/fps,strength=bounded(options.strength,.2,2,1),stagger=bounded(options.stagger,0,.5,.12),ratio={'16:9':16/9,'9:16':9/16,'1:1':1}[options.ratio]||16/9;
    const o={...P.defaultClip('gradient-mesh'),...options,duration:d,layers:[],audio:[],base:{visible:false,...L.transform()}};
    o.text=String(options.text??'讓想法，自由動起來').slice(0,60);o.subtitle=String(options.subtitle??'每一層，都能自由調整').slice(0,80);
    const fontSize=Math.max(2.2,Math.min(7,23/Math.ceil(Math.max(1,Array.from(o.text).length)/(ratio<.9?10:16))));
    const add=(type,name,style={},transform={})=>{const l={...L.defaultLayer(type),name,...style,end:d,transform:{...L.transform(),...transform}};o.layers.push(l);return l;};
    const text=(name,value,x=50,y=48,size=fontSize,fill='#f4f1e8',width=82)=>add('text',name,{text:value,fontSize:size,fill,width,height:28},{x,y});
    const shape=(name,x=50,y=48,w=65,h=30,fill=o.secondary,type='rect')=>add(type,name,{width:w,height:h,fill,radius:18},{x,y});
    const keys=(l,knots)=>{let pose={...l.transform};l.keyframes=knots.map(([u,values,easing='ease-in-out'])=>{pose={...pose,...values};return{time:Math.round(u*d*fps)/fps,...pose,easing};});return l;};
    const hero=()=>{const panel=shape('品牌色塊');const title=text('主標題',o.text);return[panel,title];};
    const step=Math.min(.08,stagger/d);
    if(id==='001'){
      for(const [i,l] of hero().entries())keys(l,[[0,{scale:.15,rotation:-15*strength,opacity:0}],[.08+i*step,{opacity:0}],[.3+i*step,{scale:1+.16*strength,rotation:2*strength,opacity:1},'ease-out'],[.48+i*step,{scale:1,rotation:0}],[1,{}]]);
    }else if(id==='002'){
      const items=(Array.isArray(options.items)&&options.items.length?options.items:['靈感','創作','分享']).slice(0,5);
      text('主標題',o.text,50,15,Math.min(fontSize,4.5));
      items.forEach((v,i)=>{const y=32+i*(42/Math.max(1,items.length-1));const a=shape('卡片 '+(i+1),50,y,68,8,i%2?o.color:o.secondary);const b=text('標籤 '+(i+1),String(v),50,y,3,o.background,62);for(const l of[a,b])keys(l,[[0,{x:50-30*strength,opacity:0}],[i*step,{x:50-30*strength,opacity:0}],[Math.min(.85,.36+i*step),{x:50,opacity:1},'ease-out'],[1,{}]]);});
    }else if(id==='003'){
      for(let i=0;i<8;i++){const a=i/8*Math.PI*2,r=23*strength,l=shape('放射粒子 '+(i+1),50,48,3,3*ratio,i%2?o.secondary:o.color,'ellipse');keys(l,[[0,{scale:0,opacity:0}],[.12,{scale:.4,opacity:1}],[.52,{x:50+Math.cos(a)*r,y:48+Math.sin(a)*r*ratio,scale:1},'ease-out'],[.85,{scale:.1,opacity:0}],[1,{}]]);}
      keys(text('主標題',o.text),[[0,{scale:.6,opacity:0}],[.32,{scale:1,opacity:1},'back'],[1,{}]]);
    }else if(id==='010'){
      for(const l of hero())keys(l,[[0,{x:50-42*strength,opacity:0}],[.35,{x:50+8*strength,opacity:1},'ease-out'],[.52,{x:50-3*strength}],[.7,{x:50}],[1,{}]]);
    }else if(id==='014'){
      for(let i=5;i>=0;i--){const l=shape(i?'殘影 '+i:'移動主體',24,48,14,14*ratio,i%2?o.secondary:o.color,'ellipse'),delay=i*.035;keys(l,[[0,{opacity:0}],[delay,{x:24,opacity:i?.13:1}],[.5+delay,{x:76,opacity:i?.13:1}],[1,{x:24,opacity:i?.13:1}]]);}
      text('主標題',o.text,50,20,Math.min(fontSize,5));
    }else if(id==='016'){
      for(let i=0;i<4;i++){const l=shape('景深層 '+(i+1),30+i*14,32+i*10,25+i*3,18+i*2,i%2?o.color:o.secondary);l.transform.opacity=.16+i*.13;keys(l,[[0,{x:l.transform.x-5*i*strength}],[.5,{x:l.transform.x+5*i*strength}],[1,{x:l.transform.x-5*i*strength}]]);}
      keys(text('前景標題',o.text),[[0,{x:44}],[.5,{x:56}],[1,{x:44}]]);
    }else if(id==='024'){
      const positions=[[0,0,0],[.2,0,0],[.23,-4,2],[.26,3,-2],[.3,-2,1],[.35,1,-1],[.42,0,0],[1,0,0]];
      for(const l of hero())keys(l,positions.map(([u,x,y])=>[u,{x:50+x*strength,y:48+y*strength,rotation:x*strength/2},'linear']));
    }else if(id==='121'){
      for(const l of hero())keys(l,[[0,{x:30}],[.18,{x:30-8*strength,rotation:-4*strength},'ease-in'],[.44,{x:62,rotation:4*strength},'ease-out'],[.66,{x:50,rotation:0}],[1,{}]]);
    }else if(id==='122'){
      for(let i=0;i<3;i++){const l=shape('跟隨部件 '+(i+1),34+i*16,48,13,20,i%2?o.secondary:o.color);keys(l,[[0,{x:12+i*6,rotation:-12}],[.25+i*step,{x:34+i*16+7*strength,rotation:9*strength},'ease-out'],[.52+i*step,{x:34+i*16,rotation:-3}],[.75+i*step,{rotation:0}],[1,{}]]);}text('主標題',o.text,50,20,Math.min(fontSize,5));
    }else if(id==='123'){
      const l=shape('彈跳主體',50,22,18,18*ratio,o.color,'ellipse');keys(l,[[0,{y:20}],[.28,{y:63},'ease-in'],[.44,{y:63-27*strength},'ease-out'],[.6,{y:63},'ease-in'],[.72,{y:63-12*strength},'ease-out'],[.84,{y:63},'ease-in'],[.91,{y:63-4*strength},'ease-out'],[1,{y:63},'ease-in']]);text('主標題',o.text,50,16,Math.min(fontSize,4.5));
    }else if(['124','125','126','127','128'].includes(id)){
      const group=hero();
      for(const l of group){const knots=[];
        for(let i=0;i<=32;i++){const u=i/32,a=u*Math.PI*2;
          let values={};if(id==='124')values={x:50+Math.sin(a*3)*2*strength,y:48+Math.sin(a*2)*2*strength,rotation:Math.sin(a*4)*4*strength};
          if(id==='125')values={scale:1+Math.sin(a*2)*.12*strength};
          if(id==='126')values={x:50+Math.sin(a)*12*strength,y:48+Math.sin(a*2)*7*strength,rotation:Math.sin(a)*5};
          if(id==='127')values={x:50-Math.cos(a)*20*strength};
          if(id==='128')values={x:20+Math.floor(u*6)/6*60,y:48+(i%4<2?-1:1)*strength};
          knots.push([u,values,id==='128'?'step':'linear']);
        }keys(l,knots);
      }
    }else if(id==='130'||id==='131'){
      const chars=Array.from(o.text.replace(/\n/g,' ')),chunk=Math.max(1,Math.ceil(chars.length/10)),groups=[];for(let i=0;i<chars.length;i+=chunk)groups.push(chars.slice(i,i+chunk).join(''));
      groups.forEach((value,i)=>{const x=50+(i-(groups.length-1)/2)*(72/Math.max(1,groups.length)),l=text('文字段 '+(i+1),value,x,48,Math.min(7,10/Math.max(1,chunk)),o.color,Math.max(7,78/Math.max(1,groups.length)));
        const knots=[];for(let j=0;j<=32;j++){const u=j/32,a=u*Math.PI*2+i*.5;knots.push([u,id==='130'?{y:48+Math.sin(a)*7*strength}:{x:50+Math.sin(a)*25,y:48-Math.cos(a)*13*strength,rotation:Math.sin(a)*22},'linear']);}keys(l,knots);
      });
    }else if(id==='134'){
      for(let i=0;i<8;i++){const a=i/8*Math.PI*2,l=shape('重複圖形 '+(i+1),50+Math.cos(a)*24,48+Math.sin(a)*15,8,8*ratio,i%2?o.secondary:o.color);keys(l,[[0,{scale:.25,rotation:0}],[.5,{scale:1+.12*strength,rotation:180}],[1,{scale:.25,rotation:360}]]);}text('主標題',o.text,50,48,Math.min(fontSize,4.5),o.color,35);
    }else if(id==='143'){
      for(let i=0;i<5;i++){const l=shape('組件 '+(i+1),50,48+(i-2)*3,48,7,i%2?o.secondary:o.color);keys(l,[[0,{}],[.4,{x:50+(i-2)*6*strength,y:48+(i-2)*12*strength,rotation:(i-2)*4*strength}],[.65,{}],[1,{x:50,y:48+(i-2)*3,rotation:0}]]);}text('主標題',o.text,50,15,Math.min(fontSize,4.5));
    }else if(id==='144'){
      for(let i=0;i<2;i++){const l=shape('分割面板 '+(i+1),25+i*50,48,48,55,i?o.secondary:o.color);keys(l,[[0,{x:i?125:-25,opacity:0}],[.4,{x:25+i*50,opacity:1},'ease-out'],[1,{}]]);}
      const a=text('主標題',o.text,25,48,Math.min(fontSize,4),o.background,42),b=text('副標題',o.subtitle||'你的下一個想法',75,48,3.5,o.background,42);for(const l of[a,b])keys(l,[[0,{opacity:0}],[.38,{opacity:0}],[.6,{opacity:1}],[1,{}]]);
    }
    if(o.subtitle&&id!=='144'&&o.layers.length<12)text('小字說明',o.subtitle,50,89,2.7,'#cbd4df',88);
    if(options.sound)o.audio=[{sound:id==='003'||id==='024'?'expand':'confirm',time:Math.round(d*.28*fps)/fps,volume:.55,rate:1,fadeIn:0,fadeOut:.06}];
    o.reference={library:'motion-prompt',id,kind:'workshop-recipe',sourceCommit:R.origin.commit};
    return P.validate({version:2,ratio:options.ratio,fps,clips:[o]}).clips[0];
  }
  R.recipeIds=recipeIds;R.createClip=createClip;
})();
