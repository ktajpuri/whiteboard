# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install all dependencies (run from root)
npm install

# Run both client and server in dev mode
npm run dev

# Run server only
npm run dev -w server

# Run client only
npm run dev -w client

# Run DB migrations
npm run migrate

# Build client for production
npm run build
```

## Architecture

Monorepo with npm workspaces: `client/` (React) and `server/` (Node/Express).

### Server (`server/src/`)

- `index.js` — Express app entry, wires middleware and routes
- `config/passport.js` — Passport strategies: Local (email/password) and Google OAuth
- `db/index.js` — `pg` Pool singleton; `db/migrate.js` runs `db/migrations/001_initial.sql`
- `middleware/auth.js` — JWT verification from httpOnly cookie (`token`)
- `routes/auth.js` — Register, login, Google OAuth, `/auth/me`, logout
- `routes/decks.js` — CRUD for decks (owned by user)
- `routes/slides.js` — CRUD + reorder for slides within a deck
- `services/s3.js` — AWS SDK v3 client pointed at Cloudflare R2
- `services/redis.js` — Upstash Redis client

Auth flow: Google OAuth and local login both issue a JWT in an httpOnly cookie (`token`, 7-day expiry). The `authMiddleware` reads this cookie on protected routes.

### Client (`client/src/`)

- `store/` — Four Zustand stores:
  - `authStore` — current user, guest/logged-in mode
  - `slidesStore` — slides array + active slide; persisted to `localStorage` (guest mode)
  - `canvasStore` — active tool, zoom, pan, selection, active color
  - `historyStore` — undo/redo stacks per slide (50 actions deep)
- `api/` — Axios client (`api/client.js`) with offline queue; `auth.js`, `decks.js`, `slides.js` wrappers
- `canvas/WhiteboardCanvas.jsx` — react-konva Stage; all tool event handling lives here
- `canvas/elements/` — `ShapeElement`, `StrokeElement`, `TextElement`, `ImageElement` Konva renderers
- `components/` — `Toolbar`, `SlidePanel`, `PropertiesPanel`, `ColorPicker`, `AuthModal`, `ExportModal`, `CropModal`
- `utils/imageUtils.js` — `readAndResizeImage(file, maxSide=1920)` → `{ dataURL, naturalWidth, naturalHeight }`
- `hooks/useAutoSave.js` — 30-second autosave to localStorage (guest) or server (logged in)

### Data model

Slide `elements` is a JSONB array stored in PostgreSQL (and mirrored in localStorage for guests). Every element has a `specVersion: '1.0'` field.

Element types:
```js
// Shape
{ id, type: 'rect'|'ellipse'|'triangle'|'hexagon', x, y, width, height, rotation, fill, stroke, strokeWidth, specVersion }
// Freehand stroke
{ id, type: 'stroke', points: number[], color, lineWidth, specVersion }
// Text
{ id, type: 'text', x, y, width, text, fontSize, fontStyle, color, specVersion }
// Image (non-destructive crop)
{ id, type: 'image', x, y, width, height, rotation, src, naturalWidth, naturalHeight,
  cropX?, cropY?, cropWidth?, cropHeight?, specVersion }
// cropX/Y/Width/Height are in source pixels; omitting them shows the full image.
// Konva renders via the `crop` prop: the crop rect is stretched to fill width×height.
```

### Canvas coordinate system

The canvas is 4000×3000px. The Konva `Stage` is positioned at `(panX, panY)` and scaled by `zoom`. Use `stage.getRelativePointerPosition()` to convert screen coords to canvas coords.

### Key decisions

- No ORM — raw `pg` queries throughout
- JWT in httpOnly cookie (not localStorage) to avoid XSS exposure
- Slides stored as JSONB blobs — no separate `elements` table
- Guest data lives entirely in Zustand's localStorage persistence; on login the user is prompted to keep or discard it
- Export (PNG/PDF) is done client-side; only JSON export is uploaded to R2
- Images are stored as base64 data URLs inside the slide JSONB blob — no separate upload endpoint
- Crop is non-destructive: `cropX/Y/Width/Height` in source pixels, display `width/height` independent
- Socket.io is not wired in v1 but the server is structured to support it later

## Environment

Copy `.env.example` to `.env` and fill in values. The server reads `.env` via `require('dotenv').config()` at startup; Render injects env vars directly in production.

## Deployment

- **Frontend**: Vercel — connect GitHub repo, set `VITE_API_URL` to the Render backend URL
- **Backend**: Render — connect GitHub repo, set all env vars in the Render dashboard, set start command to `npm run start -w server`
- **After deploy**: add the Render callback URL to Google OAuth authorized redirect URIs: `https://your-app.onrender.com/auth/google/callback`
