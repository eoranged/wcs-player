import { fetchJson, processAudioUrl } from '../../utils/api';

export default async function handler(req, res) {
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

    // List of known playlist files (this could be made dynamic in the future)
    const playlistFiles = [
      'bachata_moderna.json',
      'bachata_sensual.json',
      'bachata_traditional.json',
      'salsa_cubana.json',
      'salsa_linea.json',
      'salsa_romantica.json',
      'wcs_advanced.json',
      'wcs_beginner.json',
      'wcs_classics.json',
      'wcs_competitions.json',
      'wcs_contemporary.json',
      'wcs_intermediate.json',
      'wcs_showcase.json'
    ];
    
    const musicLibrary = [];
    
    for (const file of playlistFiles) {
      try {
        const playlistData = await fetchJson(`/playlists/${file}`);
        
        if (playlistData.songs && Array.isArray(playlistData.songs)) {
          // Process each song and add to music library
          playlistData.songs.forEach(song => {
            musicLibrary.push({
              ...song,
              // Process audio URL to use base URL if configured
              audio: processAudioUrl(song.audio),
              // Add playlist context
              playlist: playlistData.name,
              style: playlistData.style
            });
          });
        }
      } catch (fileError) {
        console.error(`Error reading playlist file ${file}:`, fileError);
        // Continue with other files
      }
    }
    
    // Return the aggregated music library as JSON
    return res.status(200).json(musicLibrary);
  } catch (error) {
    console.error('Error in API route:', error);
    return res.status(500).json({ error: 'Failed to fetch music library' });
  }
}
