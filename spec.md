# Collaborative Whiteboard App — Product Spec v1.0

## Project Overview

A web-based whiteboard application built with **React + Node.js**. Users can draw, annotate, and organize visual content across multiple slides. Authentication is optional — guests can use the app fully with local persistence, while logged-in users get server-side sync.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Konva.js or Fabric.js for canvas rendering |
| State Management | Zustand |
| Backend | Node.js + Express |
| Database | PostgreSQL (users, slides) + Redis (sessions/cache) |
| Auth | JWT + Google OAuth 2.0 |
| Storage | S3-compatible bucket (exported files) |
| Realtime (future) | Socket.io (not v1, but architect to support it) |

---

## Authentication

- **Guest mode**: Full app usable without login. All data persisted in `localStorage`.
- **Logged-in mode**: Data synced to server. Accessible across sessions and devices.
- **Auth methods**: Email/password + Google OAuth.
- **Guest → Login migration**: On first login, prompt user to save or discard guest session data before migrating.

---

## Canvas

### Behaviour
- Large fixed-size canvas per slide (e.g., 4000x3000px logical space).
- **Pan**: Middle-click drag or Spacebar + drag.
- **Zoom**: Scroll wheel or explicit zoom controls. Include a "Fit to screen" button.
- Default background: white.

### Shapes
Supported: `circle`, `triangle`, `square`, `hexagon`

- **Add**: Select shape from toolbar → click-drag on canvas to place.
- **Move**: Click to select → drag to reposition.
- **Resize**: Drag corner or edge handles. Free resize by default.
- **Aspect ratio lock**: Toggle button in toolbar/properties panel when shape is selected.
- **Rotate**: Rotation handle rendered above shape. Free rotation via drag.
- **Fill color**: Applied via color bucket tool.
- **Border color**: Configurable in properties panel when shape is selected.
- **Delete**: `Delete` / `Backspace` key, or right-click → Delete.

### Multi-Select
- `Shift + Click` to add to selection.
- Click-drag on empty canvas area to draw a selection rectangle.
- Grouped selection supports: **move**, **delete**, **copy**.
- No permanent grouping in v1.

---

## Drawing Tools

### Freehand Pen
- Smooth stroke rendering on canvas.
- Pen sizes: `S`, `M`, `L`, `XL` (fixed presets).
- Color: selected from active palette color.
- Each stroke is a discrete, selectable, deletable object.

### Text Tool
- Click anywhere on canvas to place a text box.
- Inline editing with: font size (`S/M/L/XL`), bold, italic.
- Text box is movable and resizable like a shape.
- Text color follows active palette color.

### Eraser Tool
- Dedicated eraser that removes elements it passes over.
- Eraser sizes: `S`, `M`, `L`, `XL`.
- Works on: freehand strokes, shapes, and text boxes.

---

## Color System

### Palette
- ~20 preset color swatches always visible in toolbar.
- Full color picker accessible via `+` / custom button: hex input + RGB sliders.
- Last 5 recently used colors shown in palette row.
- Active color applies to: pen strokes, text, or fill bucket — depending on active tool.

### Color Bucket (Fill Tool)
- Activate from toolbar.
- Click any **enclosed area** on canvas to fill with active color.
- Works on: closed shapes, closed freehand regions, any enclosed canvas area.
- Replaces existing fill if already filled.

---

## Undo / Redo

- Undo: `Ctrl+Z` / `Cmd+Z`
- Redo: `Ctrl+Y` / `Cmd+Shift+Z`
- Minimum history depth: **50 actions per slide**.
- Tracked actions: add, move, resize, rotate, delete (shapes/strokes/text), fill changes.

---

## Slides

### Slide Panel
- Collapsible thumbnail panel on the **left side** of the screen.
- Each thumbnail shows a live preview of the slide.
- Slides are **reorderable via drag-and-drop**.
- Click a thumbnail to switch to that slide.

### Slide Operations

| Action | Trigger |
|---|---|
| New slide | `+` button at bottom of panel |
| Duplicate slide | Right-click thumbnail → Duplicate |
| Delete slide | Right-click → Delete (with confirmation dialog) |
| Rename slide | Double-click thumbnail label |
| Reorder | Drag-and-drop in panel |

### Cross-Slide Content
- `Ctrl+C` / `Ctrl+V` works for elements **within and across slides**.
- Duplicate slide creates a full copy appended after the current slide.

### Limits
- No hard slide limit in v1.
- Show a performance warning banner when deck exceeds **50 slides**.

---

## Export

| Format | Scope | Detail |
|---|---|---|
| PNG | Single slide or all slides (ZIP) | Rasterized at 2x resolution |
| PDF | Single slide or full deck | One page per slide, A4 landscape |
| JSON | Single slide or full deck | Full fidelity format — elements, positions, styles, metadata |

- Trigger: **File → Export** menu or dedicated toolbar button.
- JSON format should be **versioned from day one** (include a `specVersion` field) for forward compatibility.

---

## Import

- Accepts: JSON files (single slide or multi-slide deck).
- Imported slides are always **appended as new slides** at the end of the current deck.
- No merging into an existing slide.
- Trigger: **File → Import** menu.

---

## Persistence & Offline

| Mode | Behaviour |
|---|---|
| Guest | Autosaved to `localStorage` every 30 seconds |
| Logged-in (online) | Autosaved to server every 30 seconds |
| Logged-in (offline) | Changes queued locally; synced when connection restores |
| Offline indicator | Subtle banner: *"You're offline — changes saved locally"* |
| Tab close guard | Warn before closing tab if unsaved changes exist (guest mode) |

---

## UI Layout (High-Level)

```
+----------------------------+-----------------------------------+
|  Top Toolbar               |  (Tool options / properties)      |
+------------+---------------+-----------------------------------+
|            |                                                   |
|  Slide     |                  Canvas Area                      |
|  Panel     |                                                   |
| (Thumbs)   |                                                   |
|            |                                                   |
+------------+---------------------------------------------------+
```

- **Top toolbar**: Tool selection (shapes, pen, text, eraser, bucket), color palette, undo/redo, export/import, zoom controls.
- **Left panel**: Slide thumbnails, drag-to-reorder, add/delete slide controls.
- **Properties panel**: Appears contextually (right side or inline) when a shape/text is selected.

---

## Out of Scope (v1)

- Real-time multi-user collaboration (deferred to v2; architect backend to support Socket.io)
- Presence indicators / live cursors
- Version history / named snapshots
- Comments or annotations
- Image upload to canvas
- Mobile / touch support
- Permanent shape grouping

---

## Open Questions

1. Should guest `localStorage` data be migrated to the server on first login, or discarded?
2. Is there a maximum project/deck count per logged-in user?
3. What is the maximum JSON file size accepted on import?

---

## Definition of Done (per feature)

- [ ] Unit tests for all canvas operations (add, move, resize, rotate, delete)
- [ ] Undo/redo works correctly across all element types
- [ ] Export produces valid, correctly rendered output in all 3 formats
- [ ] Import appends slides without corrupting existing deck state
- [ ] Guest autosave survives page refresh
- [ ] Logged-in autosave survives network drop and reconnect
- [ ] All tools work correctly with multi-select