import { useEffect, useRef } from 'react'
import { Text } from 'react-konva'
import { useCanvasStore } from '../../store/canvasStore'

export default function TextElement({ element, draggable, isEditing, onClick, onDragEnd, onTransformEnd, onTextChange }) {
  const textRef = useRef()
  const zoom = useCanvasStore(s => s.zoom)
  const panX = useCanvasStore(s => s.panX)
  const panY = useCanvasStore(s => s.panY)

  useEffect(() => {
    if (!isEditing || !textRef.current) return

    const node = textRef.current
    node.hide()

    const stage = node.getStage()
    const stageBox = stage.container().getBoundingClientRect()
    const nodePos = node.absolutePosition()

    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)

    textarea.value = element.text || ''
    textarea.style.cssText = `
      position: absolute;
      top: ${stageBox.top + nodePos.y}px;
      left: ${stageBox.left + nodePos.x}px;
      width: ${element.width * zoom}px;
      min-height: ${(element.fontSize || 16) * zoom * 1.5}px;
      font-size: ${(element.fontSize || 16) * zoom}px;
      font-family: sans-serif;
      font-style: ${element.fontStyle?.includes('italic') ? 'italic' : 'normal'};
      font-weight: ${element.fontStyle?.includes('bold') ? 'bold' : 'normal'};
      color: ${element.color || '#000000'};
      border: 1px dashed #666;
      padding: 2px;
      margin: 0;
      overflow: hidden;
      background: transparent;
      outline: none;
      resize: none;
      line-height: 1.4;
      transform-origin: left top;
    `
    textarea.focus()

    const finish = () => {
      onTextChange(textarea.value)
      node.show()
      document.body.removeChild(textarea)
    }

    textarea.addEventListener('blur', finish)
    textarea.addEventListener('keydown', e => {
      if (e.key === 'Escape') finish()
    })

    return () => {
      if (document.body.contains(textarea)) {
        onTextChange(textarea.value)
        node.show()
        document.body.removeChild(textarea)
      }
    }
  }, [isEditing])

  return (
    <Text
      ref={textRef}
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width || 200}
      text={element.text || ''}
      fontSize={element.fontSize || 16}
      fontStyle={element.fontStyle || 'normal'}
      fontFamily="sans-serif"
      fill={element.color || '#000000'}
      rotation={element.rotation || 0}
      draggable={draggable}
      onClick={onClick}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    />
  )
}
