import { Text } from 'react-konva'

export default function StampElement({ element, draggable, onClick, onDragEnd, onTransformEnd }) {
  const size = element.size || 80
  return (
    <Text
      id={element.id}
      x={element.x}
      y={element.y}
      text={element.content}
      fontSize={size}
      // Konva Text pads slightly — keep width/height unconstrained
      draggable={draggable}
      onClick={onClick}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    />
  )
}
