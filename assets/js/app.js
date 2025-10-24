// Frontend JS pour la UI — communique avec /api/search et /api/stream
document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const resultsGrid = document.getElementById('resultsGrid');
  const noResults = document.getElementById('noResults');
  const playerModal = document.getElementById('playerModal');
  const audioPlayer = document.getElementById('audioPlayer');
  const playerTitle = document.getElementById('playerTitle');
  const downloadBtn = document.getElementById('downloadBtn');
  const closePlayer = document.getElementById('closePlayer');
  document.getElementById('year').textContent = new Date().getFullYear();

  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = searchInput.value.trim();
    if (!q) return;
    resultsGrid.innerHTML = '';
    noResults.classList.add('hidden');
    showSkeletons(6);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      renderResults(data);
    } catch (err) {
      console.error(err);
      renderResults([]);
    }
  });

  function showSkeletons(n){
    resultsGrid.innerHTML = '';
    for(let i=0;i<n;i++){
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `<div class="card-thumb" aria-hidden="true">…</div>
        <div class="card-body">
          <div class="card-title">Chargement…</div>
          <div class="card-meta">—</div>
          <div class="card-actions"><div class="btn-secondary">...</div></div>
        </div>`;
      resultsGrid.appendChild(div);
    }
  }

  function renderResults(items){
    resultsGrid.innerHTML = '';
    if (!items || items.length === 0) {
      noResults.classList.remove('hidden');
      return;
    }
    items.forEach(item => {
      const card = document.createElement('article');
      card.className = 'card';
      const thumbStyle = item.thumbnail ? `style="background-image:url('${item.thumbnail}')" ` : '';
      card.innerHTML = `
        <div class="card-thumb" ${thumbStyle} aria-hidden="true">♫</div>
        <div class="card-body">
          <h3 class="card-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</h3>
          <div class="card-meta">${item.duration || ''}</div>
          <div class="card-actions">
            <button class="btn-cta" data-action="play" data-videoid="${item.id}" data-title="${escapeHtml(item.title)}">Lecture</button>
            <a class="btn-secondary" data-action="download" href="/api/stream?videoId=${item.id}&download=1">Télécharger</a>
          </div>
        </div>
      `;
      const playBtn = card.querySelector('[data-action="play"]');
      playBtn.addEventListener('click', () => openPlayer(item));
      resultsGrid.appendChild(card);
    });
  }

  function openPlayer(item){
    playerTitle.textContent = item.title || 'Lecture';
    const streamUrl = `/api/stream?videoId=${encodeURIComponent(item.id)}`;
    audioPlayer.src = streamUrl;
    audioPlayer.play().catch(()=>{ /* autoplay may be blocked by browser */ });
    downloadBtn.href = `/api/stream?videoId=${encodeURIComponent(item.id)}&download=1`;
    downloadBtn.classList.toggle('hidden', false);
    playerModal.classList.remove('hidden');
  }

  closePlayer.addEventListener('click', closeModal);
  playerModal.addEventListener('click', (e) => {
    if (e.target === playerModal) closeModal();
  });
  function closeModal(){
    audioPlayer.pause();
    audioPlayer.src = '';
    playerModal.classList.add('hidden');
  }

  function escapeHtml(str){
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }
});
