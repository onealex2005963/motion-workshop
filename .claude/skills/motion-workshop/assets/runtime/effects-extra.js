/* Additional original motion templates. Canvas only; no external assets. */
(() => {
  const E=window.MotionEffects,TAU=Math.PI*2;
  const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return 1-(1-v)**3;},smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  const font=(s,w=750)=>`${w} ${s}px -apple-system, "PingFang TC", sans-serif`;
  const round=(c,x,y,w,h,r,color)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
  const txt=(c,text,x,y,size,color,width,weight=750)=>{c.save();c.font=font(size,weight);c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;String(text).split('\n').slice(0,3).forEach((line,i,lines)=>c.fillText(line,x,y+(i-(lines.length-1)/2)*size*1.2,width));c.restore();};
  const circle=(c,x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,Math.max(.01,r),0,TAU);c.fill();};
  const colors=o=>[o.color,o.secondary,'#f5eee4'];
  const labels=o=>o.items?.length?o.items:['靈感','創作','分享','可能'];
  const heading=(c,w,h,t,o)=>{const s=Math.min(w,h);txt(c,o.text,w/2,h*.19,s*.075*o.size,'#f6f2e9',w*.84);if(o.subtitle)txt(c,o.subtitle,w/2,h*.88,s*.025,'#e7edf5aa',w*.84,450);};
  const pulse=t=>{const p=((t%4)+4)%4;return p<2?ease(p*1.7):1-smooth((p-2)/2);};
  const renderers={};
  renderers['mask-reveal']=(c,w,h,t,o)=>{
    const s=Math.min(w,h),lines=o.text.split('\n').slice(0,3),size=s*.12*o.size;
    lines.forEach((line,row)=>{const chars=Array.from(line).slice(0,20),cw=Math.min(size,w*.8/Math.max(1,chars.length));
      c.save();c.beginPath();c.rect(0,h*.45+(row-(lines.length-1)/2)*size*1.25-size*.7,w,size*1.4);c.clip();
      chars.forEach((ch,i)=>{const p=pulse(t-i*.07-row*.14),x=w/2+(i-(chars.length-1)/2)*cw;c.save();c.translate(x,h*.45+(row-(lines.length-1)/2)*size*1.25+(1-p)*size*1.7);c.rotate((1-p)*-.15);txt(c,ch,0,0,cw*.9,row%2?o.secondary:o.color,cw);c.restore();});c.restore();
    });if(o.subtitle)txt(c,o.subtitle,w/2,h*.8,s*.028,'#eee9df',w*.8,450);
  };
  renderers['kinetic-zoom']=(c,w,h,t,o)=>{
    const s=Math.min(w,h),p=pulse(t),scale=1+(1-p)*1.8;
    for(let i=4;i>0;i--){c.save();c.globalAlpha=.055;c.translate(w/2,h/2);c.scale(scale+i*.1,scale+i*.1);txt(c,o.text,0,0,s*.14*o.size,o.secondary,w*.8);c.restore();}
    c.save();c.translate(w/2,h/2);c.scale(scale,scale);c.globalAlpha=.2+.8*p;txt(c,o.text,0,0,s*.14*o.size,o.color,w*.8);c.restore();
    if(o.subtitle)txt(c,o.subtitle,w/2,h*.82,s*.028,'#eee9df',w*.8,450);
  };
  renderers['text-morph']=(c,w,h,t,o)=>{
    const s=Math.min(w,h),words=labels(o),phase=t*.55,k=Math.floor(phase)%words.length,p=smooth((phase%1-.55)/.45),size=s*.15*o.size;
    const width=s*(.45+.18*Math.sin(phase*.8)**2);round(c,w/2-width/2,h*.52-size*.7,width,size*1.4,size*.7,o.color);
    c.save();c.beginPath();c.rect(0,h*.52-size*.66,w,size*1.32);c.clip();c.globalAlpha=1-p;txt(c,words[k],w/2,h*.52-p*size,size*.7,o.background,width*.8);c.globalAlpha=p;txt(c,words[(k+1)%words.length],w/2,h*.52+(1-p)*size,size*.7,o.background,width*.8);c.restore();heading(c,w,h,t,o);
  };
  renderers['number-roll']=(c,w,h,t,o)=>{
    const s=Math.min(w,h),p=pulse(t),value=(p===1?o.value:Math.round(o.value*p*100)/100).toLocaleString('en-US',{maximumFractionDigits:20});
    txt(c,value+(o.suffix||''),w/2,h*.54,s*.22*o.size,o.color,w*.85,850);
    round(c,w*.2,h*.73,w*.6,s*.006,4,'#ffffff22');round(c,w*.2,h*.73,w*.6*p,s*.006,4,o.secondary);heading(c,w,h,t,o);
  };
  renderers.typewriter=(c,w,h,t,o)=>{
    const s=Math.min(w,h),chars=Array.from(o.text.replace(/\n/g,' ')),p=((t%6)+6)%6,n=Math.min(chars.length,Math.floor(p*12)),visible=chars.slice(0,n).join('');
    round(c,w*.1,h*.36,w*.8,h*.28,s*.025,'#ffffff0d');c.strokeStyle=o.secondary+'66';c.lineWidth=1;c.strokeRect(w*.1,h*.36,w*.8,h*.28);
    txt(c,visible+(Math.floor(t*2)%2?'':'▍'),w/2,h*.5,s*.075*o.size,o.color,w*.7,600);heading(c,w,h,t,{...o,text:''});
  };
  function card(c,x,y,w,h,angle,label,index,o,alpha=1){c.save();c.globalAlpha=alpha;c.translate(x,y);c.rotate(angle);c.shadowColor='#0006';c.shadowBlur=w*.1;c.shadowOffsetY=w*.07;round(c,-w/2,-h/2,w,h,w*.07,colors(o)[index%3]);c.shadowColor='transparent';txt(c,String(index+1).padStart(2,'0'),-w*.3,-h*.22,w*.11,o.background,w*.2);txt(c,label,0,h*.1,w*.13,o.background,w*.82);c.restore();}
  renderers['card-flyin']=(c,w,h,t,o)=>{
    const s=Math.min(w,h),items=labels(o).slice(0,5),cw=Math.min(w*.82/items.length/1.08,s*.25*o.size),ch=cw*1.4;
    items.forEach((label,i)=>{const p=ease((t%6-i*.16)*1.1),x=w/2+(i-(items.length-1)/2)*cw*1.08,y=h*.55+Math.sin(i*1.5)*s*.025;card(c,x+(1-p)*(i%2?1:-1)*w,y-(1-p)*h,cw,ch,(1-p)*(i%2?.7:-.7),label,i,o,p);});heading(c,w,h,t,o);
  };
  renderers['card-flip']=(c,w,h,t,o)=>{
    const s=Math.min(w,h),items=labels(o),phase=t*.65,k=Math.floor(phase)%items.length,u=phase%1,angle=Math.sin(u*Math.PI)*Math.PI,scale=Math.abs(Math.cos(angle));
    c.save();c.translate(w/2,h*.55);c.scale(Math.max(.015,scale),1);card(c,0,0,s*.37*o.size,s*.48*o.size,0,items[(k+(angle>Math.PI/2?1:0))%items.length],k+(angle>Math.PI/2?1:0),o);c.restore();heading(c,w,h,t,o);
  };
  renderers['orbit-cards']=(c,w,h,t,o)=>{
    const s=Math.min(w,h),items=labels(o).slice(0,5),positions=items.map((label,i)=>{const a=t*.5+i/items.length*TAU;return{label,i,x:Math.sin(a)*s*.32,y:Math.cos(a)*s*.05,z:Math.cos(a)};}).sort((a,b)=>a.z-b.z);
    positions.forEach(p=>{const scale=.7+(p.z+1)*.2;card(c,w/2+p.x,h*.56+p.y,s*.21*scale*o.size,s*.3*scale*o.size,p.x/s*.08,p.label,p.i,o,.6+.4*(p.z+1)/2);});heading(c,w,h,t,o);
  };
  renderers['bento-grid']=(c,w,h,t,o)=>{
    const s=Math.min(w,h),items=labels(o).slice(0,6),cw=Math.min(w*.25,s*.3),ch=s*.19,gap=s*.025;
    for(let i=0;i<6;i++){const col=i%3,row=Math.floor(i/3),p=ease((t%6-i*.12)*1.3),x=w/2+(col-1)*(cw+gap)*p,y=h*.56+(row-.5)*(ch+gap)*p;c.save();c.translate(x,y);c.scale(.2+.8*p,.2+.8*p);round(c,-cw/2,-ch/2,cw,ch,s*.02,colors(o)[i%3]);txt(c,items[i]||`特色 ${i+1}`,0,0,s*.035,o.background,cw*.82);c.restore();}heading(c,w,h,t,o);
  };
  renderers['chart-build']=(c,w,h,t,o)=>{
    const s=Math.min(w,h),items=labels(o).slice(0,6),values=o.values?.length?o.values:[35,70,55,90],max=Math.max(1,...values),count=Math.min(6,Math.max(items.length,values.length)),gap=w*.65/count,bw=gap*.64;
    c.strokeStyle='#ffffff33';c.lineWidth=1;c.beginPath();c.moveTo(w*.15,h*.75);c.lineTo(w*.85,h*.75);c.stroke();
    for(let i=0;i<count;i++){const value=values[i%values.length],p=ease((t%6-i*.16)*1.1),height=h*.36*value/max*p,x=w*.175+i*gap;round(c,x,h*.75-height,bw,Math.max(1,height),Math.min(6,height*.1),value===max?o.color:o.secondary);txt(c,(p===1?value:Math.round(value*p*100)/100).toLocaleString('en-US',{maximumFractionDigits:20}),x+bw/2,h*.75-height-s*.03,s*.032,'#f6f2e9',bw);txt(c,items[i]||String(i+1),x+bw/2,h*.8,s*.025,'#d1d9e2',gap*.9,450);}heading(c,w,h,t,o);
  };
  renderers['path-draw']=(c,w,h,t,o)=>{
    const s=Math.min(w,h),items=labels(o).slice(0,5),n=items.length,p=((t%6)+6)%6/4*(n-1),y=h*.55;
    for(let i=0;i<n-1;i++){const x=w*.17+i*w*.66/(n-1),next=w*.17+(i+1)*w*.66/(n-1);c.lineWidth=s*.006;c.strokeStyle='#ffffff22';c.beginPath();c.moveTo(x,y);c.lineTo(next,y);c.stroke();c.strokeStyle=o.color;c.beginPath();c.moveTo(x,y);c.lineTo(x+(next-x)*smooth(p-i),y);c.stroke();}
    items.forEach((label,i)=>{const x=n===1?w/2:w*.17+i*w*.66/(n-1),done=p>=i;circle(c,x,y,s*.042,done?o.color:o.secondary);txt(c,done?'✓':String(i+1),x,y,s*.035,o.background,s*.07);txt(c,label,x,y+s*.09,s*.029,'#f6f2e9',w*.18,550);});heading(c,w,h,t,o);
  };
  renderers['phone-scroll']=(c,w,h,t,o)=>{
    const s=Math.min(w,h),pw=s*.31*o.size,ph=s*.55*o.size,x=w*.5,y=h*.55,items=labels(o),scroll=(.5-.5*Math.cos(t*.65))*ph*.6;
    c.save();c.translate(x,y);c.rotate(-.05+Math.sin(t*.5)*.025);round(c,-pw/2-5,-ph/2-5,pw+10,ph+10,pw*.13,'#d9dfe7');round(c,-pw/2,-ph/2,pw,ph,pw*.1,o.background);c.save();c.beginPath();c.roundRect(-pw/2+4,-ph/2+4,pw-8,ph-8,pw*.09);c.clip();
    for(let i=0;i<8;i++){const yy=-ph*.32+i*ph*.24-scroll;round(c,-pw*.42,yy,pw*.84,ph*.2,pw*.035,colors(o)[i%3]);txt(c,items[i%items.length],0,yy+ph*.1,pw*.105,o.background,pw*.72);}
    c.restore();round(c,-pw*.19,-ph*.48,pw*.38,ph*.025,ph*.02,'#080c11');c.restore();heading(c,w,h,t,o);
  };
  renderers['tab-indicator']=(c,w,h,t,o)=>{
    const s=Math.min(w,h),items=labels(o).slice(0,4),tw=Math.min(w*.7,s*.85),gap=tw/items.length,phase=t*.6,k=Math.floor(phase)%items.length,u=smooth(phase%1),next=(k+1)%items.length,x=w/2-tw/2;
    round(c,x,h*.43,tw,s*.14,s*.025,'#ffffff10');round(c,x+(k+(next-k)*u)*gap+s*.008,h*.43+s*.008,gap-s*.016,s*.124,s*.02,o.color);
    items.forEach((label,i)=>txt(c,label,x+(i+.5)*gap,h*.5,s*.035,i===(u<.5?k:next)?o.background:'#e8edf4',gap*.86,650));heading(c,w,h,t,o);
  };
  renderers['cursor-click']=(c,w,h,t,o)=>{
    const s=Math.min(w,h),phase=t%4,p=ease(phase/1.3),click=Math.exp(-Math.pow((phase-1.6)/.12,2)),x=w*.5,y=h*.55;
    c.save();c.translate(x,y);c.scale(1-click*.07,1-click*.07);round(c,-s*.22,-s*.065,s*.44,s*.13,s*.025,o.color);txt(c,labels(o)[0],0,0,s*.045,o.background,s*.38);c.restore();
    const ripple=clamp((phase-1.6)/.8);if(ripple>0&&ripple<1){c.save();c.globalAlpha=1-ripple;c.lineWidth=s*.004;c.strokeStyle=o.secondary;c.beginPath();c.arc(x+s*.09,y,s*.22*ripple,0,TAU);c.stroke();c.restore();}
    c.save();c.translate(w*.17+(x+s*.09-w*.17)*p,h*.85+(y-h*.85)*p-s*.09*Math.sin(p*Math.PI));c.fillStyle='#f5f2e9';c.strokeStyle=o.background;c.lineWidth=2;c.beginPath();c.moveTo(0,0);c.lineTo(s*.055,s*.026);c.lineTo(s*.028,s*.038);c.lineTo(s*.018,s*.069);c.closePath();c.fill();c.stroke();c.restore();heading(c,w,h,t,o);
  };
  renderers['glass-card']=(c,w,h,t,o)=>{
    const s=Math.min(w,h);for(let i=0;i<5;i++){const x=w*(.5+.3*Math.sin(t*.4+i*1.3)),y=h*(.5+.24*Math.cos(t*.5+i));const g=c.createRadialGradient(x,y,0,x,y,s*.23);g.addColorStop(0,colors(o)[i%3]+'99');g.addColorStop(1,colors(o)[i%3]+'00');c.fillStyle=g;c.fillRect(x-s*.23,y-s*.23,s*.46,s*.46);}
    const p=pulse(t),cw=Math.min(w*.65,s*.9),ch=s*.34,y=h*.53+(1-p)*s*.12;round(c,w/2-cw/2,y-ch/2,cw,ch,s*.035,'#ffffff24');c.strokeStyle='#ffffff88';c.lineWidth=1;c.beginPath();c.roundRect(w/2-cw/2,y-ch/2,cw,ch,s*.035);c.stroke();txt(c,o.text,w/2,y,s*.09*o.size,'#f6f2e9',cw*.85);if(o.subtitle)txt(c,o.subtitle,w/2,h*.87,s*.025,'#e7edf5',w*.8,450);
  };
  renderers['beat-sync']=(c,w,h,t,o)=>{
    const s=Math.min(w,h),b=t*o.bpm/60,k=Math.floor(b),p=1-(b-k),items=labels(o),r=s*(.2+.035*Math.exp(-8*(1-p)))*o.size;
    c.save();c.translate(w/2,h*.53);c.rotate(k*Math.PI/2+smooth(1-p)*Math.PI/2);round(c,-r,-r,r*2,r*2,r*.2,colors(o)[k%3]);c.restore();txt(c,items[k%items.length],w/2,h*.53,s*.065,o.background,r*1.6);heading(c,w,h,t,o);
  };
  const defs=[
    ['mask-reveal','逐字揭幕','文字','每個字從遮罩中依序升起。'],['kinetic-zoom','大字聚焦','文字','大字由遠近收斂，強調一句重點。'],['text-morph','關鍵字輪替','文字','在膠囊中輪替你的重點詞。'],['number-roll','數字計數','資料','數字從零滾動到指定目標。'],['typewriter','打字機','文字','逐字輸入與閃動游標。'],
    ['card-flyin','卡片飛入','介面','多張標籤卡片依序飛入舞台。'],['card-flip','卡片翻轉','介面','用翻面動作切換卡片內容。'],['orbit-cards','卡片環繞','介面','卡片沿立體感軌道環繞。'],['bento-grid','便當格展開','介面','六個功能區塊從中央展開。'],['chart-build','長條圖生長','資料','依照你輸入的數值繪製動態長條圖。'],['path-draw','流程連線','資料','步驟與連線依序完成。'],['phone-scroll','手機展示','介面','模擬手機中的內容捲動。'],['tab-indicator','標籤滑塊','介面','滑塊移動並切換標籤。'],['cursor-click','游標點擊','介面','游標移入按鈕並觸發漣漪。'],['glass-card','光感玻璃卡','質感','柔和光斑後方浮起透明卡片。'],['beat-sync','節拍換卡','幾何','依設定 BPM 切換色塊與文字。']
  ].map(([id,name,category,description],i)=>({id,name,category,description,icon:['Aa','↗','↔','99','▍','▱','◧','◎','▦','▥','→','▯','▬','➤','▢','♪'][i]}));
  const base=E.render.bind(E);E.definitions.push(...defs);
  E.render=(c,w,h,t,o)=>{if(!renderers[o.effect])return base(c,w,h,t,o);c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.fillStyle=o.background;c.fillRect(0,0,w,h);renderers[o.effect](c,w,h,t*o.speed,o);c.restore();};
})();
