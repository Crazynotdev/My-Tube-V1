// Frontend JS amélioré : pas d'autoplay sans geste utilisateur, overlay pour indiquer "cliquer pour jouer"
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
  const playOverlay = document.getElementById('playOverlay');
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
        <div class="card-thumb" ${thumbStyle} aria-hidden="true">
          <button class="play-btn-card" data-id="${escapeHtml(item.id)}" title="Lecture">▶</button>
          ${item.duration ? `<div class="duration">${item.duration}</div>` : ''}
        </div>
        <div class="card-body">
          <h3 class="card-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</h3>
          <div class="card-meta">${item.author || ''}</div>
          <div class="card-actions">
            <button class="btn-cta" data-action="open" data-videoid="${escapeHtml(item.id)}" data-title="${escapeHtml(item.title)}">Ouvrir</button>
            <a class="btn-secondary" data-action="download" href="/api/stream?videoId=${encodeURIComponent(item.id)}&download=1">Télécharger</a>
          </div>
        </div>
      `;

      // play from play button on thumbnail (user gesture)
      const playBtn = card.querySelector('.play-btn-card');
      playBtn.addEventListener('click', () => openPlayer(item, true));

      const openBtn = card.querySelector('[data-action="open"]');
      openBtn.addEventListener('click', () => openPlayer(item, false));

      resultsGrid.appendChild(card);
    });
  }

  function openPlayer(item, startImmediately=false){
    playerTitle.textContent = item.title || 'Lecture';
    const streamUrl = `/api/stream?videoId=${encodeURIComponent(item.id)}`;
    audioPlayer.src = streamUrl;
    audioPlayer.load();
    downloadBtn.href = `/api/stream?videoId=${encodeURIComponent(item.id)}&download=1`;
    playerModal.classList.remove('hidden');

    // Ensure overlay exists
    if (playOverlay) playOverlay.classList.add('hidden');

    // Try to play if user explicitly clicked thumbnail (user gesture) — otherwise show overlay to ask user to click play
    if (startImmediately) {
      audioPlayer.play().catch((err)=>{
        // play blocked — show overlay instructing user to press play
        console.warn('Autoplay blocked', err);
        showPlayOverlay();
      });
    } else {
      showPlayOverlay();
    }
  }

  function showPlayOverlay(){
    if (!playOverlay) return;
    playOverlay.classList.remove('hidden');
    // remove previous handler
    playOverlay.onclick = null;
    playOverlay.onclick = async () => {
      try {
        await audioPlayer.play();
        playOverlay.classList.add('hidden');
      } catch (e) {
        console.error('Playback failed', e);
      }
    };
  }

  closePlayer.addEventListener('click', closeModal);
  playerModal.addEventListener('click', (e) => {
    if (e.target === playerModal) closeModal();
  });
  function closeModal(){
    audioPlayer.pause();
    audioPlayer.src = '';
    playerModal.classList.add('hidden');
    if (playOverlay) playOverlay.classList.add('hidden');
  }

  function escapeHtml(str){
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }
});
