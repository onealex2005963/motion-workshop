/* Original editorial, data and product motion studies. MIT. */
(() => {
  'use strict';
  const E=window.MotionEffects,TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x));
  const ease=x=>1-(1-clamp(x))**3, smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
  const font=(s,weight=700)=>`${weight} ${s}px -apple-system, "PingFang TC", sans-serif`;
  function text(c,value,x,y,size,color,width,weight=700){c.save();c.fillStyle=color;c.font=font(size,weight);c.textAlign='center';c.textBaseline='middle';String(value||'').split('\n').slice(0,3).forEach((line,i,all)=>c.fillText(line,x,y+(i-(all.length-1)/2)*size*1.2,width));c.restore();}
  function box(c,x,y,w,h,r,color){c.fillStyle=color;c.beginPath();c.roundRect(x,y,Math.max(0,w),Math.max(0,h),r);c.fill();}
  function dot(c,x,y,r,color){c.beginPath();c.arc(x,y,Math.max(.01,r),0,TAU);c.fillStyle=color;c.fill();}
  function heading(c,w,h,o){const s=Math.min(w,h);text(c,o.text,w/2,h*.16,s*.07*o.size,'#f4f1e8',w*.86);text(c,o.subtitle,w/2,h*.9,s*.024,'#cbd4df',w*.86,450);}
  const labels=o=>o.items.length?o.items:['開始','整理','完成'];
  const renderers={};
  renderers['line-chart']=(c,w,h,t,o)=>{
    const s=Math.min(w,h),values=o.values,n=values.length,max=Math.max(1,...values),left=w*.16,right=w*.84,top=h*.34,bottom=h*.74,p=ease((t%7)*.55);
    const points=values.map((v,i)=>[n===1?w/2:left+(right-left)*i/(n-1),bottom-v/max*(bottom-top)]);
    c.strokeStyle='#ffffff17';c.lineWidth=1;for(let i=0;i<4;i++){const y=top+(bottom-top)*i/3;c.beginPath();c.moveTo(left,y);c.lineTo(right,y);c.stroke();}
    c.save();c.beginPath();c.rect(0,0,p>=.999?w:left+(right-left)*p,h);c.clip();
    const fill=c.createLinearGradient(0,top,0,bottom);fill.addColorStop(0,o.color+'55');fill.addColorStop(1,o.color+'00');
    c.beginPath();c.moveTo(points[0][0],bottom);points.forEach(([x,y])=>c.lineTo(x,y));c.lineTo(points.at(-1)[0],bottom);c.closePath();c.fillStyle=fill;c.fill();
    c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=o.color;c.lineWidth=s*.006;c.lineJoin='round';c.stroke();
    points.forEach(([x,y],i)=>{dot(c,x,y,s*.012,o.color);text(c,values[i],x,y-s*.035,s*.028,'#f4f1e8',w*.13,550);});c.restore();
    points.forEach(([x],i)=>text(c,labels(o)[i]||String(i+1),x,bottom+s*.055,s*.026,'#cbd4df',w*.15,500));heading(c,w,h,o);
  };
  renderers['donut-chart']=(c,w,h,t,o)=>{
    const s=Math.min(w,h),values=o.values,total=values.reduce((a,b)=>a+b,0),colors=[o.color,o.secondary,'#f4f1e8','#ff805a','#80dbc4','#f394be'];
    const r=s*.22*o.size,cx=w*.39,cy=h*.55,p=ease((t%7)*.55);let angle=-Math.PI/2;
    c.lineWidth=s*.065;c.strokeStyle='#ffffff13';c.beginPath();c.arc(cx,cy,r,0,TAU);c.stroke();
    values.forEach((v,i)=>{const arc=total?v/total*TAU:0,end=angle+arc*p;c.beginPath();if(arc>0)c.arc(cx,cy,r,angle,end);c.strokeStyle=colors[i%colors.length];c.stroke();angle+=arc*p;
      dot(c,w*.66,h*.37+i*s*.065,s*.009,colors[i%colors.length]);text(c,`${labels(o)[i]||i+1}  ${total?Math.round(v/total*100):0}%`,w*.77,h*.37+i*s*.065,s*.03,'#e9eef4',w*.22,500);
    });text(c,total?Math.round(p*100)+'%':'—',cx,cy,s*.09*o.size,o.color,s*.35);heading(c,w,h,o);
  };
  renderers['network-flow']=(c,w,h,t,o)=>{
    const s=Math.min(w,h),items=labels(o),n=items.length,cx=w/2,cy=h*.55,r=s*.26*o.size;
    items.forEach((label,i)=>{const a=-Math.PI/2+i/n*TAU,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.78,p=((t*.3+i/n)%1+1)%1;
      c.strokeStyle=o.secondary+'66';c.lineWidth=s*.003;c.beginPath();c.moveTo(cx,cy);c.lineTo(x,y);c.stroke();dot(c,cx+(x-cx)*p,cy+(y-cy)*p,s*.008,o.color);
      dot(c,x,y,s*.042,o.secondary);text(c,label,x,y+s*.075,s*.027,'#f4f1e8',w*.16,550);
    });dot(c,cx,cy,s*(.065+.004*Math.sin(t*3)),o.color);text(c,'＋',cx,cy,s*.06,o.background,s*.1);heading(c,w,h,o);
  };
  renderers['timeline-story']=(c,w,h,t,o)=>{
    const s=Math.min(w,h),items=labels(o),n=items.length,left=w*.15,right=w*.85,y=h*.56,p=ease((t%8)*.35);
    c.strokeStyle='#ffffff22';c.lineWidth=s*.005;c.beginPath();c.moveTo(left,y);c.lineTo(right,y);c.stroke();c.strokeStyle=o.color;c.beginPath();c.moveTo(left,y);c.lineTo(left+(right-left)*p,y);c.stroke();
    items.forEach((label,i)=>{const x=n===1?w/2:left+(right-left)*i/(n-1),q=ease((p-(n===1?0:i/(n-1)))*8+.2),up=i%2?-1:1;
      dot(c,x,y,s*.013,q>.2?o.color:o.secondary);c.save();c.globalAlpha=q;box(c,x-w*.065,y+up*s*.14-s*.04,w*.13,s*.08,s*.012,o.secondary);text(c,label,x,y+up*s*.14,s*.027,o.background,w*.12);text(c,String(i+1).padStart(2,'0'),x,y-up*s*.06,s*.027,'#cbd4df',w*.1,500);c.restore();
    });heading(c,w,h,o);
  };
  function windowBox(c,w,h,o){const s=Math.min(w,h),x=w*.14,y=h*.3,ww=w*.72,hh=h*.47;box(c,x,y,ww,hh,s*.025,'#1d2933');box(c,x,y,ww,s*.07,s*.02,'#2b3945');['#ff805a','#d8f36a','#80dbc4'].forEach((color,i)=>dot(c,x+s*(.04+i*.035),y+s*.035,s*.008,color));return {x,y:y+s*.105,w:ww,h:hh-s*.11,s};}
  renderers['code-window']=(c,w,h,t,o)=>{
    const q=windowBox(c,w,h,o),lines=labels(o),p=((t%8)+8)%8;
    lines.forEach((line,i)=>{const progress=ease((p-i*.28)*1.7),y=q.y+i*q.s*.052;c.save();c.globalAlpha=progress;
      text(c,String(i+1),q.x+q.s*.055,y,q.s*.023,'#71869a',q.s*.05,500);c.font=font(q.s*.032,550);c.textAlign='left';c.textBaseline='middle';c.fillStyle=i%2?o.secondary:o.color;c.fillText(line.slice(0,Math.ceil(line.length*progress)),q.x+q.s*.1,y,q.w-q.s*.16);c.restore();
    });heading(c,w,h,o);
  };
  renderers['terminal-run']=(c,w,h,t,o)=>{
    const q=windowBox(c,w,h,o),lines=labels(o),phase=((t%8)+8)%8;
    c.font=font(q.s*.03,500);c.textAlign='left';c.textBaseline='middle';lines.forEach((line,i)=>{const p=ease((phase-i*.5)*2);c.globalAlpha=p;c.fillStyle=i===lines.length-1?o.color:'#dbe5ee';c.fillText((i===0?'$ ':'✓ ')+line.slice(0,Math.ceil(line.length*p)),q.x+q.s*.05,q.y+i*q.s*.06,q.w-q.s*.1);});c.globalAlpha=1;heading(c,w,h,o);
  };
  renderers['logo-reveal']=(c,w,h,t,o)=>{
    const s=Math.min(w,h),p=ease((t%6)*.8),r=s*.14*o.size;
    c.save();c.translate(w/2,h*.48);c.rotate((1-p)*-Math.PI/2);c.scale(.25+.75*p,.25+.75*p);c.globalAlpha=p;
    for(let i=0;i<4;i++){c.save();c.rotate(i*Math.PI/2);box(c,s*.018,-r*.85,r*.73,r*.73,r*.16,i%2?o.secondary:o.color);c.restore();}c.restore();
    text(c,o.text,w/2,h*.75,s*.085*o.size,'#f4f1e8',w*.82);text(c,o.subtitle,w/2,h*.9,s*.025,'#cbd4df',w*.84,450);
  };
  renderers['split-title']=(c,w,h,t,o)=>{
    const s=Math.min(w,h),p=ease((t%6)*.9),chars=Array.from(o.text.replace(/\n/g,' ')),mid=Math.ceil(chars.length/2),size=s*.1*o.size;
    c.save();c.beginPath();c.rect(w*.06,h*.25,w*.88,h*.5);c.clip();
    text(c,chars.slice(0,mid).join(''),w*.5-(1-p)*w*.5,h*.43,size,o.color,w*.85);
    text(c,chars.slice(mid).join(''),w*.5+(1-p)*w*.5,h*.59,size,o.secondary,w*.85);c.restore();
    box(c,w*.25,h*.73,w*.5*p,s*.005,2,o.color);text(c,o.subtitle,w/2,h*.86,s*.026,'#cbd4df',w*.85,450);
  };
  renderers['quote-card']=(c,w,h,t,o)=>{
    const s=Math.min(w,h),p=ease((t%7)*.85),x=w*.13,y=h*.26+(1-p)*s*.08;
    c.save();c.globalAlpha=p;box(c,x,y,w*.74,h*.48,s*.025,'#ffffff0d');box(c,x,y,s*.008,h*.48,2,o.color);
    text(c,'“',w*.23,y+s*.07,s*.18,o.secondary,s*.18);text(c,o.text,w/2,y+h*.25,s*.078*o.size,'#f4f1e8',w*.61);text(c,o.subtitle,w/2,y+h*.4,s*.029,o.color,w*.62,500);c.restore();
  };
  renderers['gradient-mesh']=(c,w,h,t,o)=>{
    const s=Math.min(w,h);[o.color,o.secondary,'#80dbc4'].forEach((color,i)=>{const x=w*(.5+.32*Math.sin(t*.35+i*2.1)),y=h*(.5+.32*Math.cos(t*.29+i*1.7)),r=s*.65;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color+'a0');g.addColorStop(1,color+'00');c.fillStyle=g;c.fillRect(0,0,w,h);});
    text(c,o.text,w/2,h*.5,s*.13*o.size,'#f4f1e8',w*.85);text(c,o.subtitle,w/2,h*.86,s*.026,'#f4f1e8',w*.85,450);
  };
  renderers['isometric-stack']=(c,w,h,t,o)=>{
    const s=Math.min(w,h),p=ease((t%7)*.75),items=labels(o).slice(0,4);
    items.forEach((label,i)=>{const q=ease((p-i*.12)*2),y=h*.65-i*s*.085-(1-q)*s*.24,ww=s*.5*o.size,hh=s*.16;
      c.save();c.globalAlpha=q;c.translate(w/2,y);c.rotate(-.12);c.transform(1,.28,-.8,.65,0,0);box(c,-ww/2,-hh/2,ww,hh,s*.025,i%2?o.secondary:o.color);text(c,label,0,0,s*.035,o.background,ww*.85,650);c.restore();
    });heading(c,w,h,o);
  };
  renderers['notification-stack']=(c,w,h,t,o)=>{
    const s=Math.min(w,h),items=labels(o).slice(0,4),ww=Math.min(w*.68,s*1.05),hh=s*.1;
    items.forEach((label,i)=>{const p=ease(((t%7)-i*.28)*1.4),x=w/2-ww/2+(1-p)*w*.7,y=h*.33+i*hh*1.2;
      c.save();c.globalAlpha=p;box(c,x,y,ww,hh,s*.018,'#ffffff16');dot(c,x+hh*.45,y+hh/2,hh*.19,i%2?o.secondary:o.color);text(c,'✓',x+hh*.45,y+hh/2,hh*.25,o.background,hh*.3);text(c,label,x+ww*.55,y+hh/2,s*.033,'#f4f1e8',ww*.77,550);c.restore();
    });heading(c,w,h,o);
  };
  const entries=[
    ['line-chart','折線趨勢','資料','折線逐段繪出，搭配原始數值與標籤。','↗'],
    ['donut-chart','環形比例','資料','依數據比例展開環形圖與圖例。','◔'],
    ['network-flow','資料網絡','資料','節點間的光點流動，呈現連結關係。','⌘'],
    ['timeline-story','里程碑時間軸','資料','沿著時間線逐步展開事件。','↦'],
    ['code-window','程式碼視窗','開發','程式碼逐行出現的產品展示視窗。','{}'],
    ['terminal-run','終端機演示','開發','指令與完成訊息依序出現。','>_'],
    ['logo-reveal','幾何標誌揭幕','幾何','四個幾何部件組合成抽象標誌。','✣'],
    ['split-title','分割標題','文字','兩段文字從左右收合，帶出主題。','Aa'],
    ['quote-card','引言卡片','文字','讓一句話與署名成為畫面的焦點。','“'],
    ['gradient-mesh','流光漸層','質感','柔和漸層緩慢流動，托住主標題。','◉'],
    ['isometric-stack','斜角堆疊','介面','多層卡片以等角感的方式組合。','▱'],
    ['notification-stack','通知堆疊','介面','訊息依序滑入，呈現產品回饋。','☷']
  ];
  E.definitions.push(...entries.map(([id,name,category,description,icon])=>({id,name,category,description,icon})));
  const base=E.render.bind(E);E.render=(c,w,h,t,o)=>{const render=renderers[o.effect];if(!render)return base(c,w,h,t,o);c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.fillStyle=o.background;c.fillRect(0,0,w,h);render(c,w,h,t*o.speed,o);c.restore();};
})();
