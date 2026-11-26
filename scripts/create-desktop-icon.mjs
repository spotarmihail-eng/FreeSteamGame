import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const root = process.cwd();
const outputDir = path.join(root, "build");
await fs.mkdir(outputDir, { recursive: true });
const svg = await fs.readFile(path.join(root, "public/icons/icon.svg"));
const png = await sharp(svg).resize(256, 256).png().toBuffer();
const ico = await pngToIco(png);
await fs.writeFile(path.join(outputDir, "icon.ico"), ico);
console.log("Generated Windows application icon.");
