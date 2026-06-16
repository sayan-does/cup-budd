import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '..', 'public', 'icons');

const COLORS = { bg: [0x1a, 0x47, 0x2a], fg: [0xff, 0xff, 0xff] };

function createPNG(width, height, bg, fg) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const t = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([t, data]);
    const crc = crc32(crcData);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc);
    return Buffer.concat([len, t, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const raw = Buffer.alloc(height * (1 + width * 3));
  const cx = width / 2, cy = height / 2, r = Math.min(cx, cy) * 0.7;
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 3)] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isInside = dist <= r;
      const isCharX = x >= cx - r * 0.3 && x <= cx + r * 0.3;
      const isCharY = y >= cy - r * 0.6 && y <= cy + r * 0.6;
      const off = 1 + y * (1 + width * 3) + x * 3;
      if (isInside && isCharX && isCharY) {
        raw[off] = fg[0]; raw[off + 1] = fg[1]; raw[off + 2] = fg[2];
      } else if (isInside) {
        raw[off] = bg[0]; raw[off + 1] = bg[1]; raw[off + 2] = bg[2];
      } else {
        raw[off] = 0; raw[off + 1] = 0; raw[off + 2] = 0;
      }
    }
  }

  const idat = deflateSync(raw);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const sizes = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'icon-512-maskable.png', size: 512 },
];

for (const { file, size } of sizes) {
  const png = createPNG(size, size, COLORS.bg, COLORS.fg);
  writeFileSync(resolve(outDir, file), png);
  console.log(`Created ${file} (${size}x${size}, ${png.length} bytes)`);
}
