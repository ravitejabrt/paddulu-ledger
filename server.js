const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  // Normalize and parse URL path
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = parsedUrl.pathname;
  
  // API Routes
  if (pathname === '/api/config') {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const config = JSON.parse(body);
          const configContent = `/**
 * Paddulu Ledger - Supabase Configuration Credentials
 * 
 * Instructions:
 * -------------------------------------------------------------
 * 1. You can hardcode your Supabase project credentials below.
 * 2. Alternatively, you can configure these settings inside the web application UI
 *    by clicking the "Database Settings" button in the header.
 * -------------------------------------------------------------
 */

window.SUPABASE_URL_ENCRYPTED = ${JSON.stringify(config.encryptedUrl || '')};
window.SUPABASE_ANON_KEY_ENCRYPTED = ${JSON.stringify(config.encryptedKey || '')};
`;
          const configPath = path.join(__dirname, 'config.js');
          fs.writeFile(configPath, configContent, 'utf8', (err) => {
            if (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.code }));
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            }
          });
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON format' }));
        }
      });
      return;
    }
  }

  if (pathname === '/api/entries') {
    const dataPath = path.join(__dirname, 'data.json');
    if (req.method === 'GET') {
      fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end('[]');
          } else {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.code }));
          }
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(data || '[]');
        }
      });
      return;
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          JSON.parse(body); // validate syntax
          fs.writeFile(dataPath, body, 'utf8', (err) => {
            if (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.code }));
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            }
          });
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON format' }));
        }
      });
      return;
    }
  }

  if (pathname === '/api/agents') {
    const agentsPath = path.join(__dirname, 'agents.json');
    if (req.method === 'GET') {
      fs.readFile(agentsPath, 'utf8', (err, data) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end('[]');
          } else {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.code }));
          }
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(data || '[]');
        }
      });
      return;
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          JSON.parse(body); // validate syntax
          fs.writeFile(agentsPath, body, 'utf8', (err) => {
            if (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.code }));
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            }
          });
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON format' }));
        }
      });
      return;
    }
  }

  if (pathname === '/') {
    pathname = '/index.html';
  }

  const filePath = path.join(__dirname, pathname);
  
  // Safe directory check to prevent directory traversal attacks
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 File Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code} ..\n`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
