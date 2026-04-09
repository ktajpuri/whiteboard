import { useRef, useEffect, useCallback } from 'react'
import { Stage, Layer, Rect, Transformer } from 'react-konva'
import { v4 as uuidv4 } from 'uuid'
import { useCanvasStore } from '../store/canvasStore'
import { useSlidesStore } from '../store/slidesStore'
import { useHistoryStore } from '../store/historyStore'
import ShapeElement from './elements/ShapeElement'
import StrokeElement from './elements/StrokeElement'
import TextElement from './elements/TextElement'

const CANVAS_W = 4000
const CANVAS_H = 3000
const PEN_SIZES = { S: 2, M: 4, L: 8, XL: 16 }
const ERASER_SIZES = { S: 10, M: 20, L: 40, XL: 80 }
const SHAPE_TOOLS = ['rect', 'ellipse', 'triangle', 'hexagon']

export default function WhiteboardCanvas({ width, height }) {
  const stageRef = useRef()
  const trRef = useRef()
  const isPointerDown = useRef(false)
  const drawingId = useRef(null)
  const shapeStart = useRef(null)
  const clipboard = useRef([])

  const {
    activeTool, penSize, eraserSize, activeColor,
    zoom, panX, panY, selectedIds, editingTextId,
    setZoom, setPan, setSelected, clearSelection, addToSelection, setEditingText
  } = useCanvasStore()

  const { getActiveSlide, updateSlideElements, activeSlideId } = useSlidesStore()
  const { push: pushHistory, undo, redo } = useHistoryStore()

  const slide = getActiveSlide()
  const elements = slide?.elements || []

  const commit = useCallback((newElements) => {
    if (!activeSlideId) return
    pushHistory(activeSlideId, elements)
    updateSlideElements(activeSlideId, newElements)
  }, [activeSlideId, elements, pushHistory, updateSlideElements])

  const updateLive = useCallback((newElements) => {
    if (!activeSlideId) return
    updateSlideElements(activeSlideId, newElements)
  }, [activeSlideId, updateSlideElements])

  // Sync Transformer with selection
  useEffect(() => {
    if (!trRef.current || !stageRef.current) return
    const stage = stageRef.current
    const nodes = selectedIds.map(id => stage.findOne(`#${id}`)).filter(Boolean)
    trRef.current.nodes(nodes)
    trRef.current.getLayer()?.batchDraw()
  }, [selectedIds, elements])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return
      const mod = e.metaKey || e.ctrlKey

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length) {
        commit(elements.filter(el => !selectedIds.includes(el.id)))
        clearSelection()
        return
      }
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        const prev = undo(activeSlideId, elements)
        if (prev !== null) updateSlideElements(activeSlideId, prev)
      }
      if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        const next = redo(activeSlideId, elements)
        if (next !== null) updateSlideElements(activeSlideId, next)
      }
      if (mod && e.key === 'c') {
        clipboard.current = elements.filter(el => selectedIds.includes(el.id))
      }
      if (mod && e.key === 'v' && clipboard.current.length) {
        const pasted = clipboard.current.map(el => ({
          ...el, id: uuidv4(),
          x: (el.x || 0) + 20,
          y: (el.y || 0) + 20
        }))
        commit([...elements, ...pasted])
        setSelected(pasted.map(p => p.id))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedIds, elements, activeSlideId])

  // Wheel: zoom + pan
  const handleWheel = (e) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    const oldZoom = zoom
    const pointer = stage.getPointerPosition()

    if (e.evt.ctrlKey || e.evt.metaKey) {
      const factor = e.evt.deltaY < 0 ? 1.1 : 0.9
      const newZoom = Math.min(5, Math.max(0.1, oldZoom * factor))
      const mousePointTo = { x: (pointer.x - panX) / oldZoom, y: (pointer.y - panY) / oldZoom }
      setZoom(newZoom)
      setPan(pointer.x - mousePointTo.x * newZoom, pointer.y - mousePointTo.y * newZoom)
    } else {
      setPan(panX - e.evt.deltaX, panY - e.evt.deltaY)
    }
  }

  const getCanvasPos = () => {
    const pos = stageRef.current.getPointerPosition()
    return { x: (pos.x - panX) / zoom, y: (pos.y - panY) / zoom }
  }

  const handleMouseDown = (e) => {
    const target = e.target
    const stage = stageRef.current
    isPointerDown.current = true

    // Middle-click or space+drag: pan (handled via CSS cursor + wheel)
    if (e.evt.button === 1) return

    const pos = getCanvasPos()

    if (activeTool === 'select') {
      if (target === stage || target.name() === 'background') {
        clearSelection()
      }
      return
    }

    if (activeTool === 'pen') {
      const id = uuidv4()
      drawingId.current = id
      const newStroke = {
        id, type: 'stroke', specVersion: '1.0',
        points: [pos.x, pos.y],
        color: activeColor,
        lineWidth: PEN_SIZES[penSize] || 4
      }
      updateLive([...elements, newStroke])
      return
    }

    if (activeTool === 'eraser') {
      const hit = stage.getIntersection(stage.getPointerPosition())
      if (hit && hit.id() && hit.name() !== 'background') {
        commit(elements.filter(el => el.id !== hit.id()))
      }
      return
    }

    if (activeTool === 'text') {
      const hit = stage.getIntersection(stage.getPointerPosition())
      if (hit && hit.id() && elements.find(el => el.id === hit.id() && el.type === 'text')) {
        setEditingText(hit.id())
        return
      }
      const id = uuidv4()
      const newText = {
        id, type: 'text', specVersion: '1.0',
        x: pos.x, y: pos.y, width: 200,
        text: '', fontSize: 16, fontStyle: 'normal', color: activeColor
      }
      commit([...elements, newText])
      setEditingText(id)
      return
    }

    if (activeTool === 'bucket') {
      const hit = stage.getIntersection(stage.getPointerPosition())
      if (hit && hit.id()) {
        commit(elements.map(el => el.id === hit.id() ? { ...el, fill: activeColor } : el))
      }
      return
    }

    if (SHAPE_TOOLS.includes(activeTool)) {
      shapeStart.current = pos
      const id = uuidv4()
      drawingId.current = id
      const newShape = {
        id, type: activeTool, specVersion: '1.0',
        x: pos.x, y: pos.y, width: 0, height: 0,
        rotation: 0, fill: 'transparent', stroke: activeColor, strokeWidth: 2
      }
      updateLive([...elements, newShape])
    }
  }

  const handleMouseMove = (e) => {
    if (!isPointerDown.current) return
    const pos = getCanvasPos()

    if (activeTool === 'pen' && drawingId.current) {
      updateLive(elements.map(el => el.id === drawingId.current
        ? { ...el, points: [...el.points, pos.x, pos.y] }
        : el
      ))
      return
    }

    if (activeTool === 'eraser') {
      const stage = stageRef.current
      const hit = stage.getIntersection(stage.getPointerPosition())
      if (hit && hit.id() && hit.name() !== 'background') {
        const eraserSize_ = ERASER_SIZES[eraserSize] || 20
        // simple proximity erase: remove element whose center is within eraser radius
        commit(elements.filter(el => {
          if (el.id !== hit.id()) return true
          return false
        }))
      }
      return
    }

    if (SHAPE_TOOLS.includes(activeTool) && shapeStart.current && drawingId.current) {
      const dx = pos.x - shapeStart.current.x
      const dy = pos.y - shapeStart.current.y
      const w = Math.abs(dx)
      const h = Math.abs(dy)
      const x = dx >= 0 ? shapeStart.current.x : pos.x
      const y = dy >= 0 ? shapeStart.current.y : pos.y
      updateLive(elements.map(el => el.id === drawingId.current
        ? { ...el, x, y, width: w, height: h }
        : el
      ))
    }
  }

  const handleMouseUp = () => {
    if (!isPointerDown.current) return
    isPointerDown.current = false

    if (activeTool === 'pen' && drawingId.current) {
      const stroke = elements.find(el => el.id === drawingId.current)
      if (stroke) commit([...elements.filter(el => el.id !== stroke.id), stroke])
      drawingId.current = null
      return
    }

    if (SHAPE_TOOLS.includes(activeTool) && drawingId.current) {
      const shape = elements.find(el => el.id === drawingId.current)
      if (shape && shape.width < 5 && shape.height < 5) {
        updateLive(elements.filter(el => el.id !== drawingId.current))
      } else if (shape) {
        commit(elements)
      }
      drawingId.current = null
      shapeStart.current = null
    }
  }

  const handleElementClick = (e) => {
    if (activeTool !== 'select') return
    const id = e.target.id()
    if (e.evt.shiftKey) {
      addToSelection(id)
    } else {
      setSelected([id])
    }
  }

  const handleDragEnd = (e) => {
    const id = e.target.id()
    const node = e.target
    commit(elements.map(el => el.id === id
      ? { ...el, x: node.x(), y: node.y() }
      : el
    ))
  }

  const handleTransformEnd = (e) => {
    const node = e.target
    const id = node.id()
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    commit(elements.map(el => {
      if (el.id !== id) return el
      if (el.type === 'stroke') {
        return { ...el, x: node.x(), y: node.y(), rotation: node.rotation() }
      }
      return {
        ...el,
        x: node.x(),
        y: node.y(),
        width: Math.max(5, (el.width || 0) * scaleX),
        height: Math.max(5, (el.height || 0) * scaleY),
        rotation: node.rotation()
      }
    }))
  }

  const handleTextChange = (id, text) => {
    commit(elements.map(el => el.id === id ? { ...el, text } : el))
    setEditingText(null)
  }

  const isDraggable = activeTool === 'select'

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      x={panX}
      y={panY}
      scaleX={zoom}
      scaleY={zoom}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ cursor: activeTool === 'pen' ? 'crosshair' : activeTool === 'eraser' ? 'cell' : 'default' }}
    >
      <Layer>
        {/* Canvas background */}
        <Rect
          name="background"
          x={0} y={0}
          width={CANVAS_W} height={CANVAS_H}
          fill="#ffffff"
          shadowColor="rgba(0,0,0,0.15)"
          shadowBlur={20}
          shadowOffset={{ x: 2, y: 2 }}
        />

        {/* Elements */}
        {elements.map(el => {
          if (el.type === 'stroke') {
            return (
              <StrokeElement
                key={el.id}
                element={el}
                draggable={isDraggable}
                onClick={handleElementClick}
                onDragEnd={handleDragEnd}
              />
            )
          }
          if (el.type === 'text') {
            return (
              <TextElement
                key={el.id}
                element={el}
                draggable={isDraggable}
                isEditing={editingTextId === el.id}
                onClick={handleElementClick}
                onDragEnd={handleDragEnd}
                onTransformEnd={handleTransformEnd}
                onTextChange={(text) => handleTextChange(el.id, text)}
              />
            )
          }
          return (
            <ShapeElement
              key={el.id}
              element={el}
              draggable={isDraggable}
              onClick={handleElementClick}
              onDragEnd={handleDragEnd}
              onTransformEnd={handleTransformEnd}
            />
          )
        })}

        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => newBox.width < 5 || newBox.height < 5 ? oldBox : newBox}
        />
      </Layer>
    </Stage>
  )
}
