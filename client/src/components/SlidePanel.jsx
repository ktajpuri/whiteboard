import { useState, useRef } from 'react'
import { useSlidesStore } from '../store/slidesStore'

export default function SlidePanel() {
  const {
    slides, activeSlideId,
    setActiveSlide, addSlide, duplicateSlide, deleteSlide, renameSlide, reorderSlides
  } = useSlidesStore()

  const [editingId, setEditingId]     = useState(null)
  const [editLabel, setEditLabel]     = useState('')
  const [contextMenu, setContextMenu] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const dragItem = useRef(null)
  const dragOver = useRef(null)

  const startRename = (slide) => { setEditingId(slide.id); setEditLabel(slide.label) }
  const commitRename = () => {
    if (editingId && editLabel.trim()) renameSlide(editingId, editLabel.trim())
    setEditingId(null)
  }

  const handleDragStart = (idx) => { dragItem.current = idx }
  const handleDragEnter = (idx) => { dragOver.current = idx }
  const handleDragEnd   = () => {
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
      <div className="slide-panel-header">
        <span className="slide-panel-title">Pages</span>
        <span className="slide-count-badge">{slides.length}</span>
      </div>

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
            title="Double-click to rename · Right-click for options"
          >
            <div className="thumb-preview">
              <span className="thumb-number">{idx + 1}</span>
            </div>
            <div className="thumb-meta">
              <span className="thumb-index">{idx + 1}</span>
              {editingId === slide.id ? (
                <input
                  className="thumb-label-input"
                  value={editLabel}
                  autoFocus
                  onChange={e => setEditLabel(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitRename()
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className="thumb-label">{slide.label}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <button className="add-slide-btn" onClick={addSlide}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        New Page
      </button>

      {slides.length > 50 && (
        <div className="perf-warning">Performance may be affected with 50+ pages</div>
      )}

      {contextMenu && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button onClick={() => { startRename(slides.find(s => s.id === contextMenu.id)); setContextMenu(null) }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Rename
          </button>
          <button onClick={() => { duplicateSlide(contextMenu.id); setContextMenu(null) }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Duplicate
          </button>
          <div className="context-menu-separator"/>
          <button className="danger" onClick={() => { setConfirmDelete(contextMenu.id); setContextMenu(null) }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            Delete
          </button>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal" style={{ minWidth: 320 }}>
            <div className="modal-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4h6v2"/></svg>
            </div>
            <div>
              <h3>Delete page?</h3>
              <p style={{ marginTop: 6 }}>This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button className="btn-danger" onClick={() => { deleteSlide(confirmDelete); setConfirmDelete(null) }}>Delete</button>
              <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
