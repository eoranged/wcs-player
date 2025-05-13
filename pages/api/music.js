import musicLibrary from '../../lib/data/musicLibrary';

export default function handler(req, res) {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(musicLibrary);
  } catch (error) {
    console.error('Error in API route:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: 'Failed to fetch music library' });
  }
}
