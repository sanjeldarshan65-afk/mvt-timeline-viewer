/**
 * Writes a FAKE MVT results folder for tests and demos.
 * Layout mirrors `mvt-ios check-backup --output <dir>`:
 *   <module>.json            records a module extracted (context)
 *   <module>_detected.json   records that matched an IOC (suspicious)
 *   timeline.csv             all records as events
 *   timeline_detected.csv    only IOC-matched events
 *   info.json, command.log   run metadata
 * All data is invented. Indicator domains use the reserved .example TLD.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'sample-mvt-data', 'ios_backup_sample');

const sms = [
  { isodate: '2025-01-28 09:14:02.000000', direction: 'received', phone_number: '+15550100001', text: 'Lunch at 1?', links: [] },
  { isodate: '2025-01-29 22:41:57.000000', direction: 'received', phone_number: '+15550100002', text: 'Your parcel is held: https://track-parcel.example/a1', links: ['https://track-parcel.example/a1'] },
];
const safari_history = [
  { isodate: '2025-01-29 22:43:10.000000', url: 'https://track-parcel.example/a1', visit_id: 41, redirect_source: null },
  { isodate: '2025-01-30 08:02:33.000000', url: 'https://news.example.org/', visit_id: 42, redirect_source: null },
];
const datausage = [
  { first_isodate: '2025-01-29 22:43:11.000000', isodate: '2025-01-29 22:44:02.000000', proc_name: 'fakeprocessd', bundle_id: '', wwan_in: 0, wwan_out: 0, wifi_in: 18234, wifi_out: 90211 },
];

const detected = {
  sms: [sms[1]],
  safari_history: [safari_history[0]],
  datausage: [datausage[0]],
};

const csvRow = (cols) => cols.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',');
const header = csvRow(['UTC Timestamp', 'Plugin', 'Event', 'Description']);
const events = [
  ['2025-01-28 09:14:02.000000', 'SMS', 'sms_received', `${sms[0].phone_number}: ${sms[0].text}`],
  ['2025-01-29 22:41:57.000000', 'SMS', 'sms_received', `${sms[1].phone_number}: ${sms[1].text}`],
  ['2025-01-29 22:43:10.000000', 'SafariHistory', 'safari_history', safari_history[0].url],
  ['2025-01-29 22:44:02.000000', 'Datausage', 'datausage', `${datausage[0].proc_name} WIFI IN: 18234, WIFI OUT: 90211`],
  ['2025-01-30 08:02:33.000000', 'SafariHistory', 'safari_history', safari_history[1].url],
];
const isDetected = (e) => /track-parcel\.example|fakeprocessd/.test(e[3]);

export function writeSample(out = OUT) {
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const w = (name, data) => fs.writeFileSync(path.join(out, name), typeof data === 'string' ? data : JSON.stringify(data, null, 4));
  w('sms.json', sms);
  w('safari_history.json', safari_history);
  w('datausage.json', datausage);
  for (const [mod, recs] of Object.entries(detected)) w(`${mod}_detected.json`, recs);
  w('timeline.csv', [header, ...events.map(csvRow)].join('\n') + '\n');
  w('timeline_detected.csv', [header, ...events.filter(isDetected).map(csvRow)].join('\n') + '\n');
  w('info.json', { mvt_version: '2.x (sample)', target_path: '/path/to/backup', date: '2025-02-01 10:00:00', ioc_files: ['sample-indicators.stix2'] });
  w('command.log', 'SAMPLE DATA - not produced by a real MVT run\n');
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) console.log('Wrote', writeSample());
