import { test, describe } from 'node:test';
import assert from 'node:assert';
import { parseMvtFolder } from '../../src/parser/node.js';
import { parseCsv } from '../../src/parser/mvt.js';

describe('MVT Parser', () => {
  describe('parseMvtFolder', () => {
    test('should parse ios_backup_sample correctly', async () => {
      const result = await parseMvtFolder('tests/sample-mvt-data/ios_backup_sample');
      
      // Check timeline has 5 rows
      assert.strictEqual(result.timeline.length, 5, 'Expected 5 timeline rows');
      
      // Check 3 are suspicious (matching detected timeline)
      const suspiciousCount = result.timeline.filter(r => r.label === 'suspicious (IOC match)').length;
      assert.strictEqual(suspiciousCount, 3, 'Expected 3 suspicious rows');
      
      // Check modules has sms, safari_history, datausage
      assert.strictEqual(result.modules.sms.length, 2, 'Expected 2 sms entries');
      assert.strictEqual(result.modules.safari_history.length, 2, 'Expected 2 safari_history entries');
      assert.strictEqual(result.modules.datausage.length, 1, 'Expected 1 datausage entry');
      
      // Check detected has 3 keys
      assert.strictEqual(Object.keys(result.detected).length, 3, 'Expected 3 detected keys');
      assert.strictEqual(result.detected.sms.length, 1, 'Expected 1 sms_detected entry');
      assert.strictEqual(result.detected.safari_history.length, 1, 'Expected 1 safari_history_detected entry');
      assert.strictEqual(result.detected.datausage.length, 1, 'Expected 1 datausage_detected entry');
      
      // Check info.json is parsed
      assert.ok(result.info, 'Expected info to be parsed');
      assert.strictEqual(result.info.mvt_version, '2.x (sample)', 'Expected mvt_version');
    });
  });

  describe('parseCsv', () => {
    test('should parse a CSV with quoted comma', () => {
      const csv = '"Name","Description"\n"John, Jr.","Said ""hi"""\n"Jane","A simple name"\n';
      const [header, ...rows] = parseCsv(csv);

      assert.deepStrictEqual(header, ["Name", "Description"]);
      assert.strictEqual(rows.length, 2, "Expected 2 data rows");
      assert.strictEqual(rows[0][0], "John, Jr.", "Quoted comma stays in field");
      assert.strictEqual(rows[0][1], "Said \"hi\"", "Doubled quotes unescape");
      assert.deepStrictEqual(rows[1], ["Jane", "A simple name"]);
    });
  });
});
