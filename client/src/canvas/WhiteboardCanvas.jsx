import { useRef, useEffect } from 'react'
import { Stage, Layer, Rect, Transformer } from 'react-konva'
import { v4 as uuidv4 } from 'uuid'
import { useCanvasStore } from '../store/canvasStore'
import { useSlidesStore } from '../store/slidesStore'
import { useHistoryStore } from '../store/historyStore'
import ShapeElement from './elements/ShapeElement'
import StrokeElement from './elements/StrokeElement'
import TextElement from './elements/TextElement'
import ImageElement from './elements/ImageElement'

const CANVAS_W = 4000
const CANVAS_H = 3000
const PEN_SIZES = { S: 2, M: 4, L: 8, XL: 16 }
const SHAPE_TOOLS = ['rect', 'ellipse', 'triangle', 'hexagon']

export default function WhiteboardCanvas({ width, height }) {
  const stageRef = useRef()
  const trRef = useRef()
  const isPointerDown = useRef(false)
  const drawingId = useRef(null)
  const shapeStart = useRef(null)
  const clipboard = useRef([])

  // Read tool state via refs so event handlers never go stale
  const toolRef = useRef('select')
  const penSizeRef = useRef('M')
  const eraserSizeRef = useRef('M')
  const activeColorRef = useRef('#000000')
  const zoomRef = useRef(1)
  const panXRef = useRef(0)
  const panYRef = useRef(0)
  const selectedIdsRef = useRef([])
  const editingTextIdRef = useRef(null)

  const {
    activeTool, penSize, eraserSize, activeColor,
    zoom, panX, panY, selectedIds, editingTextId,
    setZoom, setPan, setSelected, clearSelection, addToSelection, setEditingText
  } = useCanvasStore()

  // Keep refs in sync with React state
  useEffect(() => { toolRef.current = activeTool }, [activeTool])
  useEffect(() => { penSizeRef.current = penSize }, [penSize])
  useEffect(() => { eraserSizeRef.current = eraserSize }, [eraserSize])
  useEffect(() => { activeColorRef.current = activeColor }, [activeColor])
  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { panXRef.current = panX }, [panX])
  useEffect(() => { panYRef.current = panY }, [panY])
  useEffect(() => { selectedIdsRef.current = selectedIds }, [selectedIds])
  useEffect(() => { editingTextIdRef.current = editingTextId }, [editingTextId])

  const { updateSlideElements } = useSlidesStore()
  const { push: pushHistory, undo, redo } = useHistoryStore()

  // Always read fresh elements directly from Zustand — fixes stale closure bugs
  const getElements = () => useSlidesStore.getState().getActiveSlide()?.elements || []
  const getSlideId = () => useSlidesStore.getState().activeSlideId

  const commit = (newElements) => {
    const slideId = getSlideId()
    if (!slideId) return
    pushHistory(slideId, getElements())
    updateSlideElements(slideId, newElements)
  }

  const updateLive = (newElements) => {
    const slideId = getSlideId()
    if (!slideId) return
    updateSlideElements(slideId, newElements)
  }

  // Sync Transformer nodes whenever selection or elements change
  const slide = useSlidesStore(s => s.getActiveSlide())
  const elements = slide?.elements || []

  useEffect(() => {
    if (!trRef.current || !stageRef.current) return
    const nodes = selectedIds.map(id => stageRef.current.findOne(`#${id}`)).filter(Boolean)
    trRef.current.nodes(nodes)
    trRef.current.getLayer()?.batchDraw()
  }, [selectedIds, elements])

  // Keyboard shortcuts — read fresh state from Zustand/refs
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return
      const mod = e.metaKey || e.ctrlKey
      const ids = selectedIdsRef.current
      const els = getElements()
      const slideId = getSlideId()

      if ((e.key === 'Delete' || e.key === 'Backspace') && ids.length) {
        commit(els.filter(el => !ids.includes(el.id)))
        clearSelection()
        return
      }
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        const prev = undo(slideId, els)
        if (prev !== null) updateSlideElements(slideId, prev)
      }
      if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        const next = redo(slideId, els)
        if (next !== null) updateSlideElements(slideId, next)
      }
      if (mod && e.key === 'c') {
        clipboard.current = els.filter(el => ids.includes(el.id))
      }
      if (mod && e.key === 'v' && clipboard.current.length) {
        const pasted = clipboard.current.map(el => ({
          ...el, id: uuidv4(),
          x: (el.x || 0) + 20,
          y: (el.y || 0) + 20
        }))
        commit([...els, ...pasted])
        setSelected(pasted.map(p => p.id))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, []) // no deps — reads fresh state via refs/getState()

  const getCanvasPos = () => {
    const pos = stageRef.current.getPointerPosition()
    return {
      x: (pos.x - panXRef.current) / zoomRef.current,
      y: (pos.y - panYRef.current) / zoomRef.current
    }
  }

  const handleWheel = (e) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    const oldZoom = zoomRef.current
    const pointer = stage.getPointerPosition()

    if (e.evt.ctrlKey || e.evt.metaKey) {
      const factor = e.evt.deltaY < 0 ? 1.1 : 0.9
      const newZoom = Math.min(5, Math.max(0.1, oldZoom * factor))
      const mousePointTo = {
        x: (pointer.x - panXRef.current) / oldZoom,
        y: (pointer.y - panYRef.current) / oldZoom
      }
      setZoom(newZoom)
      setPan(pointer.x - mousePointTo.x * newZoom, pointer.y - mousePointTo.y * newZoom)
    } else {
      setPan(panXRef.current - e.evt.deltaX, panYRef.current - e.evt.deltaY)
    }
  }

  const handleMouseDown = (e) => {
    if (e.evt.button === 1) return
    isPointerDown.current = true
    const tool = toolRef.current
    const target = e.target
    const stage = stageRef.current
    const pos = getCanvasPos()
    const els = getElements()

    if (tool === 'select') {
      if (target === stage || target.name() === 'background') clearSelection()
      return
    }

    if (tool === 'pen') {
      const id = uuidv4()
      drawingId.current = id
      updateLive([...els, {
        id, type: 'stroke', specVersion: '1.0',
        points: [pos.x, pos.y],
        color: activeColorRef.current,
        lineWidth: PEN_SIZES[penSizeRef.current] || 4
      }])
      return
    }

    if (tool === 'eraser') {
      const hit = stage.getIntersection(stage.getPointerPosition())
      if (hit?.id() && hit.name() !== 'background') {
        commit(els.filter(el => el.id !== hit.id()))
      }
      return
    }

    if (tool === 'text') {
      const hit = stage.getIntersection(stage.getPointerPosition())
      if (hit?.id() && els.find(el => el.id === hit.id() && el.type === 'text')) {
        setEditingText(hit.id())
        return
      }
      const id = uuidv4()
      commit([...els, {
        id, type: 'text', specVersion: '1.0',
        x: pos.x, y: pos.y, width: 200,
        text: '', fontSize: 16, fontStyle: 'normal', color: activeColorRef.current
      }])
      setEditingText(id)
      return
    }

    if (tool === 'bucket') {
      const hit = stage.getIntersection(stage.getPointerPosition())
      if (hit?.id()) {
        commit(els.map(el => el.id === hit.id() ? { ...el, fill: activeColorRef.current } : el))
      }
      return
    }

    if (SHAPE_TOOLS.includes(tool)) {
      shapeStart.current = pos
      const id = uuidv4()
      drawingId.current = id
      updateLive([...els, {
        id, type: tool, specVersion: '1.0',
        x: pos.x, y: pos.y, width: 0, height: 0,
        rotation: 0, fill: 'transparent',
        stroke: activeColorRef.current, strokeWidth: 2
      }])
    }
  }

  const handleMouseMove = () => {
    if (!isPointerDown.current) return
    const tool = toolRef.current
    const pos = getCanvasPos()

    if (tool === 'pen' && drawingId.current) {
      // Read fresh elements every call — avoids stale closure losing points
      const els = getElements()
      updateLive(els.map(el =>
        el.id === drawingId.current
          ? { ...el, points: [...el.points, pos.x, pos.y] }
          : el
      ))
      return
    }

    if (tool === 'eraser') {
      const hit = stageRef.current.getIntersection(stageRef.current.getPointerPosition())
      if (hit?.id() && hit.name() !== 'background') {
        commit(getElements().filter(el => el.id !== hit.id()))
      }
      return
    }

    if (SHAPE_TOOLS.includes(tool) && shapeStart.current && drawingId.current) {
      const dx = pos.x - shapeStart.current.x
      const dy = pos.y - shapeStart.current.y
      const w = Math.abs(dx)
      const h = Math.abs(dy)
      const x = dx >= 0 ? shapeStart.current.x : pos.x
      const y = dy >= 0 ? shapeStart.current.y : pos.y
      // Read fresh elements to avoid overwriting with stale state
      const els = getElements()
      updateLive(els.map(el =>
        el.id === drawingId.current ? { ...el, x, y, width: w, height: h } : el
      ))
    }
  }

  const handleMouseUp = () => {
    if (!isPointerDown.current) return
    isPointerDown.current = false
    const tool = toolRef.current
    const els = getElements()

    if (tool === 'pen' && drawingId.current) {
      const stroke = els.find(el => el.id === drawingId.current)
      if (stroke) commit(els) // finalize current state as history checkpoint
      drawingId.current = null
      return
    }

    if (SHAPE_TOOLS.includes(tool) && drawingId.current) {
      const shape = els.find(el => el.id === drawingId.current)
      if (shape && shape.width < 5 && shape.height < 5) {
        updateLive(els.filter(el => el.id !== drawingId.current))
      } else if (shape) {
        commit(els)
      }
      drawingId.current = null
      shapeStart.current = null
    }
  }

  const handleElementClick = (e) => {
    if (toolRef.current !== 'select') return
    const id = e.target.id()
    if (e.evt.shiftKey) addToSelection(id)
    else setSelected([id])
  }

  const handleDragEnd = (e) => {
    const node = e.target
    const id = node.id()
    const els = getElements()
    commit(els.map(el => {
      if (el.id !== id) return el
      // Ellipse node.x/y is center — convert back to top-left
      if (el.type === 'ellipse') {
        return { ...el, x: node.x() - el.width / 2, y: node.y() - el.height / 2 }
      }
      return { ...el, x: node.x(), y: node.y() }
    }))
  }

  const handleTransformEnd = (e) => {
    const node = e.target
    const id = node.id()
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    const els = getElements()
    commit(els.map(el => {
      if (el.id !== id) return el
      const newWidth = Math.max(5, (el.width || 0) * scaleX)
      const newHeight = Math.max(5, (el.height || 0) * scaleY)
      // Ellipse: node.x/y is center, convert to top-left
      const newX = el.type === 'ellipse' ? node.x() - newWidth / 2 : node.x()
      const newY = el.type === 'ellipse' ? node.y() - newHeight / 2 : node.y()
      return { ...el, x: newX, y: newY, width: newWidth, height: newHeight, rotation: node.rotation() }
    }))
  }

  const handleTextChange = (id, text) => {
    const els = getElements()
    commit(els.map(el => el.id === id ? { ...el, text } : el))
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
        <Rect
          name="background"
          x={0} y={0}
          width={CANVAS_W} height={CANVAS_H}
          fill="#ffffff"
          shadowColor="rgba(0,0,0,0.15)"
          shadowBlur={20}
          shadowOffset={{ x: 2, y: 2 }}
        />

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
          if (el.type === 'image') {
            return (
              <ImageElement
                key={el.id}
                element={el}
                draggable={isDraggable}
                onClick={handleElementClick}
                onDragEnd={handleDragEnd}
                onTransformEnd={handleTransformEnd}
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
