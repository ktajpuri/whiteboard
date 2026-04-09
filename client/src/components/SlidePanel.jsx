import { useState, useRef } from 'react'
import { useSlidesStore } from '../store/slidesStore'

export default function SlidePanel() {
  const {
    slides, activeSlideId,
    setActiveSlide, addSlide, duplicateSlide, deleteSlide, renameSlide, reorderSlides
  } = useSlidesStore()

  const [editingId, setEditingId] = useState(null)
  const [editLabel, setEditLabel] = useState('')
  const [contextMenu, setContextMenu] = useState(null) // { id, x, y }
  const [confirmDelete, setConfirmDelete] = useState(null)
  const dragItem = useRef(null)
  const dragOver = useRef(null)

  const startRename = (slide) => {
    setEditingId(slide.id)
    setEditLabel(slide.label)
  }

  const commitRename = () => {
    if (editingId && editLabel.trim()) renameSlide(editingId, editLabel.trim())
    setEditingId(null)
  }

  const handleDragStart = (idx) => { dragItem.current = idx }
  const handleDragEnter = (idx) => { dragOver.current = idx }
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null) return
    const reordered = [...slides]
    const [moved] = reordered.splice(dragItem.current, 1)
    reordered.splice(dragOver.current, 0, moved)
    reorderSlides(reordered)
    dragItem.current = null
    dragOver.current = null
  }

  const handleContextMenu = (e, id) => {
    e.preventDefault()
    setContextMenu({ id, x: e.clientX, y: e.clientY })
  }

  return (
    <div className="slide-panel" onClick={() => setContextMenu(null)}>
      <div className="slide-list">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`slide-thumb ${slide.id === activeSlideId ? 'active' : ''}`}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragEnter={() => handleDragEnter(idx)}
            onDragEnd={handleDragEnd}
            onDragOver={e => e.preventDefault()}
            onClick={() => setActiveSlide(slide.id)}
            onContextMenu={e => handleContextMenu(e, slide.id)}
            onDoubleClick={() => startRename(slide)}
          >
            <div className="thumb-preview">
              <span className="thumb-number">{idx + 1}</span>
            </div>
            {editingId === slide.id ? (
              <input
                className="thumb-label-input"
                value={editLabel}
                autoFocus
                onChange={e => setEditLabel(e.target.value)}
                onBlur={commitRename}
                onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingId(null) }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span className="thumb-label">{slide.label}</span>
            )}
          </div>
        ))}
      </div>

      <button className="add-slide-btn" onClick={addSlide} title="Add slide">+ New Slide</button>

      {slides.length > 50 && (
        <div className="perf-warning">⚠ Performance may be affected with 50+ slides</div>
      )}

      {contextMenu && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button onClick={() => { duplicateSlide(contextMenu.id); setContextMenu(null) }}>Duplicate</button>
          <button onClick={() => { setConfirmDelete(contextMenu.id); setContextMenu(null) }} className="danger">Delete</button>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <p>Delete this slide? This cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={() => { deleteSlide(confirmDelete); setConfirmDelete(null) }} className="danger">Delete</button>
              <button onClick={() => setConfirmDelete(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
