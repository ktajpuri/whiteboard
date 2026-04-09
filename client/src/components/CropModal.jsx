import { useState, useRef, useCallback, useEffect } from 'react'

const HANDLE = 12   // handle square size in px

function getHandles(c) {
  return [
    { id: 'nw', x: c.x,          y: c.y          },
    { id: 'n',  x: c.x + c.w/2,  y: c.y          },
    { id: 'ne', x: c.x + c.w,    y: c.y          },
    { id: 'e',  x: c.x + c.w,    y: c.y + c.h/2  },
    { id: 'se', x: c.x + c.w,    y: c.y + c.h    },
    { id: 's',  x: c.x + c.w/2,  y: c.y + c.h    },
    { id: 'sw', x: c.x,          y: c.y + c.h    },
    { id: 'w',  x: c.x,          y: c.y + c.h/2  },
  ]
}

const CURSORS = { nw:'nw-resize', n:'n-resize', ne:'ne-resize', e:'e-resize', se:'se-resize', s:'s-resize', sw:'sw-resize', w:'w-resize' }

export default function CropModal({ element, onApply, onClose }) {
  // Scale image to fit in viewport
  const MAX_W = Math.min(760, window.innerWidth  - 80)
  const MAX_H = Math.min(540, window.innerHeight - 240)
  const scale = Math.min(MAX_W / element.naturalWidth, MAX_H / element.naturalHeight, 1)
  const dW    = element.naturalWidth  * scale   // display width
  const dH    = element.naturalHeight * scale   // display height

  // Crop rect in display coords
  const [crop, setCrop] = useState({
    x: (element.cropX      ?? 0)                             * scale,
    y: (element.cropY      ?? 0)                             * scale,
    w: (element.cropWidth  ?? element.naturalWidth)          * scale,
    h: (element.cropHeight ?? element.naturalHeight)         * scale,
  })

  // Keep a ref so drag closure always reads current crop
  const cropRef = useRef(crop)
  useEffect(() => { cropRef.current = crop }, [crop])

  const startDrag = useCallback((handleId, e) => {
    e.preventDefault()
    e.stopPropagation()
    const sc    = { ...cropRef.current }
    const sx    = e.clientX
    const sy    = e.clientY

    const onMove = (ev) => {
      const dx = ev.clientX - sx
      const dy = ev.clientY - sy
      let { x, y, w, h } = sc

      if (handleId.includes('n')) { y = sc.y + dy; h = sc.h - dy }
      if (handleId.includes('s')) { h = sc.h + dy }
      if (handleId.includes('w')) { x = sc.x + dx; w = sc.w - dx }
      if (handleId === 'e' || handleId === 'ne' || handleId === 'se') { w = sc.w + dx }

      // Clamp to image bounds with minimum 20px
      if (x < 0) { w += x; x = 0 }
      if (y < 0) { h += y; y = 0 }
      w = Math.max(20, w)
      h = Math.max(20, h)
      if (x + w > dW) w = dW - x
      if (y + h > dH) h = dH - y

      setCrop({ x, y, w, h })
    }

    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [dW, dH])

  const handleApply = () => {
    onApply({
      cropX:      Math.round(crop.x / scale),
      cropY:      Math.round(crop.y / scale),
      cropWidth:  Math.round(crop.w / scale),
      cropHeight: Math.round(crop.h / scale),
    })
  }

  const handleReset = () => {
    setCrop({ x: 0, y: 0, w: dW, h: dH })
  }

  const handles = getHandles(crop)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal crop-modal" onClick={e => e.stopPropagation()}
        style={{ minWidth: 'auto', padding: '24px 28px', gap: 16 }}>

        <button className="modal-close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div className="modal-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 2v4M2 6h4M18 2v4M22 6h-4M6 22v-4M2 18h4M18 22v-4M22 18h-4"/>
              <rect x="7" y="7" width="10" height="10" rx="1"/>
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize:18 }}>Crop Image</h2>
            <p style={{ marginTop:2, fontSize:13 }}>Drag handles to adjust the crop. The original image is never modified.</p>
          </div>
        </div>

        {/* Canvas */}
        <div style={{ position:'relative', width:dW, height:dH, userSelect:'none', margin:'0 auto', flexShrink:0 }}>
          <img src={element.src} style={{ width:dW, height:dH, display:'block' }} draggable={false} alt="" />

          {/* Dark mask — 4 sides */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:crop.y, background:'rgba(0,0,0,.58)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', top:crop.y+crop.h, left:0, right:0, bottom:0, background:'rgba(0,0,0,.58)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', top:crop.y, left:0, width:crop.x, height:crop.h, background:'rgba(0,0,0,.58)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', top:crop.y, left:crop.x+crop.w, right:0, height:crop.h, background:'rgba(0,0,0,.58)', pointerEvents:'none' }} />

          {/* Crop border + rule-of-thirds */}
          <div style={{ position:'absolute', top:crop.y, left:crop.x, width:crop.w, height:crop.h, border:'1.5px solid rgba(255,255,255,.9)', pointerEvents:'none' }}>
            <div style={{ position:'absolute', top:'33.3%', insetInline:0, height:1, background:'rgba(255,255,255,.25)' }} />
            <div style={{ position:'absolute', top:'66.6%', insetInline:0, height:1, background:'rgba(255,255,255,.25)' }} />
            <div style={{ position:'absolute', insetBlock:0, left:'33.3%', width:1, background:'rgba(255,255,255,.25)' }} />
            <div style={{ position:'absolute', insetBlock:0, left:'66.6%', width:1, background:'rgba(255,255,255,.25)' }} />
          </div>

          {/* Handles */}
          {handles.map(h => (
            <div
              key={h.id}
              onMouseDown={e => startDrag(h.id, e)}
              style={{
                position:'absolute',
                left: h.x - HANDLE/2, top: h.y - HANDLE/2,
                width: HANDLE, height: HANDLE,
                background:'#fff', border:'1.5px solid rgba(0,0,0,.3)',
                borderRadius: 2, cursor: CURSORS[h.id], zIndex: 10,
              }}
            />
          ))}
        </div>

        {/* Dimensions */}
        <div style={{ fontSize:11, color:'var(--n-400)', textAlign:'center' }}>
          {Math.round(crop.w / scale)} × {Math.round(crop.h / scale)} px
        </div>

        <div className="modal-actions">
          <button className="btn-primary" onClick={handleApply}>Apply Crop</button>
          <button className="btn-secondary" onClick={handleReset}>Reset</button>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
