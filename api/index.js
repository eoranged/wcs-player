const express = require('express');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Import the shared music library
const musicLibrary = require('../lib/data/musicLibrary');

app.prepare().then(() => {
  const server = express();
  
  // API endpoint to get music library
  server.get('/api/music', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(musicLibrary);
  });

  // Handle all other requests with Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});

// For Vercel
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const parsedUrl = parse(req.url, true);
  handle(req, res, parsedUrl);
};
