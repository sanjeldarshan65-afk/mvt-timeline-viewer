/**
 * Sample MVT Data Generator
 * 
 * Creates realistic-looking MVT JSON files based on
 * Mobile Verification Toolkit structure and Graphite indicators.
 */

const fs = require('fs');
const path = require('path');

const SAMPLE_DIR = path.join(__dirname, 'sample-mvt-data');

/**
 * Create sample MVT results for a single Android device
 */
function createAndroidSample() {
  const androidId = 'android_device_sample_001';
  
  // Device metadata report
  const metaReport = {
    name: 'meta_report.json',
    source: 'meta_report.json',
    date: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    device_path: '/data/data/com.whatsapp/files/',
    filename: 'meta_report.json',
    device_info: {
      android_id: androidId,
      model: 'SM-G991B',
      carrier: 'T-Mobile',
      os_version: '13',
      build_date: '2024-05-15',
      imei: '357436281056473'
    },
    report_data: {
      android_id: androidId,
      model: 'SM-G991B',
      carrier: 'T-Mobile',
      os_version: '13'
    }
  };

  // EXIF report (usually just metadata)
  const exifReport = {
    name: 'exif_report.json',
    source: 'exif_report.json',
    date: new Date(Date.now() - 86400000 * 4).toISOString(),
    device_path: '/storage/emulated/0/DCIM/Camera/',
    filename: 'IMG_20240515_103045.jpg',
    report_data: {
      fields: [
        { device_path: '/storage/emulated/0/DCIM/Camera/IMG_20240515_103045.jpg', filename: 'IMG_20240515_103045.jpg', field: 'make', value: 'Samsung' },
        { device_path: '/storage/emulated/0/DCIM/Camera/IMG_20240515_103045.jpg', filename: 'IMG_20240515_103045.jpg', field: 'model', value: 'SM-G991B' }
      ]
    }
  };

  // Gallery report with suspicious WhatsApp activity (Graphite indicator)
  const galleryReport = {
    name: 'gallery_report.json',
    source: 'gallery_report.json',
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    device_path: '/storage/emulated/0/WhatsApp/Media/.Statuses/',
    filename: 'gallery_report.json',
    report_data: {
      entries: [
        {
          device_path: '/storage/emulated/0/WhatsApp/Media/.Statuses/',
          filename: 'IMG_20240513_143022.jpg',
          title: 'IMG_20240513_143022.jpg',
          date: new Date(Date.now() - 86400000 * 3).toISOString(),
          mime_type: 'image/jpeg',
          chat_id: '123456789012345678',
          sender: 'Unknown',
          keywords: ['meeting', 'urgent', 'project'],
          category: 'SUSPICIOUS'
        },
        {
          device_path: '/storage/emulated/0/WhatsApp/Media/.Statuses/',
          filename: 'IMG_20240513_143100.jpg',
          title: 'IMG_20240513_143100.jpg',
          date: new Date(Date.now() - 86400000 * 3).toISOString(),
          mime_type: 'image/jpeg',
          chat_id: '123456789012345678',
          sender: 'Unknown',
          keywords: ['confidential', 'budget'],
          category: 'SUSPICIOUS'
        }
      ]
    }
  };

  // BIGPRETZEL artifact (confirmed Graphite indicator)
  const bigPretzelReport = {
    name: 'bigpretzel_artifact.json',
    source: 'BIGPRETZEL_artifact.json',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    device_path: '/data/data/com.android.providers.media/databases/mediadb.db',
    filename: 'BIGPRETZEL_artifact.json',
    report_data: {
      binary_name: 'BIGPRETZEL',
      version: '2.1.0',
      install_date: '2025-01-30T08:23:15-05:00',
      last_seen: '2025-01-31T14:45:30-05:00',
      permissions: [
        'READ_PHONE_STATE',
        'ACCESS_FINE_LOCATION',
        'RECEIVE_BOOT_COMPLETED'
      ],
      binary_path: '/data/data/com.graphite.forensic/files/BIGPRETZEL.so',
      size_bytes: 1048576,
      category: 'CONFIRMED'
    }
  };

  return {
    device_info: {
      android_id: androidId,
      model: 'SM-G991B',
      carrier: 'T-Mobile',
      os_version: '13'
    },
    reports: [metaReport, exifReport, galleryReport, bigPretzelReport]
  };
}

/**
 * Create sample MVT results for iOS device
 */
function createiOSSample() {
  // iOS device metadata (simulated)
  const iosDeviceReport = {
    name: 'ios_device_meta.json',
    source: 'iOS_Device_MetaData.json',
    date: new Date(Date.now() - 86400000 * 10).toISOString(),
    device_path: '/var/mobile/Library/Preferences/',
    filename: 'ios_device_meta.json',
    device_info: {
      device_id: 'iPhone_14_Pro_Unknown_User',
      model: 'iPhone15,2',
      carrier: 'Verizon',
      os_version: '18.2.1',
      build_date: '2025-01-20',
      imei: '357436281056999'
    },
    report_data: {
      device_id: 'iPhone_14_Pro_Unknown_User',
      model: 'iPhone15,2',
      carrier: 'Verizon',
      os_version: '18.2.1'
    }
  };

  // CVE-2025-43200 indicator (confirmed iOS zero-click)
  const cve202543200Report = {
    name: 'cve_2025_43200_artifact.json',
    source: 'CVE-2025-43200_Artifact.json',
    date: new Date(Date.now() - 86400000 * 9).toISOString(),
    device_path: '/var/mobile/Containers/Data/Application/',
    filename: 'CVE-2025-43200_Artifact.json',
    report_data: {
      vulnerability_id: 'CVE-2025-43200',
      affected_version: '18.2.1',
      fixed_in: '18.3.1',
      attack_vector: 'Zero-click iMessage',
      detected_at: '2025-06-15T10:22:45-04:00',
      chat_id: '147852369012345678',
      sender: 'Ciro Pellegrino',
      keywords: ['journal', 'investigation', 'source'],
      category: 'CONFIRMED'
    }
  };

  return {
    device_info: {
      device_id: 'iPhone_14_Pro_Unknown_User',
      model: 'iPhone15,2',
      carrier: 'Verizon',
      os_version: '18.2.1'
    },
    reports: [iosDeviceReport, cve202543200Report]
  };
}

/**
 * Main: Create sample data directory and files
 */
function main() {
  // Create sample directory
  if (!fs.existsSync(SAMPLE_DIR)) {
    fs.mkdirSync(SAMPLE_DIR, { recursive: true });
    console.log('Created sample directory:', SAMPLE_DIR);
  }

  // Create Android sample
  const androidSample = createAndroidSample();
  const androidPath = path.join(SAMPLE_DIR, 'android_device_sample_001.json');
  fs.writeFileSync(androidPath, JSON.stringify(androidSample, null, 2));
  console.log('Created Android sample:', androidPath);

  // Create iOS sample
  const iosSample = createiOSSample();
  const iosPath = path.join(SAMPLE_DIR, 'ios_device_sample_001.json');
  fs.writeFileSync(iosPath, JSON.stringify(iosSample, null, 2));
  console.log('Created iOS sample:', iosPath);

  // Create combined sample (multiple devices)
  const combinedSample = {
    device_info: {
      investigation_id: 'INV-2025-001',
      investigator: 'John Doe',
      notes: 'Combined analysis of Android and iOS devices from Graphite investigation'
    },
    reports: [
      ...androidSample.reports,
      ...iosSample.reports
    ]
  };
  const combinedPath = path.join(SAMPLE_DIR, 'combined_investigation.json');
  fs.writeFileSync(combinedPath, JSON.stringify(combinedSample, null, 2));
  console.log('Created combined sample:', combinedPath);

  console.log('\nSample data generation complete!');
  console.log('Files created in:', SAMPLE_DIR);
  console.log('\nRun "npm run sample-data" to regenerate.');
}

main();
