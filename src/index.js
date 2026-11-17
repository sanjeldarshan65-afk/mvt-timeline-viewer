/**
 * Graphite Evidence Viewer - Main Entry Point
 */

import EvidenceParser from './parser/evidenceParser.js';
import TimelineView from './timeline/TimelineView.js';

/**
 * Main class for Graphite Evidence Viewer
 */
class GraphiteEvidenceViewer {
  constructor() {
    this.parser = new EvidenceParser();
    this.timelineView = null;
    this.parsedData = null;
  }

  /**
   * Load and parse MVT results from a file
   * 
   * @param {string} filePath - Path to MVT results JSON file
   * @returns {Promise<object>} Parsed evidence data
   */
  async loadFile(filePath) {
    this.parsedData = await this.parser.parseFile(filePath);
    this.timelineView = new TimelineView(this.parsedData);
    this.timelineView.buildTimeline();
    
    return this.parsedData;
  }

  /**
   * Get timeline HTML
   * 
   * @returns {string} HTML string for timeline visualization
   */
  getTimelineHTML() {
    return this.timelineView.generateHTML();
  }

  /**
   * Get summary report
   * 
   * @returns {object} Summary of findings
   */
  getSummary() {
    return this.parser.generateSummary(this.parsedData);
  }

  /**
   * Export as Markdown report
   * 
   * @returns {string} Markdown report
   */
  exportMarkdown() {
    if (!this.parsedData) {
      throw new Error('No data loaded. Use loadFile() first.');
    }

    const summary = this.getSummary();
    
    let md = `# Graphite Evidence Report\n\n`;
    md += `## Summary\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Devices | ${summary.totalDevices} |`;
    md += `\n| Findings | ${summary.totalFindings} |`;
    md += `\n| Confirmed | ${summary.breakdown.confirmed} |`;
    md += `\n| Suspicious | ${summary.breakdown.suspicious} |`;
    md += `\n| Insufficient | ${summary.breakdown.insufficient} |`;
    
    if (summary.mostSuspiciousDevice) {
      md += `\n## Highest Risk Device\n\n`;
      md += `*Device ID:* ${summary.mostSuspiciousDevice}\n\n`;
    }
    
    md += `## Timeline\n\n`;
    
    // Add timeline events
    for (const event of this.timelineView.timelineEvents) {
      md += `### ${format(event.timestamp, 'PPPP p')}\n\n`;
      md += `**Severity:** ${event.severity} | **Category:** ${event.category}\n\n`;
      md += `${event.source}\n\n`;
      
      if (event.keywords && event.keywords.length > 0) {
        md += `*Keywords:* ${event.keywords.join(', ')}\n\n`;
      }
      
      md += `---\n\n`;
    }
    
    return md;
  }
}

export default GraphiteEvidenceViewer;
