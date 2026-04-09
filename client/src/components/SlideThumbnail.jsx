import { useEffect, useRef } from 'react'

const CANVAS_W = 4000
const CANVAS_H = 3000
const THUMB_W  = 192
const THUMB_H  = 144
const SCALE    = THUMB_W / CANVAS_W  // 0.048

function drawElements(ctx, elements) {
  for (const el of elements) {
    ctx.save()

    if (el.rotation) {
      const cx = el.x + (el.width  || 0) / 2
      const cy = el.y + (el.height || 0) / 2
      ctx.translate(cx, cy)
      ctx.rotate((el.rotation * Math.PI) / 180)
      ctx.translate(-cx, -cy)
    }

    if (el.type === 'rect') {
      if (el.fill && el.fill !== 'transparent') {
        ctx.fillStyle = el.fill
        ctx.fillRect(el.x, el.y, el.width, el.height)
      }
      if ((el.strokeWidth ?? 2) > 0) {
        ctx.strokeStyle = el.stroke || '#000'
        ctx.lineWidth   = el.strokeWidth ?? 2
        ctx.strokeRect(el.x, el.y, el.width, el.height)
      }
    }

    if (el.type === 'ellipse') {
      ctx.beginPath()
      ctx.ellipse(
        el.x + el.width / 2, el.y + el.height / 2,
        Math.abs(el.width / 2), Math.abs(el.height / 2),
        0, 0, Math.PI * 2
      )
      if (el.fill && el.fill !== 'transparent') { ctx.fillStyle = el.fill; ctx.fill() }
      if ((el.strokeWidth ?? 2) > 0) {
        ctx.strokeStyle = el.stroke || '#000'
        ctx.lineWidth   = el.strokeWidth ?? 2
        ctx.stroke()
      }
    }

    if (el.type === 'triangle') {
      ctx.beginPath()
      ctx.moveTo(el.x + el.width / 2, el.y)
      ctx.lineTo(el.x + el.width,     el.y + el.height)
      ctx.lineTo(el.x,                el.y + el.height)
      ctx.closePath()
      if (el.fill && el.fill !== 'transparent') { ctx.fillStyle = el.fill; ctx.fill() }
      if ((el.strokeWidth ?? 2) > 0) {
        ctx.strokeStyle = el.stroke || '#000'; ctx.lineWidth = el.strokeWidth ?? 2; ctx.stroke()
      }
    }

    if (el.type === 'hexagon') {
      const cx = el.x + el.width / 2, cy = el.y + el.height / 2
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a  = ((i * 60) - 30) * Math.PI / 180
        const px = cx + (el.width  / 2) * Math.cos(a)
        const py = cy + (el.height / 2) * Math.sin(a)
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.closePath()
      if (el.fill && el.fill !== 'transparent') { ctx.fillStyle = el.fill; ctx.fill() }
      if ((el.strokeWidth ?? 2) > 0) {
        ctx.strokeStyle = el.stroke || '#000'; ctx.lineWidth = el.strokeWidth ?? 2; ctx.stroke()
      }
    }

    if (el.type === 'stroke' && el.points?.length >= 4) {
      ctx.beginPath()
      ctx.moveTo(el.points[0], el.points[1])
      for (let i = 2; i < el.points.length - 1; i += 2) {
        ctx.lineTo(el.points[i], el.points[i + 1])
      }
      ctx.strokeStyle = el.color || '#000'
      ctx.lineWidth   = el.lineWidth || 2
      ctx.lineCap     = 'round'
      ctx.lineJoin    = 'round'
      ctx.stroke()
    }

    if (el.type === 'image' && el.src) {
      const img = thumbImgCache.get(el.src)
      if (img) {
        const nw = el.naturalWidth  ?? img.naturalWidth
        const nh = el.naturalHeight ?? img.naturalHeight
        const sx = el.cropX      ?? 0
        const sy = el.cropY      ?? 0
        const sw = el.cropWidth  ?? nw
        const sh = el.cropHeight ?? nh
        ctx.drawImage(img, sx, sy, sw, sh, el.x, el.y, el.width, el.height)
      }
    }

    if (el.type === 'text' && el.text) {
      const size  = el.fontSize || 16
      const style = el.fontStyle || 'normal'
      ctx.font      = `${style} ${size}px Inter, sans-serif`
      ctx.fillStyle = el.color || '#000'
      ctx.fillText(el.text, el.x, el.y + size)
    }

    ctx.restore()
  }
}

// Module-level image cache for thumbnails
const thumbImgCache = new Map()

function loadImage(src) {
  if (thumbImgCache.has(src)) return Promise.resolve(thumbImgCache.get(src))
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => { thumbImgCache.set(src, img); resolve(img) }
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export default function SlideThumbnail({ elements }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const render = async () => {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, THUMB_W, THUMB_H)
      if (!elements?.length) return

      // Pre-load all images
      const imageEls = elements.filter(el => el.type === 'image' && el.src)
      await Promise.all(imageEls.map(el => loadImage(el.src)))

      ctx.save()
      ctx.scale(SCALE, SCALE)
      drawElements(ctx, elements)
      ctx.restore()
    }

    render()
  }, [elements])

  return (
    <canvas
      ref={canvasRef}
      width={THUMB_W}
      height={THUMB_H}
      style={{ display: 'block', width: '100%', height: '100%', borderRadius: 3 }}
    />
  )
}
