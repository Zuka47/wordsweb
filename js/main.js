/* =========================================================
   main.js — Home page logic
   ========================================================= */

const GEORGIAN_ONLY = /^[\u10A0-\u10FF\s]+$/;

let knownWords = [];   // loaded from JSON + localStorage merged (lowercase form for matching)
let recentList = [];

const els = {};

document.addEventListener('DOMContentLoaded', async ()=>{
  els.form = document.getElementById('search-form');
  els.input = document.getElementById('word-input');
  els.box = document.getElementById('search-box');
  els.hint = document.getElementById('search-hint');
  els.recent = document.getElementById('recent-list');
  els.totalDiscoveries = document.getElementById('stat-total');
  els.userDiscoveries = document.getElementById('stat-user');
  els.searches = document.getElementById('stat-searches');

  await loadWordBank();
  renderRecent();
  renderTopStats();

  els.form.addEventListener('submit', onSubmit);
  els.input.addEventListener('input', ()=> clearHint());

  const randomBtn = document.getElementById('random-word-btn');
  if(randomBtn) randomBtn.addEventListener('click', insertRandomWord);
});

async function loadWordBank(){
  showLoading(true);
  try{
    const res = await fetch('data/words.json');
    if(!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    const seed = data.words.map(w => ({ word: w.word, meaning: w.meaning, by: w.discoveredBy, rarity: w.rarity, ts: 0 }));

    const stored = Store.get('skg_discovered', []); // [{word, meaning, by, rarity, ts}]
    knownWords = mergeUnique(seed, stored);
    recentList = [...knownWords].sort((a,b)=> b.ts - a.ts).slice(0, 8);
  }catch(err){
    console.error('Failed to load word bank:', err);
    showToast('სიტყვების ბაზის ჩატვირთვა ვერ მოხერხდა. სცადეთ მოგვიანებით.', { title:'შეცდომა', type:'error' });
    knownWords = Store.get('skg_discovered', []);
    recentList = [...knownWords].sort((a,b)=> b.ts - a.ts).slice(0, 8);
  }finally{
    showLoading(false);
  }
}

function mergeUnique(seed, stored){
  const map = new Map();
  seed.forEach(w => map.set(normalize(w.word), w));
  stored.forEach(w => map.set(normalize(w.word), w));
  return Array.from(map.values());
}

function normalize(w){ return w.trim().toLowerCase(); }

function showLoading(isLoading){
  const spinner = document.getElementById('recent-loading');
  if(!spinner) return;
  spinner.style.display = isLoading ? 'block' : 'none';
}

function clearHint(){
  els.hint.innerHTML = 'მხოლოდ ქართული ასოები';
  els.box.classList.remove('shake');
}

function validate(raw){
  const trimmed = raw.trim();
  if(trimmed.length === 0) return { ok:false, msg:'გთხოვთ, შეიყვანოთ სიტყვა.' };
  if(/[0-9]/.test(trimmed)) return { ok:false, msg:'ციფრები არ არის დაშვებული.' };
  if(/[a-zA-Z]/.test(trimmed)) return { ok:false, msg:'ლათინური ასოები არ არის დაშვებული — მხოლოდ ქართული.' };
  if(!GEORGIAN_ONLY.test(trimmed)) return { ok:false, msg:'მხოლოდ ქართული ასოები და სივრცეები დაშვებულია.' };
  return { ok:true, value: trimmed };
}

function onSubmit(e){
  e.preventDefault();
  const result = validate(els.input.value);
  if(!result.ok){
    invalidShake(result.msg);
    return;
  }
  handleDiscovery(result.value);
}

function invalidShake(msg){
  els.hint.innerHTML = `<span class="err">${msg}</span>`;
  els.box.classList.add('shake');
  SFX.play('duplicate');
  setTimeout(()=> els.box.classList.remove('shake'), 450);
}

function insertRandomWord(){
  SFX.play('click');
  const samples = ['ვარსკვლავი','ოკეანე','ჩიტი','მთვარე','წყვილი','კოშკი','ბაღი','ხმელეთი','სანთელი','ციხე'];
  els.input.value = samples[Math.floor(Math.random()*samples.length)];
  els.input.focus();
}

function handleDiscovery(word){
  const stats = getStats();
  stats.searched++;

  const key = normalize(word);
  const existing = knownWords.find(w => normalize(w.word) === key);

  stats.history.unshift({ word, status: existing ? 'duplicate' : 'new', ts: Date.now() });
  stats.history = stats.history.slice(0, 60);

  if(existing){
    stats.duplicates++;
    saveStats(stats);
    onDuplicate(word);
  }else{
    stats.discoveries++;
    const entry = { word, meaning: '???', by: getOrCreateUsername(), rarity: pickRarity(), ts: Date.now() };
    knownWords.push(entry);
    Store.set('skg_discovered', knownWords.filter(w => w.ts > 0).concat(seedMarkers()));
    recentList.unshift(entry);
    recentList = recentList.slice(0, 8);

    const unlocked = checkAchievements(stats);
    saveStats(stats);

    onNewDiscovery(entry, unlocked);
  }

  renderRecent();
  renderTopStats();
  els.input.value = '';
}

// keep storage lean: only persist user-made discoveries (ts>0); seed words come back from JSON each load
function seedMarkers(){ return []; }

function pickRarity(){
  const roll = Math.random();
  if(roll < 0.05) return 'epic';
  if(roll < 0.25) return 'rare';
  return 'common';
}

function getOrCreateUsername(){
  let name = Store.get('skg_username', null);
  if(!name){
    name = 'სტუმარი' + Math.floor(Math.random()*900 + 100);
    Store.set('skg_username', name);
  }
  return name;
}

function onNewDiscovery(entry, unlocked){
  els.box.classList.add('glow');
  setTimeout(()=> els.box.classList.remove('glow'), 1400);
  els.hint.innerHTML = `<span style="color:var(--success)">ახალი აღმოჩენა დაფიქსირდა!</span>`;

  SFX.play('discover');
  shardBurst(els.box);
  showToast(`„${entry.word}" დაემატა შენს კოლექციას.`, { title:'ახალი სიტყვა აღმოაჩინეთ!', type:'success' });

  if(unlocked && unlocked.length){
    unlocked.forEach((a, i)=>{
      setTimeout(()=>{
        SFX.play('achievement');
        showToast(`${a.glyph} ${a.desc}`, { title:`მიღწევა გახსნილია: ${a.name}`, type:'info', duration:4200 });
      }, 700 + i*900);
    });
  }
}

function onDuplicate(word){
  els.hint.innerHTML = `<span class="err">„${word}" უკვე აღმოჩენილია — სცადეთ სხვა სიტყვა.</span>`;
  els.box.classList.add('shake');
  setTimeout(()=> els.box.classList.remove('shake'), 450);
  SFX.play('duplicate');
  showToast(`„${word}" სხვამ უკვე იპოვა.`, { title:'სიტყვა უკვე არსებობს', type:'error' });
}

function renderRecent(){
  if(!els.recent) return;
  if(recentList.length === 0){
    els.recent.innerHTML = `
      <div class="empty-state">
        <div class="glyph">🔍</div>
        <p>აღმოჩენები ჯერ არ არსებობს. დაიწყეთ ძებნა!</p>
      </div>`;
    return;
  }
  els.recent.innerHTML = recentList.map((w, i) => `
    <div class="crystal ${i===0 && w.ts && Date.now() - w.ts < 1500 ? 'new-pop' : ''}">
      <div class="word ka">${escapeHTML(w.word)}</div>
      <div class="meta">${rarityLabel(w.rarity)} · ${escapeHTML(w.by || 'სისტემა')}</div>
    </div>
  `).join('');
}

function rarityLabel(r){
  const map = { common:'ჩვეულებრივი', rare:'იშვიათი', epic:'ეპიკური' };
  return map[r] || 'ჩვეულებრივი';
}

function renderTopStats(){
  const stats = getStats();
  if(els.totalDiscoveries) animateNumber(els.totalDiscoveries, knownWords.length);
  if(els.userDiscoveries) animateNumber(els.userDiscoveries, stats.discoveries);
  if(els.searches) animateNumber(els.searches, stats.searched);
}

function animateNumber(el, target){
  const current = parseInt(el.dataset.val || '0', 10);
  if(current === target){ el.textContent = target; return; }
  el.dataset.val = target;
  const start = current;
  const duration = 500;
  const t0 = performance.now();
  function step(t){
    const p = Math.min(1, (t - t0)/duration);
    el.textContent = Math.round(start + (target-start)*p);
    if(p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function escapeHTML(str){
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
