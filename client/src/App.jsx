import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from './store/authStore'
import { useSlidesStore } from './store/slidesStore'
import { useCanvasStore } from './store/canvasStore'
import { getMe, logout } from './api/auth'
import { createDeck, listDecks } from './api/decks'
import { getSlides, createSlide, updateSlide } from './api/slides'
import { useAutoSave } from './hooks/useAutoSave'
import WhiteboardCanvas from './canvas/WhiteboardCanvas'
import Toolbar from './components/Toolbar'
import SlidePanel from './components/SlidePanel'
import PropertiesPanel from './components/PropertiesPanel'
import AuthModal from './components/AuthModal'
import ExportModal from './components/ExportModal'

export default function App() {
  const [showAuth, setShowAuth]   = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [deckId, setDeckId]       = useState(null)
  const [isOnline, setIsOnline]   = useState(navigator.onLine)
  const containerRef = useRef()
  const [canvasSize, setCanvasSize] = useState({
    width:  window.innerWidth  - 220,
    height: window.innerHeight - 56,
  })

  const { user, setUser, logout: logoutStore } = useAuthStore()
  const { init, setSlides }  = useSlidesStore()
  const { selectedIds }      = useCanvasStore()

  useAutoSave(deckId)

  useEffect(() => {
    const onResize = () => setCanvasSize({ width: window.innerWidth - 220, height: window.innerHeight - 56 })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const on  = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  useEffect(() => {
    init()
    getMe()
      .then(({ user }) => { setUser(user); return loadOrCreateDeck() })
      .catch(() => {}) // guest mode
  }, [])

  async function loadOrCreateDeck() {
    try {
      const decks = await listDecks()
      let deck = decks[0]
      if (!deck) deck = await createDeck('My Whiteboard')
      setDeckId(deck.id)

      const serverSlides = await getSlides(deck.id)
      const localSlides  = useSlidesStore.getState().slides

      // ── No server slides: upload local (first login with guest content) ──
      if (serverSlides.length === 0) {
        const created = []
        for (const slide of localSlides) {
          const s = await createSlide(deck.id, { label: slide.label, elements: slide.elements })
          created.push(normalizeSlide(s))
        }
        setSlides(created)
        return
      }

      // ── Server has slides: server is authoritative for structure ──────────
      // For each server slide, check if local has a *newer* version (unsaved
      // content that hasn't been auto-saved yet).  If so, push it up now.
      const toUpload = []   // { id, elements } to flush to server after setSlides

      const mergedSlides = serverSlides.map(ss => {
        const normalized = normalizeSlide(ss)
        const local      = localSlides.find(l => l.id === ss.id)

        if (local?.localUpdatedAt && ss.updated_at) {
          const serverTime = new Date(ss.updated_at).getTime()
          const localTime  = new Date(local.localUpdatedAt).getTime()

          if (localTime > serverTime) {
            // Local content is newer — use it and schedule an upload
            toUpload.push({ id: ss.id, elements: local.elements })
            return { ...normalized, elements: local.elements, localUpdatedAt: local.localUpdatedAt }
          }
        }

        return normalized
      })

      setSlides(mergedSlides)

      // Flush any locally-newer content to server
      for (const { id, elements } of toUpload) {
        try { await updateSlide(deck.id, id, { elements }) } catch {}
      }
    } catch (err) {
      console.error('Failed to load deck', err)
    }
  }

  function normalizeSlide(s) {
    return {
      id: s.id,
      label: s.label,
      elements: s.elements || [],
      specVersion: s.spec_version || '1.0',
      localUpdatedAt: null,   // cleared on load — server is now the baseline
    }
  }

  const handleLogout = async () => {
    await logout()
    logoutStore()
    setDeckId(null)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      if (file.size > 10 * 1024 * 1024) return alert('File too large (max 10MB)')
      const text = await file.text()
      try {
        const data = JSON.parse(text)
        const incoming = Array.isArray(data) ? data : data.slides ? data.slides : [data]
        useSlidesStore.getState().importSlides(incoming)
      } catch { alert('Invalid JSON file') }
    }
    input.click()
  }

  return (
    <div className="app">
      <Toolbar
        onExport={() => setShowExport(true)}
        onImport={handleImport}
        user={user}
        onSignIn={() => setShowAuth(true)}
        onSignOut={handleLogout}
      />

      <div className="app-body">
        {/* Pass deckId so SlidePanel can fire structural API calls immediately */}
        <SlidePanel deckId={deckId} />

        <div className="canvas-area" ref={containerRef}>
          <WhiteboardCanvas width={canvasSize.width} height={canvasSize.height} />
        </div>

        {selectedIds.length > 0 && <PropertiesPanel />}
      </div>

      {!isOnline && (
        <div className="offline-banner">You're offline — changes are saved locally</div>
      )}

      {showAuth   && <AuthModal  onClose={() => setShowAuth(false)}   />}
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </div>
  )
}
