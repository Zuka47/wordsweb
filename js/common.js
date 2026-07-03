/* =========================================================
   common.js — shared across all pages
   Handles: burger menu, theme, toasts, sound fx, storage helpers
   ========================================================= */

/* ---------- Route progress bar (cosmetic loading feel) ---------- */
(function routeProgress(){
  const bar = document.getElementById('route-progress');
  if(!bar) return;
  let w = 0;
  const tick = setInterval(()=>{
    w += (90 - w) * 0.18;
    bar.style.width = w + '%';
  }, 60);
  window.addEventListener('load', ()=>{
    clearInterval(tick);
    bar.style.width = '100%';
    setTimeout(()=>{ bar.style.opacity = '0'; }, 250);
  });
})();

/* ---------- Storage helpers ---------- */
const Store = {
  get(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){ return fallback; }
  },
  set(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const DEFAULT_STATS = {
  searched: 0,
  discoveries: 0,
  duplicates: 0,
  history: [],          // {word, status, ts}
  discoveredWords: [],  // array of word strings (this user's session discoveries)
  achievements: []      // array of achievement ids unlocked
};

function getStats(){ return Store.get('skg_stats', DEFAULT_STATS); }
function saveStats(stats){ Store.set('skg_stats', stats); }

const ACHIEVEMENTS = [
  { id:'first_word', glyph:'🔹', name:'პირველი ნაბიჯი', desc:'აღმოაჩინე პირველი სიტყვა', test: s => s.discoveries >= 1 },
  { id:'five_words', glyph:'💎', name:'კოლექციონერი', desc:'აღმოაჩინე 5 სიტყვა', test: s => s.discoveries >= 5 },
  { id:'twenty_words', glyph:'👑', name:'ენათმეცნიერი', desc:'აღმოაჩინე 20 სიტყვა', test: s => s.discoveries >= 20 },
  { id:'ten_searches', glyph:'🔍', name:'მაძიებელი', desc:'მოიძიე 10-ჯერ', test: s => s.searched >= 10 },
  { id:'no_dupes', glyph:'⚡', name:'სუფთა სერია', desc:'5 აღმოჩენა გამეორების გარეშე', test: s => s.discoveries >= 5 && s.duplicates === 0 }
];

function checkAchievements(stats){
  const newlyUnlocked = [];
  ACHIEVEMENTS.forEach(a=>{
    if(!stats.achievements.includes(a.id) && a.test(stats)){
      stats.achievements.push(a.id);
      newlyUnlocked.push(a);
    }
  });
  return newlyUnlocked;
}

/* ---------- Sound effects (synthesized — no audio files needed) ---------- */
const SFX = {
  ctx: null,
  init(){ if(!this.ctx){ this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } },
  play(type){
    try{
      this.init();
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);

      if(type === 'discover'){
        o.type = 'triangle';
        o.frequency.setValueAtTime(440, now);
        o.frequency.exponentialRampToValueAtTime(880, now + 0.18);
        g.gain.setValueAtTime(0.18, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        o.start(now); o.stop(now + 0.42);
      } else if(type === 'duplicate'){
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(220, now);
        o.frequency.exponentialRampToValueAtTime(140, now + 0.22);
        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        o.start(now); o.stop(now + 0.3);
      } else if(type === 'click'){
        o.type = 'sine';
        o.frequency.setValueAtTime(600, now);
        g.gain.setValueAtTime(0.08, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        o.start(now); o.stop(now + 0.09);
      } else if(type === 'achievement'){
        [523,659,784].forEach((f,i)=>{
          const oo = ctx.createOscillator(); const gg = ctx.createGain();
          oo.connect(gg); gg.connect(ctx.destination);
          oo.type='triangle'; oo.frequency.setValueAtTime(f, now + i*0.1);
          gg.gain.setValueAtTime(0.15, now + i*0.1);
          gg.gain.exponentialRampToValueAtTime(0.001, now + i*0.1 + 0.35);
          oo.start(now + i*0.1); oo.stop(now + i*0.1 + 0.36);
        });
      }
    }catch(e){ /* audio not available — fail silently */ }
  }
};

/* ---------- Toast notifications ---------- */
function showToast(message, opts = {}){
  const { title = '', type = 'info', duration = 3600 } = opts;
  let stack = document.getElementById('toast-stack');
  if(!stack){
    stack = document.createElement('div');
    stack.id = 'toast-stack';
    document.body.appendChild(stack);
  }
  const icons = { success:'✦', error:'✕', info:'ⓘ' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `
    <span class="ico">${icons[type] || 'ⓘ'}</span>
    <div class="body">
      ${title ? `<strong>${title}</strong>` : ''}
      <span>${message}</span>
    </div>`;
  stack.appendChild(el);
  requestAnimationFrame(()=> el.classList.add('show'));
  setTimeout(()=>{
    el.classList.remove('show');
    setTimeout(()=> el.remove(), 400);
  }, duration);
}

/* ---------- Shard burst (signature confetti) ---------- */
function shardBurst(originEl){
  const burst = document.createElement('div');
  burst.className = 'shard-burst';
  document.body.appendChild(burst);

  const rect = originEl ? originEl.getBoundingClientRect() : { left: window.innerWidth/2, top: window.innerHeight/2, width:0, height:0 };
  const cx = rect.left + rect.width/2;
  const cy = rect.top + rect.height/2;
  const colors = ['#8b5cf6','#4f8cff','#a78bfa','#34d399','#fbbf24'];

  for(let i=0;i<26;i++){
    const s = document.createElement('div');
    s.className = 'shard';
    const angle = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random()*160;
    const dx = Math.cos(angle)*dist;
    const dy = Math.sin(angle)*dist - 40;
    const rot = Math.random()*360;
    s.style.left = cx + 'px';
    s.style.top = cy + 'px';
    s.style.background = colors[i % colors.length];
    s.style.transform = `translate(0,0) rotate(0deg)`;
    s.style.transition = `transform ${0.7 + Math.random()*0.4}s cubic-bezier(.16,.84,.44,1), opacity ${0.9 + Math.random()*0.3}s ease-out`;
    burst.appendChild(s);
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{
        s.style.opacity = '1';
        s.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
        setTimeout(()=>{ s.style.opacity = '0'; }, 500);
      });
    });
  }
  setTimeout(()=> burst.remove(), 1500);
}

/* ---------- Theme ---------- */
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  Store.set('skg_theme', theme);
}
function initTheme(){
  const theme = Store.get('skg_theme', 'dark');
  applyTheme(theme);
}
initTheme();

/* ---------- Navbar: burger / side panel ---------- */
function initNav(){
  const burger = document.querySelector('.burger');
  const panel = document.querySelector('.side-panel');
  const overlay = document.querySelector('.overlay');
  if(!burger || !panel || !overlay) return;

  function closeMenu(){
    burger.classList.remove('open');
    panel.classList.remove('open');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
  }
  function openMenu(){
    burger.classList.add('open');
    panel.classList.add('open');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  burger.addEventListener('click', ()=>{
    burger.classList.contains('open') ? closeMenu() : openMenu();
  });
  overlay.addEventListener('click', closeMenu);
  panel.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  // mark active link by current page
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .side-panel a').forEach(a=>{
    const href = a.getAttribute('href');
    if(href === current) a.classList.add('active');
  });
}
document.addEventListener('DOMContentLoaded', initNav);
