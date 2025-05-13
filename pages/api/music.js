import musicLibrary from '../../lib/data/musicLibrary';

export default function handler(req, res) {
  // Set content type before any response is sent
  res.setHeader('Content-Type', 'application/json');
  
  // Add CORS headers if needed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  try {
    // Return the music library as JSON
    return res.status(200).json(musicLibrary);
  } catch (error) {
    console.error('Error in API route:', error);
    return res.status(500).json({ error: 'Failed to fetch music library' });
  }
}
