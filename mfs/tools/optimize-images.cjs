const path = require("path");
const fs = require("fs/promises");
const sharp = require("sharp");

const outputDir = path.resolve(__dirname, "../public/assets/optimized");

const targets = [
  {
    input: path.resolve(__dirname, "../public/assets/main-image.webp"),
    name: "main-image",
    widths: [640, 960, 1280, 1600],
  },
  {
    input: path.resolve(__dirname, "../public/assets/center-image.webp"),
    name: "center-image",
    widths: [640, 960, 1280, 1600],
  },
];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function build() {
  await ensureDir(outputDir);

  await Promise.all(
    targets.map(async (target) => {
      const inputStat = await fs.stat(target.input);
      if (!inputStat.isFile()) {
        throw new Error(`Missing input image: ${target.input}`);
      }

      await Promise.all(
        target.widths.map(async (width) => {
          const output = path.join(outputDir, `${target.name}-${width}.webp`);
          await sharp(target.input)
            .resize({ width })
            .webp({ quality: 82 })
            .toFile(output);
        })
      );
    })
  );
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
