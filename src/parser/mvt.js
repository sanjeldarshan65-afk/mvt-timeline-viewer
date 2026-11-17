/**
 * Pure parser for an MVT `--output` folder. No fs: pass {filename: textContent}.
 * Works the same in the browser (file.text()) and in Node (see ./node.js).
 */

export const SUSPICIOUS = 'suspicious (IOC match)';
export const CONTEXT = 'context';

/** RFC 4180-style CSV: quoted fields, commas/newlines inside quotes, "" escapes. */
export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== '')) rows.push(row);
  return rows;
}

/** MVT timeline CSV -> [{timestamp, plugin, event, description}] keyed by header name. */
function parseTimeline(text) {
  const [header = [], ...rows] = parseCsv(text);
  const col = (name) => header.indexOf(name);
  const idx = { timestamp: col('UTC Timestamp'), plugin: col('Plugin'), event: col('Event'), description: col('Description') };
  return rows.map((r) => Object.fromEntries(Object.entries(idx).map(([k, i]) => [k, i >= 0 ? r[i] ?? '' : ''])));
}

const rowKey = (r) => [r.timestamp, r.plugin, r.event, r.description].join('\u0000');
const baseName = (path) => path.split(/[\\/]/).pop();

export function parseMvtFiles(files) {
  const result = { info: null, modules: {}, detected: {}, timeline: [], errors: [] };
  let timelineText = null, detectedText = null;

  for (const [path, text] of Object.entries(files)) {
    const name = baseName(path);
    if (name === 'timeline.csv') { timelineText = text; continue; }
    if (name === 'timeline_detected.csv') { detectedText = text; continue; }
    if (!name.endsWith('.json')) continue;
    let data;
    try { data = JSON.parse(text); } catch (e) { result.errors.push(`${name}: ${e.message}`); continue; }
    if (name === 'info.json') result.info = data;
    else if (name.endsWith('_detected.json')) result.detected[name.slice(0, -'_detected.json'.length)] = data;
    else result.modules[name.slice(0, -'.json'.length)] = data;
  }

  const flagged = new Set(detectedText ? parseTimeline(detectedText).map(rowKey) : []);
  if (timelineText) {
    result.timeline = parseTimeline(timelineText)
      .map((r) => ({ ...r, label: flagged.has(rowKey(r)) ? SUSPICIOUS : CONTEXT }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }
  return result;
}
