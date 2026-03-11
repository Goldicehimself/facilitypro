const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const INPUT_DIR = path.join(__dirname, '../src/assets/screenshots');
const OUTPUT_DIR = path.join(INPUT_DIR, 'optimized');
const widths = [480, 768, 1024, 1440];

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

(async () => {
  const files = fs.readdirSync(INPUT_DIR).filter(f => /\.(png|jpg|jpeg|svg)$/i.test(f) && f !== 'optimized');
  for (const file of files) {
    const inputPath = path.join(INPUT_DIR, file);
    const name = path.parse(file).name;

    for (const w of widths) {
      const outWebp = path.join(OUTPUT_DIR, `${name}-${w}.webp`);
      try {
        await sharp(inputPath)
          .resize({ width: w })
          .webp({ quality: 80 })
          .toFile(outWebp);
        console.log('Wrote', outWebp);
      } catch (err) {
        console.error('Failed webp for', file, w, err.message);
      }

      const outPng = path.join(OUTPUT_DIR, `${name}-${w}.png`);
      try {
        await sharp(inputPath)
          .resize({ width: w })
          .png({ quality: 80 })
          .toFile(outPng);
        console.log('Wrote', outPng);
      } catch (err) {
        console.error('Failed png for', file, w, err.message);
      }
    }
  }
  console.log('Optimization complete');
})();