const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputFile = path.join(__dirname, '../public/new-logo.png');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  console.log('Generating PWA icons...');
  
  for (const size of sizes) {
    const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);
    
    try {
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputFile);
      
      console.log(`✓ Generated icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`✗ Error generating icon-${size}x${size}.png:`, error.message);
    }
  }
  
  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
