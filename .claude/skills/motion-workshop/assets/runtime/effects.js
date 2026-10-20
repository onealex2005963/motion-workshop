/* Original, dependency-free animation renderers. Every frame is determined by time and settings. */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
  const rand = n => { const v = Math.sin(n * 127.17 + 19.71) * 43758.5453; return v - Math.floor(v); };
  const font = (size, weight = 800) => `${weight} ${size}px -apple-system, BlinkMacSystemFont, "PingFang TC", sans-serif`;
  const palette = o => [o.color, o.secondary, '#f4f1e8'];
  function circle(c, x, y, r, color) { c.fillStyle = color; c.beginPath(); c.arc(x, y, Math.max(0.01, r), 0, TAU); c.fill(); }
  function path(c, vertices, color) { c.fillStyle = color; c.beginPath(); vertices.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); }
  function grid(c, w, h, color, spacing) {
    c.save(); c.globalAlpha = .12; c.strokeStyle = color; c.lineWidth = 1;
    for (let x = 0; x < w; x += spacing) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    for (let y = 0; y < h; y += spacing) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.restore();
  }
  function text(c, value, x, y, maxWidth, size, color, weight = 800) {
    c.save(); c.font = font(size, weight); c.textAlign = 'center'; c.textBaseline = 'middle';
    const lines = String(value || '').split('\n').slice(0, 3);
    let scale = 1; for (const line of lines) scale = Math.min(scale, maxWidth / Math.max(1, c.measureText(line).width));
    c.translate(x, y); c.scale(scale, scale); c.fillStyle = color;
    lines.forEach((line, i) => c.fillText(line, 0, (i - (lines.length - 1) / 2) * size * 1.18)); c.restore();
  }
  function title(c, o, w, h, t) {
    const s = Math.min(w, h); c.save(); c.globalAlpha = .93;
    text(c, o.text, w * .5, h * .22, w * .82, s * .095 * o.size, '#f5f3ec');
    if (o.subtitle) text(c, o.subtitle, w * .5, h * .885, w * .8, s * .026, '#f5f3ec', 450);
    c.restore();
  }
  const renderers = {};
  renderers.bounce = (c, w, h, t, o) => {
    const s = Math.min(w, h), floor = h * .76, r = s * .062 * o.size;
    grid(c, w, h, o.color, s * .085);
    c.strokeStyle = '#f4f1e833'; c.lineWidth = 2; c.beginPath(); c.moveTo(w * .12, floor); c.lineTo(w * .88, floor); c.stroke();
    const position = time => {
      const a = time * 1.25, phase = ((a % 1) + 1) % 1;
      return { x: w * (.5 + .29 * Math.sin(time * 1.6)), y: floor - r - Math.sin(phase * Math.PI) * h * .29, phase };
    };
    for (let j = 7; j > 0; j--) { const p = position(t - j * .045); c.globalAlpha = (8 - j) * .028; circle(c, p.x, p.y, r * .83, o.secondary); }
    c.globalAlpha = 1;
    const p = position(t), squash = Math.exp(-Math.pow(Math.min(p.phase, 1 - p.phase) / .065, 2)) * .4;
    c.save(); c.translate(p.x, p.y + r * squash); c.scale(1 + squash, 1 - squash); circle(c, 0, 0, r, o.color); c.restore();
    title(c, o, w, h, t);
  };
  renderers.type = (c, w, h, t, o) => {
    const s = Math.min(w, h), chars = Array.from(o.text.replace(/\n/g, ' ').slice(0, 16) || '動起來');
    const base = Math.min(s * .19 * o.size, w * .78 / chars.length);
    c.save(); c.font = font(base, 900); c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let row = -2; row <= 2; row++) {
      let x = w * .5 - base * chars.length * .5 + base * .5;
      chars.forEach((char, i) => {
        c.save(); c.translate(x, h * .5 + row * base * 1.2 + Math.sin(t * 2.7 - i * .5) * base * .18);
        c.scale(1 + .23 * Math.sin(t * 3 - i * .55), 1 + .12 * Math.cos(t * 3 - i * .55));
        if (row === 0) { c.fillStyle = o.color; c.fillText(char, 0, 0); }
        else { c.globalAlpha = .25; c.strokeStyle = row < 0 ? o.secondary : o.color; c.lineWidth = s * .0017; c.strokeText(char, 0, 0); }
        c.restore(); x += base;
      });
    }
    c.restore();
    if (o.subtitle) text(c, o.subtitle, w / 2, h * .89, w * .8, s * .027, '#f5f3ec', 450);
  };
  renderers.morph = (c, w, h, t, o) => {
    const s = Math.min(w, h), r = s * .21 * o.size;
    const radius = (a, k) => {
      const circleR = 1, squareR = .87 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
      const star = .8 + .27 * Math.cos(5 * a), flower = .94 + .19 * Math.cos(6 * a);
      return [circleR, squareR, star, flower, circleR][k];
    };
    const make = (time, dx, color) => {
      const p = ((time * .65 % 4) + 4) % 4, k = Math.floor(p), u = smooth(p - k);
      const pts = Array.from({ length: 240 }, (_, i) => { const a = i / 240 * TAU, rr = mix(radius(a, k), radius(a, k + 1), u) * r; return [Math.cos(a + time * .25) * rr + w / 2 + dx, Math.sin(a + time * .25) * rr + h * .56 + dx]; });
      path(c, pts, color);
    };
    grid(c, w, h, o.secondary, s * .065); make(t - .12, s * .025, o.secondary); make(t - .06, s * .012, '#f3eee5'); make(t, 0, o.color); title(c, o, w, h, t);
  };
  renderers.rhythm = (c, w, h, t, o) => {
    const colors = palette(o), step = Math.min(w / 8, h / 6);
    for (let y = 0; y < h + step; y += step) for (let x = 0; x < w + step; x += step) {
      const i = Math.round(x / step), j = Math.round(y / step), n = i + j * 17;
      c.save(); c.beginPath(); c.rect(x, y, step, step); c.clip(); c.translate(x + step / 2, y + step / 2);
      const b = t * 1.3 - (i + j) * .11, cycle = Math.floor(b), u = smooth(b - cycle);
      c.rotate((cycle + u) * Math.PI / 2); c.fillStyle = colors[(n + Math.abs(cycle)) % 3]; c.fillRect(-step, -step, step * 2, step * 2);
      c.fillStyle = o.background; c.beginPath();
      if (n % 3 === 0) { c.arc(-step / 2, -step / 2, step * .95, 0, TAU); c.fill(); }
      else if (n % 3 === 1) circle(c, 0, 0, step * .29, o.background);
      else path(c, [[-step / 2, -step / 2], [step / 2, step / 2], [-step / 2, step / 2]], o.background);
      c.restore();
    }
    c.fillStyle = o.background; c.globalAlpha = .94; c.fillRect(w * .08, h * .39, w * .84, h * .22); c.globalAlpha = 1;
    text(c, o.text, w / 2, h / 2, w * .75, Math.min(w, h) * .13 * o.size, '#f5f3ec');
  };
  renderers.flow = (c, w, h, t, o) => {
    const s = Math.min(w, h); c.lineCap = 'round';
    for (let j = 0; j < 34; j++) {
      c.beginPath(); for (let i = 0; i <= 140; i++) {
        const x = i / 140 * w, y = h * .5 + (j - 16.5) * s * .017 + Math.sin(i / 140 * TAU * 1.2 + t * 1.1 + j * .11) * s * .11 * o.size + Math.sin(i / 140 * 9 - t * .7) * s * .06;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.strokeStyle = j % 5 === 0 ? o.secondary : o.color; c.globalAlpha = .35 + .6 * j / 34; c.lineWidth = s * .003; c.stroke();
    }
    c.globalAlpha = 1; title(c, o, w, h, t);
  };

  // Shared WebGL ray marcher: original SDF clay and repeated torus scenes.
  let glCanvas, gl, program, uniforms, glError;
  const vertex = 'attribute vec2 position; void main(){ gl_Position=vec4(position,0.,1.); }';
  const fragment = `precision highp float;
    uniform vec2 res; uniform float time; uniform float mode; uniform float objectScale; uniform vec3 ink; uniform vec3 accent; uniform vec3 bg;
    mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
    float torus(vec3 p,float a,float b){return length(vec2(length(p.xy)-a,p.z))-b;}
    float scene(vec3 p){
      if(mode<.5){
        p.xz=rot(time*.37)*p.xz; p.yz=rot(time*.23)*p.yz;
        float sphere=length(p)-.86;
        float donut=torus(p,.65,.25);
        vec3 q=abs(p)-vec3(.64); float box=length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-.16;
        float phase=mod(time*.48,3.); if(phase<1.) return mix(sphere,donut,smoothstep(0.,1.,phase));
        if(phase<2.)return mix(donut,box,smoothstep(1.,2.,phase)); return mix(box,sphere,smoothstep(2.,3.,phase));
      }
      p.xy=rot(.18*sin(time*.35)+p.z*.08)*p.xy;
      p.z=mod(p.z+time*.8,2.2)-1.1;
      return torus(p,1.55,.11);
    }
    void main(){
      vec2 uv=(gl_FragCoord.xy*2.-res)/min(res.x,res.y); uv.y+=.12; if(mode<.5)uv/=objectScale;
      vec3 ro=vec3(0.,0.,mode<.5?3.7:4.4),rd=normalize(vec3(uv,mode<.5?-3.:-1.4));
      float d=0.; bool hit=false; vec3 p;
      for(int i=0;i<88;i++){ p=ro+rd*d; float s=scene(p); if(abs(s)<.002){hit=true;break;} d+=max(.001,s*.8); if(d>20.)break; }
      vec3 color=bg;
      if(hit){ vec2 e=vec2(.003,0.); vec3 n=normalize(vec3(scene(p+e.xyy)-scene(p-e.xyy),scene(p+e.yxy)-scene(p-e.yxy),scene(p+e.yyx)-scene(p-e.yyx)));
        vec3 light=normalize(vec3(-2.,3.,4.)); float lam=max(0.,dot(n,light)); float rim=pow(1.-max(0.,dot(n,-rd)),3.);
        vec3 base=ink;
        if(mode>.5) base=.5+.5*cos(vec3(0.,2.1,4.2)+p.z*.9+time*.6+dot(n,-rd)*4.);
        color=base*(.2+.8*lam)+accent*rim*.55+vec3(pow(max(0.,dot(reflect(-light,n),-rd)),32.))*.6;
        if(mode>.5)color=mix(color,bg,1.-exp(-d*.055));
      }
      gl_FragColor=vec4(pow(clamp(color,0.,1.),vec3(.92)),1.);
    }`;
  function initGL() {
    if (gl || glError) return;
    try {
      glCanvas = document.createElement('canvas'); gl = glCanvas.getContext('webgl', { preserveDrawingBuffer: true, alpha: false, antialias: false });
      if (!gl) throw new Error('此電腦無法啟用 WebGL');
      const compile = (type, code) => { const shader = gl.createShader(type); gl.shaderSource(shader, code); gl.compileShader(shader); if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader)); return shader; };
      program = gl.createProgram(); gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex)); gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment)); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program)); gl.useProgram(program);
      const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
      const pos = gl.getAttribLocation(program, 'position'); gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
      uniforms = Object.fromEntries(['res','time','mode','objectScale','ink','accent','bg'].map(k => [k, gl.getUniformLocation(program, k)]));
    } catch (error) { glError = error.message; gl = null; }
  }
  const rgb = hex => hex.match(/[\da-f]{2}/gi).map(v => parseInt(v, 16) / 255);
  function shader(c, w, h, t, o, mode) {
    initGL(); if (!gl) { renderers.morph(c, w, h, t, o); return; }
    const factor = Math.min(1, 1000 / Math.max(w, h));
    const gw = Math.round(w * factor), gh = Math.round(h * factor);
    if (glCanvas.width !== gw || glCanvas.height !== gh) { glCanvas.width = gw; glCanvas.height = gh; }
    gl.viewport(0, 0, gw, gh); gl.useProgram(program); gl.uniform2f(uniforms.res, gw, gh); gl.uniform1f(uniforms.time, t); gl.uniform1f(uniforms.mode, mode); gl.uniform1f(uniforms.objectScale, o.size);
    for (const [name, color] of [['ink',o.color],['accent',o.secondary],['bg',o.background]]) gl.uniform3fv(uniforms[name], rgb(color));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); c.drawImage(glCanvas, 0, 0, w, h); title(c, o, w, h, t);
  }
  renderers.clay = (c,w,h,t,o) => shader(c,w,h,t,o,0);
  renderers.tunnel = (c,w,h,t,o) => shader(c,w,h,t,o,1);

  let glassCanvas;
  renderers.glass = (c,w,h,t,o) => {
    const s = Math.min(w,h);
    if (!glassCanvas) glassCanvas = document.createElement('canvas'); glassCanvas.width=w; glassCanvas.height=h;
    const b=glassCanvas.getContext('2d'); b.fillStyle=o.background;b.fillRect(0,0,w,h);
    for(let i=0;i<9;i++){b.fillStyle=i%2?o.color:o.secondary;b.globalAlpha=.25;b.fillRect(i*w/8,0,w/16,h);}b.globalAlpha=1;
    text(b,o.text,w/2,h*.48,w*.86,s*.18*o.size,'#f4f1e8');c.drawImage(glassCanvas,0,0);
    for(let i=0;i<4;i++){
      const r=s*(.115+.018*i),x=w*(.5+.23*Math.sin(t*.7+i*1.7)),y=h*(.52+.21*Math.cos(t*.6+i*1.5));
      c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();
      const zoom=1.3;c.drawImage(glassCanvas,x-r/zoom,y-r/zoom,r*2/zoom,r*2/zoom,x-r,y-r,r*2,r*2);
      const grad=c.createRadialGradient(x-r*.3,y-r*.35,r*.05,x,y,r);grad.addColorStop(0,'#ffffff55');grad.addColorStop(.6,'#ffffff00');grad.addColorStop(1,o.secondary+'99');
      c.fillStyle=grad;c.fillRect(x-r,y-r,r*2,r*2);c.restore();
      c.strokeStyle='#ffffffaa';c.lineWidth=s*.002;c.beginPath();c.arc(x,y,r,Math.PI,Math.PI*1.7);c.stroke();
    }
    if(o.subtitle)text(c,o.subtitle,w/2,h*.89,w*.8,s*.027,'#f5f3ec',450);
  };
  renderers.particles = (c,w,h,t,o) => {
    const s=Math.min(w,h),n=Math.round(500+o.amount*35),colors=palette(o),angle=t*.33;
    c.save();c.translate(w/2,h*.55);
    for(let i=0;i<n;i++){
      const u=rand(i+5)*TAU,v=rand(i+105)*TAU,r=(.2+.055*Math.cos(v))*s*o.size;
      let x=Math.cos(u)*r,y=Math.sin(u)*r,z=Math.sin(v)*s*.1;
      const burst=.5-.5*Math.cos(t*.9),spread=burst**5;
      x+=Math.cos(v*3)*s*.25*spread;y+=Math.sin(v*2)*s*.25*spread;z+=Math.cos(u*3)*s*.2*spread;
      const xx=x*Math.cos(angle)+z*Math.sin(angle),zz=-x*Math.sin(angle)+z*Math.cos(angle),pers=1/(1+zz/s*.8);
      c.globalAlpha=.32+.65*rand(i+991);circle(c,xx*pers,y*pers,Math.max(.65,s*.0015*pers*(1+rand(i))),colors[i%3]);
    }c.restore();title(c,o,w,h,t);
  };

  // Gray–Scott reaction diffusion, cached at fixed steps so scrubbing and export agree.
  const chem={n:96,frames:null,key:null};
  function prepareChem(amount){
    const n=chem.n,count=n*n;let a=new Float32Array(count).fill(1),b=new Float32Array(count),aa=new Float32Array(count),bb=new Float32Array(count);
    for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(rand(x+y*n)>.985||Math.hypot(x-48,y-48)<7){b[x+y*n]=.85;a[x+y*n]=.4;}
    const frames=[],feed=.026+amount*.00016,kill=.059;
    for(let step=0;step<540;step++){
      for(let y=0;y<n;y++)for(let x=0;x<n;x++){
        const i=x+y*n,l=(x+n-1)%n+y*n,r=(x+1)%n+y*n,u=x+(y+n-1)%n*n,d=x+(y+1)%n*n;
        const la=a[l]+a[r]+a[u]+a[d]-4*a[i],lb=b[l]+b[r]+b[u]+b[d]-4*b[i],ab=a[i]*b[i]*b[i];
        aa[i]=clamp(a[i]+.19*la-ab+feed*(1-a[i]));bb[i]=clamp(b[i]+.095*lb+ab-(kill+feed)*b[i]);
      }[a,aa]=[aa,a];[b,bb]=[bb,b];if(step%6===0)frames.push(b.slice());
    }chem.frames=frames;chem.key=amount;
  }
  let chemCanvas;
  renderers.reaction=(c,w,h,t,o)=>{
    if(chem.key!==o.amount)prepareChem(o.amount);
    if(!chemCanvas){chemCanvas=document.createElement('canvas');chemCanvas.width=chem.n;chemCanvas.height=chem.n;}
    const idx=(.5-.5*Math.cos(t*.35))*(chem.frames.length-1),k=Math.floor(idx),u=idx-k;
    const data=chemCanvas.getContext('2d').createImageData(chem.n,chem.n),fg=rgb(o.color),bg=rgb(o.background);
    for(let i=0;i<chem.n*chem.n;i++){const v=smooth((mix(chem.frames[k][i],chem.frames[Math.min(k+1,chem.frames.length-1)][i],u)-.1)*7);for(let j=0;j<3;j++)data.data[i*4+j]=mix(bg[j],fg[j],v)*255;data.data[i*4+3]=255;}
    chemCanvas.getContext('2d').putImageData(data,0,0);c.drawImage(chemCanvas,0,0,w,h);
    c.fillStyle=o.background+'99';c.fillRect(0,h*.35,w,h*.3);text(c,o.text,w/2,h*.5,w*.8,Math.min(w,h)*.13*o.size,'#f5f3ec');
  };
  renderers.halftone=(c,w,h,t,o)=>{
    const s=Math.min(w,h),step=s/(23+o.amount*.25);
    for(let y=0;y<h;y+=step)for(let x=0;x<w;x+=step){
      const dx=(x-w/2)/s,dy=(y-h*.54)/s,d=Math.hypot(dx,dy),wave=.5+.5*Math.sin(d*18-t*2.5+Math.atan2(dy,dx)*2);
      circle(c,x,y,step*(.08+.4*wave),Math.sin(dx*4+t*.35)>.3?o.secondary:o.color);
    }
    c.fillStyle=o.background+'de';c.fillRect(w*.08,h*.4,w*.84,h*.2);text(c,o.text,w/2,h*.5,w*.77,s*.12*o.size,'#f5f3ec');
  };

  const physicsCache=new Map();
  function physics(amount){
    const count=Math.round(12+amount*.2);if(physicsCache.has(count))return physicsCache.get(count);
    const bodies=Array.from({length:count},(_,i)=>({x:.14+rand(i+9)*.72,y:-.1-rand(i+98)*.8,r:.027+rand(i+17)*.024,vx:(rand(i+44)-.5)*.2,vy:0,a:rand(i)*TAU,spin:(rand(i+31)-.5)*4})),frames=[];
    const dt=1/120;
    for(let f=0;f<720;f++){
      for(const b of bodies){b.vy+=.6*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.a+=b.spin*dt;
        if(b.y+b.r>.8){b.y=.8-b.r;b.vy=-Math.abs(b.vy)*.67;b.vx*=.99;b.spin*=.98;}
        if(b.x-b.r<.08){b.x=.08+b.r;b.vx=Math.abs(b.vx)*.8;}if(b.x+b.r>.92){b.x=.92-b.r;b.vx=-Math.abs(b.vx)*.8;}
      }
      for(let i=0;i<count;i++)for(let j=i+1;j<count;j++){
        const a=bodies[i],b=bodies[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),r=a.r+b.r;
        if(d<r&&d>.0001){const nx=dx/d,ny=dy/d,over=(r-d)/2;a.x-=nx*over;a.y-=ny*over;b.x+=nx*over;b.y+=ny*over;
          const rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rel<0){const imp=-rel*.82;a.vx-=imp*nx;a.vy-=imp*ny;b.vx+=imp*nx;b.vy+=imp*ny;}}
      }if(f%2===0)frames.push(bodies.map(b=>({...b})));
    }physicsCache.set(count,frames);return frames;
  }
  renderers.physics=(c,w,h,t,o)=>{
    const frames=physics(o.amount),phase=((t%8)+8)%8,ft=Math.min(5.98,phase<6?phase:(8-phase)*2.99)*60,k=Math.floor(ft),u=ft-k,colors=palette(o),s=Math.min(w,h);
    grid(c,w,h,o.secondary,s*.1);c.strokeStyle=o.color;c.lineWidth=s*.005;c.beginPath();c.moveTo(w*.08,h*.8);c.lineTo(w*.92,h*.8);c.stroke();
    frames[k].forEach((b,i)=>{const next=frames[Math.min(k+1,359)][i],x=mix(b.x,next.x,u)*w,y=mix(b.y,next.y,u)*h,r=b.r*s;
      c.save();c.translate(x,y);c.rotate(mix(b.a,next.a,u));circle(c,0,0,r,colors[i%3]);c.fillStyle=o.background;c.font=font(r*.95);c.textAlign='center';c.textBaseline='middle';c.fillText(Array.from(o.text.replace(/\s/g,''))[i%Math.max(1,Array.from(o.text.replace(/\s/g,'')).length)]||'✦',0,0);c.restore();
    });title(c,o,w,h,t);
  };
  const definitions=[
    ['bounce','彈跳小球','幾何','壓扁、拉長，讓小球跳出節奏。','●'],
    ['type','呼吸文字','文字','文字逐字伸展，隨節奏輕輕起伏。','Aa'],
    ['morph','形狀變奏','幾何','圓、方、星形，流暢變換輪廓。','✦'],
    ['clay','黏土立體','幾何','帶柔和光影的立體形狀變化。','◉'],
    ['rhythm','節奏拼貼','幾何','幾何色塊排成會跳舞的網格。','▦'],
    ['flow','流動線條','幾何','層層曲線，像風吹過的波浪。','≋'],
    ['glass','玻璃透鏡','質感','移動的透明球，放大背後的文字。','◌'],
    ['tunnel','光影隧道','質感','穿過帶有金屬色澤的立體圓環。','◎'],
    ['particles','星塵粒子','質感','粒子聚成圓環，再向外散開。','⁙'],
    ['reaction','有機生長','質感','反應擴散模擬生成有機紋理。','❋'],
    ['halftone','網點印刷','質感','用大小網點畫出流動的印刷質感。','⠿'],
    ['physics','物理遊樂場','文字','有碰撞與重力的字母小球。','◒']
  ].map(([id,name,category,description,icon])=>({id,name,category,description,icon}));
  window.MotionEffects={definitions,render(c,w,h,t,o){c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.fillStyle=o.background;c.fillRect(0,0,w,h);(renderers[o.effect]||renderers.bounce)(c,w,h,t*o.speed,o);c.restore();},getDiagnostics(){initGL();return {webgl:!!gl,error:glError||null};}};
})();
