/**
 * Timeline Visualization for MVT Evidence
 * 
 * Creates chronological timeline views of forensic evidence
 * with confidence level indicators.
 * 
 * @module TimelineView
 */

import { format } from 'date-fns';

/**
 * TimelineView class
 */
class TimelineView {
  constructor(parsedData) {
    this.parsedData = parsedData;
    this.timelineEvents = [];
  }

  /**
   * Build timeline events from all reports
   */
  buildTimeline() {
    const events = [];

    // Collect all categorized entries
    for (const deviceId of Object.keys(this.parsedData.devices)) {
      const device = this.parsedData.devices[deviceId];
      
      for (const report of device.reports) {
        for (const entry of report.categorizedEntries) {
          const event = this.createEvent(entry, report, device);
          events.push(event);
        }
      }
    }

    // Sort chronologically
    this.timelineEvents = events.sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });

    return this.timelineEvents;
  }

  /**
   * Create a timeline event from an entry
   */
  createEvent(entry, report, device) {
    const timestamp = this.extractTimestamp(entry, report);
    const severity = this.getSeverity(entry);
    const categoryLabel = entry.category;
    
    return {
      id: this.generateEventId(entry, timestamp),
      timestamp,
      device: device.device_info || {},
      reportType: report.reportType,
      source: report.source,
      category: categoryLabel,
      severity,
      fields: entry.fields || entry.entries || [],
      keywords: entry.keywords || [],
      confidenceLevel: entry.confidenceLevel
    };
  }

  /**
   * Extract timestamp from entry or report
   */
  extractTimestamp(entry, report) {
    // Try to get date from entry
    if (entry.date) {
      return new Date(entry.date);
    }
    
    // Fall back to report date
    if (report.date) {
      return new Date(report.date);
    }
    
    // Default to current time
    return new Date();
  }

  /**
   * Determine severity based on category
   */
  getSeverity(entry) {
    if (entry.category === 'CONFIRMED') {
      return 'HIGH';
    } else if (entry.category === 'SUSPICIOUS') {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * Generate unique event ID
   */
  generateEventId(entry, timestamp) {
    const dateStr = timestamp.toISOString().slice(0, 19).replace(/:/g, '-');
    const indexStr = entry.device_path?.split('/').pop()?.slice(0, 10) || '0';
    return `evt_${dateStr}_${indexStr}_${Math.random().toString(36).slice(2, 7)}`;
  }

  /**
   * Generate HTML timeline
   */
  generateHTML() {
    if (this.timelineEvents.length === 0) {
      this.buildTimeline();
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Graphite Evidence Timeline</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f1f5f9;
      padding: 2rem;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #1e293b; margin-bottom: 1rem; }
    .summary {
      background: #fff;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 2rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .summary h2 { font-size: 1.2rem; margin-bottom: 0.5rem; }
    .summary p { color: #64748b; font-size: 0.9rem; }
    
    .timeline {
      position: relative;
      padding-left: 3rem;
    }
    .timeline::before {
      content: '';
      position: absolute;
      left: 1.2rem;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #e2e8f0;
    }
    .event {
      position: relative;
      margin-bottom: 1.5rem;
      background: #fff;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .event::before {
      content: '';
      position: absolute;
      left: -3.2rem;
      top: 1.2rem;
      width: 1.6rem;
      height: 1.6rem;
      border-radius: 50%;
      background: #94a3b8;
    }
    .event.confirmed::before { background: #10b981; }
    .event.suspicious::before { background: #f59e0b; }
    .event.insufficient::before { background: #6b7280; }
    
    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .event-time {
      font-size: 0.85rem;
      color: #64748b;
    }
    .event-severity {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .severity-HIGH { background: #fee2e2; color: #dc2626; }
    .severity-MEDIUM { background: #fef3c7; color: #d97706; }
    .severity-LOW { background: #e2e8f0; color: #475569; }
    
    .event-title {
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }
    .event-category {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      font-size: 0.8rem;
      margin-right: 0.5rem;
    }
    .cat-confirmed { background: #d1fae5; color: #065f46; }
    .cat-suspicious { background: #fef3c7; color: #92400e; }
    .cat-insufficient { background: #f1f5f9; color: #475569; }
    
    .event-details {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid #e2e8f0;
      font-size: 0.9rem;
      color: #64748b;
    }
    .event-detail-row {
      margin: 0.25rem 0;
    }
    .event-detail-label {
      font-weight: 600;
      color: #1e293b;
    }
    .keywords {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-top: 0.5rem;
    }
    .keyword-tag {
      background: #dbeafe;
      color: #1e40af;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.8rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Graphite Evidence Timeline</h1>
    
    <div class="summary">
      <h2>Summary</h2>
      <p>
        <strong>Total Events:</strong> ${this.timelineEvents.length || this.parsedData.meta.totalEntries}<br>
        <strong>Confirmed:</strong> ${this.timelineEvents.filter(e => e.category === 'CONFIRMED').length}<br>
        <strong>Suspicious:</strong> ${this.timelineEvents.filter(e => e.category === 'SUSPICIOUS').length}<br>
        <strong>Insufficient:</strong> ${this.timelineEvents.filter(e => e.category === 'INSUFFICIENT').length}
      </p>
    </div>

    <div class="timeline">
    ${this.timelineEvents.map(event => this.renderEvent(event)).join('')}
    </div>
  </div>
</body>
</html>`;

    return html;
  }

  /**
   * Render a single event
   */
  renderEvent(event) {
    const timeStr = format(event.timestamp, 'MMMM d, yyyy h:mm a');
    const deviceStr = event.device.model || event.device.name || 'Unknown Device';
    
    return `
      <div class="event ${event.category.toLowerCase()}">
        <div class="event-header">
          <div class="event-time">${timeStr}</div>
          <span class="event-severity severity-${event.severity}">${event.severity}</span>
        </div>
        <div class="event-title">${event.source}</div>
        <div class="event-category">
          <span class="cat-${event.category.toLowerCase()}">${event.category}</span>
          <span>${deviceStr}</span>
        </div>
        <div class="event-details">
          <div class="event-detail-row">
            <span class="event-detail-label">Report Type:</span>
            ${event.reportType}
          </div>
          ${Array.isArray(event.fields) && event.fields.length > 0 ? `
          <div class="event-detail-row">
            <span class="event-detail-label">Fields:</span>
            ${event.fields.map(f => f.field || f).join(', ')}
          </div>
          ` : ''}
          ${Array.isArray(event.keywords) && event.keywords.length > 0 ? `
          <div class="event-detail-row">
            <span class="event-detail-label">Keywords:</span>
            <div class="keywords">
              ${event.keywords.map(k => `<span class="keyword-tag">${k}</span>`).join('')}
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }
}

export default TimelineView;
