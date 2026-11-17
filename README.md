# Graphite Evidence Viewer

An evidence viewer and timeline visualization tool for MVT (Mobile Verification Toolkit) forensic results.

## Purpose

This tool helps investigators analyze MVT results from consensually acquired mobile evidence, organizing findings into incident timelines with confidence levels (confirmed, suspicious, insufficient).

## Features

- **JSON Import**: Load MVT result files (`.json`) from Android/iOS investigations
- **Timeline View**: Chronological visualization of all findings
- **Evidence Categorization**: Label findings as:
  - ✅ **Confirmed**: Strong evidence of compromise (e.g., BIGPRETZEL artifact)
  - ⚠️ **Suspicious**: Potential indicators needing verification
  - 🔍 **Insufficient**: Limited/no indicator found
- **Device Grouping**: Organize findings by device (Android/iOS)
- **Export**: Generate reports in HTML/Markdown

## Quick Start

```bash
# Install dependencies
npm install

# Create sample data (from MVT docs)
npm run sample-data

# Start the web dashboard
npm run dev
```

## Project Structure

```
src/
  ├── parser/
  │   └── evidenceParser.js    # Parse MVT JSON results
  ├── timeline/
  │   └── TimelineView.js      # Timeline visualization
  ├── categories/
  │   └── EvidenceCategory.js  # Confirm/suspicious/insufficient logic
  └── ui/
      └── Dashboard.js         # Web UI dashboard
tests/
  ├── sample-mvt-data/        # Sample MVT JSON files
  └── unit/                   # Unit tests
docs/
  └── API.md                  # API documentation
```

## Example Usage

```javascript
import { parseMVTResults } from './src/parser/evidenceParser.js';
import { TimelineView } from './src/timeline/TimelineView.js';

// Load MVT results
const results = await parseMVTResults('mvt_results.json');

// Create timeline
const timeline = new TimelineView(results);
const html = timeline.generateHTML();
```

## Research Background

Based on Citizen Lab investigations (2025):
- Android: BIGPRETZEL forensic artifact found on 2 devices
- iOS: Zero-click compromise confirmed on iOS 18.2.1 (CVE-2025-43200)
- Platform: "Graphite" spyware with WhatsApp/Signal monitoring

## References

- [Citizen Lab: Paragon Graphite Android](https://citizenlab.ca/research/a-first-look-at-paragons-proliferating-spyware-operations/)
- [Citizen Lab: iOS Mercenary Spyware](https://citizenlab.ca/research/first-forensic-confirmation-of-paragons-ios-mercenary-spyware-finds-journalists-targeted/)
- [Mobile Verification Toolkit Docs](https://docs.mvt.re/en/latest/)
- [Apple CVE-2025-43200 Advisory](https://support.apple.com/en-asia/122174)

## License

MIT
