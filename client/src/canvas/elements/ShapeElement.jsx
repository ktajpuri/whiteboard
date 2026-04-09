import { Rect, Ellipse, Line } from 'react-konva'

const trianglePoints = (w, h) => [w / 2, 0, w, h, 0, h]

const hexagonPoints = (w, h) => {
  const cx = w / 2, cy = h / 2, rx = w / 2, ry = h / 2
  const pts = []
  for (let i = 0; i < 6; i++) {
    pts.push(cx + rx * Math.cos(((i * 60) - 30) * Math.PI / 180))
    pts.push(cy + ry * Math.sin(((i * 60) - 30) * Math.PI / 180))
  }
  return pts
}

export default function ShapeElement({ element, draggable, onClick, onDragEnd, onTransformEnd }) {
  const common = {
    id: element.id,
    x: element.x,
    y: element.y,
    rotation: element.rotation || 0,
    fill: element.fill || 'transparent',
    stroke: element.stroke || '#000000',
    strokeWidth: element.strokeWidth ?? 2,
    draggable,
    onClick,
    onDragEnd,
    onTransformEnd
  }

  if (element.type === 'rect') {
    return <Rect {...common} width={element.width} height={element.height} />
  }
  if (element.type === 'ellipse') {
    return (
      <Ellipse
        {...common}
        x={element.x + element.width / 2}
        y={element.y + element.height / 2}
        radiusX={element.width / 2}
        radiusY={element.height / 2}
      />
    )
  }
  if (element.type === 'triangle') {
    return (
      <Line
        {...common}
        points={trianglePoints(element.width, element.height)}
        closed
      />
    )
  }
  if (element.type === 'hexagon') {
    return (
      <Line
        {...common}
        points={hexagonPoints(element.width, element.height)}
        closed
      />
    )
  }
  return null
}
