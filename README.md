# Gospel Path UX V3.1 PWA

Gospel Path is an installable offline-first PWA for church keys players and organists.

## What this build includes

- Packaged PWA structure: `index.html`, `styles.css`, `music-engine.js`, `app.js`, `manifest.webmanifest`, `sw.js`, icons, README, and tests.
- Songs and playlists with local persistence.
- Chord tap flow with real LH/RH voicings and fingerings.
- Chord Lab replacement that updates the selected chord token, quality, color, and fingering.
- Path Builder that generates Safe, Churchy, and Crunchy/Shed route cards.
- Safer route application flow: replace selected chord, replace section, append to section, or add as new section.
- Typed progression parsing for hyphens, commas, arrows, and whitespace.
- Lick Builder with editable visible lick cards.
- Shout patterns and organ presets.
- Live Mode with song and playlist pickers.
- Light/dark mode and responsive mobile/iPad layouts.

## Run locally

```bash
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

## Tests

```bash
node tests/music-engine.test.js
```

## Notes

This is still a frontend/local-state build. Data saves to `localStorage` on the device. No backend is required for this pass.
