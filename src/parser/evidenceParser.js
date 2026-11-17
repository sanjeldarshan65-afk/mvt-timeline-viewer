import { mvtSchema, graphiteIndicators } from './mvtSchema.js';

/**
 * Evidence Parser for MVT Results
 * 
 * Parses MVT JSON results and categorizes them by:
 * - Confirmed: Strong evidence of Graphite/Paragon compromise
 * - Suspicious: Potential indicators needing verification
 * - Insufficient: Limited/no indicator found
 * 
 * @module EvidenceParser
 * @example
 *   const parser = new EvidenceParser();
 *   const results = await parser.parseFile('mvt_results.json');
 */

class EvidenceParser {
  constructor() {
    this.confidenceLevels = {
      CONFIRMED: {
        label: 'Confirmed',
        icon: '✓',
        color: '#10b981', // emerald-500
        description: 'Strong evidence of compromise'
      },
      SUSPICIOUS: {
        label: 'Suspicious',
        icon: '⚠',
        color: '#f59e0b', // amber-500
        description: 'Potential indicator needing verification'
      },
      INSUFFICIENT: {
        label: 'Insufficient',
        icon: '🔍',
        color: '#6b7280', // gray-500
        description: 'Limited or no indicator found'
      }
    };
  }

  /**
   * Parse MVT JSON file
   * 
   * @param {string} filePath - Path to MVT results JSON file
   * @param {object} options - Parsing options
   * @returns {Promise<object>} Parsed evidence with categorization
   */
  async parseFile(filePath, options = {}) {
    // Load raw data - support both file paths and direct content
    let rawData;
    if (options.content) {
      rawData = options.content;
    } else {
      rawData = await this.loadFile(filePath);
    }

    const parsed = {
      meta: {
        source: filePath,
        parsedAt: new Date().toISOString(),
        totalEntries: 0,
        breakdown: {
          confirmed: 0,
          suspicious: 0,
          insufficient: 0
        }
      },
      devices: {},
      reports: []
    };

    // Handle root-level structure
    if (rawData.reports && Array.isArray(rawData.reports)) {
      console.log(`Found ${rawData.reports.length} reports in file`);
      for (const reportFile of rawData.reports) {
        const reportData = await this.parseReport(reportFile);
        parsed.reports.push(reportData);
        this.aggregateByDevice(parsed, reportData);
      }
    } else if (rawData.device_info) {
      // Single device info
      parsed.meta.device = rawData.device_info;
    } else {
      console.log('No reports or device_info found in data structure');
    }

    parsed.meta.totalEntries = parsed.reports.reduce(
      (sum, r) => sum + r.totalEntries, 0
    );

    return parsed;
  }

  /**
   * Parse individual MVT report
   * 
   * @param {object} reportFile - Report file object from the reports array (has source, filename, report_data fields)
   * @returns {object} Parsed report data
   */
  async parseReport(reportFile) {
    // Extract filename from report file object
    const filename = reportFile.source || reportFile.filename || 'unknown_report.json';
    
    // Load report data from parent file
    const content = await this.loadReportContent(filename, reportFile.report_data);
    
    const reportType = this.extractReportType(filename);
    const reportData = this.extractReportData(content, reportType);
    
    // Categorize each entry - pass the entries/fields array directly
    let entriesArray;
    if (reportType === 'gallery') {
      entriesArray = reportData.entries || [];
    } else if (reportType === 'exif') {
      entriesArray = reportData.fields || [];
    } else if (reportType === 'unknown') {
      // For unknown/other types, try to get entries from report_data directly
      const reportDataObj = content.report_data;
      if (reportDataObj && !Array.isArray(reportDataObj)) {
        entriesArray = [reportDataObj]; // Single object
      } else {
        entriesArray = Array.isArray(reportDataObj) ? reportDataObj : [];
      }
    } else {
      entriesArray = [];
    }
    
    const categorizedEntries = this.categorizeEntries(entriesArray, reportType);

    return {
      ...reportData,
      reportType,
      categorizedEntries,
      totalEntries: categorizedEntries.length
    };
  }

  /**
   * Categorize MVT report entries by confidence level
   * 
   * @param {Array|object} entries - Raw MVT entries (array or single entry object)
   * @param {string} reportType - Type of report (exif, gallery, meta, etc.)
   * @returns {Array} Categorized entries
   */
  categorizeEntries(entries, reportType) {
    // Handle both array and single entry
    const entryList = Array.isArray(entries) ? entries : [entries];
    
    const categorized = entryList.map(entry => {
      let category = this.determineCategory(entry, reportType);
      
      return {
        ...entry,
        category,
        confidenceLevel: this.confidenceLevels[category]
      };
    });

    return categorized;
  }

  /**
   * Determine category for a single entry
   */
  determineCategory(entry, reportType) {
    // Known confirmed indicators (Graphite/Paragon)
    const confirmedPatterns = [
      { pattern: /bigpretzel/i, level: 'CONFIRMED' },
      { pattern: /graphite/i, level: 'CONFIRMED' },
      { pattern: /paragon/i, level: 'CONFIRMED' },
      { pattern: /cve-2025-43200/i, level: 'CONFIRMED' }
    ];

    for (const p of confirmedPatterns) {
      if (p.pattern.test(JSON.stringify(entry))) {
        return p.level;
      }
    }

    // Messaging activity (WhatsApp/Signal chats)
    if (reportType === 'gallery' && (entry.chat_id || entry.sender)) {
      // Check for Graphite-like indicators
      const hasKeywords = Array.isArray(entry.keywords);
      const hasCallId = !!entry.call_id;
      
      if (hasKeywords || hasCallId) {
        return 'SUSPICIOUS'; // Messaging activity is suspicious until confirmed
      }
    }

    // EXIF reports - usually just metadata unless suspicious values
    if (reportType === 'exif') {
      return 'INSUFFICIENT';
    }

    // Default: insufficient
    return 'INSUFFICIENT';
  }

  /**
   * Extract report type from filename
   */
  extractReportType(filename) {
    // Remove .json extension and match report type
    const baseName = filename.replace(/\.json$/, '');
    
    const typeMap = {
      'exif_report': 'exif',
      'gallery_report': 'gallery',
      'meta_report': 'meta',
      'photos_report': 'photos',
      'videos_report': 'videos',
      'contacts_report': 'contacts',
      'bigpretzel_artifact': 'bigpretzel',
      'ios_device_meta': 'ios_meta',
      'cve_2025_43200_artifact': 'cve'
    };

    return typeMap[baseName] || 'unknown';
  }

  /**
   * Extract report data based on type
   */
  extractReportData(content, reportType) {
    // Simplified extraction - in production, parse vendor-specific formats
    const baseData = {
      source: content.source,
      date: content.date,
      device_path: content.device_path || null,
      filename: content.filename || null
    };

    if (reportType === 'exif') {
      const fields = content.report_data?.fields || [];
      return { ...baseData, fields };
    } else if (reportType === 'gallery') {
      const entries = content.report_data?.entries || [];
      return { ...baseData, entries };
    }

    // For other report types, return report_data as-is
    return { ...baseData, report_data: content.report_data };
  }

  /**
   * Aggregate parsed data by device
   */
  aggregateByDevice(parsed, reportData) {
    const deviceId = reportData.device_info?.android_id || 
                     reportData.device_info?.device_id || 
                     'unknown';
    
    if (!parsed.devices[deviceId]) {
      parsed.devices[deviceId] = {
        device_info: reportData.device_info,
        reports: []
      };
    }
    
    parsed.devices[deviceId].reports.push(reportData);
    
    // Update the breakdown counts
    for (const categorizedEntry of reportData.categorizedEntries) {
      const category = categorizedEntry.category.toLowerCase();
      if (parsed.meta.breakdown[category] !== undefined) {
        parsed.meta.breakdown[category]++;
      }
    }
  }

  /**
   * Generate summary report
   */
  generateSummary(parsed) {
    const summary = {
      totalDevices: Object.keys(parsed.devices).length,
      totalFindings: parsed.meta.totalEntries,
      breakdown: parsed.meta.breakdown
    };

    // Find most suspicious device
    let mostSuspicious = null;
    let maxSuspicious = 0;

    for (const deviceId of Object.keys(parsed.devices)) {
      const device = parsed.devices[deviceId];
      const suspiciousCount = device.reports.reduce((sum, r) => {
        const conf = r.categorizedEntries.reduce((s, e) => s + (e.category === 'SUSPICIOUS' ? 1 : 0), 0);
        return sum + conf;
      }, 0);
      
      if (suspiciousCount > maxSuspicious) {
        maxSuspicious = suspiciousCount;
        mostSuspicious = deviceId;
      }
    }

    if (mostSuspicious) {
      summary.mostSuspiciousDevice = mostSuspicious;
    }

    return summary;
  }

  /**
   * Helper: Load file from filesystem
   */
  async loadFile(filePath) {
    // Use fs to read actual file
    const fs = await import('fs');
    const path = await import('path');
    return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'));
  }

  /**
   * Helper: Load report content
   * 
   * @param {string} filename - Report filename (e.g., "gallery_report.json")
   * @param {object} reportData - Report data from parent file (e.g., content.report_data)
   * @returns {object} Extracted report data
   */
  async loadReportContent(filename, reportData) {
    // Return the report data from the reportFile parameter
    // which should have report_data field
    return { source: filename, report_data: reportData };
  }
}

export default EvidenceParser;
export { EvidenceParser, mvtSchema, graphiteIndicators };
