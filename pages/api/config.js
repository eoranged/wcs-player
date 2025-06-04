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
      env: process.env.NODE_ENV || 'production',
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || ''
    };
    
    // Check if user is admin by ID match
    let isUserAdmin = false;
    if (user && user.id && adminUserId) {
      // Convert both to strings for comparison
      isUserAdmin = String(user.id) === String(adminUserId);
    }
    
    // Check if debug mode is enabled globally
    const isDebugMode = adminUserId === 'DEBUG';
    
    // Set admin status
    config.isAdmin = isUserAdmin;
    
    // Set feature flags based on permissions
    // Show debug panel if user is admin OR if debug mode is enabled
    config.features.debugPanel = isUserAdmin || isDebugMode;
    
    // Return configuration
    return res.status(200).json(config);
  } catch (error) {
    console.error('Error in config API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
