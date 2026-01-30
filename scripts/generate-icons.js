/**
 * Icon Generator Script for Let Right
 *
 * This script processes the source icon image to:
 * 1. Crop out rounded corners/shadow to get clean symbol
 * 2. Generate all required icon sizes for web, Android, and iOS
 * 3. Create circular versions for Android round icons
 *
 * Prerequisites:
 *   npm install sharp
 *
 * Usage:
 *   node scripts/generate-icons.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source icon path - new clean icon with teal colors
const SOURCE_ICON = 'C:\\Users\\david\\Downloads\\Gemini_Generated_Image_3a8wdx3a8wdx3a8w.png';

// Output directories
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const ANDROID_RES_DIR = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const IOS_ASSETS_DIR = path.join(__dirname, '..', 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');

// Icon sizes configuration
const WEB_ICONS = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
  { name: 'icon-transparent.png', size: 192, transparent: true },
];

const ANDROID_ICONS = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

const IOS_ICON = { name: 'AppIcon-512@2x.png', size: 1024 };

/**
 * Create a circular mask SVG for a given size
 */
function createCircleMask(size) {
  return Buffer.from(`
    <svg width="${size}" height="${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/>
    </svg>
  `);
}

/**
 * Remove white/near-white background and make it transparent
 * This processes each pixel and sets white pixels to transparent
 */
async function removeWhiteBackground(iconBuffer) {
  const image = sharp(iconBuffer);
  const { width, height, channels } = await image.metadata();

  // Get raw pixel data
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Process each pixel - if it's white/near-white, make it transparent
  const newData = Buffer.alloc(info.width * info.height * 4); // RGBA

  for (let i = 0; i < info.width * info.height; i++) {
    const srcOffset = i * info.channels;
    const dstOffset = i * 4;

    const r = data[srcOffset];
    const g = data[srcOffset + 1];
    const b = data[srcOffset + 2];
    const a = info.channels === 4 ? data[srcOffset + 3] : 255;

    // Check if pixel is white or near-white (threshold: 250)
    const isWhite = r > 250 && g > 250 && b > 250;

    newData[dstOffset] = r;
    newData[dstOffset + 1] = g;
    newData[dstOffset + 2] = b;
    newData[dstOffset + 3] = isWhite ? 0 : a; // Make white pixels transparent
  }

  // Create new image with transparency
  return sharp(newData, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
    .png()
    .toBuffer();
}

async function processIcon(inputPath) {
  console.log('Processing source icon...');

  const image = sharp(inputPath);
  const metadata = await image.metadata();

  console.log(`Original size: ${metadata.width}x${metadata.height}`);

  // This icon has rounded corners with a slight shadow
  // Crop inward to get just the clean symbol area
  const inset = Math.floor(metadata.width * 0.08);  // 8% inset from each edge

  const cropLeft = inset;
  const cropTop = inset;
  const cropWidth = metadata.width - (inset * 2);
  const cropHeight = metadata.height - (inset * 2);

  console.log(`Cropping: inset=${inset}px from each edge`);

  // Crop to remove rounded corners
  const croppedBuffer = await image
    .extract({
      left: cropLeft,
      top: cropTop,
      width: cropWidth,
      height: cropHeight
    })
    .png()
    .toBuffer();

  console.log(`Cropped size: ${cropWidth}x${cropHeight}`);
  return croppedBuffer;
}

/**
 * Create a circular version of the icon
 */
async function createCircularIcon(iconBuffer, size) {
  // First resize the icon
  const resized = await sharp(iconBuffer)
    .resize(size, size)
    .png()
    .toBuffer();

  // Create circular mask
  const mask = createCircleMask(size);

  // Apply the circular mask
  const circular = await sharp(resized)
    .composite([{
      input: mask,
      blend: 'dest-in'
    }])
    .png()
    .toBuffer();

  return circular;
}

async function generateIcons() {
  try {
    if (!fs.existsSync(SOURCE_ICON)) {
      console.error(`Source icon not found: ${SOURCE_ICON}`);
      process.exit(1);
    }

    const processedIcon = await processIcon(SOURCE_ICON);

    if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

    console.log('\nGenerating web icons...');
    for (const icon of WEB_ICONS) {
      const outputPath = path.join(PUBLIC_DIR, icon.name);
      if (icon.transparent) {
        // Create transparent background version
        const transparentIcon = await removeWhiteBackground(processedIcon);
        await sharp(transparentIcon)
          .resize(icon.size, icon.size)
          .png()
          .toFile(outputPath);
        console.log(`  Created: ${icon.name} (${icon.size}x${icon.size}) [transparent]`);
      } else {
        await sharp(processedIcon)
          .resize(icon.size, icon.size)
          .png()
          .toFile(outputPath);
        console.log(`  Created: ${icon.name} (${icon.size}x${icon.size})`);
      }
    }

    console.log('\nGenerating favicon...');
    await sharp(processedIcon)
      .resize(32, 32)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'favicon.png'));
    console.log('  Created: favicon.png (32x32)');

    console.log('\nGenerating Android icons...');
    for (const icon of ANDROID_ICONS) {
      const folderPath = path.join(ANDROID_RES_DIR, icon.folder);
      if (fs.existsSync(folderPath)) {
        // ic_launcher.png (square)
        await sharp(processedIcon)
          .resize(icon.size, icon.size)
          .png()
          .toFile(path.join(folderPath, 'ic_launcher.png'));

        // ic_launcher_round.png (circular)
        const circularIcon = await createCircularIcon(processedIcon, icon.size);
        await sharp(circularIcon)
          .toFile(path.join(folderPath, 'ic_launcher_round.png'));

        // ic_launcher_foreground.png (adaptive icon foreground with padding)
        await sharp(processedIcon)
          .resize(Math.round(icon.size * 0.66), Math.round(icon.size * 0.66))
          .extend({
            top: Math.round(icon.size * 0.17),
            bottom: Math.round(icon.size * 0.17),
            left: Math.round(icon.size * 0.17),
            right: Math.round(icon.size * 0.17),
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .png()
          .toFile(path.join(folderPath, 'ic_launcher_foreground.png'));

        console.log(`  Created: ${icon.folder}/ic_launcher*.png (${icon.size}x${icon.size})`);
      }
    }

    console.log('\nGenerating iOS icon...');
    if (fs.existsSync(IOS_ASSETS_DIR)) {
      await sharp(processedIcon)
        .resize(IOS_ICON.size, IOS_ICON.size)
        .png()
        .toFile(path.join(IOS_ASSETS_DIR, IOS_ICON.name));
      console.log(`  Created: ${IOS_ICON.name} (${IOS_ICON.size}x${IOS_ICON.size})`);
    }

    console.log('\nIcon generation complete!');

  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
