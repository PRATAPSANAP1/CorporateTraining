const fs = require('fs');
const path = require('path');

// Read the VITE_API_URL from environment variables, fall back to the live Render URL
const apiUrl = process.env.VITE_API_URL || 'https://corporatetraining.onrender.com/api';

// Path to api.js
const apiPath = path.join(__dirname, 'api.js');

if (fs.existsSync(apiPath)) {
  let content = fs.readFileSync(apiPath, 'utf8');
  
  // Replace the API_URL configuration with the environment variable value
  // We look for the CONFIG block and replace the API_URL property
  const updatedContent = content.replace(
    /API_URL:\s*(?:window\.location\.hostname[\s\S]*?'https:\/\/corporatetraining\.onrender\.com\/api')/g,
    `API_URL: '${apiUrl}'`
  );
  
  if (content === updatedContent) {
    // If the regex replacement didn't match the multi-line config, try a simpler replace
    const simpleUpdatedContent = content.replace(
      /'https:\/\/corporatetraining\.onrender\.com\/api'/g,
      `'${apiUrl}'`
    );
    fs.writeFileSync(apiPath, simpleUpdatedContent, 'utf8');
    console.log(`[Build] Replaced hardcoded URL with: ${apiUrl}`);
  } else {
    fs.writeFileSync(apiPath, updatedContent, 'utf8');
    console.log(`[Build] Successfully updated CONFIG.API_URL to: ${apiUrl}`);
  }
} else {
  console.error(`[Build Error] api.js not found at ${apiPath}`);
  process.exit(1);
}
