import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useSlidesStore } from '../store/slidesStore'
import { login, register, googleLogin } from '../api/auth'

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('login') // login | register
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState('')
  const [showMigrate, setShowMigrate] = useState(false)

  const setUser = useAuthStore(s => s.setUser)
  const slides = useSlidesStore(s => s.slides)
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
      if (hasGuestData) {
        setShowMigrate(true)
      } else {
        onClose()
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleMigrate = (keep) => {
    if (!keep) setSlides([{ id: crypto.randomUUID(), label: 'Slide 1', elements: [], specVersion: '1.0' }])
    onClose()
  }

  if (showMigrate) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <h3>You have unsaved guest work</h3>
          <p>Would you like to keep your current whiteboard content or start fresh?</p>
          <div className="modal-actions">
            <button onClick={() => handleMigrate(true)}>Keep my work</button>
            <button onClick={() => handleMigrate(false)} className="secondary">Start fresh</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal auth-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>{mode === 'login' ? 'Sign in' : 'Create account'}</h2>

        <button className="google-btn" onClick={googleLogin}>
          Continue with Google
        </button>
        <div className="divider">or</div>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <input placeholder="Name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          )}
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? '...' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button className="link-btn" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
