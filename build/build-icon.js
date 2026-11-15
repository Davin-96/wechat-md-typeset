const sharp = require('sharp');
const pngToIco = require('png-to-ico').default;
const fs = require('fs');
const path = require('path');

(async () => {
  const svg = fs.readFileSync(path.join(__dirname, 'icon.svg'));
  const sizes = [256, 128, 64, 48, 32, 16];
  const buffers = [];
  for (const s of sizes) {
    const buf = await sharp(svg).resize(s, s).png().toBuffer();
    buffers.push(buf);
  }
  fs.writeFileSync(path.join(__dirname, 'icon.png'), buffers[0]);
  const ico = await pngToIco(buffers);
  fs.writeFileSync(path.join(__dirname, 'icon.ico'), ico);
  console.log('icon.ico generated (' + ico.length + ' bytes)');
})().catch(e => { console.error(e); process.exit(1); });