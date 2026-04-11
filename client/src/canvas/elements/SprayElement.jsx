import { Shape } from 'react-konva'

export default function SprayElement({ element, draggable, onClick, onDragEnd }) {
  const { id, dots = [], color = '#000000', dotSize = 2 } = element
  const r = dotSize / 2

  return (
    <Shape
      id={id}
      fill={color}
      draggable={draggable}
      onClick={onClick}
      onDragEnd={onDragEnd}
      sceneFunc={(ctx, shape) => {
        ctx.beginPath()
        for (let i = 0; i < dots.length; i++) {
          const d = dots[i]
          ctx.moveTo(d.x + r, d.y)
          ctx.arc(d.x, d.y, r, 0, Math.PI * 2)
        }
        ctx.fillShape(shape)
      }}
      hitFunc={(ctx, shape) => {
        // Hit detection: rough bounding box of all dots
        if (dots.length === 0) return
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        for (const d of dots) {
          if (d.x < minX) minX = d.x
          if (d.y < minY) minY = d.y
          if (d.x > maxX) maxX = d.x
          if (d.y > maxY) maxY = d.y
        }
        ctx.beginPath()
        ctx.rect(minX - r, minY - r, maxX - minX + dotSize, maxY - minY + dotSize)
        ctx.fillShape(shape)
      }}
    />
  )
}
