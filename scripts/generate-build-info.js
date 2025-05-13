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

// Create .env.local file with build information
function generateBuildInfo() {
  const version = getGitCommitHash();
  const buildTime = new Date().toISOString();
  
  const envContent = `
# Auto-generated build information
NEXT_PUBLIC_APP_VERSION=${version}
NEXT_PUBLIC_BUILD_TIME=${buildTime}
`;

  const filePath = path.join(__dirname, '../.env.local');
  
  try {
    fs.writeFileSync(filePath, envContent.trim());
    console.log(`Build info generated with version: ${version}`);
  } catch (error) {
    console.error('Error writing build info file:', error.message);
  }
}

// Run the function
generateBuildInfo();
