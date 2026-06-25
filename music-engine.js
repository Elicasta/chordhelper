(function (root, factory) {
  const engine = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = engine;
  root.GospelPathEngine = engine;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const CHROMATIC_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const CHROMATIC_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const NOTE_TO_SEMITONE = {
    C: 0, 'B#': 0,
    'C#': 1, Db: 1,
    D: 2,
    'D#': 3, Eb: 3,
    E: 4, Fb: 4,
    'E#': 5, F: 5,
    'F#': 6, Gb: 6,
    G: 7,
    'G#': 8, Ab: 8,
    A: 9,
    'A#': 10, Bb: 10,
    B: 11, Cb: 11
  };
  const MAJOR_SCALES = {
    C: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    Db: ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
    D: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
    Eb: ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
    E: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
    F: ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
    Gb: ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F'],
    G: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
    Ab: ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
    A: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
    Bb: ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
    B: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#']
  };
  const INTERVALS = {
    '1': 0, b2: 1, '2': 2, '#2': 3, b3: 3, '3': 4, '4': 5, '#4': 6, b5: 6, '5': 7, '#5': 8, b6: 8, '6': 9, bb7: 9, b7: 10, '7': 11, '8': 12, '9': 14, b9: 13, '#9': 15, '11': 17, '#11': 18, '13': 21, b13: 20
  };
  const DEGREE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
  const QUALITY_BY_STYLE = {
    plain: { '1': '', '2': 'm', '3': 'm', '4': '', '5': '', '6': 'm', '7': 'dim', b2: '', b3: '', b5: 'dim', b6: '', b7: '' },
    ccm: { '1': 'add2', '2': 'm7', '3': 'm7', '4': 'add2', '5': 'sus', '6': 'm7', b7: 'add2' },
    gospel: { '1': 'maj9', '2': 'm9', '3': '7#5', '4': 'maj9', '5': '13sus', '6': 'm9', '7': 'dim7', b2: 'maj7', b3: 'maj9', '#4': 'dim7', b5: 'dim7', b6: 'maj7(#11)', b7: '13' },
    shout: { '1': '7', '2': '7', '3': '7', '4': '7', '5': '7', '6': '7', b7: '7', '#4': 'dim7' },
    preacher: { '1': 'maj9', '2': 'm11', '3': '7#5', '4': 'maj9', '5': '13sus', '6': 'm9', b6: 'maj7(#11)', b7: '13sus' },
    weird: { '1': 'maj9', '2': 'm11', '3': 'maj7/G#', '4': 'maj9', '5': '13sus', '6': 'm11', b2: 'maj7(#11)', b3: 'maj9', '#4': 'dim7', b6: 'maj7(#11)', b7: '13sus' }
  };

  const DESCRIPTORS = {
    '1': 'home base. Stable, safe, and good for worship beds or landing after tension.',
    '2': 'a setup chord. In gospel and worship it often pulls toward the 5 or back home.',
    '3': 'a strong gospel passing color when treated as dominant. It pulls hard into the 6 minor.',
    '4': 'the lift chord. Good for choruses, preacher swells, and emotional movement.',
    '5': 'the pull chord. Use it when the band needs clear direction back to the 1.',
    '6': 'the emotional minor. Good for bridges, reflective worship, and 3-6-2-5 movement.',
    b6: 'borrowed color. Good for weird reharm, dramatic walkdowns, or preacher tension.',
    b7: 'church color. Strong for gospel walkups, shout energy, and dominant movement back home.',
    '#4': 'diminished connector. Strong between 4 and 1 over 5, or as a quick passing chord.'
  };
  const FAT_QUALITY_GROUPS = {
    major: ['maj9', 'maj13', '6/9', 'maj7(#11)', 'add9/13'],
    minor: ['m9', 'm11', 'm13'],
    dominant: ['9sus', '13sus', '13', '13b9', '7#9', '7#5#9'],
    diminished: ['dim7'],
    color: ['maj13(#11)', '13sus', 'm11', '6/9']
  };

  const FAT_QUALITY_DESCRIPTORS = {
    'maj9': 'wide worship color. Clear, warm, and safe for the 1 or 4.',
    'maj13': 'fat major color. More open than maj9 because the 13 adds a soft lift.',
    'maj13(#11)': 'bright outside major color. Good for modern gospel and reharm moments.',
    'maj7(#11)': 'dreamy raised-11 color. Use for intros, transitions, and unexpected lift.',
    '6/9': 'classic warm gospel/jazz major color. Thick without sounding tense.',
    'add9/13': 'simple major color with extra air. Good when maj7 feels too fancy.',
    'm9': 'emotional minor color. Good for bridges, altar, and 3-6-2-5 movement.',
    'm11': 'fatter minor color. Great for preacher beds and soft modern gospel movement.',
    'm13': 'advanced minor color. Smooth, rich, and best when the band gives you room.',
    '9sus': 'clean suspended dominant. Good when you need pull without hard resolution yet.',
    '13sus': 'fat suspended dominant. Very churchy on the 5 and b7.',
    '13': 'dominant color with body. Good for shout hits, turnarounds, and walkups.',
    '13b9': 'strong tension dominant. Use it right before a clear landing.',
    '7#9': 'bluesy gospel bite. Good for hits, preacher punches, and shout color.',
    '7#5#9': 'altered dominant heat. Use quickly before resolving.',
    'dim7': 'connector chord. Good between neighboring bass notes or into an inversion.'
  };


  function mod(n, m = 12) { return ((n % m) + m) % m; }
  function normalizeKey(key) {
    if (!key) return 'C';
    const clean = String(key).trim().replace('♭', 'b').replace('♯', '#');
    const map = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' };
    return KEYS.includes(clean) ? clean : map[clean] || 'C';
  }
  function noteSemitone(note) {
    return NOTE_TO_SEMITONE[String(note).replace('♭', 'b').replace('♯', '#')] ?? 0;
  }
  function semitoneToNote(value, preferSharps = false) {
    return (preferSharps ? CHROMATIC_SHARPS : CHROMATIC_FLATS)[mod(value)];
  }
  function alterNoteName(note, accidental) {
    if (!accidental) return note;
    const letter = note[0];
    const existing = note.slice(1);
    const val = noteSemitone(note) + (accidental === 'b' ? -1 : accidental === 'bb' ? -2 : accidental === '#' ? 1 : 2);
    const natural = NOTE_TO_SEMITONE[letter];
    const diff = mod(val - natural);
    if (diff === 0) return letter;
    if (diff === 1) return `${letter}#`;
    if (diff === 2) return `${letter}##`;
    if (diff === 11) return `${letter}b`;
    if (diff === 10) return `${letter}bb`;
    return semitoneToNote(val, existing.includes('#'));
  }
  function splitNumberToken(token) {
    const raw = String(token).trim().replace('♭', 'b').replace('♯', '#');
    const match = raw.match(/^(bb|b|##|#)?([1-7])([a-zA-Z0-9+#()°/\-]*)?$/);
    if (!match) return null;
    const accidental = match[1] || '';
    const degree = Number(match[2]);
    const suffix = match[3] || '';
    return { accidental, degree, suffix, normalized: `${accidental}${degree}` };
  }
  function numberToNote(numberToken, key = 'C') {
    const parsed = splitNumberToken(numberToken);
    const scale = MAJOR_SCALES[normalizeKey(key)] || MAJOR_SCALES.C;
    if (!parsed) return null;
    return alterNoteName(scale[parsed.degree - 1], parsed.accidental);
  }
  function qualityFor(numberToken, style = 'gospel') {
    const parsed = splitNumberToken(numberToken);
    if (!parsed) return '';
    if (parsed.suffix) return parsed.suffix === 'dom' ? '7' : parsed.suffix;
    const styleMap = QUALITY_BY_STYLE[style] || QUALITY_BY_STYLE.gospel;
    return styleMap[parsed.normalized] ?? QUALITY_BY_STYLE.gospel[parsed.normalized] ?? '';
  }
  function numberToChord(numberToken, key = 'C', style = 'gospel') {
    const root = numberToNote(numberToken, key);
    if (!root) return String(numberToken);
    return `${root}${qualityFor(numberToken, style)}`;
  }
  function chordToNumber(chordSymbol, key = 'C') {
    const root = parseChordRoot(chordSymbol);
    if (!root) return null;
    const scale = MAJOR_SCALES[normalizeKey(key)] || MAJOR_SCALES.C;
    const target = noteSemitone(root);
    for (let i = 0; i < scale.length; i++) {
      const base = noteSemitone(scale[i]);
      if (mod(base) === target) return String(i + 1);
      if (mod(base - 1) === target) return `b${i + 1}`;
      if (mod(base + 1) === target) return `#${i + 1}`;
    }
    return '?';
  }
  function parseChordRoot(symbol) {
    const match = String(symbol).trim().replace('♭', 'b').replace('♯', '#').match(/^([A-G](?:b|#)?)/);
    return match ? match[1] : null;
  }
  function parseChordQuality(symbol) {
    const root = parseChordRoot(symbol);
    if (!root) return '';
    return String(symbol).trim().slice(root.length);
  }
  function normalizeInput(input) {
    return String(input || '')
      .replace(/[–—]/g, '-')
      .replace(/→|>|,/g, ' ')
      .replace(/\s+-\s+/g, ' ')
      .replace(/\|/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function parseProgression(input, key = 'C', style = 'gospel') {
    const normalized = normalizeInput(input);
    if (!normalized) return { rawInput: input, key: normalizeKey(key), tokens: [], warnings: ['Nothing to parse yet.'] };
    const pieces = normalized.split(' ').filter(Boolean);
    const tokens = pieces.map((piece) => {
      const raw = piece.trim();
      const slashNumber = raw.match(/^((?:bb|b|##|#)?[1-7])\/((?:bb|b|##|#)?[1-7])$/);
      if (slashNumber) {
        const main = slashNumber[1];
        const bass = slashNumber[2];
        const symbol = `${numberToChord(main, key, style)}/${numberToNote(bass, key)}`;
        return {
          id: uid('tok'), raw, type: 'number', normalizedNumber: raw, chordSymbol: symbol,
          root: numberToNote(main, key), quality: qualityFor(main, style),
          descriptor: DESCRIPTORS[main] || 'slash chord movement. Tap it for fingerings and routes.'
        };
      }
      const number = splitNumberToken(raw);
      if (number) {
        const symbol = numberToChord(number.normalized, key, style);
        return {
          id: uid('tok'), raw, type: 'number', normalizedNumber: number.normalized, chordSymbol: symbol,
          root: numberToNote(number.normalized, key), quality: qualityFor(number.normalized, style),
          descriptor: DESCRIPTORS[number.normalized] || 'usable color chord. Tap it for fingerings and routes.'
        };
      }
      if (/^[A-G](?:b|#)?/i.test(raw)) {
        return {
          id: uid('tok'), raw, type: 'chord', normalizedNumber: chordToNumber(raw, key), chordSymbol: raw,
          root: parseChordRoot(raw), quality: parseChordQuality(raw), descriptor: 'typed chord symbol. Tap it for fingerings, licks, and next movement ideas.'
        };
      }
      return { id: uid('tok'), raw, type: 'unknown', warnings: [`Could not read "${raw}" as a number or chord.`] };
    });
    return { rawInput: input, key: normalizeKey(key), tokens, warnings: tokens.flatMap(t => t.warnings || []) };
  }
  function progressionFromNumbers(numbers, key = 'C', style = 'gospel') {
    return numbers.map((n) => ({
      id: uid('ch'), number: n, symbol: numberToChord(n, key, style), root: numberToNote(n, key), descriptor: DESCRIPTORS[n] || 'tap for details'
    }));
  }
  function routeFor({ key = 'C', from = '1', to = '4', style = 'gospel', intensity = 'churchy' } = {}) {
    const cleanStyle = style === 'weird_reharm' ? 'weird' : style;
    const safe = [from, to];
    const to4 = ['1', '3', '6', '2', '5', '1/3', '4'];
    const to1 = ['4', '#4', '1/5', '6', '2', '5', '1'];
    const shout = ['1', '3', '4', '#4', '5', '4', '1'];
    const weird = ['1', 'b3', '6', 'b6', '5', 'b7', '4'];
    function isTo(x) { return String(to).replace(/[^#b1-7]/g, '') === x; }
    let churchyNums = isTo('4') ? to4 : isTo('1') ? to1 : cleanStyle === 'shout' ? shout : [from, '6', '2', '5', to];
    let spicyNums = cleanStyle === 'weird' ? weird : [from, 'b7', '3', '6', '2', 'b2', '5', to];
    if (intensity === 'safe') spicyNums = churchyNums;
    return [
      makeRoute('Safe', safe, key, cleanStyle, 'The safe route gives you direction without fighting the singer or band.'),
      makeRoute('Churchy', churchyNums, key, cleanStyle, 'A church movement with passing tension and a clear landing point.'),
      makeRoute(intensity === 'wild' || cleanStyle === 'weird' ? 'Wild Reharm' : 'Spicy', spicyNums, key, cleanStyle, 'A higher-color route. Use this in rehearsal, intros, or moments where the band is following you.')
    ];
  }
  function normalizeRouteToken(token) {
    const slash = String(token).split('/');
    return slash[0];
  }
  function makeRoute(label, numbers, key, style, explanation) {
    const chords = numbers.map((n) => {
      const main = normalizeRouteToken(n);
      const bass = String(n).includes('/') ? String(n).split('/')[1] : null;
      const symbol = numberToChord(main, key, style);
      const bassNote = bass ? numberToNote(bass, key) : null;
      return {
        id: uid('ch'), number: n, symbol: bassNote ? `${symbol}/${bassNote}` : symbol,
        root: numberToNote(main, key), descriptor: DESCRIPTORS[main] || 'passing movement'
      };
    });
    return { id: uid('route'), label, chords, explanation };
  }
  function intervalsForQuality(quality) {
    const q = String(quality || '').toLowerCase().replace(/\s+/g, '');
    if (q.includes('dim')) return ['1', 'b3', 'b5', '6'];
    if (q.includes('maj13(#11)')) return ['1', '5', '7', '9', '#11', '13'];
    if (q.includes('maj13')) return ['1', '5', '3', '7', '9', '13'];
    if (q.includes('maj7(#11)')) return ['1', '5', '3', '7', '#11'];
    if (q.includes('maj9') || q.includes('add2')) return ['1', '5', '3', '7', '9'];
    if (q.includes('6/9') || q.includes('add9/13')) return ['1', '5', '3', '6', '9'];
    if (q.includes('m13')) return ['1', 'b7', 'b3', '5', '9', '13'];
    if (q.includes('m11')) return ['1', 'b7', 'b3', '4', '5', '9'];
    if (q.includes('m9') || q === 'm7' || q.startsWith('m')) return ['1', 'b7', 'b3', '5', '9'];
    if (q.includes('13sus')) return ['1', 'b7', '4', '9', '13'];
    if (q.includes('9sus')) return ['1', 'b7', '4', '5', '9'];
    if (q.includes('13b9')) return ['1', 'b7', '3', 'b9', '13'];
    if (q.includes('13#11')) return ['1', 'b7', '3', '#11', '13'];
    if (q.includes('13')) return ['1', 'b7', '3', '9', '13'];
    if (q.includes('11')) return ['1', 'b7', '3', '5', '11'];
    if (q.includes('7#5#9')) return ['1', 'b7', '3', '#5', '#9'];
    if (q.includes('7#9')) return ['1', 'b7', '3', '5', '#9'];
    if (q.includes('7b9')) return ['1', 'b7', '3', '5', 'b9'];
    if (q.includes('7#5')) return ['1', 'b7', '3', '#5', 'b7'];
    if (q.includes('9')) return ['1', 'b7', '3', '5', '9'];
    if (q.includes('sus')) return ['1', '5', '4', 'b7', '9'];
    if (q.includes('maj7')) return ['1', '5', '3', '7', '#11'];
    if (q.includes('7')) return ['1', 'b7', '3', '5', 'b7'];
    return ['1', '5', '3', '5', '1'];
  }
  function fatFamilyFor(numberToken, symbol) {
    const number = numberToken ? String(numberToken).split('/')[0] : null;
    const quality = parseChordQuality(symbol || '').toLowerCase();
    if (number === '#4' || quality.includes('dim')) return 'diminished';
    if (['2', '3', '6'].includes(number) || quality.startsWith('m')) return 'minor';
    if (['5', 'b7'].includes(number) || /7|9|13|sus|alt/.test(quality)) return 'dominant';
    if (['b6', 'b2', 'b3'].includes(number)) return 'color';
    return 'major';
  }
  function fatChordOptionsFor(chordOrNumber = '1', { key = 'C', style = 'gospel' } = {}) {
    const raw = String(chordOrNumber || '1').trim();
    const parsedNumber = splitNumberToken(raw.split('/')[0]);
    let root;
    let number;
    if (parsedNumber) {
      number = parsedNumber.normalized;
      root = numberToNote(number, key);
    } else {
      root = parseChordRoot(raw) || numberToNote(raw, key) || normalizeKey(key);
      number = chordToNumber(raw, key) || '?';
    }
    const family = fatFamilyFor(number, raw);
    const qualities = FAT_QUALITY_GROUPS[family] || FAT_QUALITY_GROUPS.color;
    return qualities.map((quality) => {
      const symbol = `${root}${quality}`;
      return {
        id: uid('fat'),
        symbol,
        number,
        quality,
        family,
        descriptor: FAT_QUALITY_DESCRIPTORS[quality] || 'fat color chord. Tap for fingering and organ settings.',
        root
      };
    });
  }
  function transposeFromRoot(root, intervalName) {
    const semitone = noteSemitone(root) + (INTERVALS[intervalName] ?? 0);
    const preferSharps = String(root).includes('#');
    return semitoneToNote(semitone, preferSharps);
  }
  function chordNotes(symbol) {
    const root = parseChordRoot(symbol) || 'C';
    const quality = parseChordQuality(symbol).replace(/\/.*$/, '');
    const intervals = intervalsForQuality(quality);
    return intervals.map((i) => transposeFromRoot(root, i));
  }
  function fingeringFor(symbol, { instrument = 'piano', difficulty = 'easy', handSize = 'medium', key = 'C' } = {}) {
    const notes = chordNotes(symbol);
    const lh = notes.slice(0, Math.min(2, notes.length));
    let rh = notes.slice(2);
    if (difficulty === 'easy') rh = rh.slice(0, 4);
    if (difficulty === 'advanced' && rh.length < 4) rh.push(transposeFromRoot(parseChordRoot(symbol) || 'C', '9'));
    const rhFingers = rh.length <= 3 ? [1, 2, 5].slice(0, rh.length) : rh.length === 4 ? [1, 2, 3, 5] : [1, 2, 3, 4, 5];
    const organ = organPresetFor(symbol, key);
    return {
      symbol, instrument, difficulty, handSize,
      leftHandNotes: lh,
      rightHandNotes: rh,
      leftHandFingers: lh.length === 1 ? [5] : [5, 1],
      rightHandFingers: rhFingers,
      note: instrument === 'organ'
        ? 'On organ, think manual shape and expression more than piano attack. Keep the voicing clean and use Leslie for motion.'
        : 'Keep the top note clear. If it feels wide, remove the lowest right-hand note first.',
      organ
    };
  }
  function organPresetFor(symbol, key = 'C') {
    const q = parseChordQuality(symbol).toLowerCase();
    if (q.includes('7') || q.includes('13')) {
      return { name: 'Preacher / Shout Bite', upper: '888888000', lower: '808000000', percussion: '3rd harmonic, fast decay', chorus: 'C3', leslie: 'Fast for hits, slow while talking', expression: '65-100%' };
    }
    if (q.includes('maj') || q.includes('add')) {
      return { name: 'Warm Worship Bed', upper: '888400000', lower: '004400000', percussion: 'Off', chorus: 'C2 or C3', leslie: 'Slow, flip fast on swell', expression: '35-75%' };
    }
    return { name: 'Soft Talk Bed', upper: '888000000', lower: '008800000', percussion: 'Off', chorus: 'C3', leslie: 'Slow', expression: '40-60%' };
  }
  function lickFor({ key = 'C', chord = '1', target = '4', style = 'gospel', speed = 'medium' } = {}) {
    const current = /^[#b]?[1-7]/.test(chord) ? numberToChord(chord, key, style) : chord;
    const targetChord = /^[#b]?[1-7]/.test(target) ? numberToChord(target, key, style) : target;
    const targetRoot = parseChordRoot(targetChord) || numberToNote(target, key) || normalizeKey(key);
    const root = parseChordRoot(current) || normalizeKey(key);
    const patterns = {
      gospel: ['b3', '3', '5', '6', 'b7', '8', '9', '8', 'b7', '5', '3'],
      ccm: ['1', '2', '3', '5', '6', '5', '3', '2', '1'],
      shout: ['1', 'b3', '3', '4', '#4', '5', '6', 'b7', '8'],
      preacher: ['5', '6', 'b7', '7', '8', '9', '8', 'b7', '5'],
      weird: ['1', 'b2', '3', '5', 'b6', '7', '9', 'b9', '8']
    };
    const use = patterns[style] || patterns.gospel;
    const notes = use.map((interval) => transposeFromRoot(root, interval)).concat([targetRoot]);
    return {
      id: uid('lick'), name: `${styleLabel(style)} run into ${targetChord}`, current, target: targetChord, notes,
      fingering: notes.length <= 8 ? 'RH: 1-2-3-1-2-3-4-5' : 'RH: 1-2-3-1-2-3-1-2-3-5',
      feel: speed === 'fast' ? 'fast triplet push' : speed === 'slow' ? 'slow intentional fill' : 'medium gospel run',
      descriptor: `Use this as a ${styleLabel(style).toLowerCase()} connector into ${targetChord}. Land on the target root clearly.`
    };
  }
  function styleLabel(style) {
    return ({ ccm: 'CCM', gospel: 'Gospel', shout: 'Shout', preacher: 'Preacher', weird: 'Weird reharm', weird_reharm: 'Weird reharm', plain: 'Plain' })[style] || style;
  }
  function uid(prefix = 'id') { return `${prefix}_${Math.random().toString(36).slice(2, 9)}`; }

  const seedSongs = [
    {
      id: 'song-this-is-the-day-template', title: 'This Is The Day', category: 'Kids / Praise', defaultKey: 'F', currentKey: 'F', feel: 'Bright praise', sourceType: 'built_in_template', userCreated: false,
      notes: 'Simple public-style praise template. Save your own arrangement if your church plays it differently.',
      sections: [
        { id: 'sec-titd-intro', name: 'Intro', color: 'blue', bars: [{ id: uid('bar'), chords: progressionFromNumbers(['1', '4', '1', '5'], 'F', 'plain') }] },
        { id: 'sec-titd-a', name: 'Main', color: 'green', bars: [{ id: uid('bar'), chords: progressionFromNumbers(['1', '4', '1', '5', '1', '4', '5', '1'], 'F', 'plain') }] },
        { id: 'sec-titd-end', name: 'Ending', color: 'red', bars: [{ id: uid('bar'), chords: progressionFromNumbers(['1', '4', '#4', '1/5', '5', '1'], 'F', 'gospel') }] }
      ]
    },
    {
      id: 'song-lords-army-template', title: "I'm In The Lord's Army", category: 'Kids / March Praise', defaultKey: 'G', currentKey: 'G', feel: 'March praise', sourceType: 'built_in_template', userCreated: false,
      notes: 'Template progression only. Add your church version in My Songs.',
      sections: [
        { id: 'sec-army-main', name: 'Main', color: 'green', bars: [{ id: uid('bar'), chords: progressionFromNumbers(['1', '4', '1', '5', '1', '4', '5', '1'], 'G', 'plain') }] },
        { id: 'sec-army-shout', name: 'Shout Tag', color: 'red', bars: [{ id: uid('bar'), chords: progressionFromNumbers(['1', '3', '4', '#4', '5', '4', '1'], 'G', 'shout') }] }
      ]
    },
    {
      id: 'song-preacher-bed', title: 'Preacher Talk Bed', category: 'Preacher / Altar', defaultKey: 'Eb', currentKey: 'Eb', feel: 'Soft talk into build', sourceType: 'built_in_template', userCreated: false,
      notes: 'Good starting map for backing a preacher without overplaying.',
      sections: [
        { id: 'sec-preach-soft', name: 'Soft', color: 'purple', bars: [{ id: uid('bar'), chords: progressionFromNumbers(['1', '4', '1/5', '5'], 'Eb', 'preacher') }] },
        { id: 'sec-preach-build', name: 'Build', color: 'red', bars: [{ id: uid('bar'), chords: progressionFromNumbers(['1', '3', '6', '2', '5', '4'], 'Eb', 'preacher') }] },
        { id: 'sec-preach-fat', name: 'Fat Colors', color: 'orange', bars: [{ id: uid('bar'), chords: [
          { id: uid('ch'), number: '1', symbol: 'Ebmaj13', root: 'Eb', descriptor: FAT_QUALITY_DESCRIPTORS['maj13'] },
          { id: uid('ch'), number: '4', symbol: 'Abmaj13(#11)', root: 'Ab', descriptor: FAT_QUALITY_DESCRIPTORS['maj13(#11)'] },
          { id: uid('ch'), number: '6', symbol: 'Cm11', root: 'C', descriptor: FAT_QUALITY_DESCRIPTORS['m11'] },
          { id: uid('ch'), number: '5', symbol: 'Bb13sus', root: 'Bb', descriptor: FAT_QUALITY_DESCRIPTORS['13sus'] }
        ] }] }
      ]
    }
  ];

  return {
    KEYS, CHROMATIC_FLATS, MAJOR_SCALES, normalizeKey, numberToNote, numberToChord, chordToNumber,
    parseProgression, routeFor, fingeringFor, lickFor, progressionFromNumbers, fatChordOptionsFor, seedSongs, uid, styleLabel
  };
});
