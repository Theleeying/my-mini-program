/**
 * 生成默认商品占位图 PNG（浅灰底 + 购物袋图标）
 * 运行：node scripts/gen-default-goods.js
 */
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

const WIDTH = 400
const HEIGHT = 400
const BG = { r: 242, g: 242, b: 242 }       // 浅灰背景
const ICON = { r: 180, g: 180, b: 180 }      // 图标灰
const WHITE = { r: 255, g: 255, b: 255 }
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

function drawRect(buf, x1, y1, x2, y2, color) {
  for (let y = Math.max(0, y1); y <= Math.min(HEIGHT - 1, y2); y++) {
    for (let x = Math.max(0, x1); x <= Math.min(WIDTH - 1, x2); x++) {
      const i = (y * WIDTH + x) * 4
      buf[i] = color.r; buf[i + 1] = color.g; buf[i + 2] = color.b; buf[i + 3] = color.a !== undefined ? color.a : 255
    }
  }
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

function drawLineH(buf, y, x1, x2, color) {
  drawRect(buf, x1, y, x2, y, color)
}

function fillTriangle(buf, vertices, color) {
  const [v0, v1, v2] = vertices
  const minX = Math.max(0, Math.min(v0[0], v1[0], v2[0]))
  const maxX = Math.min(WIDTH - 1, Math.max(v0[0], v1[0], v2[0]))
  const minY = Math.max(0, Math.min(v0[1], v1[1], v2[1]))
  const maxY = Math.min(HEIGHT - 1, Math.max(v0[1], v1[1], v2[1]))
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (pointInTriangle(x, y, v0, v1, v2)) {
        const i = (y * WIDTH + x) * 4
        buf[i] = color.r; buf[i + 1] = color.g; buf[i + 2] = color.b; buf[i + 3] = 255
      }
    }
  }
}

function pointInTriangle(px, py, v0, v1, v2) {
  const d1 = sign(px, py, v1[0], v1[1], v2[0], v2[1])
  const d2 = sign(px, py, v2[0], v2[1], v0[0], v0[1])
  const d3 = sign(px, py, v0[0], v0[1], v1[0], v1[1])
  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0)
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0)
  return !(hasNeg && hasPos)
}

function sign(x1, y1, x2, y2, x3, y3) {
  return (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3)
}

// 全部初始化为背景色
const pixels = Buffer.alloc(WIDTH * HEIGHT * 4)
for (let i = 0; i < WIDTH * HEIGHT; i++) {
  pixels[i * 4] = BG.r
  pixels[i * 4 + 1] = BG.g
  pixels[i * 4 + 2] = BG.b
  pixels[i * 4 + 3] = 255
}

// ========== 绘制购物袋图标（居中） ==========
// 袋身：矩形 120x140，中心在 (200, 220)
const bagX1 = 140, bagY1 = 150
const bagX2 = 260, bagY2 = 290
drawRect(pixels, bagX1, bagY1, bagX2, bagY2, ICON)

// 袋口提手
const handleX1 = 160, handleY1 = 90
const handleX2 = 240, handleY2 = 149
drawRect(pixels, handleX1, handleY1, handleX2, handleY2, ICON)

// 袋身中间镂空（用背景色填充以示镂空效果）
drawRect(pixels, 155, 170, 245, 275, BG)

// 提手镂空
drawRect(pixels, 178, 105, 222, 140, BG)

// ========== 底部文字 "暂无图片" ==========
// 用像素画简单的"无"字占位
// 画一条粗线代表文字占位（居中，y≈340）
drawRect(pixels, 120, 325, 280, 332, ICON)  // 第一行
drawRect(pixels, 150, 342, 250, 349, ICON)  // 第二行

const png = createPNG(pixels)
const outPath = path.join(__dirname, '..', 'images', 'default-goods.png')
fs.writeFileSync(outPath, png)
console.log('✅ 生成 images/default-goods.png')