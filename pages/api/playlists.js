import { fetchPlaylists } from '../../utils/api';

// API endpoint to get playlists based on music style
export default async function handler(req, res) {
  const { style } = req.query;
  
  // Set content type before any response is sent
  res.setHeader('Content-Type', 'application/json');
  
  // Add CORS headers if needed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  try {
    // Check if base URL is configured
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      return res.status(500).json({
        error: 'NEXT_PUBLIC_BASE_URL is required but not configured'
      });
    }

    // Log the request for debugging
    console.log(`Fetching playlists for style: ${style}`);
    
    // Fetch playlists from remote source
    const playlists = await fetchPlaylists(style);
    
    // Return playlists for the requested style
    res.status(200).json(playlists);
  } catch (error) {
    console.error('Error in playlists API route:', error);
    return res.status(500).json({ error: 'Failed to fetch playlists' });
  }
}
