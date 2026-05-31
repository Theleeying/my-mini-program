/**
 * 生成 TabBar 图标脚本
 * 在 Node.js 环境下运行：node scripts/gen-tab-icons.js
 *
 * 生成 5 个 tab × 2 种状态（默认灰色 + 选中绿色）= 10 个 PNG 图标
 * 规格：81×81px，PNG 格式
 *
 * 图标分配：
 *   首页    home      灰色#999 / 绿色#4CAF50
 *   二手    shop      灰色#999 / 绿色#4CAF50
 *   失物    find      灰色#999 / 绿色#4CAF50
 *   自习    study     灰色#999 / 绿色#4CAF50
 *   我的    user      灰色#999 / 绿色#4CAF50
 */
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

const WIDTH = 81
const HEIGHT = 81
const GRAY = { r: 0x99, g: 0x99, b: 0x99 }
const GREEN = { r: 0x4C, g: 0xAF, b: 0x50 }

// ====== PNG 原始字节生成 ======

function createPNG(pixels) {
  // 将 RGBA 像素数组转为带滤波的原始数据
  const rawData = Buffer.alloc(HEIGHT * (1 + WIDTH * 4))
  for (let y = 0; y < HEIGHT; y++) {
    rawData[y * (1 + WIDTH * 4)] = 0 // 无滤波
    for (let x = 0; x < WIDTH; x++) {
      const idx = y * WIDTH + x
      const offset = y * (1 + WIDTH * 4) + 1 + x * 4
      rawData[offset] = pixels[idx * 4]     // R
      rawData[offset + 1] = pixels[idx * 4 + 1] // G
      rawData[offset + 2] = pixels[idx * 4 + 2] // B
      rawData[offset + 3] = pixels[idx * 4 + 3] // A
    }
  }

  const deflated = zlib.deflateSync(rawData)

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(WIDTH, 0)
  ihdr.writeUInt32BE(HEIGHT, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 6  // color type: RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr)

  // IDAT
  const idatChunk = makeChunk('IDAT', deflated)

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk])
}

function makeChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)

  const crcData = Buffer.concat([typeBuffer, data])
  const crc = crc32(crcData)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc, 0)

  return Buffer.concat([length, typeBuffer, data, crcBuf])
}

// CRC32 实现
const crcTable = []
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
  }
  crcTable[n] = c
}

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

// ====== 图标绘制函数 ======

function fillPixels(color) {
  const pixels = Buffer.alloc(WIDTH * HEIGHT * 4)
  for (let i = 0; i < WIDTH * HEIGHT; i++) {
    pixels[i * 4] = color.r
    pixels[i * 4 + 1] = color.g
    pixels[i * 4 + 2] = color.b
    pixels[i * 4 + 3] = 255
  }
  return pixels
}

function drawCircle(pixels, cx, cy, r, color) {
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const dx = x - cx, dy = y - cy
      if (dx * dx + dy * dy <= r * r) {
        const idx = (y * WIDTH + x) * 4
        pixels[idx] = color.r
        pixels[idx + 1] = color.g
        pixels[idx + 2] = color.b
        pixels[idx + 3] = 255
      }
    }
  }
}

function drawRect(pixels, x1, y1, x2, y2, color) {
  for (let y = Math.max(0, y1); y <= Math.min(HEIGHT - 1, y2); y++) {
    for (let x = Math.max(0, x1); x <= Math.min(WIDTH - 1, x2); x++) {
      const idx = (y * WIDTH + x) * 4
      pixels[idx] = color.r
      pixels[idx + 1] = color.g
      pixels[idx + 2] = color.b
      pixels[idx + 3] = 255
    }
  }
}

function drawLineH(pixels, y, x1, x2, color) {
  drawRect(pixels, x1, y, x2, y, color)
}

// ====== 图标形状定义 ======

function drawHomeIcon(fgColor) {
  const bg = { r: 0, g: 0, b: 0, a: 0 }
  const pixels = Buffer.alloc(WIDTH * HEIGHT * 4)
  for (let i = 0; i < WIDTH * HEIGHT; i++) {
    pixels[i * 4 + 3] = 0 // 透明背景
  }
  // 房顶三角形
  const roof = [
    [41, 12], [20, 35], [62, 35]
  ]
  fillTriangle(pixels, roof, fgColor)
  // 房屋主体
  drawRect(pixels, 24, 35, 58, 66, fgColor)
  // 门
  const doorBg = { r: 255, g: 255, b: 255 }
  drawRect(pixels, 36, 47, 46, 66, doorBg)
  return pixels
}

function drawShopIcon(fgColor) {
  const pixels = Buffer.alloc(WIDTH * HEIGHT * 4)
  for (let i = 0; i < WIDTH * HEIGHT; i++) pixels[i * 4 + 3] = 0
  // 购物袋主体
  drawRect(pixels, 22, 28, 59, 68, fgColor)
  // 袋口提手
  drawRect(pixels, 28, 15, 53, 27, fgColor)
  // 中间镂空
  const bg = { r: 0, g: 0, b: 0 }
  drawRect(pixels, 30, 35, 51, 62, bg)
  // 提手镂空
  drawRect(pixels, 34, 18, 47, 27, bg)
  return pixels
}

function drawFindIcon(fgColor) {
  const pixels = Buffer.alloc(WIDTH * HEIGHT * 4)
  for (let i = 0; i < WIDTH * HEIGHT; i++) pixels[i * 4 + 3] = 0
  // 放大镜圆圈
  drawCircle(pixels, 34, 34, 18, fgColor)
  // 中间镂空
  const bg = { r: 0, g: 0, b: 0 }
  drawCircle(pixels, 34, 34, 11, bg)
  // 放大镜手柄
  drawRect(pixels, 47, 42, 64, 50, fgColor)
  return pixels
}

function drawStudyIcon(fgColor) {
  const pixels = Buffer.alloc(WIDTH * HEIGHT * 4)
  for (let i = 0; i < WIDTH * HEIGHT; i++) pixels[i * 4 + 3] = 0
  // 书本主体
  drawRect(pixels, 18, 18, 63, 62, fgColor)
  // 书脊
  const spine = { r: 255, g: 255, b: 255 }
  drawRect(pixels, 37, 18, 44, 62, spine)
  // 书本横线
  drawLineH(pixels, 30, 22, 35, spine)
  drawLineH(pixels, 40, 22, 35, spine)
  drawLineH(pixels, 50, 22, 35, spine)
  return pixels
}

function drawUserIcon(fgColor) {
  const pixels = Buffer.alloc(WIDTH * HEIGHT * 4)
  for (let i = 0; i < WIDTH * HEIGHT; i++) pixels[i * 4 + 3] = 0
  // 头部圆形
  drawCircle(pixels, 41, 25, 15, fgColor)
  // 身体半圆
  drawCircle(pixels, 41, 72, 26, fgColor)
  // 身体上方切平
  const bg = { r: 0, g: 0, b: 0 }
  drawRect(pixels, 0, 0, 81, 39, bg)
  return pixels
}

function fillTriangle(pixels, vertices, color) {
  const [v0, v1, v2] = vertices
  const minX = Math.max(0, Math.min(v0[0], v1[0], v2[0]))
  const maxX = Math.min(WIDTH - 1, Math.max(v0[0], v1[0], v2[0]))
  const minY = Math.max(0, Math.min(v0[1], v1[1], v2[1]))
  const maxY = Math.min(HEIGHT - 1, Math.max(v0[1], v1[1], v2[1]))
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (pointInTriangle(x, y, v0, v1, v2)) {
        const idx = (y * WIDTH + x) * 4
        pixels[idx] = color.r
        pixels[idx + 1] = color.g
        pixels[idx + 2] = color.b
        pixels[idx + 3] = 255
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

// ====== 生成所有图标 ======

const icons = [
  { name: 'home', draw: drawHomeIcon },
  { name: 'shop', draw: drawShopIcon },
  { name: 'find', draw: drawFindIcon },
  { name: 'study', draw: drawStudyIcon },
  { name: 'user', draw: drawUserIcon },
]

const outDir = path.join(__dirname, '..', 'images', 'tab')

icons.forEach(({ name, draw }) => {
  // 默认态（灰色）
  const grayPng = createPNG(draw(GRAY))
  fs.writeFileSync(path.join(outDir, `${name}.png`), grayPng)
  console.log(`✅ 生成 images/tab/${name}.png (灰色)`)

  // 选中态（绿色）
  const greenPng = createPNG(draw(GREEN))
  fs.writeFileSync(path.join(outDir, `${name}-active.png`), greenPng)
  console.log(`✅ 生成 images/tab/${name}-active.png (绿色)`)
})

console.log('\n🎉 所有 TabBar 图标生成完毕！共 10 个文件')
