import { Line } from 'react-konva'

export default function StrokeElement({ element, draggable, onClick, onDragEnd }) {
  return (
    <Line
      id={element.id}
      points={element.points}
      stroke={element.color || '#000000'}
      strokeWidth={element.lineWidth || 4}
      tension={0.4}
      lineCap="round"
      lineJoin="round"
      globalCompositeOperation="source-over"
      draggable={draggable}
      onClick={onClick}
      onDragEnd={onDragEnd}
    />
  )
}
