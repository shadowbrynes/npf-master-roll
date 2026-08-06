import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';

import registerHandler from './api/register.js';
import profileHandler from './api/profile.js';
import basesHandler from './api/bases.js';
import unitsHandler from './api/units.js';
import personnelHandler from './api/personnel.js';
import dashboardHandler from './api/dashboard.js';
import projectionsHandler from './api/retirement-projections.js';
import importHandler from './api/import.js';
import emailSettingsHandler from './api/email-settings.js';
import notificationsHandler from './api/notifications.js';
import retirementPoliciesHandler from './api/retirement-policies.js';
import retirementCalculatorHandler from './api/retirement-calculator.js';

const routes = {
  '/api/register': registerHandler,
  '/api/profile': profileHandler,
  '/api/bases': basesHandler,
  '/api/units': unitsHandler,
  '/api/personnel': personnelHandler,
  '/api/dashboard': dashboardHandler,
  '/api/retirement-projections': projectionsHandler,
  '/api/import': importHandler,
  '/api/notifications': notificationsHandler,
  '/api/retirement-policies': retirementPoliciesHandler,
  '/api/retirement-calculator': retirementCalculatorHandler,
  '/api/email-settings': emailSettingsHandler
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  req.query = parsedUrl.query;

  res.status = function (code) {
    res.statusCode = code;
    return res;
  };
  res.json = function (obj) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(obj));
    return res;
  };

  const handler = routes[pathname];
  if (handler) {
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', async () => {
      if (bodyData) {
        try { req.body = JSON.parse(bodyData); } catch (e) { req.body = {}; }
      } else {
        req.body = {};
      }
      try {
        await handler(req, res);
      } catch (err) {
        console.error('API Error:', err);
        res.status(500).json({ success: false, message: err.message });
      }
    });
    return;
  }

  let filePath = path.join(process.cwd(), pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath) && fs.existsSync(path.join(process.cwd(), 'public', pathname))) {
    filePath = path.join(process.cwd(), 'public', pathname);
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 Not Found</h1>');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Local development server running at http://localhost:${PORT}`);
});
