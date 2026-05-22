/* ===================================================================
   jbguionie.fr — JavaScript de la page playlist privée
   =================================================================== */

const state = {
  playlist: null,
  extracts: [],
  currentTrack: null,
  isPlaying: false,
};

const audio = document.getElementById('audio-player');

async function init() {
  const slug = getSlugFromUrl();
  if (!slug) return showError('Lien invalide.');

  document.getElementById('footer-slug').textContent = `jbguionie.fr/p/${slug}`;

  try {
    const [playlistsRes, extractsRes] = await Promise.all([
      fetch('/assets/data/playlists.json'),
      fetch('/assets/data/extracts.json'),
    ]);

    if (!playlistsRes.ok || !extractsRes.ok) throw new Error('Données introuvables.');

    const playlists = await playlistsRes.json();
    const allExtracts = await extractsRes.json();

    const playlist = playlists.find(p => p.slug === slug);
    if (!playlist) return showError('Cette sélection est introuvable ou a été retirée.');

    // Vérifier expiration
    if (playlist.expiry_date) {
      const expiry = new Date(playlist.expiry_date);
      if (expiry < new Date()) {
        return showError('Ce lien a expiré.');
      }
    }

    // Récupérer les extraits dans l'ordre choisi
    const extractSlugs = playlist.extracts || [];
    const orderedExtracts = extractSlugs
      .map(slug => allExtracts.find(e => e.slug === slug))
      .filter(Boolean);

    state.playlist = playlist;
    state.extracts = orderedExtracts;

    render();
    setupPlayer();

  } catch (e) {
    console.error(e);
    showError('Impossible de charger cette sélection.');
  }
}

function getSlugFromUrl() {
  // Format attendu : /p/slug (via redirection) → URL devient /playlist.html?slug=xxx
  // ou directement /playlist.html?slug=xxx
  const params = new URLSearchParams(window.location.search);
  return params.get('slug') || params.get('p');
}

function render() {
  document.title = `${state.playlist.title} — Jean-Baptiste Guionie`;
  renderHero();
  renderExtracts();
  renderFooterExpiry();
}

function renderHero() {
  const p = state.playlist;
  const totalDuration = computeTotalDuration();
  const dateStr = p.created_date ? formatDateFR(p.created_date) : '';

  document.getElementById('playlist-hero').innerHTML = `
    <div class="hero-eyebrow">Sélection sur mesure${dateStr ? ' · ' + dateStr : ''}</div>
    <h1>${formatTitle(p.title)}</h1>
    ${p.message ? `<p class="playlist-message">${escapeHTML(p.message)}</p>` : ''}
    <div class="playlist-meta-bar">
      <div class="playlist-stats">
        <span><strong>${state.extracts.length}</strong> extraits</span>
        ${totalDuration ? `<span>Durée <strong>${totalDuration}</strong></span>` : ''}
        <span>MP3 <strong>192 kbps</strong></span>
      </div>
      <a class="btn-download-all" id="download-all-btn">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 2v9M8 11l-3.5-3.5M8 11l3.5-3.5M2.5 13.5h11"/></svg>
        Tout télécharger (.zip)
      </a>
    </div>
  `;

  document.getElementById('download-all-btn').addEventListener('click', downloadAllAsZip);
}

function renderExtracts() {
  const container = document.getElementById('extracts-list');

  if (state.extracts.length === 0) {
    container.innerHTML = '<div class="empty-state">Aucun extrait dans cette sélection.</div>';
    return;
  }

  container.innerHTML = state.extracts.map((ex, i) => extractHTML(ex, i + 1)).join('');
  attachExtractListeners();
}

function extractHTML(ex, num) {
  const waveform = generateWaveform(ex.slug || ex.title || String(num));
  const audioUrl = ex.audio_file || '';
  const safeId = ex.slug || `ex-${num}`;

  return `
    <div class="extract fade-in" data-audio="${audioUrl}" data-id="${safeId}">
      <div class="extract-num">${String(num).padStart(2, '0')}</div>
      <div>
        <div class="extract-title">${formatTitle(ex.title)}</div>
        <div class="extract-client">${[ex.client, ex.support, ex.year].filter(Boolean).join(' · ')}</div>
      </div>
      <div class="extract-waveform">${waveform}</div>
      <div class="extract-meta">
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

function renderFooterExpiry() {
  if (state.playlist.expiry_date) {
    const d = new Date(state.playlist.expiry_date);
    document.getElementById('footer-expiry').textContent = `Expire le ${formatDateFR(state.playlist.expiry_date)}`;
  } else {
    document.getElementById('footer-expiry').textContent = '';
  }
}

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
    document.querySelectorAll('.extract').forEach(el => {
      el.classList.toggle('playing', el.dataset.id === state.currentTrack);
    });
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
    document.getElementById('player-current').textContent = formatTime(audio.currentTime);
  });
}

function attachExtractListeners() {
  document.querySelectorAll('.extract').forEach(el => {
    el.addEventListener('click', () => {
      const audioUrl = el.dataset.audio;
      if (!audioUrl) return;
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
  }
  document.getElementById('player-title').textContent = title.length > 45 ? title.slice(0, 45) + '…' : title;
  document.getElementById('player-client').textContent = ' · ' + client;
  document.getElementById('player-download').href = url;
  document.getElementById('player').classList.add('active');
  audio.play().catch(e => console.error(e));
}

// ---- Download All as ZIP ----
async function downloadAllAsZip() {
  const btn = document.getElementById('download-all-btn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="8" cy="8" r="6" stroke-dasharray="20 10"/></svg> Préparation du zip…';
  btn.style.pointerEvents = 'none';

  try {
    // Charger JSZip depuis CDN à la demande (pas chargé inutilement sinon)
    if (typeof JSZip === 'undefined') {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
    }

    const zip = new JSZip();
    const folder = zip.folder(slugify(state.playlist.title));

    for (const ex of state.extracts) {
      if (!ex.audio_file) continue;
      try {
        const response = await fetch(ex.audio_file);
        const blob = await response.blob();
        const filename = (ex.slug || slugify(ex.title || 'extrait')) + '.mp3';
        folder.file(filename, blob);
      } catch (e) {
        console.error('Erreur téléchargement', ex.audio_file, e);
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = slugify(state.playlist.title) + '.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Erreur ZIP :', e);
    alert('Le téléchargement groupé a échoué. Vous pouvez télécharger les extraits individuellement.');
  } finally {
    btn.innerHTML = originalText;
    btn.style.pointerEvents = '';
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// ---- Helpers (partagés avec main.js mais inline ici) ----
function generateWaveform(seedStr) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed += seedStr.charCodeAt(i);
  let bars = '';
  for (let i = 0; i < 50; i++) {
    const v = (Math.sin(i * 0.4 + seed) * Math.cos(i * 0.13 + seed * 1.7) + Math.sin(i * 0.9 + seed)) * 0.5 + 0.5;
    bars += `<div class="bar" style="height:${4 + Math.abs(v) * 20}px"></div>`;
  }
  return bars;
}

function computeTotalDuration() {
  let totalSec = 0;
  for (const ex of state.extracts) {
    if (!ex.duration) continue;
    const parts = ex.duration.split(':').map(Number);
    if (parts.length === 2) totalSec += parts[0] * 60 + parts[1];
  }
  if (!totalSec) return '';
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
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

function formatDateFR(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function showError(message) {
  document.getElementById('playlist-hero').innerHTML = `
    <div class="hero-eyebrow">Erreur</div>
    <h1>Sélection <em>introuvable.</em></h1>
    <p class="playlist-message">${escapeHTML(message)}</p>
  `;
  document.getElementById('extracts-list').innerHTML = '';
}

init();
