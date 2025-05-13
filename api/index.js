// This file is only used for local development
// In production, Vercel uses the API routes in the pages/api directory

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});

// For Vercel - this won't be used as Vercel will use the pages/api directory directly
module.exports = (req, res) => {
  const parsedUrl = parse(req.url, true);
  handle(req, res, parsedUrl);
};
