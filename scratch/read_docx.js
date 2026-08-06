const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

// Unzip word/document.xml from docx using adm-zip or native unzipping if available, or buffer parsing
const buf = fs.readFileSync('C:\\Users\\GODWIN\\Music\\EOD PORTAL.docx');

// Search for word/document.xml in zip directory
// Simple zip reader for uncompressed/deflated entries
const { execSync } = require('child_process');

try {
  const out = execSync('powershell -Command "Expand-Archive -Path \'C:\\Users\\GODWIN\\Music\\EOD PORTAL.docx\' -DestinationPath \'%TEMP%\\eod_docx\' -Force; Get-Content \'%TEMP%\\eod_docx\\word\\document.xml\'"').toString();
  // Strip XML tags
  const text = out.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  console.log('--- DOCX CONTENT START ---');
  console.log(text);
  console.log('--- DOCX CONTENT END ---');
} catch (e) {
  console.error(e);
}
