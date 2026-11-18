import { parseMvtFiles, SUSPICIOUS } from './parser/mvt.js';

const PAGE = 200;
const $ = (id) => document.getElementById(id);
const out = $('timeline');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c]);

let rows = [];      // full parsed timeline
let view = [];      // rows after filters
let shown = 0;      // how many of `view` are rendered
const filters = { suspiciousOnly: false, plugin: '', q: '' };

// ---------- loading ----------

$('loadButton').addEventListener('click', async () => {
  const files = [...$('fileInput').files].filter((f) => /\.(json|csv)$/i.test(f.name));
  if (!files.length) return message('Choose the folder MVT wrote with <code>--output</code> first.');
  message('Reading ' + files.length + ' files…');
  const entries = await Promise.all(files.map(async (f) => [f.name, await f.text()]));
  load(Object.fromEntries(entries));
});

const SAMPLE = './tests/sample-mvt-data/ios_backup_sample/';
const SAMPLE_FILES = ['info.json', 'sms.json', 'sms_detected.json', 'safari_history.json', 'safari_history_detected.json',
  'datausage.json', 'datausage_detected.json', 'timeline.csv', 'timeline_detected.csv'];
$('sampleButton').addEventListener('click', async () => {
  const entries = await Promise.all(SAMPLE_FILES.map(async (n) => [n, await (await fetch(SAMPLE + n)).text()]));
  load(Object.fromEntries(entries));
});

function load(files) {
  const result = parseMvtFiles(files);
  if (!result.timeline.length) {
    return message('No <code>timeline.csv</code> found. Pick the folder MVT wrote with <code>--output</code>.' + errors(result));
  }
  rows = result.timeline;
  Object.assign(filters, { suspiciousOnly: false, plugin: '', q: '' });
  renderShell(result);
  apply();
}

// ---------- rendering ----------

function message(html) {
  rows = [];
  out.innerHTML = '<p class="note">' + html + '</p>';
}

const errors = (r) => r.errors.length ? '<br>Skipped: ' + r.errors.map(esc).join('; ') : '';

function renderShell(result) {
  const suspicious = rows.filter((r) => r.label === SUSPICIOUS).length;
  const plugins = countBy(rows, (r) => r.plugin);
  const first = rows[0].timestamp.slice(0, 10), last = rows[rows.length - 1].timestamp.slice(0, 10);
  const days = Math.max(1, Math.round((Date.parse(last) - Date.parse(first)) / 864e5) + 1);

  out.innerHTML = `
    <div class="summary">
      ${stat(rows.length.toLocaleString(), 'events')}
      ${stat(suspicious.toLocaleString(), 'IOC matches', 'suspicious')}
      ${stat(Object.keys(result.modules).length, 'modules')}
      ${stat(Number.isNaN(days) ? '?' : days.toLocaleString() + (days === 1 ? ' day' : ' days'), esc(first) + ' → ' + esc(last))}
    </div>
    ${suspicious ? '' : '<p class="note">No events matched an indicator. That is not proof the device is clean.</p>'}
    <div class="filters" role="search">
      <div class="seg" role="group" aria-label="Show">
        <button type="button" data-susp="0" aria-pressed="true">All</button>
        <button type="button" data-susp="1" aria-pressed="false">Suspicious only</button>
      </div>
      <select id="pluginFilter" aria-label="Filter by module">
        <option value="">All modules</option>
        ${Object.entries(plugins).sort((a, b) => b[1] - a[1]).map(([p, n]) => `<option value="${esc(p)}">${esc(p)} (${n})</option>`).join('')}
      </select>
      <input id="search" type="search" placeholder="Search events, URLs, numbers…" aria-label="Search">
      <span id="count" class="count" aria-live="polite"></span>
    </div>
    <div class="timeline" id="rows"></div>
    <button id="more" class="btn btn-ghost more" type="button" hidden></button>
    ${result.errors.length ? '<p class="note">' + errors(result).slice(4) + '</p>' : ''}`;

  out.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => {
    filters.suspiciousOnly = b.dataset.susp === '1';
    out.querySelectorAll('.seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    apply();
  }));
  $('pluginFilter').addEventListener('change', (e) => { filters.plugin = e.target.value; apply(); });
  let t;
  $('search').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { filters.q = e.target.value.trim().toLowerCase(); apply(); }, 150); });
  $('more').addEventListener('click', () => renderPage());
}

function apply() {
  const { suspiciousOnly, plugin, q } = filters;
  view = rows.filter((r) =>
    (!suspiciousOnly || r.label === SUSPICIOUS) &&
    (!plugin || r.plugin === plugin) &&
    (!q || (r.event + ' ' + r.description + ' ' + r.plugin).toLowerCase().includes(q)));
  shown = 0;
  $('rows').innerHTML = view.length ? '' : '<p class="note">No events match these filters.</p>';
  renderPage();
}

function renderPage() {
  const next = view.slice(shown, shown + PAGE);
  $('rows').insertAdjacentHTML('beforeend', next.map(row).join(''));
  shown += next.length;
  $('count').textContent = `Showing ${shown.toLocaleString()} of ${view.length.toLocaleString()}`;
  const left = view.length - shown;
  $('more').hidden = left <= 0;
  $('more').textContent = `Show ${Math.min(PAGE, left).toLocaleString()} more`;
}

function row(r) {
  const s = r.label === SUSPICIOUS;
  return `<div class="event${s ? ' suspicious' : ''}">
    <div><div class="event-time">${esc(r.timestamp)}</div><div class="event-plugin">${esc(r.plugin)}</div></div>
    <div><div class="event-title">${esc(r.event)} <span class="label${s ? ' suspicious' : ''}">${esc(r.label)}</span></div>
    <div class="event-desc">${esc(r.description)}</div></div></div>`;
}

const stat = (num, label, cls = '') => `<div class="stat ${cls}"><div class="stat-num">${num}</div><div class="stat-label">${label}</div></div>`;

function countBy(list, key) {
  const m = {};
  for (const x of list) m[key(x)] = (m[key(x)] || 0) + 1;
  return m;
}
