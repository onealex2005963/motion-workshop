/* Editable cubic geometry. Original implementation, MIT.
 * Segment/handle model informed by Paper.js documentation; no upstream code copied.
 */
(() => {
  'use strict';
  const clamp=(v,a,b,d=0)=>Number.isFinite(v)?Math.max(a,Math.min(b,v)):d;
  const copy=v=>JSON.parse(JSON.stringify(v));
  const point=(x,y)=>({x,y,inX:0,inY:0,outX:0,outY:0});
  function segment(p={}) {
    return {x:clamp(p.x,-300,400,50),y:clamp(p.y,-300,400,50),
      inX:clamp(p.inX,-300,300),inY:clamp(p.inY,-300,300),
      outX:clamp(p.outX,-300,300),outY:clamp(p.outY,-300,300)};
  }
  function normalize(raw) {
    const segments=(Array.isArray(raw?.segments)?raw.segments:[]).slice(0,64).map(segment);
    return {closed:raw?.closed===true,segments:segments.length>=2?segments:[point(10,50),point(90,50)]};
  }
  const mix=(a,b,u)=>({x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u});
  function controls(a,b) {if(!a.outX&&!a.outY&&!b.inX&&!b.inY)return [a,mix(a,b,1/3),mix(a,b,2/3),b];return [a,{x:a.x+a.outX,y:a.y+a.outY},{x:b.x+b.inX,y:b.y+b.inY},b];}
  function cubic(a,b,u) {
    if(!a.outX&&!a.outY&&!b.inX&&!b.inY){const p=mix(a,b,u),dx=b.x-a.x,dy=b.y-a.y;return {...point(p.x,p.y),angle:Math.atan2(dy,dx)*180/Math.PI,tangentX:dx,tangentY:dy};}
    const [p,c,d,q]=controls(a,b),v=1-u;
    const x=v**3*p.x+3*v*v*u*c.x+3*v*u*u*d.x+u**3*q.x;
    const y=v**3*p.y+3*v*v*u*c.y+3*v*u*u*d.y+u**3*q.y;
    let dx=3*v*v*(c.x-p.x)+6*v*u*(d.x-c.x)+3*u*u*(q.x-d.x);
    let dy=3*v*v*(c.y-p.y)+6*v*u*(d.y-c.y)+3*u*u*(q.y-d.y);
    if(Math.hypot(dx,dy)<1e-8){const before=Math.max(0,u-.001),after=Math.min(1,u+.001),f=t=>{const s=1-t;return{x:s**3*p.x+3*s*s*t*c.x+3*s*t*t*d.x+t**3*q.x,y:s**3*p.y+3*s*s*t*c.y+3*s*t*t*d.y+t**3*q.y};},l=f(before),r=f(after);dx=r.x-l.x;dy=r.y-l.y;}
    return {...point(x,y),angle:Math.atan2(dy,dx)*180/Math.PI,tangentX:dx,tangentY:dy};
  }
  function interpolate(a,b,u) {
    if(a.closed!==b.closed||a.segments.length!==b.segments.length)return copy(u<1?a:b);
    return {closed:a.closed,segments:a.segments.map((s,i)=>Object.fromEntries(Object.keys(s).map(k=>[k,s[k]+(b.segments[i][k]-s[k])*u])))};
  }
  function draw(ctx,path,width,height) {
    const s=path.segments,p=(x,y)=>[(x/100-.5)*width,(y/100-.5)*height];
    ctx.moveTo(...p(s[0].x,s[0].y));
    for(let i=1;i<s.length+(path.closed?1:0);i++){const a=s[(i-1)%s.length],b=s[i%s.length];ctx.bezierCurveTo(...p(a.x+a.outX,a.y+a.outY),...p(b.x+b.inX,b.y+b.inY),...p(b.x,b.y));}
    if(path.closed)ctx.closePath();
  }
  function split(path,index,u=.5) {
    const s=path.segments,n=s.length;if(n>=64||index<0||index>=n-(path.closed?0:1))return false;
    const a=s[index],b=s[(index+1)%n],[p,c,d,q]=controls(a,b),pc=mix(p,c,u),cd=mix(c,d,u),dq=mix(d,q,u),left=mix(pc,cd,u),right=mix(cd,dq,u),middle=mix(left,right,u);
    a.outX=pc.x-a.x;a.outY=pc.y-a.y;b.inX=dq.x-b.x;b.inY=dq.y-b.y;
    s.splice(index+1,0,{...point(middle.x,middle.y),inX:left.x-middle.x,inY:left.y-middle.y,outX:right.x-middle.x,outY:right.y-middle.y});return true;
  }
  function smooth(path,index) {
    const s=path.segments,n=s.length,p=s[index],a=s[(index+n-1)%n],b=s[(index+1)%n];
    const dx=(b.x-a.x)/6,dy=(b.y-a.y)/6;p.inX=-dx;p.inY=-dy;p.outX=dx;p.outY=dy;
    if(!path.closed&&index===0){p.inX=p.inY=0;p.outX=(b.x-p.x)/3;p.outY=(b.y-p.y)/3;}
    if(!path.closed&&index===n-1){p.outX=p.outY=0;p.inX=(a.x-p.x)/3;p.inY=(a.y-p.y)/3;}
  }
  function closest(path,p,map=v=>v) {
    let best={distance:Infinity,index:0,u:.5};const s=path.segments,target=map(p);
    for(let i=0;i<s.length-(path.closed?0:1);i++){
      const at=u=>map(cubic(s[i],s[(i+1)%s.length],u)),distance=u=>{const q=at(u);return Math.hypot(q.x-target.x,q.y-target.y);};
      let step=0,d=Infinity;for(let j=0;j<=40;j++){const value=distance(j/40);if(value<d){d=value;step=j;}}
      let lo=Math.max(0,(step-1)/40),hi=Math.min(1,(step+1)/40);
      for(let j=0;j<22;j++){const a=lo+(hi-lo)/3,b=hi-(hi-lo)/3;if(distance(a)<distance(b))hi=b;else lo=a;}
      const u=(lo+hi)/2,value=distance(u);if(value<best.distance)best={distance:value,index:i,u};
    }
    return best;
  }
  function insert(path,after,p) {
    const s=path.segments;if(s.length>=64||!Number.isInteger(after)||after<0||after>=s.length||!Number.isFinite(p?.x)||!Number.isFinite(p?.y))return false;
    s.splice(after+1,0,segment(p));return true;
  }
  function fromShape(layer,pose,ratio=16/9) {
    const p=(x,y)=>point(x,y),k=.5522847498307936;
    if(layer.type==='path')return copy(pose.path||layer.path);
    if(layer.type==='ellipse')return {closed:true,segments:[{...p(100,50),inY:-50*k,outY:50*k},{...p(50,100),inX:50*k,outX:-50*k},{...p(0,50),inY:50*k,outY:-50*k},{...p(50,0),inX:-50*k,outX:50*k}]};
    if(layer.type==='line')return {closed:false,segments:[p(0,50),p(100,50)]};
    if(['triangle','polygon','star'].includes(layer.type)){const n=layer.type==='triangle'?3:layer.sides||5,count=layer.type==='star'?n*2:n;return {closed:true,segments:Array.from({length:count},(_,i)=>{const a=-Math.PI/2+i/count*Math.PI*2,r=layer.type==='star'&&i%2?layer.innerRadius:1;return p(50+Math.cos(a)*50*r,50+Math.sin(a)*50*r);})};}
    if(layer.type==='arrow')return {closed:true,segments:[[0,30],[60,30],[60,0],[100,50],[60,100],[60,70],[0,70]].map(([x,y])=>p(x,y))};
    const radius=Math.min(pose.radius/720*100,pose.width*ratio/2,pose.height/2),rx=radius/(pose.width*ratio)*100,ry=radius/pose.height*100;
    return {closed:true,segments:[{...p(rx,0),inX:-rx*k},{...p(100-rx,0),outX:rx*k},{...p(100,ry),inY:-ry*k},{...p(100,100-ry),outY:ry*k},{...p(100-rx,100),inX:rx*k},{...p(rx,100),outX:-rx*k},{...p(0,100-ry),inY:ry*k},{...p(0,ry),outY:-ry*k}]};
  }
  function toWorld(layer,pose,p,ratio) {
    const x=(p.x-(layer.anchorX??50))/100*pose.width*ratio*pose.scale*pose.scaleX,y=(p.y-(layer.anchorY??50))/100*pose.height*pose.scale*pose.scaleY,r=pose.rotation*Math.PI/180;
    return {x:pose.x+(x*Math.cos(r)-y*Math.sin(r))/ratio,y:pose.y+x*Math.sin(r)+y*Math.cos(r)};
  }
  function toLocal(layer,pose,p,ratio) {
    const dx=(p.x-pose.x)*ratio,dy=p.y-pose.y,r=-pose.rotation*Math.PI/180;
    return {x:(dx*Math.cos(r)-dy*Math.sin(r))/(pose.scale*pose.scaleX*pose.width*ratio)*100+(layer.anchorX??50),y:(dx*Math.sin(r)+dy*Math.cos(r))/(pose.scale*pose.scaleY*pose.height)*100+(layer.anchorY??50)};
  }
  function simplify(points,tolerance=1) {
    if(points.length<3)return points;const a=points[0],b=points.at(-1),dx=b.x-a.x,dy=b.y-a.y,dd=dx*dx+dy*dy;
    let index=0,distance=0;for(let i=1;i<points.length-1;i++){const p=points[i],u=dd?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/dd)):0,d=Math.hypot(p.x-a.x-u*dx,p.y-a.y-u*dy);if(d>distance){distance=d;index=i;}}
    return distance>tolerance?[...simplify(points.slice(0,index+1),tolerance).slice(0,-1),...simplify(points.slice(index),tolerance)]:[a,b];
  }
  function bounds(path) {
    const values=path.segments.map(p=>({x:p.x,y:p.y})),s=path.segments;
    for(let i=0;i<s.length-(path.closed?0:1);i++){
      const a=s[i],b=s[(i+1)%s.length],c=controls(a,b);
      for(const axis of ['x','y']){const [p,q,r,t]=c.map(p=>p[axis]),aa=-p+3*q-3*r+t,bb=2*(p-2*q+r),cc=q-p,disc=bb*bb-4*aa*cc;
        const roots=Math.abs(aa)<1e-10?(Math.abs(bb)<1e-10?[]:[-cc/bb]):disc<0?[]:[(-bb+Math.sqrt(disc))/(2*aa),(-bb-Math.sqrt(disc))/(2*aa)];
        for(const u of roots)if(u>0&&u<1)values.push(cubic(a,b,u));
      }
    }
    return {minX:Math.min(...values.map(p=>p.x)),maxX:Math.max(...values.map(p=>p.x)),minY:Math.min(...values.map(p=>p.y)),maxY:Math.max(...values.map(p=>p.y))};
  }
  function toSVG(layer,pose,ratio=16/9) {
    const path=normalize(pose.path||layer.path),w=720*ratio,h=720,lw=w*pose.width/100,lh=h*pose.height/100,f=n=>Number(n.toFixed(6)),xy=p=>f((p.x/100-.5)*lw)+' '+f((p.y/100-.5)*lh),s=path.segments;
    let d='M '+xy(s[0]);for(let i=1;i<s.length+(path.closed?1:0);i++){const a=s[(i-1)%s.length],b=s[i%s.length];d+=' C '+xy({x:a.x+a.outX,y:a.y+a.outY})+' '+xy({x:b.x+b.inX,y:b.y+b.inY})+' '+xy(b);}if(path.closed)d+=' Z';
    const r=pose.rotation*Math.PI/180,sx=pose.scale*pose.scaleX,sy=pose.scale*pose.scaleY,a=Math.cos(r)*sx,b=Math.sin(r)*sx,c=-Math.sin(r)*sy,dd=Math.cos(r)*sy,ox=(50-(layer.anchorX??50))/100*lw,oy=(50-(layer.anchorY??50))/100*lh,matrix=[a,b,c,dd,w*pose.x/100+a*ox+c*oy,h*pose.y/100+b*ox+dd*oy].map(f).join(' ');
    let fill=pose.fill,defs='';if(layer.fillMode==='linear'||layer.fillMode==='radial'){const angle=(layer.gradientAngle||0)*Math.PI/180,dx=Math.cos(angle)*lw/2,dy=Math.sin(angle)*lh/2,tag=layer.fillMode==='linear'?'linearGradient':'radialGradient',attrs=tag==='linearGradient'?`x1="${f(-dx)}" y1="${f(-dy)}" x2="${f(dx)}" y2="${f(dy)}"`:`cx="0" cy="0" r="${f(Math.max(lw,lh)/2)}"`;defs=`<defs><${tag} id="fill" gradientUnits="userSpaceOnUse" ${attrs}><stop stop-color="${pose.fill}"/><stop offset="1" stop-color="${layer.fillSecondary}"/></${tag}></defs>`;fill='url(#fill)';}
    if(!path.closed||layer.fillEnabled===false)fill='none';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(w)} ${h}">${defs}<path d="${d}" transform="matrix(${matrix})" fill="${fill}" stroke="${layer.stroke}" stroke-width="${f(pose.strokeWidth)}" opacity="${f(pose.opacity)}"${layer.dash?` stroke-dasharray="${f(layer.dash)} ${f(layer.dash)}"`:''}/></svg>`;
  }
  window.MotionVector={point,segment,normalize,controls,cubic,interpolate,draw,split,insert,smooth,closest,fromShape,toWorld,toLocal,simplify,bounds,toSVG};
})();
