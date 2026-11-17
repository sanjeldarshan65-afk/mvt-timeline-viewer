# Graphite Evidence Viewer API

## Overview

This API documentation describes how to use the Graphite Evidence Viewer to parse MVT (Mobile Verification Toolkit) results and visualize forensic evidence from Graphite/Paragon spyware investigations.

## Classes

### `GraphiteEvidenceViewer`

Main class for loading, parsing, and visualizing MVT evidence.

```javascript
import GraphiteEvidenceViewer from './src/index.js';

const viewer = new GraphiteEvidenceViewer();
```

#### Methods

##### `loadFile(filePath, options)`

Load and parse an MVT JSON file.

**Parameters:**
- `filePath` (string): Path to MVT results JSON file
- `options` (object, optional): Parsing options
  - `content` (object): Raw JSON content (useful for testing)
  - `customIndicators` (array, optional): Custom Graphite indicators to detect

**Returns:** `Promise<object>` - Parsed evidence data with structure:
```javascript
{
  meta: {
    source: string,
    parsedAt: string,
    totalEntries: number,
    breakdown: {
      confirmed: number,
      suspicious: number,
      insufficient: number
    }
  },
  devices: {
    [deviceId]: {
      device_info: object,
      reports: Array
    }
  },
  reports: Array
}
```

##### `getTimelineHTML()`

Generate HTML for the timeline visualization.

**Returns:** `string` - Complete HTML document with inline styles

##### `getSummary()`

Get summary statistics of the loaded data.

**Returns:** `object`
```javascript
{
  totalDevices: number,
  totalFindings: number,
  breakdown: {
    confirmed: number,
    suspicious: number,
    insufficient: number
  },
  mostSuspiciousDevice: string (optional)
}
```

##### `exportMarkdown()`

Export the evidence as a Markdown report.

**Returns:** `string` - Markdown-formatted report

---

### `EvidenceParser`

Lower-level class for parsing MVT JSON files.

```javascript
import EvidenceParser from './src/parser/evidenceParser.js';

const parser = new EvidenceParser();
```

#### Methods

##### `parseFile(filePath, options)`

Parse MVT JSON file.

**Parameters:**
- `filePath` (string): Path to MVT results JSON file
- `options` (object, optional):
  - `content` (object): Raw JSON content
  - `customIndicators` (array): Custom indicators

**Returns:** `Promise<object>` - Parsed evidence

##### `parseReport(reportFile)`

Parse individual MVT report.

**Parameters:**
- `reportFile` (string): Report filename

**Returns:** `object` - Parsed report data

##### `categorizeEntries(entries, reportType)`

Categorize report entries by confidence level.

**Parameters:**
- `entries` (array): Raw MVT entries
- `reportType` (string): Report type (exif, gallery, meta, etc.)

**Returns:** `array` - Categorized entries

##### `determineCategory(entry, reportType)`

Determine category for a single entry.

**Returns:** `string` - 'CONFIRMED', 'SUSPICIOUS', or 'INSUFFICIENT'

---

### `TimelineView`

Create timeline visualizations from parsed data.

```javascript
import TimelineView from './src/timeline/TimelineView.js';

const timelineView = new TimelineView(parsedData);
```

#### Methods

##### `buildTimeline()`

Build the timeline event list.

**Returns:** `array` - Sorted timeline events

##### `generateHTML()`

Generate HTML for the timeline.

**Returns:** `string` - Complete HTML document

---

## MVT JSON Schema

### Root Structure

```javascript
{
  device_info: {
    android_id: string,
    model: string,
    carrier: string,
    os_version: string,
    build_date: string,
    imei: string
  },
  reports: [
    {
      name: string,
      source: string,
      date: string,
      device_path: string,
      filename: string,
      device_info: object,
      report_data: object
    }
  ]
}
```

### Report Types

#### `meta_report.json`

```javascript
{
  device_info: {
    android_id: string,
    model: string,
    carrier: string,
    os_version: string
  },
  report_data: {
    android_id: string,
    model: string,
    carrier: string,
    os_version: string
  }
}
```

#### `gallery_report.json`

```javascript
{
  device_path: string,
  filename: string,
  title: string,
  date: string,
  mime_type: string,
  chat_id: string,
  sender: string,
  keywords: string[],
  category: string
}
```

#### `exif_report.json`

```javascript
{
  fields: [
    {
      device_path: string,
      filename: string,
      field: string,
      value: string
    }
  ]
}
```

---

## Known Graphite Indicators

### Confirmed Indicators

- **BIGPRETZEL**: Android forensic artifact (found on 2 devices in March 2025)
- **CVE-2025-43200**: iOS 18.2.1 zero-click vulnerability (fixed in 18.3.1)
- **Graphite/Paragon** binary names in EXIF or metadata

### Suspicious Indicators

- WhatsApp/Signal chat activity with `chat_id` or `sender` fields
- Message content with keywords (meeting, urgent, confidential, etc.)
- VoIP call records (`call_id` field)

### Insufficient Evidence

- Standard EXIF metadata (make, model, etc.)
- Generic device information without Graphite-specific indicators

---

## Example Usage

```javascript
import GraphiteEvidenceViewer from './src/index.js';

// Create viewer
const viewer = new GraphiteEvidenceViewer();

// Load MVT results
const parsedData = await viewer.loadFile('mvt_results.json');

// Get summary
const summary = viewer.getSummary();
console.log(`Total devices: ${summary.totalDevices}`);
console.log(`Total findings: ${summary.totalFindings}`);

// Generate timeline HTML
const html = viewer.getTimelineHTML();
document.body.innerHTML = html;

// Export as Markdown
const markdown = viewer.exportMarkdown();
console.log(markdown);
```

## References

- [Citizen Lab: Paragon Graphite Android](https://citizenlab.ca/research/a-first-look-at-paragons-proliferating-spyware-operations/)
- [Citizen Lab: iOS Mercenary Spyware](https://citizenlab.ca/research/first-forensic-confirmation-of-paragons-ios-mercenary-spyware-finds-journalists-targeted/)
- [Mobile Verification Toolkit Docs](https://docs.mvt.re/en/latest/)
- [Apple CVE-2025-43200 Advisory](https://support.apple.com/en-asia/122174)
