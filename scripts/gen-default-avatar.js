/**
 * 生成默认头像 PNG（灰色圆形+人形剪影）
 * 运行：node scripts/gen-default-avatar.js
 */
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

const WIDTH = 200
const HEIGHT = 200
const BG = { r: 220, g: 220, b: 220 }      // 背景灰
const FG = { r: 180, g: 180, b: 180 }       // 图标浅灰
const TRANS = { r: 0, g: 0, b: 0, a: 0 }

function createPNG(pixels) {
  const rawData = Buffer.alloc(HEIGHT * (1 + WIDTH * 4))
  for (let y = 0; y < HEIGHT; y++) {
    rawData[y * (1 + WIDTH * 4)] = 0
    for (let x = 0; x < WIDTH; x++) {
      const idx = y * WIDTH + x
      const offset = y * (1 + WIDTH * 4) + 1 + x * 4
      rawData[offset] = pixels[idx * 4]
      rawData[offset + 1] = pixels[idx * 4 + 1]
      rawData[offset + 2] = pixels[idx * 4 + 2]
      rawData[offset + 3] = pixels[idx * 4 + 3]
    }
  }
  const deflated = zlib.deflateSync(rawData)
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(WIDTH, 0)
  ihdr.writeUInt32BE(HEIGHT, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  const ihdrChunk = makeChunk('IHDR', ihdr)
  const idatChunk = makeChunk('IDAT', deflated)
  const iendChunk = makeChunk('IEND', Buffer.alloc(0))
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk])
}

function makeChunk(type, data) {
  const tb = Buffer.from(type, 'ascii')
  const lb = Buffer.alloc(4)
  lb.writeUInt32BE(data.length, 0)
  const crcData = Buffer.concat([tb, data])
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(crcData), 0)
  return Buffer.concat([lb, tb, data, crcBuf])
}

const crcTable = []
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
  crcTable[n] = c
}
function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function drawCircle(buf, cx, cy, r, color) {
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const dx = x - cx, dy = y - cy
      if (dx * dx + dy * dy <= r * r) {
        const i = (y * WIDTH + x) * 4
        buf[i] = color.r; buf[i + 1] = color.g; buf[i + 2] = color.b; buf[i + 3] = color.a !== undefined ? color.a : 255
      }
    }
  }
}

function drawRect(buf, x1, y1, x2, y2, color) {
  for (let y = Math.max(0, y1); y <= Math.min(HEIGHT - 1, y2); y++) {
    for (let x = Math.max(0, x1); x <= Math.min(WIDTH - 1, x2); x++) {
      const i = (y * WIDTH + x) * 4
      buf[i] = color.r; buf[i + 1] = color.g; buf[i + 2] = color.b; buf[i + 3] = color.a !== undefined ? color.a : 255
    }
  }
}

// 背景透明 + 灰色圆形底
const pixels = Buffer.alloc(WIDTH * HEIGHT * 4)
for (let i = 0; i < WIDTH * HEIGHT; i++) pixels[i * 4 + 3] = 0

// 圆形背景
drawCircle(pixels, 100, 100, 98, BG)

// 人形剪影：头部圆圈 + 身体半圆
drawCircle(pixels, 100, 75, 35, FG)   // 头
drawCircle(pixels, 100, 175, 55, FG)  // 身体

// 把身体上方切平（覆盖头部圆的下半部遮挡）
drawRect(pixels, 0, 0, 199, 105, TRANS)
// 重新画头
drawCircle(pixels, 100, 75, 35, FG)

// 挖掉身体中间形成镂空效果太复杂，保持实心即可

const png = createPNG(pixels)
const outPath = path.join(__dirname, '..', 'images', 'default-avatar.png')
fs.writeFileSync(outPath, png)
console.log('✅ 生成 images/default-avatar.png')
