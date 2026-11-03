import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateAndroidIcons() {
  const logoPath = path.resolve('public/logo.png');
  
  // Clean border-free crop of the inner artwork
  // Bounds inside the squircle border: left=140, top=140, width=744, height=744
  const artworkBuffer = await sharp(logoPath)
    .extract({ left: 140, top: 140, width: 744, height: 744 })
    .toBuffer();

  const densities = [
    { name: 'mdpi', size: 48, fgSize: 108 },
    { name: 'hdpi', size: 72, fgSize: 162 },
    { name: 'xhdpi', size: 96, fgSize: 216 },
    { name: 'xxhdpi', size: 144, fgSize: 324 },
    { name: 'xxxhdpi', size: 192, fgSize: 432 }
  ];

  const bgColor = { r: 10, g: 28, b: 60, alpha: 1 }; // #0A1C3C

  for (const density of densities) {
    const dir = path.resolve(`android/app/src/main/res/mipmap-${density.name}`);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 1. ic_launcher.png (Legacy squircle icon with soft rounded corners)
    const radius = Math.round(density.size * 0.22);
    const squircleSvg = Buffer.from(
      `<svg width="${density.size}" height="${density.size}">
        <rect width="${density.size}" height="${density.size}" rx="${radius}" ry="${radius}" fill="#ffffff"/>
      </svg>`
    );
    await sharp(artworkBuffer)
      .resize(density.size, density.size, { fit: 'cover' })
      .composite([{ input: squircleSvg, blend: 'dest-in' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    // 2. ic_launcher_round.png (Circular launcher icon)
    const circleSvg = Buffer.from(
      `<svg width="${density.size}" height="${density.size}">
        <circle cx="${density.size / 2}" cy="${density.size / 2}" r="${density.size / 2}" fill="#ffffff"/>
      </svg>`
    );
    await sharp(artworkBuffer)
      .resize(density.size, density.size, { fit: 'cover' })
      .composite([{ input: circleSvg, blend: 'dest-in' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    // 3. ic_launcher_foreground.png (Adaptive icon foreground scaled within 72dp safe zone)
    const safeContentSize = Math.round(density.fgSize * 0.76);
    const scaledArtwork = await sharp(artworkBuffer)
      .resize(safeContentSize, safeContentSize, { fit: 'contain' })
      .toBuffer();

    await sharp({
      create: {
        width: density.fgSize,
        height: density.fgSize,
        channels: 4,
        background: bgColor
      }
    })
      .composite([
        {
          input: scaledArtwork,
          gravity: 'center'
        }
      ])
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));

    console.log(`Generated icons for mipmap-${density.name}`);
  }

  // Update background color XML in values
  const bgXmlPath = path.resolve('android/app/src/main/res/values/ic_launcher_background.xml');
  const bgXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0A1C3C</color>
</resources>
`;
  fs.writeFileSync(bgXmlPath, bgXmlContent);

  // Clean up any test images
  ['test_crop.png', 'test_crop2.png', 'test_crop3.png'].forEach(f => {
    const p = path.resolve(`android/app/src/main/res/mipmap-xxxhdpi/${f}`);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });

  const oldVectorForeground = path.resolve('android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml');
  if (fs.existsSync(oldVectorForeground)) {
    fs.unlinkSync(oldVectorForeground);
  }

  console.log('All Android icons updated cleanly with SIW logo!');
}

generateAndroidIcons().catch(err => {
  console.error('Error generating Android icons:', err);
  process.exit(1);
});
