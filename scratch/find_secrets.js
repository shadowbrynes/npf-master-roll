import fs from 'fs';
import path from 'path';

function searchDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.git' || file === '.next') continue;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDirectory(fullPath);
    } else if (stat.isFile()) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('sb_secret_') || content.includes('sb_publishable_')) {
        console.log('Secret found in:', fullPath);
      }
    }
  }
}

searchDirectory('C:\\Users\\GODWIN\\eod-cbrn-nominal-roll');
