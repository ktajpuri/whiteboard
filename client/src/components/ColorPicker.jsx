import { useState } from 'react'
import { useCanvasStore, PRESET_COLORS_LIST } from '../store/canvasStore'

export default function ColorPicker() {
  const { activeColor, recentColors, setActiveColor } = useCanvasStore()
  const [showCustom, setShowCustom] = useState(false)
  const [hex, setHex] = useState(activeColor)

  const apply = (color) => {
    setActiveColor(color)
    setHex(color)
  }

  return (
    <div className="color-picker">
      <div className="color-swatches">
        {PRESET_COLORS_LIST.map(c => (
          <button
            key={c}
            className={`swatch ${activeColor === c ? 'active' : ''}`}
            style={{ background: c, border: c === '#ffffff' ? '1px solid #ccc' : undefined }}
            onClick={() => apply(c)}
            title={c}
          />
        ))}
        <button className="swatch swatch-custom" onClick={() => setShowCustom(v => !v)} title="Custom color">+</button>
      </div>

      {recentColors.length > 0 && (
        <div className="color-recents">
          <span className="label">Recent</span>
          {recentColors.map((c, i) => (
            <button key={i} className={`swatch ${activeColor === c ? 'active' : ''}`} style={{ background: c }} onClick={() => apply(c)} />
          ))}
        </div>
      )}

      {showCustom && (
        <div className="custom-picker">
          <input type="color" value={hex} onChange={e => setHex(e.target.value)} />
          <input
            type="text"
            value={hex}
            maxLength={7}
            onChange={e => {
              setHex(e.target.value)
              if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) apply(e.target.value)
            }}
          />
          <button onClick={() => apply(hex)}>Apply</button>
        </div>
      )}
    </div>
  )
}
