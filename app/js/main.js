// Vice Platinum — GTA VI trophy guide & tracker.
// Plain ES modules, no build step, no network: the only fetch is the app's own data file.

import * as store from './store.js';

const view = document.getElementById('view');
let TROPHIES = [];
let state = store.load();
const filters = { q: '', grade: 'all', kind: 'all', status: 'all' };
const revealed = new Set(); // hidden trophies revealed by hand in this session

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const byId = (id) => TROPHIES.find((t) => t.id === Number(id));
const earnedCount = () => TROPHIES.filter((t) => state.earned[t.id]).length;
const isMasked = (t) => state.settings.spoilers && t.hidden && !state.earned[t.id] && !revealed.has(t.id);
const fmt = (n) => n.toLocaleString('en-US');

function persist() { store.save(state); renderHeader(); }

function renderHeader() {
  const n = earnedCount();
  document.getElementById('big-earned').textContent = n;
  document.getElementById('big-pct').textContent = `${Math.round((n / TROPHIES.length) * 100)}% of the list`;
  document.getElementById('progress-fill').style.width = `${(n / TROPHIES.length) * 100}%`;
  const grades = ['platinum', 'gold', 'silver', 'bronze'];
  document.getElementById('grade-strip').innerHTML = grades.map((g) => {
    const all = TROPHIES.filter((t) => t.grade === g);
    const got = all.filter((t) => state.earned[t.id]).length;
    return `<span class="chip"><span class="dot ${g}"></span>${g[0].toUpperCase() + g.slice(1)} ${got}/${all.length}</span>`;
  }).join('') + `<span class="chip">Hidden on PSN: ${TROPHIES.filter((t) => t.hidden).length}</span>`;
}

/* ---------------- shared bits ---------------- */

function counterHTML(t) {
  if (!t.target) return '';
  const cur = Math.min(state.counts[t.id] || 0, t.target);
  const pct = Math.round((cur / t.target) * 100);
  return `<span class="counter" title="PSN progress target">
    <button type="button" data-count="${t.id}|-1" aria-label="one less">−</button>
    <strong>${fmt(cur)} / ${fmt(t.target)}</strong>
    <button type="button" data-count="${t.id}|1" aria-label="one more">+</button>
    <span class="bar"><span style="width:${pct}%"></span></span>
    <span class="muted small">${esc(t.targetLabel || '')}</span>
  </span>`;
}

function metaChips(t) {
  const chips = [
    `<span class="chip"><span class="dot ${t.grade}"></span>${t.grade}</span>`,
    `<span class="chip">${esc(t.kind)}</span>`,
  ];
  if (t.hidden) chips.push('<span class="chip badge-hidden">Hidden on PSN</span>');
  if (t.missable) chips.push('<span class="chip badge-missable">Possibly missable — see Missables</span>');
  if (state.earned[t.id]) chips.push('<span class="chip" style="border-color:var(--teal);color:var(--teal)">Earned</span>');
  return chips.join(' ');
}

function cardHTML(t) {
  const masked = isMasked(t);
  const name = masked ? 'Hidden trophy' : esc(t.name);
  const desc = masked
    ? '<span class="masked">Hidden on PSN until earned. The spoiler guard is on — reveal it from its guide page, or turn the guard off in Save &amp; Settings.</span>'
    : esc(t.description);
  return `<article class="trophy ${state.earned[t.id] ? 'earned' : ''}">
    <label class="check"><input type="checkbox" data-earn="${t.id}" ${state.earned[t.id] ? 'checked' : ''} aria-label="mark earned"></label>
    <div>
      <h3>${name}</h3>
      <p class="desc">${desc}</p>
      <div class="meta">${metaChips(t)}</div>
      ${counterHTML(t)}
    </div>
    <div class="side"><a class="btn" href="#/trophy/${t.id}">Guide →</a></div>
  </article>`;
}

/* ---------------- views ---------------- */

function checklistView() {
  const kinds = [...new Set(TROPHIES.map((t) => t.kind))];
  const list = TROPHIES.filter((t) => {
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (filters.kind !== 'all' && t.kind !== filters.kind) return false;
    if (filters.status === 'earned' && !state.earned[t.id]) return false;
    if (filters.status === 'remaining' && state.earned[t.id]) return false;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      const hay = `${t.name} ${t.description} ${t.kind} ${t.grade}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  view.innerHTML = `
    <div class="toolbar">
      <label>Search <input type="search" id="f-q" value="${esc(filters.q)}" placeholder="name, keyword…"></label>
      <label>Grade <select id="f-grade">
        ${['all', 'platinum', 'gold', 'silver', 'bronze'].map((g) => `<option value="${g}" ${filters.grade === g ? 'selected' : ''}>${g === 'all' ? 'All grades' : g}</option>`).join('')}
      </select></label>
      <label>Kind <select id="f-kind">
        <option value="all" ${filters.kind === 'all' ? 'selected' : ''}>All kinds</option>
        ${kinds.map((k) => `<option value="${esc(k)}" ${filters.kind === k ? 'selected' : ''}>${esc(k)}</option>`).join('')}
      </select></label>
      <label>Status <select id="f-status">
        ${[['all', 'All'], ['earned', 'Earned'], ['remaining', 'Remaining']].map(([v, l]) => `<option value="${v}" ${filters.status === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select></label>
      <label class="switch"><input type="checkbox" id="f-spoilers" ${state.settings.spoilers ? 'checked' : ''}> Spoiler guard (hide hidden trophies)</label>
    </div>
    <p class="muted small">${list.length} of ${TROPHIES.length} trophies shown · the official order · tick the box when a trophy pops; counters track PSN's own progress targets.</p>
    ${list.map(cardHTML).join('') || '<div class="panel"><p>No trophies match those filters.</p></div>'}`;
  document.getElementById('f-q').addEventListener('input', (e) => { filters.q = e.target.value; checklistViewSoft(); });
  document.getElementById('f-grade').addEventListener('change', (e) => { filters.grade = e.target.value; render(); });
  document.getElementById('f-kind').addEventListener('change', (e) => { filters.kind = e.target.value; render(); });
  document.getElementById('f-status').addEventListener('change', (e) => { filters.status = e.target.value; render(); });
  document.getElementById('f-spoilers').addEventListener('change', (e) => { state.settings.spoilers = e.target.checked; persist(); render(); });
}

// Re-render the list only, keeping the search box focused while typing.
function checklistViewSoft() {
  const cards = view.querySelectorAll('.trophy');
  const list = TROPHIES.filter((t) => {
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (filters.kind !== 'all' && t.kind !== filters.kind) return false;
    if (filters.status === 'earned' && !state.earned[t.id]) return false;
    if (filters.status === 'remaining' && state.earned[t.id]) return false;
    if (filters.q) {
      const hay = `${t.name} ${t.description} ${t.kind} ${t.grade}`.toLowerCase();
      if (!hay.includes(filters.q.toLowerCase())) return false;
    }
    return true;
  });
  const keep = new Set(list.map((t) => String(t.id)));
  cards.forEach((c) => {
    const id = c.querySelector('[data-earn]')?.dataset.earn;
    c.style.display = keep.has(id) ? '' : 'none';
  });
}

function trophyView(id) {
  const t = byId(id);
  if (!t) { location.hash = '#/checklist'; return; }
  const masked = isMasked(t);
  const note = state.notes[t.id] || '';
  view.innerHTML = `<div class="panel">
    <p><a href="#/checklist">← Back to the checklist</a></p>
    <div class="detail-head">
      <div style="flex:1;min-width:260px">
        <h2>${masked ? 'Hidden trophy' : esc(t.name)}</h2>
        <p class="desc" style="color:var(--muted)">${masked ? '<span class="masked">This trophy is hidden on PSN until it is earned, and the spoiler guard is on.</span>' : esc(t.description)}</p>
        <div class="meta" style="display:flex;gap:6px;flex-wrap:wrap">${metaChips(t)}</div>
      </div>
      <div>
        <button type="button" class="primary" data-toggle-earn="${t.id}">${state.earned[t.id] ? 'Earned ✓ (tap to undo)' : 'Mark as earned'}</button>
      </div>
    </div>
    ${masked ? `<p style="margin-top:14px"><button type="button" data-reveal="${t.id}">Reveal this trophy anyway</button></p>` : `
    ${t.missable ? '<div class="warn" style="margin-top:14px"><strong>Missable warning.</strong> Launch-week community guides flag this as the one trophy that might be missable. The flag is unconfirmed — see the Missables page for the full picture and the save habit that covers it.</div>' : ''}
    <h3>How to earn it</h3>
    <p class="guide-text">${esc(t.guide)}</p>
    ${t.target ? `<h3>Progress</h3><div class="counter-line">${counterHTML(t)}</div><p class="muted small">PSN counts this trophy to ${fmt(t.target)} (${esc(t.targetLabel || '')}). Keep the counter here in step and the trophy pops the moment the target is met in game.</p>` : ''}
    <h3>Sources</h3>
    <p class="sources small">${esc(t.sources)}</p>
    <h3>Your notes</h3>
    <textarea id="note" placeholder="Your own notes for this trophy — saved in this browser only.">${esc(note)}</textarea>
    <p><button type="button" id="save-note">Save note</button></p>`}
  </div>`;
  const saveBtn = document.getElementById('save-note');
  if (saveBtn) saveBtn.addEventListener('click', () => {
    state.notes[t.id] = document.getElementById('note').value;
    persist();
    saveBtn.textContent = 'Saved ✓';
    setTimeout(() => { saveBtn.textContent = 'Save note'; }, 1200);
  });
}

const STAGES = [
  { title: 'Stage 1 — Play the story', kinds: ['Story'], text: 'The campaign hands you 12 trophies: the chapters, the named missions and the gold for the final mission. All are unmissable. While you are in the story, build the habits the rest of the list runs on: meditate at every spot you find, WAiNK every new place, register vehicles you keep, and pick up every collectible card you see. Put a manual save down before the endgame — several one-off moments are easiest before the credits.' },
  { title: 'Stage 2 — Finish the stranger strands', kinds: ['Side Missions'], text: 'Complete the strands for Andy, Kenton, Billy, Randy and Tyrone, Bret\'s hunting strand, and any two more to close out Strangers & Freaks. Strand finales are one-way story beats: keep a manual save before a mission that feels like an ending.' },
  { title: 'Stage 3 — See all of Leonida', kinds: ['World & Collectibles'], text: 'Explore all 52 areas, finish the meditation spots, the WAiNK locations, three card sets, 100 discovered vehicles and the Scooter Bros registrations. These are travel trophies — one slow circuit of the map with the checklist open clears most of them together.' },
  { title: 'Stage 4 — Activities & challenges', kinds: ['Activities'], text: '250 stunts, gold in all 42 shooting-range challenges, a drone-race win at all 14 Top Fun locations, 20 different race wins, every activity type tried once, Cal beaten at fishing, one arcade game finished, and 50 challenges. The range golds are the skill gate of the list; everything else is volume.' },
  { title: 'Stage 5 — Crime spree', kinds: ['Crime & Combat'], text: 'Five bank vaults with clean escapes, an armored truck, a jewelry store taken silently, one illegal operation per gang, five takedowns in a single Combat Focus, and the two partner trophies. The robberies feed Marked Bills to the money stage, so run this before Stage 6.' },
  { title: 'Stage 6 — Money & property', kinds: ['Money & Property'], text: '$250,000 of Marked Bills laundered through your contacts, $100,000 spent across shops, and all 8 garages bought. If the laundering counter lags, the vaults and gang operations of Stage 5 are the fastest earners.' },
  { title: 'Stage 7 — One-off moments', kinds: ['Moments'], text: 'The single-action trophies: a cocktail on Ocean Beach, a showroom exit through the glass, the bowling follow-through, the VCIA departure, the Rhino, the melee drive-by — plus the hidden story-moment trophies, which are earned by playing and cannot be hunted directly. Several descriptions are all anyone has to go on; each guide page says plainly what is confirmed and what is not.' },
  { title: 'Stage 8 — The 100% push', kinds: ['Completion'], text: 'A Long Road, then the platinum itself. When the counter stalls in the high nineties, the gap is a collectible set or a skipped challenge — the Remaining filter on the checklist finds it faster than any map sweep. Community estimates put a full platinum run near 200 hours; treat that as an estimate, not a promise.' },
];

function roadmapView() {
  view.innerHTML = `
    <div class="panel">
      <h2>Roadmap to the platinum</h2>
      <p>Eight stages, built from the official trophy descriptions: story first (it unlocks the map and the activities), strands and world next, the grind in the middle, and the 100% push last. There are no online trophies and — as far as anyone can confirm at launch — no hard missables; the one flagged trophy and the save habits that cover it are on the Missables page.</p>
      <p class="muted small">Difficulty and time are community estimates at launch (the story alone is reported at roughly 50–60 hours). This roadmap claims nothing it cannot point to: every stage below is a grouping of the official list, and each trophy's own page cites its sources.</p>
    </div>
    ${STAGES.map((s) => {
      const items = TROPHIES.filter((t) => s.kinds.includes(t.kind));
      const done = items.filter((t) => state.earned[t.id]).length;
      return `<div class="panel stage">
        <div class="stage-head"><h3>${esc(s.title)}</h3><span class="chip">${done}/${items.length} earned</span></div>
        <p>${esc(s.text)}</p>
        <div class="chips">${items.map((t) => `<a class="chip ${state.earned[t.id] ? 'done' : ''}" href="#/trophy/${t.id}">${state.earned[t.id] ? '✓ ' : ''}${isMasked(t) ? 'Hidden trophy' : esc(t.name)}</a>`).join('')}</div>
      </div>`;
    }).join('')}`;
}

function missablesView() {
  const flagged = TROPHIES.filter((t) => t.missable);
  const moments = TROPHIES.filter((t) => t.kind === 'Moments' && t.hidden);
  view.innerHTML = `
    <div class="panel">
      <h2>Missables — the honest version</h2>
      <p><strong>No trophy in this list is confirmed missable.</strong> That is the launch position across the community guides we checked (PowerPyx and GTABase among them), and this page will not pretend otherwise. One trophy is <em>reported</em> as possibly missable, and a handful of hidden story moments cannot be re-triggered on demand — both are cheap to cover with one habit: <strong>keep a manual save before the endgame, and before any mission that feels like a finale.</strong></p>
      <h3>Flagged: possibly missable (unconfirmed)</h3>
      ${flagged.map((t) => cardHTML(t)).join('')}
      <p class="small muted">Why flagged: the meditation spots are spread across a map that changes as the story advances, and launch-week guides could not confirm that every spot stays reachable forever. Meditating at each spot on first visit removes the risk entirely.</p>
      <h3>One-off story moments — cannot be hunted, only met</h3>
      <p>These hidden trophies hang on single moments rather than repeatable activities. Their guides say what is known and what is not; none of them is confirmed missable, and the pre-endgame save covers the worst case.</p>
      ${moments.map((t) => cardHTML(t)).join('')}
    </div>`;
}

function nextView() {
  const remaining = TROPHIES.filter((t) => !state.earned[t.id] && t.id !== 1);
  const counters = remaining
    .filter((t) => t.target && (state.counts[t.id] || 0) > 0)
    .sort((a, b) => (state.counts[b.id] / b.target) - (state.counts[a.id] / a.target))
    .slice(0, 5);
  const fresh = remaining.filter((t) => t.target && !(state.counts[t.id] > 0)).slice(0, 3);
  const story = remaining.filter((t) => t.kind === 'Story').slice(0, 3);
  const moments = remaining.filter((t) => t.kind === 'Moments' && !t.target).slice(0, 5);
  const row = (t, why) => `<article class="trophy ${state.earned[t.id] ? 'earned' : ''}">
      <label class="check"><input type="checkbox" data-earn="${t.id}" ${state.earned[t.id] ? 'checked' : ''}></label>
      <div><h3>${isMasked(t) ? 'Hidden trophy' : esc(t.name)}</h3><p class="desc">${esc(why)}</p><div class="meta">${metaChips(t)}</div>${counterHTML(t)}</div>
      <div class="side"><a class="btn" href="#/trophy/${t.id}">Guide →</a></div>
    </article>`;
  view.innerHTML = `
    <div class="panel"><h2>Next up</h2>
    <p class="muted">Suggested from your own progress: the counters closest to finishing first, then the story's next steps and the one-off moments you can grab any time.</p></div>
    ${counters.length ? `<h3 class="serif" style="margin:14px 2px 8px">Closest to done</h3>` + counters.map((t) => row(t, `${fmt(state.counts[t.id] || 0)} of ${fmt(t.target)} — ${Math.round(((state.counts[t.id] || 0) / t.target) * 100)}% there.`)).join('') : ''}
    ${story.length ? `<h3 class="serif" style="margin:14px 2px 8px">Story, in order</h3>` + story.map((t) => row(t, 'Next story trophies in the official order — unmissable, earned by playing on.')).join('') : ''}
    ${moments.length ? `<h3 class="serif" style="margin:14px 2px 8px">One-off moments</h3>` + moments.map((t) => row(t, 'A single action or encounter — see its guide page for what is confirmed.')).join('') : ''}
    ${fresh.length ? `<h3 class="serif" style="margin:14px 2px 8px">Counters not started</h3>` + fresh.map((t) => row(t, `Counts to ${fmt(t.target)} — start the habit early and it never becomes a grind.`)).join('') : ''}
    ${!remaining.length ? '<div class="panel"><p>Everything is earned — the platinum is yours. Leonida Legend indeed.</p></div>' : ''}`;
}

function saveView() {
  view.innerHTML = `<div class="panel">
    <h2>Save &amp; settings</h2>
    <p>Your progress — earned trophies, counters and notes — is stored in this browser's localStorage and nowhere else. Export it to move it to another browser or keep a backup; import restores it.</p>
    <p>
      <button type="button" id="export" class="primary">Export progress (JSON)</button>
      <label class="btn" style="display:inline-block">Import progress <input type="file" id="import" accept="application/json" hidden></label>
      <button type="button" id="reset">Reset everything</button>
    </p>
    <p id="save-msg" class="muted small"></p>
    <h3>Spoiler guard</h3>
    <label class="switch"><input type="checkbox" id="spoilers" ${state.settings.spoilers ? 'checked' : ''}> Hide hidden trophies until earned</label>
    <p class="muted small">28 of the 55 trophies are hidden on PSN until they are earned. With the guard on, an unearned hidden trophy shows as “Hidden trophy” — no name, no description — until you earn it or reveal it from its guide page.</p>
    <h3>About this guide</h3>
    <p class="small">Vice Platinum is a free, open-source, fan-made tracker. The trophy list is the official PlayStation 5 list for Grand Theft Auto VI, frozen on 2026-11-18: names, descriptions and grades via Exophase; PSN progress targets and hidden flags via PSNProfiles. Guides are original to this app, written from the official descriptions; where a trigger is unconfirmed at launch, the guide says so rather than inventing one. No Rockstar artwork or logos are used. Not affiliated with Rockstar Games or Take-Two Interactive.</p>
  </div>`;
  document.getElementById('export').addEventListener('click', () => {
    const blob = new Blob([store.exportJSON(state)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vice-platinum-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
    document.getElementById('save-msg').textContent = 'Exported.';
  });
  document.getElementById('import').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      state = store.importJSON(await f.text());
      persist();
      document.getElementById('save-msg').textContent = 'Progress imported.';
      render();
    } catch {
      document.getElementById('save-msg').textContent = 'That file is not a Vice Platinum progress export.';
    }
  });
  document.getElementById('reset').addEventListener('click', () => {
    if (confirm('Clear all earned trophies, counters and notes?')) {
      state = store.reset();
      persist();
      render();
    }
  });
  document.getElementById('spoilers').addEventListener('change', (e) => {
    state.settings.spoilers = e.target.checked;
    persist();
  });
}

/* ---------------- routing & events ---------------- */

function render() {
  const hash = location.hash || '#/checklist';
  const tab = hash.startsWith('#/trophy/') ? 'checklist' : (hash.replace('#/', '') || 'checklist');
  document.querySelectorAll('.tabs a').forEach((a) => a.classList.toggle('active', a.dataset.tab === tab));
  renderHeader();
  if (hash.startsWith('#/trophy/')) trophyView(hash.split('/')[2]);
  else if (hash === '#/roadmap') roadmapView();
  else if (hash === '#/missables') missablesView();
  else if (hash === '#/next') nextView();
  else if (hash === '#/save') saveView();
  else checklistView();
  window.scrollTo(0, 0);
}

view.addEventListener('click', (e) => {
  const countBtn = e.target.closest('[data-count]');
  if (countBtn) {
    const [id, delta] = countBtn.dataset.count.split('|');
    const t = byId(id);
    const cur = state.counts[t.id] || 0;
    state.counts[t.id] = Math.max(0, Math.min(t.target || 0, cur + Number(delta)));
    if (t.target && state.counts[t.id] >= t.target) state.earned[t.id] = true;
    persist();
    render();
    return;
  }
  const revealBtn = e.target.closest('[data-reveal]');
  if (revealBtn) { revealed.add(Number(revealBtn.dataset.reveal)); render(); return; }
  const toggleBtn = e.target.closest('[data-toggle-earn]');
  if (toggleBtn) {
    const id = Number(toggleBtn.dataset.toggleEarn);
    state.earned[id] = !state.earned[id];
    persist();
    render();
  }
});

view.addEventListener('change', (e) => {
  const box = e.target.closest('[data-earn]');
  if (box) {
    state.earned[Number(box.dataset.earn)] = box.checked;
    persist();
    render();
  }
});

window.addEventListener('hashchange', render);

fetch('data/trophies.json')
  .then((r) => r.json())
  .then((j) => { TROPHIES = j.trophies; render(); })
  .catch(() => { view.innerHTML = '<div class="panel"><p>Could not load data/trophies.json — serve the app/ folder with any static file server (for example <code>node serve.ts</code> from the repository root) and reload.</p></div>'; });
