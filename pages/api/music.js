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

export default function handler(req, res) {
  try {
    res.status(200).json(musicLibrary);
  } catch (error) {
    console.error('Error in API route:', error);
    res.status(500).json({ error: 'Failed to fetch music library' });
  }
}
