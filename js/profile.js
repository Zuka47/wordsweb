/* =========================================================
   profile.js — Profile / statistics page logic
   ========================================================= */

document.addEventListener('DOMContentLoaded', ()=>{
  renderUsername();
  renderStats();
  renderAchievements();
  renderHistory();
  initThemeToggle();
  initClearHistory();
});

function renderUsername(){
  const el = document.getElementById('profile-username');
  const name = Store.get('skg_username', 'სტუმარი');
  el.textContent = `მოგესალმებით, ${name}`;
}

function renderStats(){
  const stats = getStats();
  animateNumber(document.getElementById('p-searched'), stats.searched);
  animateNumber(document.getElementById('p-discoveries'), stats.discoveries);
  animateNumber(document.getElementById('p-duplicates'), stats.duplicates);

  const rate = stats.searched > 0 ? Math.round((stats.discoveries / stats.searched) * 100) : 0;
  document.getElementById('p-success').textContent = rate + '%';
  document.getElementById('p-success-bar').style.width = rate + '%';
}

function animateNumber(el, target){
  if(!el) return;
  const start = 0;
  const duration = 600;
  const t0 = performance.now();
  function step(t){
    const p = Math.min(1, (t - t0)/duration);
    el.textContent = Math.round(start + (target-start)*p);
    if(p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function renderAchievements(){
  const stats = getStats();
  const grid = document.getElementById('achv-grid');
  grid.innerHTML = ACHIEVEMENTS.map(a => `
    <div class="card achv ${stats.achievements.includes(a.id) ? 'unlocked' : ''}">
      <div class="glyph">${a.glyph}</div>
      <div class="name">${a.name}</div>
      <div class="desc">${a.desc}</div>
    </div>
  `).join('');
}

function renderHistory(){
  const stats = getStats();
  const list = document.getElementById('history-list');
  if(!stats.history.length){
    list.innerHTML = `
      <div class="empty-state">
        <div class="glyph">🕘</div>
        <p>ისტორია ცარიელია — დაიწყეთ ძებნა მთავარ გვერდზე.</p>
      </div>`;
    return;
  }
  list.innerHTML = stats.history.slice(0, 25).map(h => `
    <div class="history-row">
      <span class="h-word ka">${escapeHTML(h.word)}</span>
      <span style="display:flex; align-items:center; gap:10px;">
        <span style="font-size:.78rem; color:var(--text-mute);">${formatTime(h.ts)}</span>
        <span class="h-tag ${h.status === 'new' ? 'new' : 'dup'}">${h.status === 'new' ? 'ახალი' : 'გამეორება'}</span>
      </span>
    </div>
  `).join('');
}

function formatTime(ts){
  const d = new Date(ts);
  return d.toLocaleDateString('ka-GE', { day:'2-digit', month:'2-digit' }) + ' ' + d.toLocaleTimeString('ka-GE', { hour:'2-digit', minute:'2-digit' });
}

function initThemeToggle(){
  const toggle = document.getElementById('theme-toggle');
  const current = Store.get('skg_theme', 'dark');
  if(current === 'light') toggle.classList.add('on');

  toggle.addEventListener('click', ()=>{
    SFX.play('click');
    const isLight = toggle.classList.toggle('on');
    applyTheme(isLight ? 'light' : 'dark');
  });
}

function initClearHistory(){
  const btn = document.getElementById('clear-history-btn');
  btn.addEventListener('click', ()=>{
    const confirmClear = confirm('დარწმუნებული ხართ, რომ გსურთ მთელი სტატისტიკის წაშლა? ეს მოქმედება შეუქცევადია.');
    if(!confirmClear) return;
    saveStats(DEFAULT_STATS_COPY());
    SFX.play('duplicate');
    showToast('თქვენი სტატისტიკა და ისტორია წაიშალა.', { title:'ისტორია გასუფთავდა', type:'info' });
    renderStats();
    renderAchievements();
    renderHistory();
  });
}

function DEFAULT_STATS_COPY(){
  return {
    searched: 0,
    discoveries: 0,
    duplicates: 0,
    history: [],
    discoveredWords: [],
    achievements: []
  };
}

function escapeHTML(str){
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
