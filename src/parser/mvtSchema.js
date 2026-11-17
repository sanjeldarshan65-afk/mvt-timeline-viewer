/**
 * MVT JSON Schema Definition
 * Based on Mobile Verification Toolkit documentation
 * 
 * MVT results are stored as JSON files with these key structures:
 */

export const mvtSchema = {
  // Top-level structure
  root: {
    device_info: {
      type: 'object',
      required: false,
      description: 'Device metadata from MVT'
    },
    reports: {
      type: 'array',
      description: 'Array of individual MVT report files'
    }
  },

  // Individual report structure (from MVT reports/)
  report: {
    name: {
      type: 'string',
      example: 'exif_report.json'
    },
    source: {
      type: 'string',
      description: 'Original filename from device'
    },
    date: {
      type: 'string',
      format: 'ISO-8601',
      description: 'When the evidence was collected'
    },
    report_data: {
      type: 'object',
      description: 'Vendor-specific report data'
    }
  },

  // Example: exif_report (common MVT report)
  exif_report: {
    name: 'exif_report.json',
    report_data: {
      type: 'array',
      description: 'Array of EXIF metadata entries',
      items: {
        fields: {
          type: 'object',
          properties: {
            device_path: { type: 'string' },
            filename: { type: 'string' },
            field: { type: 'string' }, // e.g., 'make', 'model'
            value: { type: 'string' }
          }
        }
      }
    }
  },

  // Example: gallery_report (image/video gallery)
  gallery_report: {
    name: 'gallery_report.json',
    report_data: {
      type: 'array',
      description: 'Array of gallery entries',
      items: {
        type: 'object',
        properties: {
          device_path: { type: 'string' },
          filename: { type: 'string' },
          title: { type: 'string' },
          date: { type: 'string', format: 'ISO-8601' },
          mime_type: { type: 'string' },
          // Graphite indicators
          chat_id: { type: 'string', description: 'WhatsApp/Signal chat ID' },
          sender: { type: 'string', description: 'Contact name/ID' },
          keywords: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  },

  // Example: meta_report (device metadata)
  meta_report: {
    name: 'meta_report.json',
    report_data: {
      type: 'object',
      properties: {
        android_id: { type: 'string' },
        imei: { type: 'string' },
        carrier: { type: 'string' },
        model: { type: 'string' },
        os_version: { type: 'string' },
        build_date: { type: 'string', format: 'ISO-8601' }
      }
    }
  }
};

/**
 * Known Graphite/Paragon MVT Indicators
 * Based on Citizen Lab research
 */

export const graphiteIndicators = {
  // Android forensic artifact
  android_artifacts: {
    bigpretzel: {
      name: 'BIGPRETZEL',
      description: 'Android forensic artifact found on 2 devices (March 2025)',
      severity: 'HIGH',
      category: 'confirmed_compromise',
      fields: [
        'device_path',
        'filename',
        'binary_name'
      ]
    }
  },

  // iOS indicators
  ios_artifacts: {
    cve_2025_43200: {
      name: 'CVE-2025-43200',
      description: 'iOS 18.2.1 zero-click vulnerability (fixed in 18.3.1)',
      severity: 'HIGH',
      category: 'confirmed_compromise',
      affected_versions: ['18.2.1', '18.2.x'],
      fixed_in: '18.3.1'
    }
  },

  // Common Graphite indicators from MVT
  common_indicators: [
    {
      field: 'chat_id',
      description: 'WhatsApp/Signal chat containing messages',
      category: 'messaging_activity'
    },
    {
      field: 'sender',
      description: 'Contact name or ID from chat',
      category: 'messaging_activity'
    },
    {
      field: 'keywords',
      description: 'Message content keywords',
      category: 'messaging_activity'
    },
    {
      field: 'call_id',
      description: 'VoIP call record',
      category: 'messaging_activity'
    }
  ]
};
