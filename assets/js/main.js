/* ===================================================================
   jbguionie.fr — JavaScript principal (v2)
   Nouveautés : timeline cliquable + lightbox YouTube
   =================================================================== */

const state = {
  extracts: [],
  films: [],
  filters: { type: 'tous', secteur: 'tous' },
  currentTrack: null,
  isPlaying: false,
  isSeeking: false,
};

const audio = document.getElementById('audio-player');

// ---- Initialisation ----
async function init() {
  await Promise.all([loadExtracts(), loadFilms()]);
  setupFilters();
  setupPlayer();
  setupLightbox();
}

// ---- Chargement des extraits ----
async function loadExtracts() {
  try {
    const response = await fetch('/assets/data/extracts.json');
    if (!response.ok) throw new Error('Fichier introuvable');
    let data = await response.json();
    data.sort((a, b) => {
      if (a.order != null && b.order != null) return a.order - b.order;
      if (a.date && b.date) return new Date(b.date) - new Date(a.date);
      return 0;
    });
    state.extracts = data;
    renderExtracts();
  } catch (e) {
    console.error('Erreur chargement extraits :', e);
    document.getElementById('extracts-list').innerHTML =
      '<div class="empty-state">Aucun extrait à afficher pour le moment.</div>';
  }
}

// ---- Chargement des films ----
async function loadFilms() {
  try {
    const response = await fetch('/assets/data/films.json');
    if (!response.ok) throw new Error('Fichier introuvable');
    let data = await response.json();
    data.sort((a, b) => {
      if (a.order != null && b.order != null) return a.order - b.order;
      return 0;
    });
    state.films = data;
    renderFilms();
  } catch (e) {
    console.error('Erreur chargement films :', e);
    document.getElementById('films-list').innerHTML =
      '<div class="empty-state" style="grid-column: 1 / -1;">Aucun film à afficher pour le moment.</div>';
  }
}

// ---- Rendu des extraits ----
function renderExtracts() {
  const container = document.getElementById('extracts-list');
  document.getElementById('total-count').textContent = state.extracts.length;

  if (state.extracts.length === 0) {
    container.innerHTML = '<div class="empty-state">Aucun extrait disponible.</div>';
    document.getElementById('visible-count').textContent = '0';
    return;
  }

  const filtered = filterExtracts();
  document.getElementById('visible-count').textContent = filtered.length;

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state">Aucun extrait ne correspond à ces filtres.</div>';
    return;
  }

  container.innerHTML = filtered.map((ex, i) => extractHTML(ex, i + 1)).join('');
  attachExtractListeners();
}

function extractHTML(ex, num) {
  const waveform = generateWaveform(ex.slug || ex.title || String(num));
  const typeLabel = labelize(ex.type);
  const secteurLabel = labelize(ex.secteur);
  const audioUrl = ex.audio_file || '';
  const safeId = ex.slug || `ex-${num}`;

  return `
    <div class="extract fade-in" data-type="${ex.type || ''}" data-secteur="${ex.secteur || ''}" data-audio="${audioUrl}" data-id="${safeId}">
      <div class="extract-num">${String(num).padStart(2, '0')}</div>
      <div>
        <div class="extract-title">${formatTitle(ex.title)}</div>
        <div class="extract-client">${[ex.client, ex.support, ex.year].filter(Boolean).join(' · ')}</div>
      </div>
      <div class="extract-waveform">${waveform}</div>
      <div class="extract-meta">
        <div class="extract-tags">
          ${typeLabel ? `<span class="extract-tag">${typeLabel}</span>` : ''}
          ${secteurLabel ? `<span class="extract-tag tag-secteur">${secteurLabel}</span>` : ''}
        </div>
        <span class="extract-duration">${ex.duration || ''}</span>
      </div>
      <div class="extract-actions">
        <a class="extract-download" href="${audioUrl}" download title="Télécharger MP3" onclick="event.stopPropagation();">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2v9M8 11l-3.5-3.5M8 11l3.5-3.5M2.5 13.5h11"/></svg>
        </a>
        <button class="extract-play" aria-label="Lire">
          <svg viewBox="0 0 10 12" fill="currentColor"><polygon points="0,0 10,6 0,12"/></svg>
        </button>
      </div>
    </div>
  `;
}

// ---- Rendu des films ----
function renderFilms() {
  const container = document.getElementById('films-list');

  if (state.films.length === 0) {
    container.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;">Aucun film pour le moment.</div>';
    return;
  }

  container.innerHTML = state.films.map(filmHTML).join('');
  attachFilmListeners();
}

function filmHTML(film) {
  const ytId = getYouTubeId(film.youtube_url);
  const thumb = ytId
    ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`
    : (film.cover || '/assets/images/placeholder-film.jpg');
  const title = formatTitle(film.title);
  const titlePlain = escapeHTML(film.title || '');

  return `
    <a class="film" href="${film.youtube_url || '#'}" data-youtube-id="${ytId || ''}" data-title="${titlePlain}" data-client="${escapeHTML([film.client, film.year].filter(Boolean).join(' · '))}">
      <div class="film-thumb">
        <img src="${thumb}" alt="${titlePlain}" loading="lazy">
        <div class="film-overlay">
          ${film.duration ? `<span class="film-duration">${film.duration}</span>` : ''}
        </div>
        <div class="film-play">
          <svg viewBox="0 0 10 12" fill="currentColor"><polygon points="0,0 10,6 0,12"/></svg>
        </div>
      </div>
      <div class="film-title">${title}</div>
      <div class="film-client">${[film.client, film.year].filter(Boolean).join(' · ')}</div>
    </a>
  `;
}

// ---- Films : ouverture en lightbox au clic ----
function attachFilmListeners() {
  document.querySelectorAll('.film').forEach(el => {
    el.addEventListener('click', (e) => {
      const ytId = el.dataset.youtubeId;
      if (!ytId) return; // Pas d'ID YouTube → on laisse le lien fonctionner normalement
      e.preventDefault();
      openLightbox(ytId, el.dataset.title, el.dataset.client);
    });
  });
}

// ---- Lightbox vidéo ----
function setupLightbox() {
  const lightbox = document.getElementById('video-lightbox');
  if (!lightbox) return;

  // Fermeture au clic sur le fond
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Bouton de fermeture
  const closeBtn = document.getElementById('lightbox-close');
  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

  // Fermeture avec touche Échap
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });
}

function openLightbox(ytId, title, client) {
  const lightbox = document.getElementById('video-lightbox');
  const frame = document.getElementById('lightbox-frame');
  const caption = document.getElementById('lightbox-caption');

  if (!lightbox || !frame) return;

  // On met en pause l'audio si un extrait jouait
  if (audio && !audio.paused) audio.pause();

  // URL YouTube en mode embed avec autoplay
  frame.src = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`;

  if (caption) {
    caption.innerHTML = `${title || ''}${client ? ' <em>— ' + client + '</em>' : ''}`;
  }

  lightbox.classList.add('active');
  document.body.classList.add('lightbox-open');
}

function closeLightbox() {
  const lightbox = document.getElementById('video-lightbox');
  const frame = document.getElementById('lightbox-frame');
  if (!lightbox) return;

  lightbox.classList.remove('active');
  document.body.classList.remove('lightbox-open');

  // Vide l'iframe pour arrêter la vidéo
  setTimeout(() => {
    if (frame) frame.src = '';
  }, 350);
}

// ---- Filtres ----
function setupFilters() {
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const group = pill.dataset.group;
      document.querySelectorAll(`.filter-pill[data-group="${group}"]`).forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.filters[group] = pill.dataset.filter;
      renderExtracts();
    });
  });
}

function filterExtracts() {
  return state.extracts.filter(ex => {
    const matchType = state.filters.type === 'tous' || ex.type === state.filters.type;
    const matchSecteur = state.filters.secteur === 'tous' || ex.secteur === state.filters.secteur;
    return matchType && matchSecteur;
  });
}

// ---- Lecteur audio ----
function setupPlayer() {
  const playBtn = document.getElementById('player-play-btn');
  const playIcon = document.getElementById('player-play-icon');

  playBtn.addEventListener('click', () => {
    if (audio.paused) audio.play(); else audio.pause();
  });

  audio.addEventListener('play', () => {
    state.isPlaying = true;
    playIcon.innerHTML = '<rect x="1" y="0" width="3" height="12"/><rect x="6" y="0" width="3" height="12"/>';
    playIcon.style.marginLeft = '0';
    if (state.currentTrack) {
      document.querySelectorAll('.extract').forEach(el => {
        el.classList.toggle('playing', el.dataset.id === state.currentTrack);
      });
    }
  });

  audio.addEventListener('pause', () => {
    state.isPlaying = false;
    playIcon.innerHTML = '<polygon points="0,0 10,6 0,12"/>';
    playIcon.style.marginLeft = '2px';
    document.querySelectorAll('.extract').forEach(el => el.classList.remove('playing'));
  });

  audio.addEventListener('loadedmetadata', () => {
    document.getElementById('player-duration').textContent = formatTime(audio.duration);
  });

  audio.addEventListener('timeupdate', () => {
    if (state.isSeeking) return;
    document.getElementById('player-current').textContent = formatTime(audio.currentTime);
    updateTimelineFill();
  });

  // ---- Timeline cliquable ----
  setupTimeline();
}

function setupTimeline() {
  const timeline = document.getElementById('player-timeline');
  if (!timeline) return;

  function seekToEvent(e) {
    if (!audio.duration || isNaN(audio.duration)) return;
    const rect = timeline.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    audio.currentTime = ratio * audio.duration;
    updateTimelineFill();
    document.getElementById('player-current').textContent = formatTime(audio.currentTime);
  }

  // Clic simple
  timeline.addEventListener('click', seekToEvent);

  // Glisser-déposer (souris)
  timeline.addEventListener('mousedown', (e) => {
    state.isSeeking = true;
    seekToEvent(e);
    const onMove = (ev) => seekToEvent(ev);
    const onUp = () => {
      state.isSeeking = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  // Glisser-déposer (tactile)
  timeline.addEventListener('touchstart', (e) => {
    state.isSeeking = true;
    seekToEvent(e);
  }, { passive: true });
  timeline.addEventListener('touchmove', (e) => {
    seekToEvent(e);
  }, { passive: true });
  timeline.addEventListener('touchend', () => {
    state.isSeeking = false;
  });
}

function updateTimelineFill() {
  const fill = document.getElementById('player-timeline-fill');
  const handle = document.getElementById('player-timeline-handle');
  if (!fill || !audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  fill.style.width = pct + '%';
  if (handle) handle.style.left = pct + '%';
}

function attachExtractListeners() {
  document.querySelectorAll('.extract').forEach(el => {
    el.addEventListener('click', () => {
      const audioUrl = el.dataset.audio;
      if (!audioUrl) {
        console.warn('Pas de fichier audio pour cet extrait.');
        return;
      }
      const title = el.querySelector('.extract-title').textContent.trim();
      const client = el.querySelector('.extract-client').textContent.trim();
      playTrack(audioUrl, title, client, el.dataset.id);
    });
  });
}

function playTrack(url, title, client, id) {
  state.currentTrack = id;
  if (audio.src !== new URL(url, window.location.href).href) {
    audio.src = url;
    // Reset visuel timeline pour la nouvelle piste
    const fill = document.getElementById('player-timeline-fill');
    const handle = document.getElementById('player-timeline-handle');
    if (fill) fill.style.width = '0%';
    if (handle) handle.style.left = '0%';
  }
  document.getElementById('player-title').textContent = title.length > 45 ? title.slice(0, 45) + '…' : title;
  document.getElementById('player-client').textContent = ' · ' + client;
  document.getElementById('player-download').href = url;
  document.getElementById('player').classList.add('active');
  audio.play().catch(e => console.error('Erreur lecture :', e));
}

// ---- Helpers ----
function generateWaveform(seedStr) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed += seedStr.charCodeAt(i);
  let bars = '';
  for (let i = 0; i < 60; i++) {
    const v = (Math.sin(i * 0.4 + seed) * Math.cos(i * 0.13 + seed * 1.7) + Math.sin(i * 0.9 + seed)) * 0.5 + 0.5;
    const h = 4 + Math.abs(v) * 22;
    bars += `<div class="bar" style="height:${h}px"></div>`;
  }
  return bars;
}

function labelize(slug) {
  if (!slug) return '';
  const map = {
    'publicité': 'Publicité',
    'radio': 'Radio',
    'billboard': 'Billboard',
    'instit': 'Instit',
    'doublage': 'Doublage',
    'livre-audio': 'Livre Audio',
    'food': 'Food', 'car': 'Car', 'tech': 'Tech',
    'luxe': 'Luxe', 'lifestyle': 'LifeStyle', 'cartoon': 'Cartoon',
  };
  return map[slug] || slug;
}

function formatTitle(title) {
  if (!title) return '';
  return escapeHTML(title)
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/—\s*(«[^»]+»)/g, '— <em>$1</em>');
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = String(str || '');
  return div.innerHTML;
}

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function getYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

init();
