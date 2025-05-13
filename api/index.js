const express = require('express');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Sample music library
const musicLibrary = [
  {
    id: 1,
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    cover: 'https://i.scdn.co/image/ab67616d0000b273e319baafd16e84f040e8c4ea',
    audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    tempo: 120
  },
  {
    id: 2,
    title: 'Stairway to Heaven',
    artist: 'Led Zeppelin',
    album: 'Led Zeppelin IV',
    cover: 'https://i.scdn.co/image/ab67616d0000b2733d92b2ad5af9fbc8637425f0',
    audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    tempo: 80
  },
  {
    id: 3,
    title: 'Hotel California',
    artist: 'Eagles',
    album: 'Hotel California',
    cover: 'https://i.scdn.co/image/ab67616d0000b273d5fccf9ce08b6a7e03ec5315',
    audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    tempo: 140
  }
];

app.prepare().then(() => {
  const server = express();
  
  // API endpoint to get music library
  server.get('/api/music', (req, res) => {
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
  const parsedUrl = parse(req.url, true);
  handle(req, res, parsedUrl);
};
