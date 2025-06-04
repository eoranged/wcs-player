import fs from 'fs';
import path from 'path';
import { processAudioUrl } from '../../utils/api';

export default function handler(req, res) {
  // Set content type before any response is sent
  res.setHeader('Content-Type', 'application/json');
  
  // Add CORS headers if needed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  try {
    // Load all songs from playlist files
    const playlistsDir = path.join(process.cwd(), 'public', 'playlists');
    const playlistFiles = fs.readdirSync(playlistsDir).filter(file => file.endsWith('.json'));
    
    const musicLibrary = [];
    
    for (const file of playlistFiles) {
      try {
        const filePath = path.join(playlistsDir, file);
        const playlistData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
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
