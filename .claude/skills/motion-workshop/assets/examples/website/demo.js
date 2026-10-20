(() => {
  const canvas = document.querySelector('#stage'), select = document.querySelector('#effect');
  const play = document.querySelector('#play'), time = document.querySelector('#time');
  const clip = (effect, text, transition) => ({ ...MotionProject.defaultClip(effect), text, duration:3, transition });
  const sequence = { version:2, ratio:'16:9', quality:720, fps:30, clips:[
    clip('mask-reveal','讓靈感\n動起來',{type:'push',duration:.6}),
    { ...clip('chart-build','用數據說故事',{type:'circle',duration:.6}),items:['一月','二月','三月','四月'],values:[35,70,55,90],subtitle:'示意數據，可以替換成你的內容' },
    { ...clip('card-flyin','把點子分享出去',{type:'cut',duration:.1}),items:['網站','介面','影片'] }
  ] };
  let player;
  for (const effect of MotionEffects.definitions) {
    const option = document.createElement('option'); option.value = effect.id; option.textContent = effect.name; select.append(option);
  }
  function load() {
    player?.dispose();
    const raw = select.value === 'sequence' ? sequence : { ...sequence, clips:[MotionProject.defaultClip(select.value)] };
    const project = MotionProject.validate(raw);
    time.max = String(MotionProject.duration(project) - 1 / project.fps); time.step = String(1/project.fps);
    player = MotionWorkshopPlayer.createPreviewPlayer(canvas, project, (seconds, playing) => {
      time.value = String(seconds); document.querySelector('#clock').textContent = seconds.toFixed(2)+'s';
      play.textContent = playing ? '暫停' : '播放'; play.setAttribute('aria-pressed', String(playing));
    });
    document.querySelector('#alternative').textContent = '畫面內容：'+project.clips.map(c=>c.text.replace(/\n/g,' ')).join('／');
    document.querySelector('#status').textContent = `${project.clips.length} 幕 · ${player.frames} 影格 · ${player.duration.toFixed(2)} 秒 · ${project.fps} FPS`;
  }
  select.addEventListener('change',load); play.addEventListener('click',()=>player.playing?player.pause():player.play());
  time.addEventListener('input',()=>player.seek(Number(time.value)));
  document.querySelector('#png').addEventListener('click',()=>{
    player.pause(); canvas.toBlob(blob=>{
      if (!blob) return; const url=URL.createObjectURL(blob), link=document.createElement('a');
      link.href=url; link.download='motion-frame.png'; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
    },'image/png');
  });
  window.addEventListener('pagehide',()=>player?.dispose()); load();
})();
