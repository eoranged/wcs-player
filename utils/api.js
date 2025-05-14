/**
 * Fetches data from local JSON files instead of API
 * @param {string} path - The path to the JSON file
 * @returns {Promise<Object>} - The parsed JSON response
 * @throws {Error} - If the request fails
 */
export const fetchLocalJson = async (path) => {
  try {
    console.log(`Fetching local JSON file: ${path}`);
    
    const response = await fetch(path);
    
    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    console.log(`Local JSON data loaded:`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching local JSON from ${path}:`, error);
    throw error;
  }
};

/**
 * Fetches the music library for a specific playlist
 * @param {string} playlistId - The ID of the playlist to fetch songs for
 * @returns {Promise<Array>} - The music library data
 */
export const fetchMusicLibrary = async (playlistId = 'wcs_beginner') => {
  try {
    console.log(`Fetching music library for playlist: ${playlistId}`);
    
    // Use local JSON file for the playlist
    const data = await fetchLocalJson(`/playlists/${playlistId}.json`);
    
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
    
    // Use local JSON file for the style
    const data = await fetchLocalJson(`/styles/${styleFileName}.json`);
    
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
