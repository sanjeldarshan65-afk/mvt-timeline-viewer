/**
 * Unit tests for EvidenceParser
 */

import EvidenceParser from '../../src/parser/evidenceParser.js';

describe('EvidenceParser', () => {
  let parser;

  beforeEach(() => {
    parser = new EvidenceParser();
  });

  describe('categorizeEntries', () => {
    test('should categorize confirmed Graphite artifact', () => {
      const entry = {
        device_path: '/data/data/com.graphite.forensic/files/',
        filename: 'BIGPRETZEL_artifact.json',
        report_data: {
          binary_name: 'BIGPRETZEL',
          category: 'CONFIRMED'
        }
      };

      const result = parser.categorizeEntries([entry], 'meta');
      
      expect(result[0].category).toBe('CONFIRMED');
      expect(result[0].confidenceLevel.label).toBe('Confirmed');
    });

    test('should categorize suspicious messaging activity', () => {
      const entry = {
        device_path: '/storage/emulated/0/WhatsApp/Media/',
        filename: 'gallery_report.json',
        report_data: {
          entries: [
            {
              chat_id: '123456789012345678',
              sender: 'Unknown',
              keywords: ['meeting', 'urgent']
            }
          ]
        }
      };

      const result = parser.categorizeEntries(entry.report_data.entries, 'gallery');
      
      expect(result[0].category).toBe('SUSPICIOUS');
      expect(result[0].confidenceLevel.label).toBe('Suspicious');
    });

    test('should categorize insufficient EXIF data', () => {
      const entry = {
        device_path: '/storage/emulated/0/DCIM/Camera/',
        filename: 'IMG_20240515_103045.jpg',
        report_data: {
          fields: [
            { field: 'make', value: 'Samsung' },
            { field: 'model', value: 'SM-G991B' }
          ]
        }
      };

      const result = parser.categorizeEntries(entry.report_data.fields, 'exif');
      
      expect(result[0].category).toBe('INSUFFICIENT');
      expect(result[0].confidenceLevel.label).toBe('Insufficient');
    });

    test('should handle CVE-2025-43200 indicator', () => {
      const entry = {
        device_path: '/var/mobile/Containers/Data/Application/',
        filename: 'CVE-2025-43200_Artifact.json',
        report_data: {
          vulnerability_id: 'CVE-2025-43200',
          category: 'CONFIRMED'
        }
      };

      const result = parser.categorizeEntries([entry], 'meta');
      
      expect(result[0].category).toBe('CONFIRMED');
    });
  });

  describe('extractReportType', () => {
    test('should recognize exif report type', () => {
      expect(parser.extractReportType('exif_report.json')).toBe('exif');
    });

    test('should recognize gallery report type', () => {
      expect(parser.extractReportType('gallery_report.json')).toBe('gallery');
    });

    test('should recognize meta report type', () => {
      expect(parser.extractReportType('meta_report.json')).toBe('meta');
    });

    test('should handle unknown report type', () => {
      expect(parser.extractReportType('unknown_report.json')).toBe('unknown');
    });
  });
});
