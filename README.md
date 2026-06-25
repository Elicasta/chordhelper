# Gospel Path UX V2

This is a single-file PWA-style preview focused on the actual musician workflow.

## What changed

- Tabs now navigate to real pages:
  - Songs
  - Path
  - Chord
  - Licks
  - Shout
  - Organ
  - Live
- Songs page now contains the song library, chart, sections, chord cards, notes, writing/convert area, and inspector.
- Path page is a dedicated route builder for experimenting with chord movement.
- Chord page is a chord lab with fat chord palette and fingering.
- Licks page is a target-aware lick builder.
- Shout page has praise-break patterns, walkups, hits, and endings.
- Organ page has drawbar/Leslie presets.
- Live page is simplified and big.
- Sidebar/inspector chord options can replace the currently selected chord.
- Chords can be dragged and dropped to reorder progressions.
- Explanation can be hidden.
- Mobile layout uses page-based content and compact chord peek above bottom nav.
- Light and dark mode use the same semantic color tokens.

## Run

Open `index.html` directly, or serve it locally:

```bash
python3 -m http.server 5173
```
