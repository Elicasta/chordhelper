const E = window.GospelPathEngine;
const STORAGE_KEY = 'gospel-path-v1-state';
const HIGHLIGHT_COLORS = ['red', 'green', 'blue', 'yellow', 'purple', 'orange'];
const STYLE_OPTIONS = [
  ['gospel', 'Gospel'],
  ['ccm', 'CCM'],
  ['preacher', 'Preacher'],
  ['shout', 'Shout'],
  ['weird', 'Weird Reharm'],
  ['plain', 'Plain']
];
const TABS = ['Songs', 'Path', 'Chord', 'Licks', 'Shout', 'Organ', 'Setlist'];

const DEFAULT_STATE = {
  theme: 'dark',
  activeTab: 'Songs',
  currentSongId: 'song-this-is-the-day-template',
  selectedChord: null,
  selectedSectionId: 'sec-titd-a',
  detailDifficulty: 'easy',
  instrument: 'piano',
  style: 'gospel',
  intensity: 'churchy',
  pathFrom: '1',
  pathTo: '4',
  parseText: '1 - 4 - 3 - 5 - b6 - b7',
  currentTool: 'navigate',
  writeMode: false,
  inkColor: 'blue',
  liveMode: false,
  liveSectionIndex: 0,
  liveLocked: true,
  sheetExpanded: false,
  modal: null,
  toast: null,
  notes: [],
  strokes: {},
  songs: JSON.parse(JSON.stringify(E.seedSongs))
};

let state = loadState();
let drawing = null;
let saveTimer = null;

const appRoot = document.getElementById('app');

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredCloneSafe(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    const merged = { ...structuredCloneSafe(DEFAULT_STATE), ...parsed };
    if (!merged.songs?.length) merged.songs = structuredCloneSafe(E.seedSongs);
    return merged;
  } catch {
    return structuredCloneSafe(DEFAULT_STATE);
  }
}
function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}
function persistSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const clean = { ...state, modal: null, toast: null };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  }, 80);
}
function setState(patch, rerender = true) {
  state = { ...state, ...patch };
  document.documentElement.dataset.theme = state.theme;
  persistSoon();
  if (rerender) render();
}
function toast(message) {
  setState({ toast: message });
  setTimeout(() => {
    if (state.toast === message) setState({ toast: null });
  }, 2400);
}
function currentSong() {
  return state.songs.find((song) => song.id === state.currentSongId) || state.songs[0];
}
function currentKey() {
  return currentSong()?.currentKey || currentSong()?.defaultKey || 'C';
}
function selectedSection() {
  const song = currentSong();
  return song.sections.find((s) => s.id === state.selectedSectionId) || song.sections[0];
}
function updateCurrentSong(updater) {
  const songs = state.songs.map((song) => {
    if (song.id !== state.currentSongId) return song;
    const copy = structuredCloneSafe(song);
    updater(copy);
    return copy;
  });
  setState({ songs });
}
function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}
function colorVar(color) {
  return `var(--${color || 'blue'})`;
}
function layoutMode() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w < 768) return 'mobile';
  if (w >= 1024 && w > h) return 'ipadLandscape';
  if (w >= 768) return 'ipadPortrait';
  return 'mobile';
}
function layoutClass() {
  const mode = layoutMode();
  return mode === 'mobile' ? 'mobile-layout' : mode === 'ipadLandscape' ? 'workbench-landscape' : 'workbench-portrait';
}

function render() {
  document.documentElement.dataset.theme = state.theme;
  const mode = layoutMode();
  appRoot.innerHTML = `
    <div class="app">
      ${renderTopbar(mode)}
      ${state.liveMode ? renderLive(mode) : renderWorkbench(mode)}
      ${renderModal()}
      ${state.toast ? `<div class="toast">${esc(state.toast)}</div>` : ''}
    </div>
  `;
  wireEvents();
  requestAnimationFrame(setupCanvas);
}

function renderTopbar(mode) {
  const song = currentSong();
  return `
    <header class="topbar">
      <div class="brand" role="button" data-action="home">
        <div class="logo-mark">GP</div>
        <div>
          <div class="brand-title">Gospel Path</div>
          <div class="brand-subtitle">${modeLabel(mode)} · ${esc(song.title)}</div>
        </div>
      </div>
      <div class="topbar-center">
        <select class="select-control" data-bind="songKey" aria-label="Song key">
          ${E.KEYS.map((k) => `<option value="${k}" ${currentKey() === k ? 'selected' : ''}>Key ${k}</option>`).join('')}
        </select>
        ${TABS.map((tab) => `<button class="tab-btn ${state.activeTab === tab ? 'active accented' : ''}" data-tab="${tab}">${tab}</button>`).join('')}
      </div>
      <div class="topbar-actions">
        <button class="btn ghost desktop-only" data-action="newSong">New Song</button>
        <button class="icon-btn" title="Toggle theme" data-action="toggleTheme">${state.theme === 'dark' ? '☾' : '☼'}</button>
        <button class="btn primary" data-action="toggleLive">${state.liveMode ? 'Exit Live' : 'Live'}</button>
      </div>
    </header>
  `;
}
function modeLabel(mode) {
  return ({ mobile: 'Mobile', ipadPortrait: 'iPad Portrait', ipadLandscape: 'iPad Landscape' })[mode] || 'Desktop';
}

function renderWorkbench(mode) {
  return `
    <main class="layout ${layoutClass()}">
      <aside class="panel library-panel">
        <div class="panel-header"><h2 class="panel-title">${esc(state.activeTab)}</h2><button class="icon-btn" data-action="cycleTab">↻</button></div>
        <div class="panel-body">${renderSidePanel()}</div>
      </aside>
      ${renderCanvasPanel(mode)}
      <aside class="detail-panel">
        <div class="panel-header"><h2 class="panel-title">Chord Detail</h2><button class="btn ghost" data-action="clearChord">Clear</button></div>
        ${renderChordDetail(false)}
      </aside>
      ${renderBottomSheet()}
      ${renderBottomNav()}
    </main>
  `;
}

function renderSidePanel() {
  if (state.activeTab === 'Songs') return renderSongsPanel();
  if (state.activeTab === 'Path') return renderPathPanel();
  if (state.activeTab === 'Chord') return renderChordLabPanel();
  if (state.activeTab === 'Licks') return renderLicksPanel();
  if (state.activeTab === 'Shout') return renderShoutPanel();
  if (state.activeTab === 'Organ') return renderOrganPanel();
  return renderSetlistPanel();
}
function renderSongsPanel() {
  return `
    <div class="song-list">
      ${state.songs.map((song) => `
        <article class="song-card ${song.id === state.currentSongId ? 'active' : ''}" data-song-id="${song.id}">
          <div class="card-kicker">${esc(song.category)} · ${esc(song.currentKey || song.defaultKey)}</div>
          <h3 class="card-title">${esc(song.title)}</h3>
          <p class="card-text">${esc(song.feel || 'No feel set yet.')}</p>
        </article>
      `).join('')}
      <button class="btn accent" data-action="newSong">Add My Song</button>
      <button class="btn ghost" data-action="duplicateSong">Duplicate Current</button>
    </div>
  `;
}
function renderPathPanel() {
  const routes = E.routeFor({ key: currentKey(), from: state.pathFrom, to: state.pathTo, style: state.style, intensity: state.intensity });
  return `
    <div class="card-list">
      <div class="info-card">
        <div class="form-grid">
          ${field('From', `<input class="input-control" value="${esc(state.pathFrom)}" data-bind="pathFrom" />`)}
          ${field('To', `<input class="input-control" value="${esc(state.pathTo)}" data-bind="pathTo" />`)}
        </div>
        <div class="form-grid" style="margin-top:10px;">
          ${field('Style', select('style', STYLE_OPTIONS, state.style))}
          ${field('Intensity', select('intensity', [['safe','Safe'], ['churchy','Churchy'], ['spicy','Spicy'], ['wild','Wild']], state.intensity))}
        </div>
      </div>
      <button class="btn primary" data-action="savePathAsSection">Save Path To Song</button>
      <div class="path-results">
        ${routes.map((route) => renderRouteCard(route)).join('')}
      </div>
    </div>
  `;
}
function renderRouteCard(route) {
  return `
    <article class="result-card">
      <div class="card-kicker">${esc(route.label)} path</div>
      <div class="result-progression">
        ${route.chords.map((ch, index) => `
          ${index ? '<span class="arrow">→</span>' : ''}
          <button class="chord-pill" style="--chord-color:${colorVar(index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'green' : 'red')}" data-route-chord='${esc(JSON.stringify(ch))}'>
            <span class="chord-symbol">${esc(ch.symbol)}</span>
            <span class="chord-number">${esc(ch.number)}</span>
          </button>
        `).join('')}
      </div>
      <p class="card-text">${esc(route.explanation)}</p>
      <button class="btn ghost" data-route-save='${esc(JSON.stringify(route))}'>Add This Route</button>
    </article>
  `;
}
function renderChordLabPanel() {
  return `
    <div class="card-list">
      <div class="info-card">
        <div class="card-kicker">Parser</div>
        <h3 class="card-title">Write or type a movement</h3>
        <textarea class="input-control" data-bind="parseText">${esc(state.parseText)}</textarea>
        <div class="pill-row" style="margin-top:10px;">
          <button class="btn primary" data-action="parseToPreview">Convert To Chords</button>
          <button class="btn ghost" data-action="addParsedToSong">Add To Song</button>
        </div>
      </div>
      ${renderParsedPreview()}
      ${renderFatChordPalette(state.selectedChord)}
    </div>
  `;
}
function renderParsedPreview() {
  const parsed = E.parseProgression(state.parseText, currentKey(), state.style);
  return `
    <article class="result-card">
      <div class="card-kicker">Detected in ${currentKey()}</div>
      <div class="result-progression">
        ${parsed.tokens.map((tok, index) => `
          ${index ? '<span class="arrow">→</span>' : ''}
          <button class="chord-pill" style="--chord-color:${colorVar(tok.type === 'unknown' ? 'red' : 'blue')}" data-parsed-chord='${esc(JSON.stringify(tok))}'>
            <span class="chord-symbol">${esc(tok.chordSymbol || tok.raw)}</span>
            <span class="chord-number">${esc(tok.normalizedNumber || '?')}</span>
          </button>
        `).join('')}
      </div>
      ${parsed.warnings.length ? `<p class="card-text">${esc(parsed.warnings.join(' '))}</p>` : `<p class="card-text">Looks readable. You can add this as a new section.</p>`}
    </article>
  `;
}
function renderFatChordPalette(target = null) {
  const base = target?.number || target?.symbol || state.pathFrom || '1';
  const options = E.fatChordOptionsFor(base, { key: currentKey(), style: state.style });
  return `
    <article class="result-card fat-palette">
      <div class="card-kicker">Fat Chords</div>
      <h3 class="card-title">11s, 13s, suspensions, and big color tones</h3>
      <p class="card-text">Tap one to get fingering. Use these when the song has room, like intros, altar, preacher beds, tags, or turnarounds.</p>
      <div class="result-progression">
        ${options.map((ch, index) => `
          <button class="chord-pill" style="--chord-color:${colorVar(index % 3 === 0 ? 'orange' : index % 3 === 1 ? 'purple' : 'blue')}" data-fat-chord='${esc(JSON.stringify(ch))}'>
            <span class="chord-symbol">${esc(ch.symbol)}</span>
            <span class="chord-number">${esc(ch.quality)}</span>
          </button>
        `).join('')}
      </div>
    </article>
  `;
}
function renderLicksPanel() {
  const chord = state.selectedChord?.symbol || state.pathFrom || '1';
  const target = state.pathTo || '4';
  const licks = ['slow', 'medium', 'fast'].map((speed) => E.lickFor({ key: currentKey(), chord, target, style: state.style, speed }));
  return `
    <div class="card-list">
      <div class="info-card">
        <div class="card-kicker">Context aware</div>
        <h3 class="card-title">Runs into the next chord</h3>
        <p class="card-text">Select a chord in the chart, then use these as right-hand ideas.</p>
      </div>
      ${licks.map((lick) => renderLickCard(lick)).join('')}
    </div>
  `;
}
function renderLickCard(lick) {
  return `
    <article class="mini-card">
      <div class="card-kicker">${esc(lick.feel)}</div>
      <h3 class="card-title">${esc(lick.name)}</h3>
      <div class="notes-line">${esc(lick.notes.join(' - '))}</div>
      <p class="card-text">${esc(lick.descriptor)}</p>
      <button class="btn ghost" data-save-lick='${esc(JSON.stringify(lick))}'>Attach to Song Notes</button>
    </article>
  `;
}
function renderShoutPanel() {
  const shoutRows = [
    ['Basic praise break', ['1', '4', '1', '5']],
    ['Walkup hit', ['1', '3', '4', '#4', '5']],
    ['Turn it home', ['4', '#4', '1/5', '5', '1']],
    ['Preacher punch', ['1', 'b7', '4', '#4', '5', '1']]
  ];
  return `
    <div class="card-list">
      ${shoutRows.map(([title, nums]) => {
        const chords = E.progressionFromNumbers(nums, currentKey(), 'shout');
        return `<article class="mini-card">
          <div class="card-kicker">Shout Music</div>
          <h3 class="card-title">${esc(title)}</h3>
          <div class="result-progression">${chords.map((ch) => `<button class="chord-pill" style="--chord-color:${colorVar('red')}" data-route-chord='${esc(JSON.stringify(ch))}'><span class="chord-symbol">${esc(ch.symbol)}</span><span class="chord-number">${esc(ch.number)}</span></button>`).join('')}</div>
          <button class="btn ghost" data-add-shout='${esc(JSON.stringify({ title, nums }))}'>Add Section</button>
        </article>`;
      }).join('')}
    </div>
  `;
}
function renderOrganPanel() {
  const target = state.selectedChord?.symbol || E.numberToChord('1', currentKey(), 'preacher');
  const f = E.fingeringFor(target, { instrument: 'organ', key: currentKey() });
  const p = f.organ;
  return `
    <div class="card-list">
      <article class="info-card">
        <div class="card-kicker">Organ Mode</div>
        <h3 class="card-title">${esc(p.name)}</h3>
        <p class="card-text">Selected chord: ${esc(target)}</p>
      </article>
      ${organRow('Upper Drawbars', p.upper)}
      ${organRow('Lower Drawbars', p.lower)}
      <article class="mini-card"><div class="card-kicker">Percussion</div><div class="notes-line">${esc(p.percussion)}</div></article>
      <article class="mini-card"><div class="card-kicker">Chorus / Leslie / Expression</div><p class="card-text">${esc(p.chorus)} · ${esc(p.leslie)} · ${esc(p.expression)}</p></article>
    </div>
  `;
}
function organRow(label, value) {
  return `<article class="mini-card"><div class="card-kicker">${esc(label)}</div><div class="tool-row">${String(value).split('').map((v, i) => `<div class="field" style="width:22px;"><span class="field-label">${i + 1}</span><input type="range" min="0" max="8" value="${v}" disabled /></div>`).join('')}</div><div class="notes-line">${esc(value)}</div></article>`;
}
function renderSetlistPanel() {
  return `
    <div class="card-list">
      <article class="info-card">
        <div class="card-kicker">Live set</div>
        <h3 class="card-title">Sunday Setlist</h3>
        <p class="card-text">Use this build as your local library. Open a song, lock live mode, and avoid accidental edits.</p>
      </article>
      ${state.songs.map((song, index) => `<article class="mini-card"><div class="card-kicker">${index + 1}</div><h3 class="card-title">${esc(song.title)}</h3><p class="card-text">${esc(song.currentKey || song.defaultKey)} · ${esc(song.feel || '')}</p><button class="btn ghost" data-song-id="${song.id}">Open</button></article>`).join('')}
    </div>
  `;
}
function field(label, control) {
  return `<label class="field"><span class="field-label">${esc(label)}</span>${control}</label>`;
}
function select(bind, options, value) {
  return `<select class="select-control" data-bind="${bind}">${options.map(([v, label]) => `<option value="${v}" ${String(value) === String(v) ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select>`;
}

function renderCanvasPanel(mode) {
  const mobileTabs = mode === 'mobile' ? `<div class="mobile-tabs pill-row">${['Songs','Path','Chord','Live'].map((t) => `<button class="chip ${state.activeTab === t ? 'active accented' : ''}" data-tab="${t}">${t}</button>`).join('')}</div>` : '';
  return `
    <section class="canvas-panel">
      <div class="mode-strip">${TABS.map((tab) => `<button class="chip ${state.activeTab === tab ? 'active accented' : ''}" data-tab="${tab}">${tab}</button>`).join('')}</div>
      <div class="canvas-toolbar">
        <div class="tool-row">
          ${toolButton('navigate', 'Navigate')}
          ${toolButton('pen', 'Pen')}
          ${toolButton('highlighter', 'Highlight')}
          ${toolButton('text', 'Text')}
          ${toolButton('eraser', 'Eraser')}
        </div>
        <div class="tool-row">
          ${HIGHLIGHT_COLORS.map((c) => `<button class="color-dot ${state.inkColor === c ? 'active' : ''}" style="background:${colorVar(c)}" title="${c}" data-ink-color="${c}"></button>`).join('')}
          <button class="btn ghost" data-action="convertInk">Convert</button>
          <button class="btn ${state.writeMode ? 'danger' : 'ghost'}" data-action="toggleWrite">${state.writeMode ? 'Writing On' : 'Writing Off'}</button>
        </div>
      </div>
      ${mobileTabs}
      <div class="chart-wrap ${state.writeMode ? 'write-mode' : ''}" data-chart-wrap>
        <div class="chart-page" data-chart-page>
          <canvas class="chart-canvas ${state.writeMode ? 'active' : ''}" data-ink-canvas></canvas>
          <div class="chart-content">
            ${renderSongChart()}
          </div>
        </div>
      </div>
      <div class="ink-status">
        <span>${state.writeMode ? `Write mode · ${state.currentTool} · ${state.inkColor}` : 'Navigate mode · tap chords for fingerings'}</span>
        <span>${state.liveLocked ? 'Live lock ready' : 'Unlocked'}</span>
      </div>
    </section>
  `;
}
function toolButton(tool, label) {
  return `<button class="tool-btn ${state.currentTool === tool ? 'active' : ''}" data-tool="${tool}">${label}</button>`;
}
function renderSongChart() {
  const song = currentSong();
  const notes = state.notes.filter((n) => n.songId === song.id);
  return `
    <section class="song-hero">
      <div>
        <h1 class="song-title">${esc(song.title)}</h1>
        <div class="song-meta-row">
          <span class="badge blue">Key ${esc(currentKey())}</span>
          <span class="badge green">${esc(song.feel || 'No feel')}</span>
          <span class="badge purple">${esc(song.category || 'My Song')}</span>
          <span class="badge red">${esc(song.sourceType || 'user')}</span>
        </div>
      </div>
      <div class="pill-row">
        <button class="btn ghost" data-action="addTextNote">Text Box</button>
        <button class="btn ghost" data-action="addSection">Add Section</button>
      </div>
    </section>
    ${song.sections.map((section, sectionIndex) => renderSection(section, sectionIndex)).join('')}
    ${notes.length ? `<section class="section-card"><div class="section-head"><span class="section-label orange">Text Notes</span></div>${notes.map((n) => `<article class="mini-card"><div class="card-kicker">${esc(n.kind || 'note')}</div><p class="card-text">${esc(n.text)}</p></article>`).join('')}</section>` : ''}
  `;
}
function renderSection(section, sectionIndex) {
  return `
    <section class="section-card" data-section-id="${section.id}">
      <div class="section-head">
        <span class="section-label ${section.color || 'blue'}">${esc(section.name)}</span>
        <div class="pill-row">
          <button class="btn ghost" data-section-live="${sectionIndex}">Live Here</button>
          <button class="btn ghost" data-section-add-chord="${section.id}">Add Chords</button>
        </div>
      </div>
      ${section.bars.map((bar) => `<div class="chord-grid">${bar.chords.map((ch) => renderChordPill(ch, section.id)).join('')}</div>`).join('')}
    </section>
  `;
}
function renderChordPill(chord, sectionId) {
  const color = chord.highlight || chord.color || (chord.number?.includes('b') ? 'purple' : chord.number?.includes('#') ? 'red' : 'blue');
  const selected = state.selectedChord?.chordId === chord.id ? 'selected' : '';
  return `
    <button class="chord-pill ${selected}" style="--chord-color:${colorVar(color)}" data-chord-id="${chord.id}" data-section-id="${sectionId}">
      <span class="chord-symbol">${esc(chord.symbol)}</span>
      <span class="chord-number">${esc(chord.number || E.chordToNumber(chord.symbol, currentKey()) || '')}</span>
      <span class="chord-use">${esc((chord.descriptor || '').slice(0, 72))}</span>
    </button>
  `;
}

function renderChordDetail(compact = false) {
  const selected = state.selectedChord;
  if (!selected) return `<div class="detail-empty"><div><strong>Tap a chord.</strong><br />Fingerings, licks, organ settings, and next moves will show here.</div></div>`;
  const f = E.fingeringFor(selected.symbol, { instrument: state.instrument, difficulty: state.detailDifficulty, key: currentKey() });
  const lick = E.lickFor({ key: currentKey(), chord: selected.symbol, target: state.pathTo, style: state.style, speed: 'medium' });
  const number = selected.number || E.chordToNumber(selected.symbol, currentKey()) || '?';
  if (compact) {
    return `
      <div class="chord-detail compact-detail">
        <div class="compact-row">
          <div>
            <div class="card-kicker">${esc(number)} in ${esc(currentKey())}</div>
            <h2 class="big-chord">${esc(selected.symbol)}</h2>
          </div>
          <button class="chip active accented" data-action="toggleSheet">More</button>
        </div>
        <div class="compact-voicing">
          <span>LH: ${esc(f.leftHandNotes.join(' - '))}</span>
          <strong>RH: ${esc(f.rightHandNotes.join(' - '))}</strong>
        </div>
      </div>
    `;
  }
  return `
    <div class="chord-detail">
      <div class="chord-detail-title">
        <div class="card-kicker">${esc(number)} in ${esc(currentKey())}</div>
        <h2 class="big-chord">${esc(selected.symbol)}</h2>
        <p class="card-text">${esc(selected.descriptor || 'Tap through the options below for a playable version.')}</p>
      </div>
      <div class="pill-row">
        ${['easy','churchy','advanced'].map((d) => `<button class="chip ${state.detailDifficulty === d ? 'active accented' : ''}" data-difficulty="${d}">${d}</button>`).join('')}
        ${['piano','organ'].map((i) => `<button class="chip ${state.instrument === i ? 'active accented' : ''}" data-instrument="${i}">${i}</button>`).join('')}
      </div>
      <div class="color-row">
        ${HIGHLIGHT_COLORS.map((c) => `<button class="color-dot" style="background:${colorVar(c)}" title="highlight ${c}" data-highlight-chord="${c}"></button>`).join('')}
      </div>
      ${renderFatChordPalette(selected)}
      <div class="detail-grid">
        <article class="voicing-card">
          <div class="card-kicker">Left Hand</div>
          <div class="notes-line">${esc(f.leftHandNotes.join(' - '))}</div>
          <div class="meta">Fingers: ${esc(f.leftHandFingers.join(' - '))}</div>
        </article>
        <article class="voicing-card">
          <div class="card-kicker">Right Hand</div>
          <div class="notes-line">${esc(f.rightHandNotes.join(' - '))}</div>
          <div class="meta">Fingers: ${esc(f.rightHandFingers.join(' - '))}</div>
        </article>
        <article class="voicing-card"><div class="card-kicker">Lick</div><div class="notes-line">${esc(lick.notes.join(' - '))}</div><p class="card-text">${esc(lick.descriptor)}</p></article>
        <article class="voicing-card">
          <div class="card-kicker">Organ</div>
          <div class="notes-line">${esc(f.organ.upper)} / ${esc(f.organ.lower)}</div>
          <p class="card-text">${esc(f.organ.name)} · ${esc(f.organ.leslie)}</p>
        </article>
      </div>
    </div>
  `;
}
function renderBottomSheet() {
  if (!state.selectedChord) return '';
  return `<div class="bottom-sheet ${state.sheetExpanded ? '' : 'collapsed'}" data-action="toggleSheet"><button class="sheet-close" data-action="clearChord" aria-label="Close fingering">×</button>${renderChordDetail(!state.sheetExpanded)}</div>`;
}
function renderBottomNav() {
  return `
    <nav class="bottom-nav">
      ${['Songs','Path','Chord','Licks'].map((tab) => `<button class="tab-btn ${state.activeTab === tab ? 'active accented' : ''}" data-tab="${tab}">${tab}</button>`).join('')}
      <button class="tab-btn" data-action="toggleLive">Live</button>
    </nav>
  `;
}

function renderLive(mode) {
  const song = currentSong();
  const section = song.sections[state.liveSectionIndex] || song.sections[0];
  const chords = section.bars.flatMap((bar) => bar.chords || []);
  return `
    <main class="layout ${layoutClass()}">
      <section class="live-panel" style="grid-column:1/-1;">
        <div class="live-header">
          <div>
            <div class="card-kicker">${esc(modeLabel(mode))} · ${state.liveLocked ? 'Locked' : 'Unlocked'}</div>
            <h1 class="live-title">${esc(song.title)}</h1>
            <div class="song-meta-row"><span class="badge blue">Key ${esc(currentKey())}</span><span class="badge ${section.color || 'green'}">${esc(section.name)}</span></div>
          </div>
          <button class="btn primary" data-action="toggleLive">Exit Live</button>
        </div>
        <div class="live-section">
          <div class="live-chords">
            ${chords.map((ch) => `<button class="live-chord" style="--chord-color:${colorVar(ch.highlight || 'blue')}" data-chord-id="${ch.id}" data-section-id="${section.id}"><span class="chord-symbol">${esc(ch.symbol)}</span><span class="chord-number">${esc(ch.number || '')}</span></button>`).join('')}
          </div>
        </div>
        <div class="live-actions">
          <button class="btn ghost" data-action="prevSection">Prev</button>
          <button class="btn ghost" data-action="repeatSection">Repeat</button>
          <button class="btn accent" data-action="nextSection">Next</button>
          <button class="btn ghost" data-action="endingSection">Ending</button>
          <button class="btn ghost" data-action="panicSafe">Panic Safe</button>
          <button class="btn ${state.liveLocked ? 'danger' : 'ghost'}" data-action="toggleLiveLock">${state.liveLocked ? 'Locked' : 'Unlocked'}</button>
        </div>
      </section>
      ${renderBottomSheet()}
    </main>
  `;
}

function renderModal() {
  if (!state.modal) return '';
  if (state.modal.type === 'convertInk') return modalShell('Convert handwriting / text', `
    <p class="card-text">Browser handwriting recognition is not reliable everywhere yet. This build captures ink and lets you confirm the text before conversion.</p>
    ${field('Recognized or typed progression', `<textarea class="input-control" data-modal-input="convertText">${esc(state.modal.text || state.parseText || '')}</textarea>`)}
    <div class="info-card">${renderParsedPreviewFor(state.modal.text || state.parseText)}</div>
  `, `<button class="btn ghost" data-action="closeModal">Cancel</button><button class="btn primary" data-action="confirmConvertInk">Convert</button>`);
  if (state.modal.type === 'newSong') return modalShell('New Song', `
    ${field('Title', '<input class="input-control" data-modal-input="title" placeholder="My Praise Song" />')}
    ${field('Category', '<input class="input-control" data-modal-input="category" placeholder="Praise / Altar / Shout" />')}
    ${field('Feel', '<input class="input-control" data-modal-input="feel" placeholder="Bright praise" />')}
  `, `<button class="btn ghost" data-action="closeModal">Cancel</button><button class="btn primary" data-action="confirmNewSong">Create</button>`);
  if (state.modal.type === 'textNote') return modalShell('Add text box', `
    ${field('Note', '<textarea class="input-control" data-modal-input="note" placeholder="Hold here if preacher keeps talking."></textarea>')}
  `, `<button class="btn ghost" data-action="closeModal">Cancel</button><button class="btn primary" data-action="confirmTextNote">Add</button>`);
  if (state.modal.type === 'addSection') return modalShell('Add Section', `
    ${field('Section name', '<input class="input-control" data-modal-input="sectionName" placeholder="Bridge / Tag / Ending" />')}
    ${field('Numbers or chords', `<textarea class="input-control" data-modal-input="sectionChords">${esc(state.parseText)}</textarea>`)}
  `, `<button class="btn ghost" data-action="closeModal">Cancel</button><button class="btn primary" data-action="confirmAddSection">Add Section</button>`);
  return '';
}
function modalShell(title, body, foot) {
  return `<div class="modal-backdrop"><section class="modal-card"><div class="modal-head"><h2 class="panel-title">${esc(title)}</h2><button class="icon-btn" data-action="closeModal">×</button></div><div class="modal-body">${body}</div><div class="modal-foot">${foot}</div></section></div>`;
}
function renderParsedPreviewFor(text) {
  const parsed = E.parseProgression(text, currentKey(), state.style);
  return `<div class="card-kicker">Preview</div><div class="result-progression">${parsed.tokens.map((tok, index) => `${index ? '<span class="arrow">→</span>' : ''}<span class="badge blue">${esc(tok.chordSymbol || tok.raw)}</span>`).join('')}</div>`;
}

function wireEvents() {
  appRoot.querySelectorAll('[data-tab]').forEach((el) => el.addEventListener('click', () => setState({ activeTab: el.dataset.tab })));
  appRoot.querySelectorAll('[data-bind]').forEach((el) => {
    const bind = el.dataset.bind;
    const event = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(event, () => handleBind(bind, el.value));
  });
  appRoot.querySelectorAll('[data-action]').forEach((el) => el.addEventListener('click', (ev) => handleAction(el.dataset.action, el, ev)));
  appRoot.querySelectorAll('[data-song-id]').forEach((el) => el.addEventListener('click', () => selectSong(el.dataset.songId)));
  appRoot.querySelectorAll('[data-chord-id]').forEach((el) => el.addEventListener('click', (ev) => { ev.stopPropagation(); selectChord(el.dataset.chordId, el.dataset.sectionId); }));
  appRoot.querySelectorAll('[data-tool]').forEach((el) => el.addEventListener('click', () => setState({ currentTool: el.dataset.tool, writeMode: el.dataset.tool !== 'navigate' })));
  appRoot.querySelectorAll('[data-ink-color]').forEach((el) => el.addEventListener('click', () => setState({ inkColor: el.dataset.inkColor })));
  appRoot.querySelectorAll('[data-difficulty]').forEach((el) => el.addEventListener('click', () => setState({ detailDifficulty: el.dataset.difficulty })));
  appRoot.querySelectorAll('[data-instrument]').forEach((el) => el.addEventListener('click', () => setState({ instrument: el.dataset.instrument })));
  appRoot.querySelectorAll('[data-highlight-chord]').forEach((el) => el.addEventListener('click', () => highlightSelectedChord(el.dataset.highlightChord)));
  appRoot.querySelectorAll('[data-route-chord]').forEach((el) => el.addEventListener('click', () => selectVirtualChord(JSON.parse(el.dataset.routeChord))));
  appRoot.querySelectorAll('[data-parsed-chord]').forEach((el) => el.addEventListener('click', () => selectVirtualChord(JSON.parse(el.dataset.parsedChord))));
  appRoot.querySelectorAll('[data-fat-chord]').forEach((el) => el.addEventListener('click', () => selectVirtualChord(JSON.parse(el.dataset.fatChord))));
  appRoot.querySelectorAll('[data-route-save]').forEach((el) => el.addEventListener('click', () => addRouteToSong(JSON.parse(el.dataset.routeSave))));
  appRoot.querySelectorAll('[data-save-lick]').forEach((el) => el.addEventListener('click', () => saveLickNote(JSON.parse(el.dataset.saveLick))));
  appRoot.querySelectorAll('[data-add-shout]').forEach((el) => el.addEventListener('click', () => addShoutSection(JSON.parse(el.dataset.addShout))));
  appRoot.querySelectorAll('[data-section-live]').forEach((el) => el.addEventListener('click', () => setState({ liveSectionIndex: Number(el.dataset.sectionLive), liveMode: true })));
  appRoot.querySelectorAll('[data-section-add-chord]').forEach((el) => el.addEventListener('click', () => setState({ selectedSectionId: el.dataset.sectionAddChord, modal: { type: 'addSection' } })));
}
function handleBind(bind, value) {
  if (bind === 'songKey') {
    updateCurrentSong((song) => {
      song.currentKey = value;
      song.sections.forEach((section) => section.bars.forEach((bar) => bar.chords.forEach((ch) => {
        if (ch.number) ch.symbol = E.numberToChord(String(ch.number).split('/')[0], value, state.style) + (String(ch.number).includes('/') ? `/${E.numberToNote(String(ch.number).split('/')[1], value)}` : '');
      })));
    });
    return;
  }
  setState({ [bind]: value }, false);
  persistSoon();
  if (['style', 'intensity'].includes(bind)) render();
}
function handleAction(action, el, ev) {
  if (action === 'home') return setState({ activeTab: 'Songs' });
  if (action === 'toggleTheme') return setState({ theme: state.theme === 'dark' ? 'light' : 'dark' });
  if (action === 'toggleLive') return setState({ liveMode: !state.liveMode });
  if (action === 'toggleLiveLock') return setState({ liveLocked: !state.liveLocked });
  if (action === 'cycleTab') return cycleTab();
  if (action === 'clearChord') return setState({ selectedChord: null });
  if (action === 'toggleWrite') return setState({ writeMode: !state.writeMode, currentTool: state.writeMode ? 'navigate' : 'pen' });
  if (action === 'convertInk') return setState({ modal: { type: 'convertInk', text: state.parseText } });
  if (action === 'closeModal') return setState({ modal: null });
  if (action === 'confirmConvertInk') return confirmConvertInk();
  if (action === 'newSong') return setState({ modal: { type: 'newSong' } });
  if (action === 'confirmNewSong') return confirmNewSong();
  if (action === 'duplicateSong') return duplicateSong();
  if (action === 'addParsedToSong') return addParsedToSong();
  if (action === 'parseToPreview') return render();
  if (action === 'savePathAsSection') return addRouteToSong(E.routeFor({ key: currentKey(), from: state.pathFrom, to: state.pathTo, style: state.style, intensity: state.intensity })[1]);
  if (action === 'addTextNote') return setState({ modal: { type: 'textNote' } });
  if (action === 'confirmTextNote') return confirmTextNote();
  if (action === 'addSection') return setState({ modal: { type: 'addSection' } });
  if (action === 'confirmAddSection') return confirmAddSection();
  if (action === 'toggleSheet') { if (ev && ev.target !== el) return; return setState({ sheetExpanded: !state.sheetExpanded }); }
  if (action === 'prevSection') return stepLive(-1);
  if (action === 'nextSection') return stepLive(1);
  if (action === 'repeatSection') return toast('Repeat current section.');
  if (action === 'endingSection') return jumpToEnding();
  if (action === 'panicSafe') return panicSafe();
}
function cycleTab() {
  const i = TABS.indexOf(state.activeTab);
  setState({ activeTab: TABS[(i + 1) % TABS.length] });
}
function selectSong(songId) {
  const song = state.songs.find((s) => s.id === songId);
  if (!song) return;
  setState({ currentSongId: songId, selectedSectionId: song.sections[0]?.id, liveSectionIndex: 0, selectedChord: null });
}
function selectChord(chordId, sectionId) {
  const song = currentSong();
  let found = null;
  for (const section of song.sections) for (const bar of section.bars) for (const ch of bar.chords) if (ch.id === chordId) found = { ...ch, chordId, sectionId: section.id };
  if (found) setState({ selectedChord: found, selectedSectionId: sectionId || found.sectionId, sheetExpanded: false });
}
function selectVirtualChord(ch) {
  setState({ selectedChord: { symbol: ch.chordSymbol || ch.symbol, number: ch.normalizedNumber || ch.number, descriptor: ch.descriptor, chordId: ch.id || E.uid('virtual') }, sheetExpanded: true });
}
function highlightSelectedChord(color) {
  const selected = state.selectedChord;
  if (!selected?.chordId) return;
  updateCurrentSong((song) => {
    song.sections.forEach((section) => section.bars.forEach((bar) => bar.chords.forEach((ch) => {
      if (ch.id === selected.chordId) ch.highlight = color;
    })));
  });
  setState({ selectedChord: { ...selected, highlight: color } });
}
function addRouteToSong(route) {
  updateCurrentSong((song) => {
    song.sections.push({ id: E.uid('sec'), name: route.label || 'Path', color: 'blue', bars: [{ id: E.uid('bar'), chords: route.chords.map((ch) => ({ ...ch, id: E.uid('ch') })) }] });
  });
  toast('Path added to current song.');
}
function addParsedToSong() {
  const parsed = E.parseProgression(state.parseText, currentKey(), state.style);
  const chords = parsed.tokens.filter((t) => t.chordSymbol).map((t) => ({ id: E.uid('ch'), symbol: t.chordSymbol, number: t.normalizedNumber || t.raw, descriptor: t.descriptor }));
  if (!chords.length) return toast('Nothing readable to add.');
  updateCurrentSong((song) => song.sections.push({ id: E.uid('sec'), name: 'Converted', color: 'green', bars: [{ id: E.uid('bar'), chords }] }));
  toast('Converted progression added.');
}
function confirmConvertInk() {
  const text = getModalValue('convertText') || state.parseText;
  setState({ parseText: text, modal: null, activeTab: 'Chord' });
  setTimeout(addParsedToSong, 50);
}
function confirmNewSong() {
  const title = getModalValue('title') || 'Untitled Song';
  const category = getModalValue('category') || 'My Songs';
  const feel = getModalValue('feel') || 'Custom arrangement';
  const key = currentKey();
  const id = E.uid('song');
  const song = { id, title, category, feel, defaultKey: key, currentKey: key, sourceType: 'user_created', userCreated: true, sections: [{ id: E.uid('sec'), name: 'Main', color: 'green', bars: [{ id: E.uid('bar'), chords: E.progressionFromNumbers(['1','4','5','1'], key, state.style) }] }] };
  setState({ songs: [...state.songs, song], currentSongId: id, selectedSectionId: song.sections[0].id, modal: null, activeTab: 'Songs' });
}
function duplicateSong() {
  const copy = structuredCloneSafe(currentSong());
  copy.id = E.uid('song');
  copy.title = `${copy.title} Copy`;
  copy.userCreated = true;
  copy.sourceType = 'user_created';
  copy.sections.forEach((sec) => { sec.id = E.uid('sec'); sec.bars.forEach((bar) => { bar.id = E.uid('bar'); bar.chords.forEach((ch) => ch.id = E.uid('ch')); }); });
  setState({ songs: [...state.songs, copy], currentSongId: copy.id, selectedSectionId: copy.sections[0]?.id });
  toast('Song duplicated.');
}
function confirmTextNote() {
  const text = getModalValue('note');
  if (!text) return toast('Write a note first.');
  setState({ notes: [...state.notes, { id: E.uid('note'), songId: currentSong().id, text, kind: 'text box' }], modal: null });
}
function confirmAddSection() {
  const name = getModalValue('sectionName') || 'Custom';
  const text = getModalValue('sectionChords') || state.parseText;
  const parsed = E.parseProgression(text, currentKey(), state.style);
  const chords = parsed.tokens.filter((t) => t.chordSymbol).map((t) => ({ id: E.uid('ch'), symbol: t.chordSymbol, number: t.normalizedNumber || t.raw, descriptor: t.descriptor }));
  updateCurrentSong((song) => song.sections.push({ id: E.uid('sec'), name, color: 'blue', bars: [{ id: E.uid('bar'), chords }] }));
  setState({ modal: null });
  toast('Section added.');
}
function addShoutSection({ title, nums }) {
  const chords = E.progressionFromNumbers(nums, currentKey(), 'shout');
  updateCurrentSong((song) => song.sections.push({ id: E.uid('sec'), name: title, color: 'red', bars: [{ id: E.uid('bar'), chords }] }));
  toast('Shout section added.');
}
function saveLickNote(lick) {
  setState({ notes: [...state.notes, { id: E.uid('note'), songId: currentSong().id, text: `${lick.name}: ${lick.notes.join(' - ')}. ${lick.descriptor}`, kind: 'lick' }] });
  toast('Lick saved to song notes.');
}
function getModalValue(name) {
  return appRoot.querySelector(`[data-modal-input="${name}"]`)?.value.trim();
}
function stepLive(delta) {
  const len = currentSong().sections.length;
  setState({ liveSectionIndex: Math.max(0, Math.min(len - 1, state.liveSectionIndex + delta)) });
}
function jumpToEnding() {
  const idx = currentSong().sections.findIndex((s) => /end|tag/i.test(s.name));
  if (idx >= 0) setState({ liveSectionIndex: idx }); else toast('No ending section yet.');
}
function panicSafe() {
  const safe = { id: E.uid('ch'), symbol: E.numberToChord('1', currentKey(), 'ccm'), number: '1', descriptor: 'Safe home chord. Hold this or move to the 4 if the singer keeps building.' };
  selectVirtualChord(safe);
  toast('Safe chord loaded.');
}

function setupCanvas() {
  const canvas = appRoot.querySelector('[data-ink-canvas]');
  const page = appRoot.querySelector('[data-chart-page]');
  if (!canvas || !page) return;
  const rect = page.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  if (canvas.width !== Math.floor(width * scale) || canvas.height !== Math.floor(height * scale)) {
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  redrawInk(ctx, width, height);
  canvas.onpointerdown = startInk;
  canvas.onpointermove = moveInk;
  canvas.onpointerup = endInk;
  canvas.onpointercancel = endInk;
}
function strokesForSong() {
  const id = currentSong().id;
  if (!state.strokes[id]) state.strokes[id] = [];
  return state.strokes[id];
}
function redrawInk(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  for (const stroke of strokesForSong()) drawStroke(ctx, stroke, width, height);
  if (drawing) drawStroke(ctx, drawing, width, height);
}
function drawStroke(ctx, stroke, width, height) {
  if (!stroke.points?.length) return;
  ctx.save();
  ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.32 : 1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue(`--${stroke.color || 'blue'}`).trim() || '#2767d7';
  ctx.lineWidth = stroke.tool === 'highlighter' ? 18 : stroke.tool === 'eraser' ? 24 : stroke.width || 3;
  ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.beginPath();
  stroke.points.forEach((p, i) => {
    const x = p.x * width;
    const y = p.y * height;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();
}
function pointerPoint(ev) {
  const canvas = appRoot.querySelector('[data-ink-canvas]');
  const rect = canvas.getBoundingClientRect();
  return { x: (ev.clientX - rect.left) / rect.width, y: (ev.clientY - rect.top) / rect.height, pressure: ev.pressure || 0.5, pointerType: ev.pointerType, t: Date.now() };
}
function startInk(ev) {
  if (!state.writeMode || state.currentTool === 'navigate') return;
  ev.preventDefault();
  ev.currentTarget.setPointerCapture?.(ev.pointerId);
  drawing = { id: E.uid('ink'), tool: state.currentTool, color: state.inkColor, width: ev.pointerType === 'pen' ? 3 : 4, points: [pointerPoint(ev)], createdAt: new Date().toISOString() };
  setupCanvas();
}
function moveInk(ev) {
  if (!drawing) return;
  ev.preventDefault();
  drawing.points.push(pointerPoint(ev));
  setupCanvas();
}
function endInk(ev) {
  if (!drawing) return;
  const id = currentSong().id;
  const strokes = { ...state.strokes, [id]: [...strokesForSong(), drawing] };
  drawing = null;
  setState({ strokes }, false);
  setupCanvas();
}

window.addEventListener('resize', () => render());
window.addEventListener('orientationchange', () => setTimeout(render, 100));
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

render();
