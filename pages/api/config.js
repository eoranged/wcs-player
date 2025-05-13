// API endpoint for configuration and user validation
export default function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get Telegram user info from request body
    const { user, env } = req.body;
    
    // Get admin user ID from environment variable
    const adminUserId = process.env.TG_ADMIN || '';
    
    // Prepare response
    const config = {
      isAdmin: false,
      features: {
        debugPanel: false
      },
      env: process.env.NODE_ENV || 'production'
    };
    
    // Check if user is admin
    if (user && user.id && adminUserId) {
      // Convert both to strings for comparison
      config.isAdmin = String(user.id) === String(adminUserId);
    }
    
    // Set feature flags based on user permissions
    config.features.debugPanel = config.isAdmin || process.env.NODE_ENV === 'development';
    
    // Return configuration
    return res.status(200).json(config);
  } catch (error) {
    console.error('Error in config API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
