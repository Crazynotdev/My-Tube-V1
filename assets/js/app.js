// Préview via YouTube embed ; download via /api/stream
document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const resultsGrid = document.getElementById('resultsGrid');
  const noResults = document.getElementById('noResults');
  const playerModal = document.getElementById('playerModal');
  const playerContainer = document.getElementById('playerContainer');
  const playerTitle = document.getElementById('playerTitle');
  const downloadBtn = document.getElementById('downloadBtn');
  const closePlayer = document.getElementById('closePlayer');
  const playOverlay = document.getElementById('playOverlay');
  document.getElementById('year').textContent = new Date().getFullYear();

  let currentVideoId = null;

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

  // Creates a YouTube iframe embed; autoplay parameter controls autoplay
  function buildYouTubeIframe(videoId, autoplay = false){
    const iframe = document.createElement('iframe');
    const params = `autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1&iv_load_policy=3`;
    iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params}`;
    iframe.width = '100%';
    iframe.height = '360';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    iframe.setAttribute('allowfullscreen', '');
    return iframe;
  }

  function openPlayer(item, startImmediately=false){
    currentVideoId = item.id;
    playerTitle.textContent = item.title || 'Preview';
    downloadBtn.href = `/api/stream?videoId=${encodeURIComponent(item.id)}&download=1`;

    // remove previous iframe if exists
    playerContainer.innerHTML = '';

    // Create iframe. If user clicked thumbnail (startImmediately=true) autoplay=1; otherwise autoplay=0
    const iframe = buildYouTubeIframe(item.id, !!startImmediately);
    playerContainer.appendChild(iframe);

    playerModal.classList.remove('hidden');

    if (!startImmediately) {
      // show overlay that invites the user to play; clicking it will create an autoplaying iframe (user gesture)
      showPlayOverlay();
    } else {
      if (playOverlay) playOverlay.classList.add('hidden');
    }
  }

  function showPlayOverlay(){
    if (!playOverlay) return;
    playOverlay.classList.remove('hidden');
    playOverlay.onclick = () => {
      if (!currentVideoId) return;
      playerContainer.innerHTML = '';
      const autoplayIframe = buildYouTubeIframe(currentVideoId, true);
      playerContainer.appendChild(autoplayIframe);
      playOverlay.classList.add('hidden');
    };
  }

  closePlayer.addEventListener('click', closeModal);
  playerModal.addEventListener('click', (e) => {
    if (e.target === playerModal) closeModal();
  });

  function closeModal(){
    // remove iframe to stop playback and free resources
    playerContainer.innerHTML = '';
    currentVideoId = null;
    playerModal.classList.add('hidden');
    if (playOverlay) playOverlay.classList.add('hidden');
  }

  function escapeHtml(str){
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }
});
