import { useEffect, useState } from 'react'
import { Image as KonvaImage } from 'react-konva'

// Module-level cache so the same src is only decoded once per session
const imgCache = new Map()

function useKonvaImage(src) {
  const [img, setImg] = useState(() => imgCache.get(src) ?? null)
  useEffect(() => {
    if (!src) return
    if (imgCache.has(src)) { setImg(imgCache.get(src)); return }
    const image  = new window.Image()
    image.onload = () => { imgCache.set(src, image); setImg(image) }
    image.src    = src
  }, [src])
  return img
}

export default function ImageElement({ element, draggable, onClick, onDragEnd, onTransformEnd }) {
  const img = useKonvaImage(element.src)
  if (!img) return null   // loading…

  const nw = element.naturalWidth  ?? img.naturalWidth
  const nh = element.naturalHeight ?? img.naturalHeight

  return (
    <KonvaImage
      id={element.id}
      image={img}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation || 0}
      crop={{
        x:      element.cropX      ?? 0,
        y:      element.cropY      ?? 0,
        width:  element.cropWidth  ?? nw,
        height: element.cropHeight ?? nh,
      }}
      draggable={draggable}
      onClick={onClick}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    />
  )
}
