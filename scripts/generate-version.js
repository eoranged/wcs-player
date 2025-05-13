const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Get the git commit hash
function getGitCommitHash() {
  try {
    // Get the current git commit hash
    const hash = execSync('git rev-parse HEAD').toString().trim();
    return hash.substring(0, 8); // Return first 8 characters
  } catch (error) {
    console.error('Error getting git commit hash:', error.message);
    return 'unknown';
  }
}

// Create version.json file
function generateVersionFile() {
  const version = getGitCommitHash();
  const versionData = {
    version,
    buildTime: new Date().toISOString()
  };

  const filePath = path.join(__dirname, '../public/version.json');
  
  try {
    // Make sure the public directory exists
    const publicDir = path.join(__dirname, '../public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(versionData, null, 2));
    console.log(`Version file created with commit hash: ${version}`);
  } catch (error) {
    console.error('Error writing version file:', error.message);
  }
}

// Run the function
generateVersionFile();
