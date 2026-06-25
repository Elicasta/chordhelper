# Gospel Path V1

A static installable PWA prototype for church piano / organ players.

## What is included

- Responsive iPad landscape workbench layout
- Responsive iPad portrait chart-first layout
- Mobile quick-control layout
- Light and dark modes
- Black / white UI with red, green, blue, yellow, purple, and orange semantic highlights
- Pressable chord cards with fingerings
- Fat chord palette for maj13, 6/9, m11, m13, 13sus, 13b9, 7#9, and altered dominant colors
- Chord parser for number progressions and chord names
- Path builder for gospel, CCM, preacher, shout, weird reharm, and plain modes
- Lick / run generator
- Shout music section builder
- Organ preset panel with drawbar-style values
- Songs library with built-in templates and user-created songs
- Save-to-current-song flows
- Live Mode with section navigation and panic-safe chord
- Apple Pencil / touch / mouse ink canvas using Pointer Events
- Highlight, pen, eraser, text note, and convert flow
- Local persistence with `localStorage`
- Offline install support using a service worker and web app manifest

## How to run locally

Open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

For PWA install behavior, serving over localhost or HTTPS is best.

## Handwriting conversion note

The app stores ink strokes and provides a conversion workflow. Browser-native handwriting recognition is not dependable across iPad Safari, Chrome, and mobile browsers yet, so V1 uses a confirm-before-convert flow: write, tap Convert, confirm the recognized or typed progression, then convert it into real pressable chord data.

## Files

- `index.html` app shell
- `styles.css` responsive UI and theme system
- `music-engine.js` chord parser, routing, voicing, licks, seed songs
- `app.js` app state, rendering, events, ink canvas, saving
- `manifest.webmanifest` PWA manifest
- `sw.js` offline service worker
- `icon.svg` / `icon-maskable.svg` app icons


## Patch note

- Fixed mobile chord sheet clearance so fingering cards sit above the bottom nav and safe-area.
