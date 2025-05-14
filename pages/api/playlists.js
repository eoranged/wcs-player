// API endpoint to get playlists based on music style
export default function handler(req, res) {
  const { style } = req.query;
  
  // Log the request for debugging
  console.log(`Fetching playlists for style: ${style}`);
  
  // Dummy data for testing purposes
  const playlists = {
    'West Coast Swing': [
      { id: 'wcs-beginner', name: 'WCS Beginner', description: 'Slow tempo songs for beginners' },
      { id: 'wcs-intermediate', name: 'WCS Intermediate', description: 'Medium tempo songs' },
      { id: 'wcs-advanced', name: 'WCS Advanced', description: 'Fast and challenging songs' },
      { id: 'wcs-contemporary', name: 'WCS Contemporary', description: 'Modern pop songs for WCS' },
      { id: 'wcs-classics', name: 'WCS Classics', description: 'Classic blues and R&B for WCS' },
      { id: 'wcs-competitions', name: 'WCS Competition', description: 'Songs used in recent competitions' },
      { id: 'wcs-showcase', name: 'WCS Showcase', description: 'Showcase and performance songs' }
    ],
    'Bachata': [
      { id: 'bachata-traditional', name: 'Traditional Bachata', description: 'Classic Dominican bachata' },
      { id: 'bachata-moderna', name: 'Bachata Moderna', description: 'Modern bachata fusion' }
    ],
    'Salsa': [
      { id: 'salsa-cubana', name: 'Salsa Cubana', description: 'Cuban style salsa music' },
      { id: 'salsa-linea', name: 'Salsa en Linea', description: 'LA style salsa music' }
    ]
  };
  
  // Return playlists for the requested style or an empty array if style not found
  res.status(200).json(playlists[style] || []);
}
