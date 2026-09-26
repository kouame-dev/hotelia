import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer: (width * 4 + 1 filter byte) * height
  const rowBytes = width * 4;
  const rawData = Buffer.alloc((rowBytes + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowBytes + 1);
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // CRC32 implementation
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const crcBuf = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression: 0
  ihdrData[11] = 0; // Filter: 0
  ihdrData[12] = 0; // Interlace: 0
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT
  const idatChunk = makeChunk('IDAT', deflated);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Hotelia Luxury Dark & Gold icon generator
function hoteliaDrawer(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = (x - cx) / cx;
  const dy = (y - cy) / cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background: Deep luxury charcoal / black gradient
  let r = 26;
  let g = 25;
  let b = 23;
  let a = 255;

  // Outer gold ring
  if (!isMaskable && dist > 0.88 && dist < 0.94) {
    return [197, 168, 128, 255]; // #C5A880
  }

  // Gold "H" monogram in center
  const scale = w / 192;
  const relX = (x - cx) / scale;
  const relY = (y - cy) / scale;

  // Draw Letter "H"
  // Left vertical bar: x between -40 and -20, y between -50 and 50
  const leftBar = relX >= -40 && relX <= -20 && relY >= -50 && relY <= 50;
  // Right vertical bar: x between 20 and 40, y between -50 and 50
  const rightBar = relX >= 20 && relX <= 40 && relY >= -50 && relY <= 50;
  // Crossbar: x between -25 and 25, y between -10 and 10
  const crossBar = relX >= -25 && relX <= 25 && relY >= -10 && relY <= 10;
  // Top star / crown diamond:
  const isStar = Math.abs(relX) + Math.abs(relY + 65) <= 12;

  if (leftBar || rightBar || crossBar || isStar) {
    // Gold gradient
    return [217, 185, 138, 255];
  }

  return [r, g, b, a];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, (x, y, w, h) => hoteliaDrawer(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, (x, y, w, h) => hoteliaDrawer(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, (x, y, w, h) => hoteliaDrawer(x, y, w, h, true)));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, (x, y, w, h) => hoteliaDrawer(x, y, w, h, false)));

// SVG Icon
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#1C1B18"/>
  <circle cx="256" cy="256" r="210" fill="none" stroke="#C5A880" stroke-width="8"/>
  <path d="M160 140 H204 V372 H160 Z" fill="#C5A880"/>
  <path d="M308 140 H352 V372 H308 Z" fill="#C5A880"/>
  <path d="M190 234 H322 V278 H190 Z" fill="#C5A880"/>
  <polygon points="256,70 268,95 295,95 273,110 282,135 256,120 230,135 239,110 217,95 244,95" fill="#FFD700"/>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg);

console.log('Icons generated successfully in public/');
