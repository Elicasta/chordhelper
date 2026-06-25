const assert = require('assert');
const {
  ALL_KEYS,
  realizeChord,
  buildRoute,
  generateLick,
  parseProgressionTokens,
  replacementFromChordLabSelection,
  applyChordReplacement
} = require('../music-engine.js');

function test(name, fn) {
  try {
    fn();
    console.log('PASS', name);
  } catch (error) {
    console.error('FAIL', name);
    console.error(error);
    process.exitCode = 1;
  }
}

test('all 12 keys are available', () => {
  assert.deepStrictEqual(ALL_KEYS, ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']);
});

test('b6 and b7 map correctly in Eb', () => {
  assert.strictEqual(realizeChord('b6', null, 'Eb').symbol, 'Cb');
  assert.strictEqual(realizeChord('b7', null, 'Eb').symbol, 'Db');
});

test('fat chord voicings include actual LH/RH notes', () => {
  const checks = [
    ['1','maj13','F','Fmaj13'],
    ['1','maj13#11','F','Fmaj13(#11)'],
    ['2m','min11','F','Gm11'],
    ['5','13sus','F','C13sus'],
    ['5','13b9','F','C13b9'],
  ];
  for (const [token, quality, key, expected] of checks) {
    const r = realizeChord(token, quality, key);
    assert.strictEqual(r.symbol, expected);
    assert.ok(r.lh.startsWith('LH: '));
    assert.ok(r.rh.startsWith('RH: '));
    assert.ok(r.fingering.includes('RH fingers'));
  }
});

test('route generation returns visible steps', () => {
  const route = buildRoute('Eb', 1, 4, 'Gospel', 'Churchy');
  assert.ok(route.length >= 3);
  assert.ok(route[0].symbol);
  assert.ok(route[0].token);
});

test('lick generation returns notes and fingering', () => {
  const lick = generateLick('Eb', '3dom', '6m11', 'Gospel', 'Medium', 'Churchy');
  assert.ok(lick.notes.split(' - ').length >= 5);
  assert.ok(lick.numbers.length > 0);
  assert.ok(lick.fingering.startsWith('RH: '));
});

test('chord lab replacement updates token quality and color', () => {
  const chordStep = { id:'c1', token:'1', qualityOverride:null, color:'green' };
  const replacement = replacementFromChordLabSelection({ deg:'4', q:'maj13#11' }, 'F');
  applyChordReplacement(chordStep, replacement);
  assert.strictEqual(chordStep.token, '4');
  assert.strictEqual(chordStep.qualityOverride, 'maj13#11');
  assert.strictEqual(chordStep.color, 'green');
  assert.strictEqual(replacement.realized.symbol, 'Bbmaj13(#11)');
});

test('typed progression parser supports separators', () => {
  assert.deepStrictEqual(parseProgressionTokens('1 - 4 - 5'), ['1','4','5']);
  assert.deepStrictEqual(parseProgressionTokens('1 4 5'), ['1','4','5']);
  assert.deepStrictEqual(parseProgressionTokens('1, 4, 5'), ['1','4','5']);
  assert.deepStrictEqual(parseProgressionTokens('1 → 4 → 5'), ['1','4','5']);
  assert.deepStrictEqual(parseProgressionTokens('1-4-5'), ['1','4','5']);
});
