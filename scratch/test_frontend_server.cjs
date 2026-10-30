const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'frontend');
const server = http.createServer((req, res) => {
    let filePath = path.join(root, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const mimeTypes = {
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        'svg': 'image/svg+xml',
        'png': 'image/png',
        'json': 'application/json'
    };
    const contentType = mimeTypes[ext] || 'text/plain';
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
});

server.listen(3457, () => {
    console.log('Frontend server running on http://localhost:3457');
});
