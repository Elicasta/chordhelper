/* ============================== MUSIC ENGINE ============================== */
const PITCH = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const ALL_KEYS = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const DEG_SEMI = {1:0,2:2,3:4,4:5,5:7,6:9,7:11};
const CHORD_TYPES = {
  maj:{label:'',lh:[0,7],rh:[0,4,7]},
  min:{label:'m',lh:[0,7],rh:[0,3,7]},
  maj6:{label:'6',lh:[0,7],rh:[0,4,9]},
  add2:{label:'add2',lh:[0,7],rh:[0,2,4]},
  '6/9':{label:'6/9',lh:[0,7],rh:[2,4,9]},
  maj9:{label:'maj9',lh:[0,7],rh:[2,4,11]},
  maj13:{label:'maj13',lh:[0,7],rh:[4,9,11]},
  'maj13#11':{label:'maj13(#11)',lh:[0,6],rh:[4,9,11]},
  min9:{label:'m9',lh:[0,10],rh:[2,3,7]},
  min11:{label:'m11',lh:[0,10],rh:[3,5,7]},
  min13:{label:'m13',lh:[0,10],rh:[3,7,9]},
  dom7:{label:'7',lh:[0,10],rh:[4,7]},
  dom9:{label:'9',lh:[0,10],rh:[2,4,7]},
  dom13:{label:'13',lh:[0,10],rh:[4,7,9]},
  '13sus':{label:'13sus',lh:[0,10],rh:[2,5,9]},
  '13b9':{label:'13b9',lh:[0,10],rh:[1,4,9]},
  sus:{label:'sus',lh:[0,7],rh:[0,5,7]},
  dim7:{label:'dim7',lh:[0,9],rh:[3,6,9]},
  '7#5#9':{label:'7#5#9',lh:[0,10],rh:[3,4,8]},
  '7alt':{label:'7alt',lh:[0,10],rh:[1,4,8]},
};
const QUALITY_DESC = {
  maj:'Plain triad. Safe and bright.', min:'Plain minor triad. Soft, never wrong.',
  maj6:'Warm sixth color. Open and clean.', add2:'Open, modern, congregational.',
  '6/9':'Warm and clean. Good for praise songs without getting jazzy.',
  maj9:'Clean lift chord. Works almost anywhere.', maj13:'Fat major color. Use on intros, endings, or open space.',
  'maj13#11':'Bright raised-11 lift. Beautiful, use intentionally.',
  min9:'Soft minor color. Good for verses and altar.', min11:'Wide minor 11. Great for altar, bridge, soft preacher beds.',
  min13:'Deep minor color. Heavier altar/bridge use.',
  dom7:'Plain dominant pull back home.', dom9:'Dominant with color, still pulls home.',
  dom13:'Big dominant color before resolving.', '13sus':'Suspended pull chord. Great right before going home.',
  '13b9':'Strong dominant tension. Hit it quickly before resolving home.',
  sus:'Suspended, open, unresolved on purpose.', dim7:'Diminished connector chord. Use to walk between two chords.',
  '7#5#9':'Altered dominant. Spicy, gospel/jazz pull.', '7alt':'Fully altered dominant. Use in the shed, not for the choir.',
};
function noteName(semi){return PITCH[((semi%12)+12)%12];}
function flatAwareNoteName(semi){ const n=noteName(semi); return n==='B'?'Cb':n; }
function keyIndex(key){return PITCH.indexOf(key);}
function fingeringFor(lhCount,rhCount){
  const LH={1:'5',2:'5 - 1',3:'5 - 3 - 1'};
  const RH={1:'1',2:'1 - 5',3:'1 - 2 - 5',4:'1 - 2 - 3 - 5'};
  return {lh:LH[lhCount]||'5 - 1', rh:RH[rhCount]||'1 - 2 - 5'};
}
function baseQualityFromSuffix(suffix){
  suffix = suffix||'';
  if(/dim/.test(suffix)) return 'dim7';
  if(/alt/.test(suffix)) return '7alt';
  if(/7#5#9|#5#9/.test(suffix)) return '7#5#9';
  if(/dom/.test(suffix)) return /13/.test(suffix)?'dom13':/9/.test(suffix)?'dom9':'dom7';
  if(/13b9/.test(suffix)) return '13b9';
  if(/sus/.test(suffix)) return /13/.test(suffix)?'13sus':'sus';
  if(/^m(?!aj)/.test(suffix)){
    if(/13/.test(suffix)) return 'min13';
    if(/11/.test(suffix)) return 'min11';
    if(/9/.test(suffix)) return 'min9';
    return 'min';
  }
  if(/13#11|13\(#11\)/.test(suffix)) return 'maj13#11';
  if(/13/.test(suffix)) return 'maj13';
  if(/9/.test(suffix)) return 'maj9';
  if(/6\/9/.test(suffix)) return '6/9';
  if(/add2/.test(suffix)) return 'add2';
  if(/^6$/.test(suffix)) return 'maj6';
  return 'maj';
}
function parseToken(token){
  const parts = String(token).split('/');
  const main = parts[0];
  const bass = parts[1]||null;
  const m = main.match(/^([b#]?)(\d)(.*)$/);
  if(!m) return {degSemi:0,acc:0,suffix:'',bass};
  const acc = m[1]==='b'?-1:m[1]==='#'?1:0;
  const deg = +m[2];
  return {degSemi:DEG_SEMI[deg]!=null?DEG_SEMI[deg]:0, acc, suffix:m[3]||'', bass, deg, accSym:m[1]};
}
function realizeChord(token, qualityOverride, key){
  const kIdx = keyIndex(key);
  const p = parseToken(token);
  const rootSemi = (kIdx + p.degSemi + p.acc + 24)%12;
  const rootName = p.accSym==='b' ? flatAwareNoteName(rootSemi) : noteName(rootSemi);
  const qualityKey = qualityOverride || baseQualityFromSuffix(p.suffix);
  const qt = CHORD_TYPES[qualityKey] || CHORD_TYPES.maj;
  let symbol = rootName + qt.label;
  let lhNotes = qt.lh.map(s=>noteName(rootSemi+s));
  let rhNotes = qt.rh.map(s=>noteName(rootSemi+s));
  if(p.bass){
    const bm = p.bass.match(/^([b#]?)(\d)$/);
    if(bm){
      const bAcc = bm[1]==='b'?-1:bm[1]==='#'?1:0;
      const bDeg = +bm[2];
      const bSemi = (kIdx + (DEG_SEMI[bDeg]||0) + bAcc + 24)%12;
      const bName = noteName(bSemi);
      symbol += '/'+bName;
      lhNotes = [bName];
    }
  }
  const fg = fingeringFor(lhNotes.length, rhNotes.length);
  return {
    symbol, numberDisplay: token, qualityKey, rootName, rootSemi,
    lh: 'LH: '+lhNotes.join(' - '),
    rh: 'RH: '+rhNotes.join(' - '),
    fingering: 'LH fingers: '+fg.lh+'  ·  RH fingers: '+fg.rh,
    desc: QUALITY_DESC[qualityKey]||'Usable chord voicing.'
  };
}
const SEMI_TO_DEG = {0:'1',1:'b2',2:'2',3:'b3',4:'3',5:'4',6:'b5',7:'5',8:'b6',9:'6',10:'b7',11:'7'};
function degreeLabel(rootSemi,keyIdx,qualityKey){
  const rel = ((rootSemi-keyIdx)%12+12)%12;
  let label = SEMI_TO_DEG[rel];
  if(/min/.test(qualityKey)) label += 'm';
  else if(/dom|13sus|13b9|alt|#5#9/.test(qualityKey)) label += 'dom';
  else if(qualityKey==='dim7') label += 'dim';
  return label;
}
const DEFAULT_QUALITY_BY_DEGREE = {1:'maj',2:'min',3:'min',4:'maj',5:'maj',6:'min',7:'dim7'};
const INTENSITY_MAP = {
  Easy:{maj:'maj',min:'min',dom7:'dom7',dim7:'dim7'},
  Churchy:{maj:'maj9',min:'min9',dom7:'dom9',dim7:'dim7'},
  Crunchy:{maj:'maj13',min:'min11',dom7:'13sus',dim7:'dim7'},
  Shed:{maj:'maj13#11',min:'min13',dom7:'7alt',dim7:'dim7'},
};
function colorFor(qualityKey){
  if(/maj/.test(qualityKey)) return 'green';
  if(/min/.test(qualityKey)) return 'blue';
  if(/dim/.test(qualityKey)) return 'purple';
  if(/13b9|alt|#5#9/.test(qualityKey)) return 'red';
  return 'orange';
}
function buildRoute(key,fromDeg,toDeg,style,intensity){
  const kIdx = keyIndex(key);
  const toSemi = (kIdx + (DEG_SEMI[toDeg]||0))%12;
  const fromSemi = (kIdx + (DEG_SEMI[fromDeg]||0))%12;
  const toBaseQ = DEFAULT_QUALITY_BY_DEGREE[toDeg]||'maj';
  const fromBaseQ = DEFAULT_QUALITY_BY_DEGREE[fromDeg]||'maj';
  const cmap = INTENSITY_MAP[intensity]||INTENSITY_MAP.Easy;
  let steps = [];
  const mk = (semi,baseQ)=>({semi:((semi%12)+12)%12, q: cmap[baseQ]||cmap.maj});
  if(style==='Safe'){
    steps = [mk(fromSemi,fromBaseQ), mk(toSemi,toBaseQ)];
  } else if(style==='Gospel' || style==='CCM'){
    steps = [mk(fromSemi,fromBaseQ), mk(toSemi+2,'min'), mk(toSemi+7,'dom7'), mk(toSemi,toBaseQ)];
  } else if(style==='Preacher'){
    steps = [mk(fromSemi,fromBaseQ), mk(fromSemi+1,'dim7'), mk(toSemi,toBaseQ)];
  } else if(style==='Shout'){
    steps = [mk(fromSemi,fromBaseQ), mk(fromSemi+2,'dom7'), mk(fromSemi+4,'dom7'), mk(toSemi,toBaseQ)];
  } else if(style==='Weird Reharm'){
    steps = [mk(fromSemi,fromBaseQ), mk(toSemi+6,'dom7'), mk(toSemi,toBaseQ)];
  } else {
    steps = [mk(fromSemi,fromBaseQ), mk(toSemi,toBaseQ)];
  }
  return steps.map(s=>{
    const label = degreeLabel(s.semi,kIdx,s.q);
    const r = realizeChord(label, s.q, key);
    return {token:label, qualityKey:s.q, symbol:r.symbol, lh:r.lh, rh:r.rh, fingering:r.fingering};
  });
}
function generateLick(key,fromToken,toToken,style,speed,difficulty){
  const kIdx = keyIndex(key);
  const fromR = realizeChord(fromToken||'1', null, key);
  const toR = realizeChord(toToken||'5', null, key);
  const toSemi = (toR.rootSemi!=null ? toR.rootSemi : keyIndex(toR.rootName));
  const diffSteps = {Easy:5,Churchy:7,Shed:9}[difficulty]||7;
  // Base run: chromatic approach into the target root, strictly distinct semitone offsets.
  let offsets = [];
  for(let i=diffSteps-1;i>=0;i--) offsets.push(-i);
  // Style coloring: swap one approach note for a style-flavored color tone, kept distinct.
  const STYLE_COLOR_OFFSET = {Gospel:-3, Blues:-3, Shout:-5, CCM:-2, Organ:-4};
  const colorOff = STYLE_COLOR_OFFSET[style];
  if(colorOff!=null && offsets.length>3){
    const targetIdx = offsets.length-3;
    if(!offsets.includes(colorOff)) offsets[targetIdx] = colorOff;
  }
  const notes = offsets.map(off=>noteName(toSemi+off));
  const fingerCycle = speed==='Fast'?[1,2,3,1,2,4,2,1,1,3]:speed==='Slow'?[1,3,1,2,1,4,1,2,1,1]:[1,2,3,1,2,4,2,1,1,2];
  const fingering = notes.map((n,i)=>fingerCycle[i%fingerCycle.length]).join(' - ');
  const numbers = notes.map(n=>{
    const rel = ((keyIndex(n)-kIdx)%12+12)%12;
    return SEMI_TO_DEG[rel];
  }).join(' - ');
  return {notes: notes.join(' - '), numbers, fingering: 'RH: '+fingering,
    use: 'Play this over '+fromR.symbol+' into '+toR.symbol+'.'};
}

function parseProgressionTokens(input){
  if(!input) return [];
  return String(input)
    .replace(/→|⇒|⟶|-->|->/g,' ')
    .replace(/-/g,' ')
    .replace(/[\s,]+/g,' ')
    .trim()
    .split(/\s+/)
    .map(function(t){return t.trim();})
    .filter(Boolean);
}
function replacementFromChordLabSelection(selection,key){
  const r = realizeChord(selection.deg, selection.q, key);
  return { token: selection.deg, qualityOverride: r.qualityKey, color: colorFor(r.qualityKey), realized: r };
}
function applyChordReplacement(chordStep, replacement){
  chordStep.token = replacement.token;
  chordStep.qualityOverride = replacement.qualityOverride;
  chordStep.color = replacement.color;
  return chordStep;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PITCH, ALL_KEYS, CHORD_TYPES, parseToken, realizeChord, buildRoute, generateLick, parseProgressionTokens, colorFor, replacementFromChordLabSelection, applyChordReplacement };
}
