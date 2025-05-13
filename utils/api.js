/**
 * Fetches data from the API with error handling
 * @param {string} endpoint - The API endpoint to fetch from
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - The parsed JSON response
 * @throws {Error} - If the request fails
 */
export const fetchFromApi = async (endpoint, options = {}) => {
  try {
    // Ensure endpoint has trailing slash to prevent redirects
    // Next.js with trailingSlash: true in config requires endpoints to end with /
    const normalizedEndpoint = endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
    
    console.log(`Fetching from API: /api/${normalizedEndpoint}`);
    
    // Use the normalized endpoint with trailing slash
    const response = await fetch(`/api/${normalizedEndpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      // Redirect: follow ensures any redirects are followed automatically
      redirect: 'follow',
      ...options,
    });

    console.log(`API response status:`, response.status, response.statusText);
    
    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    // Clone the response before parsing to avoid consuming it
    const clonedResponse = response.clone();
    
    try {
      const data = await response.json();
      console.log(`API response data:`, data);
      return data;
    } catch (parseError) {
      console.error(`Error parsing JSON from ${normalizedEndpoint}:`, parseError);
      
      // Try to get the raw text to see what's being returned
      const text = await clonedResponse.text();
      console.log(`Raw API response:`, text);
      throw new Error(`Failed to parse JSON: ${parseError.message}`);
    }
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Fetches the music library
 * @returns {Promise<Array>} - The music library data
 */
export const fetchMusicLibrary = async () => {
  try {
    console.log('Fetching music library...');
    
    // Use 'music' endpoint (fetchFromApi will add trailing slash)
    const data = await fetchFromApi('music');
    
    // Validate the data structure
    if (!data) {
      console.error('Music library data is null or undefined');
      throw new Error('Invalid music library data: null or undefined');
    }
    
    if (!Array.isArray(data)) {
      console.error('Music library data is not an array:', typeof data, data);
      throw new Error(`Invalid music library data: expected array, got ${typeof data}`);
    }
    
    if (data.length === 0) {
      console.warn('Music library is empty (0 songs)');
    } else {
      console.log(`Successfully fetched music library with ${data.length} songs:`);
      // Log the first song to verify structure
      console.log('First song:', data[0]);
    }
    
    return data;
  } catch (error) {
    console.error('Failed to fetch music library:', error);
    throw error;
  }
};
