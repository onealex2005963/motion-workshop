(() => {
  const tabs = [...document.querySelectorAll('[role=tab]')], indicator = document.querySelector('.indicator');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = 0, count = 0;
  const animations = new Set();
  function animate(element, frames, options) {
    if (reduced.matches) return;
    const animation = element.animate(frames,options); animations.add(animation);
    animation.finished.catch(()=>{}).finally(()=>animations.delete(animation));
  }
  function position() {
    const tab=tabs[selected]; indicator.style.transform=`translate(${tab.offsetLeft}px,${tab.offsetTop}px)`;
    indicator.style.width=tab.offsetWidth+'px'; indicator.style.height=tab.offsetHeight+'px';
  }
  function activate(index, focus=false) {
    selected=index; tabs.forEach((tab,i)=>{
      tab.setAttribute('aria-selected',String(i===index)); tab.tabIndex=i===index?0:-1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden=i!==index;
    }); position(); if(focus)tabs[index].focus();
    const panel=document.getElementById(tabs[index].getAttribute('aria-controls'));
    const cards=[...panel.querySelectorAll('.card')];
    (cards.length?cards:[panel]).forEach((element,i)=>animate(element,[{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:380,delay:i*80,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'}));
  }
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>activate(i));
    tab.addEventListener('keydown',e=>{
      const target=e.key==='ArrowRight'?(i+1)%tabs.length:e.key==='ArrowLeft'?(i+tabs.length-1)%tabs.length:e.key==='Home'?0:e.key==='End'?tabs.length-1:null;
      if(target!==null){e.preventDefault();activate(target,true);}
    });
  });
  document.querySelector('#action').addEventListener('click',e=>{
    document.querySelector('#result').textContent=`已收到第 ${++count} 次操作。`;
    if(reduced.matches)return;
    const ripple=document.createElement('span');ripple.className='ripple';ripple.setAttribute('aria-hidden','true');e.currentTarget.append(ripple);
    const animation=ripple.animate([{transform:'scale(1)',opacity:.9},{transform:'scale(12)',opacity:0}],{duration:550});
    animations.add(animation);animation.finished.catch(()=>{}).finally(()=>{animations.delete(animation);ripple.remove();});
  });
  const observer=new ResizeObserver(position);observer.observe(document.querySelector('.tabs'));position();
  reduced.addEventListener('change',()=>{if(reduced.matches)animations.forEach(a=>a.cancel());});
  window.addEventListener('pagehide',()=>{observer.disconnect();animations.forEach(a=>a.cancel());});
})();
