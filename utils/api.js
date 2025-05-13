/**
 * Fetches data from the API with error handling
 * @param {string} endpoint - The API endpoint to fetch from
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - The parsed JSON response
 * @throws {Error} - If the request fails
 */
export const fetchFromApi = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`/api/${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return await response.json();
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
    return await fetchFromApi('music');
  } catch (error) {
    console.error('Failed to fetch music library:', error);
    throw error;
  }
};
