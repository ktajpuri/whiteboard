import { useState, useRef, useEffect, useCallback } from 'react'
import { useCanvasStore, PRESET_COLORS_LIST } from '../store/canvasStore'

// 8 key colors shown inline in the toolbar
const QUICK_COLORS = ['#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6']

export default function ColorPicker() {
  const { activeColor, recentColors, setActiveColor } = useCanvasStore()
  const [showPanel, setShowPanel] = useState(false)
  const [hex, setHex] = useState(activeColor)
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })
  const chipRef = useRef(null)

  const apply = (color) => {
    setActiveColor(color)
    setHex(color)
  }

  const openPanel = () => {
    if (chipRef.current) {
      const rect = chipRef.current.getBoundingClientRect()
      setPanelPos({ top: rect.bottom + 8, left: rect.left })
    }
    setShowPanel(v => !v)
  }

  // Close on outside click
  useEffect(() => {
    if (!showPanel) return
    const handler = (e) => {
      if (!e.target.closest('.color-panel') && !e.target.closest('.color-chip-btn')) {
        setShowPanel(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showPanel])

  return (
    <div className="color-picker">
      {/* Active color chip */}
      <button
        ref={chipRef}
        className="color-chip-btn"
        onClick={openPanel}
        title={`Color: ${activeColor}`}
        style={{ '--chip-color': activeColor }}
      >
        <span
          className="color-chip-swatch"
          style={{
            background: activeColor,
            boxShadow: activeColor === '#ffffff' ? 'inset 0 0 0 1px rgba(255,255,255,.4)' : undefined
          }}
        />
        <svg width="8" height="8" viewBox="0 0 10 6" fill="none" style={{ color: 'rgba(255,255,255,.5)', flexShrink: 0 }}>
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Quick preset swatches */}
      <div className="quick-swatches">
        {QUICK_COLORS.map(c => (
          <button
            key={c}
            className={`swatch ${activeColor === c ? 'active' : ''} ${c === '#ffffff' ? 'swatch-white' : ''}`}
            style={{ background: c }}
            onClick={() => apply(c)}
            title={c}
          />
        ))}
      </div>

      {/* Full color panel (popover) */}
      {showPanel && (
        <div
          className="color-panel"
          style={{ position: 'fixed', top: panelPos.top, left: panelPos.left, zIndex: 300 }}
        >
          <div className="color-panel-section">
            <div className="color-panel-label">Colors</div>
            <div className="color-panel-swatches">
              {PRESET_COLORS_LIST.map(c => (
                <button
                  key={c}
                  className={`swatch-lg ${activeColor === c ? 'active' : ''} ${c === '#ffffff' ? 'swatch-white' : ''}`}
                  style={{ background: c }}
                  onClick={() => { apply(c); setShowPanel(false) }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {recentColors.length > 0 && (
            <div className="color-panel-section">
              <div className="color-panel-label">Recent</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {recentColors.slice(0, 8).map((c, i) => (
                  <button
                    key={i}
                    className={`swatch-lg ${activeColor === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => { apply(c); setShowPanel(false) }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="color-panel-section">
            <div className="color-panel-label">Custom</div>
            <div className="custom-picker">
              <input
                type="color"
                value={hex}
                onChange={e => { setHex(e.target.value); apply(e.target.value) }}
              />
              <input
                type="text"
                value={hex}
                maxLength={7}
                placeholder="#000000"
                onChange={e => {
                  setHex(e.target.value)
                  if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) apply(e.target.value)
                }}
              />
              <button
                className="custom-picker-apply"
                onClick={() => { apply(hex); setShowPanel(false) }}
              >Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
