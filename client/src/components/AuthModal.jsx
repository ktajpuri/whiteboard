import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useSlidesStore } from '../store/slidesStore'
import { login, register, googleLogin } from '../api/auth'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const BoardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 30 30" fill="none">
    <rect width="30" height="30" rx="8" fill="#6366f1"/>
    <rect x="5" y="6" width="20" height="13" rx="2.5" stroke="white" strokeWidth="1.6" fill="none"/>
    <path d="M10 19.5v3m10-3v3M7.5 22.5h15" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M9 14l3 2.5 4-5 3.5 2.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function AuthModal({ onClose }) {
  const [mode, setMode]               = useState('login')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [showMigrate, setShowMigrate] = useState(false)

  const setUser  = useAuthStore(s => s.setUser)
  const slides   = useSlidesStore(s => s.slides)
  const setSlides = useSlidesStore(s => s.setSlides)
  const hasGuestData = slides.some(s => s.elements.length > 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const fn = mode === 'login' ? login : register
      const { user } = await fn(email, password, displayName)
      setUser(user)
      if (hasGuestData) setShowMigrate(true)
      else onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleMigrate = (keep) => {
    if (!keep) setSlides([{ id: crypto.randomUUID(), label: 'Page 1', elements: [], specVersion: '1.0' }])
    onClose()
  }

  if (showMigrate) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <div>
            <h3>You have unsaved work</h3>
            <p style={{ marginTop: 6 }}>Keep your current whiteboard content or start fresh with a clean slate?</p>
          </div>
          <div className="modal-actions">
            <button className="btn-primary" onClick={() => handleMigrate(true)}>Keep my work</button>
            <button className="btn-secondary" onClick={() => handleMigrate(false)}>Start fresh</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal auth-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BoardIcon />
          <div>
            <h2 style={{ fontSize: 18 }}>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
            <p style={{ fontSize: 13, marginTop: 2 }}>
              {mode === 'login' ? 'Sign in to sync your work across devices' : 'Start collaborating on your whiteboard'}
            </p>
          </div>
        </div>

        <button className="google-btn" onClick={googleLogin}>
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="auth-divider"><span>or</span></div>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="auth-input-group">
              <label className="auth-input-label">Name</label>
              <input
                placeholder="Your name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
            </div>
          )}
          <div className="auth-input-group">
            <label className="auth-input-label">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4 }}>
            {loading
              ? <span>Signing {mode === 'login' ? 'in' : 'up'}…</span>
              : mode === 'login' ? 'Sign in' : 'Create account'
            }
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            className="link-btn"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
