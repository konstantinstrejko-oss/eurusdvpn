/* EurUsdVPN — общий JS многостраничного сайта */
(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* page enter */
  var main=document.querySelector('main'); if(main) main.classList.add('page-enter');

  /* loader hide on load */
  var loader=document.getElementById('loader');
  function hideLoader(){ if(loader) loader.classList.add('hidden'); }
  if(document.readyState==='complete') setTimeout(hideLoader,250);
  else window.addEventListener('load',function(){setTimeout(hideLoader,250);});
  setTimeout(hideLoader,2500); // подстраховка

  /* header scroll */
  var hdr=document.getElementById('hdr');
  function onScroll(){ if(hdr) hdr.classList.toggle('scrolled', window.scrollY>20); }
  window.addEventListener('scroll',onScroll,{passive:true}); onScroll();

  /* mobile nav */
  var burger=document.getElementById('burger'), mobnav=document.getElementById('mobnav');
  if(burger){ burger.addEventListener('click',function(){burger.classList.toggle('open');mobnav.classList.toggle('open');}); }

  /* smooth page transitions */
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a'); if(!a) return;
    var href=a.getAttribute('href');
    if(!href||href.charAt(0)==='#'||a.target==='_blank'||a.hasAttribute('download')) return;
    var url; try{url=new URL(a.href, location.href);}catch(_){return;}
    if(url.origin!==location.origin) return;
    if(url.pathname===location.pathname && url.search===location.search){ return; }
    e.preventDefault();
    if(reduce||!loader){ location.href=a.href; return; }
    loader.classList.remove('hidden'); loader.classList.add('leaving');
    setTimeout(function(){ location.href=a.href; },380);
  });

  /* reveal on scroll */
  if(!reduce && 'IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(en,i){ if(en.isIntersecting){ en.target.style.transitionDelay=(Math.min(i,6)*60)+'ms'; en.target.classList.add('in'); io.unobserve(en.target);} });},{threshold:.14});
    document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});
  } else { document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('in');}); }

  /* count-up */
  function setFinal(n){ if(n.dataset.zero){n.textContent='0';} else if(n.dataset.dec){n.textContent=parseFloat(n.dataset.count).toFixed(n.dataset.dec);} else {n.textContent=n.dataset.count;} }
  function countUp(el){
    if(el.dataset.zero){el.textContent='0';return;}
    var target=parseFloat(el.dataset.count),dec=parseInt(el.dataset.dec||'0'),dur=1400,t0=performance.now();
    function tick(now){var p=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-p,3),v=target*e;
      el.textContent=dec?v.toFixed(dec):Math.round(v).toLocaleString('ru-RU');
      if(p<1)requestAnimationFrame(tick);else setFinal(el);}
    requestAnimationFrame(tick);
  }
  if('IntersectionObserver' in window){
    var sio=new IntersectionObserver(function(es){es.forEach(function(en){ if(en.isIntersecting){ en.target.querySelectorAll('[data-count]').forEach(function(n){ reduce?setFinal(n):countUp(n); }); sio.unobserve(en.target);} });},{threshold:.4});
    document.querySelectorAll('.stats .stat').forEach(function(s){sio.observe(s);});
  } else { document.querySelectorAll('[data-count]').forEach(setFinal); }

  /* FAQ */
  window.toggleFaq=function(el){var open=el.classList.contains('op');document.querySelectorAll('.fi.op').forEach(function(f){f.classList.remove('op');});if(!open)el.classList.add('op');};

  /* install tabs (how page) */
  window.switchTab=function(i,btn){
    document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('active');});
    document.querySelectorAll('.tab').forEach(function(b){b.classList.remove('active');});
    var pn=document.getElementById('panel'+i); if(pn)pn.classList.add('active');
    if(btn)btn.classList.add('active');
  };

  /* open mini app / cabinet */
  window.openCabinet=function(e){e&&e.preventDefault();var tg=window.Telegram&&window.Telegram.WebApp;var u=tg&&tg.initDataUnsafe&&tg.initDataUnsafe.user;
    if(u&&u.id){location.href='https://konstantinstrejko-oss.github.io/eurusdvpn/miniapp.html?tg_id='+u.id+'&name='+encodeURIComponent(u.first_name||'');}
    else{window.open('https://t.me/EurUsdVpnService_bot/miniapp','_blank');}return false;};

  /* custom cursor */
  if(!reduce && window.matchMedia('(hover:hover)').matches){
    var cur=document.createElement('div');cur.className='cur';
    var dot=document.createElement('div');dot.className='cur-dot';
    document.body.appendChild(cur);document.body.appendChild(dot);
    var cxv=0,cyv=0,rxv=0,ryv=0;
    window.addEventListener('mousemove',function(e){cxv=e.clientX;cyv=e.clientY;dot.style.transform='translate('+cxv+'px,'+cyv+'px) translate(-50%,-50%)';},{passive:true});
    (function ring(){rxv+=(cxv-rxv)*.18;ryv+=(cyv-ryv)*.18;cur.style.transform='translate('+rxv+'px,'+ryv+'px) translate(-50%,-50%)';requestAnimationFrame(ring);})();
    document.addEventListener('mouseover',function(e){ if(e.target.closest('a,button,.tab,.fi,.pc,.feat')) cur.classList.add('hot'); });
    document.addEventListener('mouseout',function(e){ if(e.target.closest('a,button,.tab,.fi,.pc,.feat')) cur.classList.remove('hot'); });
  }
})();
