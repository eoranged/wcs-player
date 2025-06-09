/**
 * Get the base URL from environment variables
 * @returns {string} - The base URL or empty string for local files
 */
const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_BASE_URL || '';
};

/**
 * Fetches data from JSON files (remote based on environment variables)
 * @param {string} path - The path to the JSON file (relative)
 * @returns {Promise<Object>} - The parsed JSON response
 * @throws {Error} - If the request fails
 */
export const fetchJson = async (path) => {
  try {
    const baseUrl = getBaseUrl();
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_BASE_URL is required but not configured');
    }
    
    const fullUrl = `${baseUrl.replace(/\/$/, '')}${path}`;
    
    console.log(`Fetching JSON file: ${fullUrl}`);
    
    const response = await fetch(fullUrl);
    
    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    console.log(`JSON data loaded:`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching JSON from ${path}:`, error);
    throw error;
  }
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use fetchJson instead
 */
export const fetchLocalJson = fetchJson;

/**
 * Fetches the music library for a specific playlist
 * @param {string} playlistId - The ID of the playlist to fetch songs for
 * @returns {Promise<Array>} - The music library data
 */
export const fetchMusicLibrary = async (playlistId = 'wcs_beginner') => {
  try {
    console.log(`Fetching music library for playlist: ${playlistId}`);
    
    // Use JSON file for the playlist from the base URL
    const data = await fetchJson(`/playlists/${playlistId}.json`);
    
    // Validate the data structure
    if (!data || !data.songs) {
      console.error('Music library data is null or undefined');
      throw new Error('Invalid music library data: null or undefined');
    }
    
    if (!Array.isArray(data.songs)) {
      console.error('Music library songs is not an array:', typeof data.songs, data.songs);
      throw new Error(`Invalid music library data: expected array, got ${typeof data.songs}`);
    }
    
    if (data.songs.length === 0) {
      console.warn('Music library is empty (0 songs)');
    } else {
      console.log(`Successfully fetched music library with ${data.songs.length} songs:`);
      // Log the first song to verify structure
      console.log('First song:', data.songs[0]);
    }
    
    // Process audio URLs and cover images to use base URL if configured
    const baseUrl = getBaseUrl();
    if (baseUrl) {
      data.songs = data.songs.map(song => {
        // Generate cover URL from song ID (fingerprint hash) if not already present
        const coverUrl = song.id ? `${baseUrl.replace(/\/$/, '')}/audio/${song.id}.jpg` : null;
        
        return {
          ...song,
          audio: song.audio.startsWith('http') ? song.audio : `${baseUrl.replace(/\/$/, '')}${song.audio}`,
          cover: song.cover || coverUrl
        };
      });
    }
    
    return data.songs;
  } catch (error) {
    console.error('Failed to fetch music library:', error);
    throw error;
  }
};

/**
 * Fetches available music styles
 * @returns {Promise<Array>} - The available music styles
 */
export const fetchMusicStyles = async () => {
  try {
    console.log('Fetching available music styles...');
    
    // For simplicity, we'll hardcode the available styles
    // In a real app, you might want to scan the styles directory
    const styles = [
      'West Coast Swing',
      'Bachata',
      'Salsa'
    ];
    
    return styles;
  } catch (error) {
    console.error('Failed to fetch music styles:', error);
    throw error;
  }
};

/**
 * Fetches playlists for a specific music style
 * @param {string} style - The music style to fetch playlists for
 * @returns {Promise<Array>} - The playlists data
 */
export const fetchPlaylists = async (style = 'West Coast Swing') => {
  try {
    console.log(`Fetching playlists for style: ${style}`);
    
    // Convert style name to filename format
    const styleFileName = style.toLowerCase().replace(/ /g, '_');
    
    // Use JSON file for the style from the base URL
    const data = await fetchJson(`/styles/${styleFileName}.json`);
    
    // Validate the data structure
    if (!data || !data.playlists) {
      console.error('Playlists data is null or undefined');
      throw new Error('Invalid playlists data: null or undefined');
    }
    
    if (!Array.isArray(data.playlists)) {
      console.error('Playlists is not an array:', typeof data.playlists, data.playlists);
      throw new Error(`Invalid playlists data: expected array, got ${typeof data.playlists}`);
    }
    
    return data.playlists;
  } catch (error) {
    console.error(`Failed to fetch playlists for style ${style}:`, error);
    // Return empty array instead of throwing to make the UI more resilient
    return [];
  }
};

/**
 * Processes audio URL to use base URL if configured
 * @param {string} audioUrl - The original audio URL
 * @returns {string} - The processed audio URL
 */
export const processAudioUrl = (audioUrl) => {
  if (!audioUrl) return '';
  
  // If it's already a full URL, return as-is
  if (audioUrl.startsWith('http')) {
    return audioUrl;
  }
  
  const baseUrl = getBaseUrl();
  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, '')}${audioUrl}`;
  }
  
  return audioUrl;
};

/**
 * Export getBaseUrl function for use in other parts of the application
 */
export { getBaseUrl };
