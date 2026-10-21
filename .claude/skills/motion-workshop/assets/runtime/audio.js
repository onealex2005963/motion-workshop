/* Offline CC0 sound playback and deterministic PCM mixing. Sound credits: sounds/catalog.json. */
(() => {
  'use strict';
  const sounds = [
    ['click','輕點'],['soft-click','柔和點擊'],['select','選取'],['confirm','完成確認'],
    ['open','展開'],['close','收合'],['expand','放大'],['shrink','縮小'],
    ['drop','落下'],['bell','清脆提示'],['pluck','撥弦'],['switch','切換'],
    ['toggle','開關'],['tick','節拍'],['error','錯誤提示'],['scroll','滑動']
  ].map(([id,name])=>({id,name,file:id+'.wav'}));
  const rate=22050,cache=new Map();let loader,context;
  const baseURL=typeof document!=='undefined'&&document.currentScript?new URL('sounds/',document.currentScript.src):null;
  const bound=(v,a,b,d)=>typeof v==='number'&&Number.isFinite(v)?Math.max(a,Math.min(b,v)):d;
  function normalizeCues(raw,duration,fps){
    if(!Array.isArray(raw))return [];
    return raw.slice(0,12).filter(c=>c&&sounds.some(s=>s.id===c.sound)).map(c=>({sound:c.sound,time:Math.round(bound(c.time,0,duration,0)*fps)/fps,volume:bound(c.volume,0,2,.7),rate:bound(c.rate,.5,2,1),fadeIn:bound(c.fadeIn,0,2,0),fadeOut:bound(c.fadeOut,0,2,.04)}));
  }
  function events(project){
    if(project.audio?.enabled===false)return [];
    const rows=window.MotionProject.timeline(project),duration=window.MotionProject.duration(project);
    return project.clips.flatMap((clip,i)=>(clip.audio||[]).map((cue,j)=>({...cue,scene:i,index:j,start:rows[i].start+cue.time,end:Math.min(duration,rows[i].end)}))).filter(c=>c.start<c.end);
  }
  function audioContext(){if(!context)context=new (window.AudioContext||window.webkitAudioContext)();return context;}
  async function load(sound){
    if(cache.has(sound))return cache.get(sound);
    const item=sounds.find(s=>s.id===sound);if(!item)throw new Error('不支援的音效：'+sound);
    const pending=(async()=>{
      const data=loader?await loader(item.file):await fetch(new URL(item.file,baseURL)).then(r=>{if(!r.ok)throw new Error('音效讀取失敗：'+item.name);return r.arrayBuffer();});
      // All bundled files are mono PCM16 WAV. Parse directly, including non-audio RIFF chunks.
      const view=new DataView(data);const tag=offset=>String.fromCharCode(...new Uint8Array(data,offset,4));
      if(data.byteLength<44||tag(0)!=='RIFF'||tag(8)!=='WAVE')throw new Error('音效 WAV 格式錯誤。');
      let offset=12,sampleRate=0,channels=0,format=0,bits=0,pcm;
      while(offset+8<=data.byteLength){const type=tag(offset),size=view.getUint32(offset+4,true),start=offset+8;if(start+size>data.byteLength)throw new Error('音效資料不完整。');
        if(type==='fmt '&&size>=16){format=view.getUint16(start,true);channels=view.getUint16(start+2,true);sampleRate=view.getUint32(start+4,true);bits=view.getUint16(start+14,true);}
        if(type==='data')pcm={start,size};offset=start+size+(size%2);
      }
      if(!pcm||format!==1||channels!==1||bits!==16||sampleRate!==rate)throw new Error('音效需使用 22050 Hz 單聲道 PCM16。');
      const samples=new Float32Array(Math.floor(pcm.size/2));for(let i=0;i<samples.length;i++)samples[i]=view.getInt16(pcm.start+i*2,true)/32768;return samples;
    })();cache.set(sound,pending);try{return await pending;}catch(e){cache.delete(sound);throw e;}
  }
  function mix(project,samples){
    const cues=events(project),out=new Float32Array(Math.round(window.MotionProject.duration(project)*rate)),master=bound(project.audio?.volume,0,1,.8);
    for(const cue of cues){
      const source=samples.get(cue.sound);if(!source)throw new Error('缺少音效資料：'+cue.sound);
      const start=Math.round(cue.start*rate),length=Math.min(Math.ceil(source.length/cue.rate),Math.max(0,Math.round(cue.end*rate)-start),out.length-start);
      const fadeIn=Math.min(cue.fadeIn*rate,length/2),fadeOut=Math.min(cue.fadeOut*rate,length/2);
      for(let i=0;i<length;i++){const at=i*cue.rate,a=Math.floor(at),fraction=at-a,value=source[a]*(1-fraction)+(source[Math.min(a+1,source.length-1)]||0)*fraction;
        const envelope=Math.min(1,fadeIn?i/fadeIn:1,fadeOut?(length-1-i)/fadeOut:1);out[start+i]+=value*cue.volume*master*Math.max(0,envelope);}
    }
    let peak=1;for(const n of out)peak=Math.max(peak,Math.abs(n));if(peak>1)for(let i=0;i<out.length;i++)out[i]/=peak;
    return out;
  }
  async function renderMix(project){const map=new Map();await Promise.all([...new Set(events(project).map(c=>c.sound))].map(async id=>map.set(id,await load(id))));return mix(project,map);}
  function wav(samples){
    const buffer=new ArrayBuffer(44+samples.length*2),v=new DataView(buffer),text=(at,s)=>{for(let i=0;i<s.length;i++)v.setUint8(at+i,s.charCodeAt(i));};
    text(0,'RIFF');v.setUint32(4,36+samples.length*2,true);text(8,'WAVE');text(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,samples.length*2,true);
    for(let i=0;i<samples.length;i++)v.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),true);return buffer;
  }
  async function exportBase64(project){
    if(!events(project).length||project.audio?.volume===0)return null;
    const bytes=new Uint8Array(wav(await renderMix(project)));let text='';for(let i=0;i<bytes.length;i+=16384)text+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(text);
  }
  async function createPlayer(project){
    const samples=await renderMix(project),ctx=audioContext(),buffer=ctx.createBuffer(1,samples.length,rate);buffer.copyToChannel(samples,0);let source;
    const pause=()=>{if(source){source.onended=null;try{source.stop();}catch{}source.disconnect();source=null;}};
    return {pause,dispose:pause,async play(seconds){pause();await ctx.resume();if(seconds>=buffer.duration)return;source=ctx.createBufferSource();source.buffer=buffer;source.connect(ctx.destination);source.start(0,Math.max(0,seconds));}};
  }
  let audition;
  async function preview(sound){
    const ctx=audioContext();await ctx.resume();const samples=await load(sound),buffer=ctx.createBuffer(1,samples.length,rate);buffer.copyToChannel(samples,0);
    if(audition){try{audition.stop();}catch{}audition.disconnect();}audition=ctx.createBufferSource();audition.buffer=buffer;const gain=ctx.createGain();gain.gain.value=.65;audition.connect(gain);gain.connect(ctx.destination);audition.onended=()=>gain.disconnect();audition.start();
  }
  async function waveform(sound,bins=80){const samples=await load(sound),count=Math.max(16,Math.min(512,Math.round(bins))),peaks=[];for(let i=0;i<count;i++){let peak=0;const from=Math.floor(i/count*samples.length),to=Math.max(from+1,Math.floor((i+1)/count*samples.length));for(let j=from;j<to&&j<samples.length;j++)peak=Math.max(peak,Math.abs(samples[j]));peaks.push(peak);}const max=Math.max(.001,...peaks);return{duration:samples.length/rate,peaks:peaks.map(p=>p/max)};}
  window.MotionAudio={waveform,sounds,sampleRate:rate,normalizeCues,events,mix,renderMix,wav,exportBase64,createPlayer,preview,unlock:()=>audioContext().resume(),setLoader(fn){loader=fn;cache.clear();}};
})();
