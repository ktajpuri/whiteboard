import { useState, useRef, useEffect } from 'react'
import { useCanvasStore } from '../store/canvasStore'

const CATEGORIES = [
  {
    label: 'Smileys', icon: '😀',
    stamps: ['😀','😂','😍','🥰','😎','🤔','😢','😡','🤩','🥳','😴','🤯','🤭','😏','🥸','😇','🤗','😜','🫡','🤑'],
  },
  {
    label: 'Gestures', icon: '👍',
    stamps: ['👍','👎','👏','🙌','🤝','👋','✌️','🤞','👌','🤙','💪','🫶','🙏','✋','🤜','🤛','🫳','🫴','🤲','👐'],
  },
  {
    label: 'Animals', icon: '🐶',
    stamps: ['🐶','🐱','🐭','🐰','🦊','🐻','🐼','🐸','🦁','🐯','🐨','🦋','🐝','🦄','🐲','🦅','🐧','🦜','🐬','🐙'],
  },
  {
    label: 'Nature', icon: '🌸',
    stamps: ['🌸','🌺','🌻','🌹','🌈','⭐','🌟','💫','☀️','🌙','❄️','🌊','🍀','🌴','🌵','🍄','⚡','🌪️','🌋','🏔️'],
  },
  {
    label: 'Objects', icon: '🎯',
    stamps: ['💡','🔥','💎','🎯','🎨','🚀','⚡','🏆','🎭','📌','💰','🔮','🎲','🎸','⚽','🎮','🎺','🎻','🥁','🎤'],
  },
  {
    label: 'Symbols', icon: '❤️',
    stamps: ['❤️','💙','💚','💛','🧡','💜','🖤','🤍','💯','✅','❌','⚠️','💥','✨','🎉','🔔','📣','🚩','🏴','⚜️'],
  },
]

export default function StampPicker() {
  const { selectedStamp, setSelectedStamp } = useCanvasStore()
  const [showPanel, setShowPanel]       = useState(false)
  const [activeCategory, setActiveCategory] = useState(0)
  const [panelPos, setPanelPos]         = useState({ top: 0, left: 0 })
  const chipRef = useRef(null)

  const openPanel = () => {
    if (chipRef.current) {
      const rect = chipRef.current.getBoundingClientRect()
      setPanelPos({ top: rect.bottom + 8, left: rect.left })
    }
    setShowPanel(v => !v)
  }

  useEffect(() => {
    if (!showPanel) return
    const handler = (e) => {
      if (!e.target.closest('.stamp-panel') && !e.target.closest('.stamp-chip-btn')) {
        setShowPanel(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showPanel])

  return (
    <div className="stamp-picker">
      <button
        ref={chipRef}
        className="stamp-chip-btn"
        onClick={openPanel}
        title={`Stamp: ${selectedStamp}`}
      >
        <span className="stamp-chip-emoji">{selectedStamp}</span>
        <svg width="8" height="8" viewBox="0 0 10 6" fill="none"
          style={{ color: 'rgba(255,255,255,.5)', flexShrink: 0 }}>
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {showPanel && (
        <div
          className="stamp-panel"
          style={{ position: 'fixed', top: panelPos.top, left: panelPos.left, zIndex: 300 }}
        >
          <div className="stamp-panel-tabs">
            {CATEGORIES.map((cat, i) => (
              <button
                key={i}
                className={`stamp-tab ${activeCategory === i ? 'active' : ''}`}
                onClick={() => setActiveCategory(i)}
                title={cat.label}
              >{cat.icon}</button>
            ))}
          </div>
          <div className="stamp-panel-label">{CATEGORIES[activeCategory].label}</div>
          <div className="stamp-grid">
            {CATEGORIES[activeCategory].stamps.map((s, i) => (
              <button
                key={i}
                className={`stamp-btn ${selectedStamp === s ? 'active' : ''}`}
                onClick={() => { setSelectedStamp(s); setShowPanel(false) }}
                title={s}
              >{s}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
