document.addEventListener('DOMContentLoaded', async ()=>{
  await loadLeaderboard();
});

async function loadLeaderboard(){
  const podiumLoading = document.getElementById('podium-loading');
  const podium = document.getElementById('podium');
  const tableLoading = document.getElementById('table-loading');
  const tableWrap = document.getElementById('table-wrap');
  const tableEmpty = document.getElementById('table-empty');
  const tbody = document.getElementById('lb-tbody');

  try{
    const res = await fetch('data/leaderboard.json');
    if(!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    const players = [...data.players].sort((a,b)=> a.rank - b.rank);

    renderPodium(players.slice(0,3), podium);
    renderTable(players, tbody);

    podiumLoading.style.display = 'none';
    podium.style.display = 'flex';
    tableLoading.style.display = 'none';
    tableWrap.style.display = 'block';
  }catch(err){
    console.error('Failed to load leaderboard:', err);
    podiumLoading.style.display = 'none';
    tableLoading.style.display = 'none';
    tableEmpty.style.display = 'block';
    showToast('ლიდერბორდის ჩატვირთვა ვერ მოხერხდა.', { title:'შეცდომა', type:'error' });
  }
}

function rankClass(rank){
  if(rank === 1) return 'gold';
  if(rank === 2) return 'silver';
  return 'bronze';
}

function initials(name){
  return name.replace(/[_\d]/g,'').slice(0,2);
}

function renderPodium(top3, container){
  container.innerHTML = top3.map(p => `
    <div class="player-card rank-${p.rank}">
      <div class="rank-badge ${rankClass(p.rank)}">${p.rank}</div>
      <div class="avatar ka">${escapeHTML(initials(p.username))}</div>
      <div class="uname ka">${escapeHTML(p.username)}</div>
      <div class="pscore">${p.discoveries}</div>
      <div class="plabel">აღმოჩენა</div>
    </div>
  `).join('');
}

function renderTable(players, tbody){
  tbody.innerHTML = players.map(p => `
    <tr>
      <td class="rank-cell">#${p.rank}</td>
      <td>
        <div class="user-cell">
          <span class="mini-avatar ka">${escapeHTML(initials(p.username))}</span>
          <span class="ka">${escapeHTML(p.username)}</span>
        </div>
      </td>
      <td>${p.discoveries}</td>
      <td>${p.totalSearches}</td>
    </tr>
  `).join('');
}

function escapeHTML(str){
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
