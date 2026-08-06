const { execSync } = require('child_process');
const fs = require('fs');

try {
  const tempZip = process.env.TEMP + '\\eod.zip';
  const tempDir = process.env.TEMP + '\\eod_docx';
  fs.copyFileSync('C:\\Users\\GODWIN\\Music\\EOD PORTAL.docx', tempZip);
  execSync(`powershell -Command "Expand-Archive -Path '${tempZip}' -DestinationPath '${tempDir}' -Force"`);
  const xmlContent = fs.readFileSync(tempDir + '\\word\\document.xml', 'utf8');
  const text = xmlContent.replace(/<[^>]+>/g, '\n').split('\n').map(s => s.trim()).filter(Boolean).join('\n');
  console.log('=== DOCX CONTENT START ===');
  console.log(text);
  console.log('=== DOCX CONTENT END ===');
} catch (e) {
  console.error(e);
}
