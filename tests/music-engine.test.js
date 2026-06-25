const assert = require('assert');
const E = require('../music-engine.js');

assert.strictEqual(E.numberToNote('b6', 'Eb'), 'Cb');
assert.strictEqual(E.numberToNote('b7', 'Eb'), 'Db');
assert.strictEqual(E.numberToChord('3', 'Eb', 'gospel'), 'G7#5');

const parsed = E.parseProgression('1 - 4 - 3 - 5 b6 b7 1/5', 'Eb', 'gospel');
assert.strictEqual(parsed.tokens.length, 7);
assert.deepStrictEqual(parsed.tokens.map((t) => t.chordSymbol), [
  'Ebmaj9',
  'Abmaj9',
  'G7#5',
  'Bb13sus',
  'Cbmaj7(#11)',
  'Db13',
  'Ebmaj9/Bb'
]);

const routes = E.routeFor({ key: 'Eb', from: '1', to: '4', style: 'gospel', intensity: 'churchy' });
assert.strictEqual(routes.length, 3);
assert.ok(routes[1].chords.some((ch) => ch.symbol.includes('G7#5')));

const fingering = E.fingeringFor('G7#5', { key: 'Eb', difficulty: 'easy' });
assert.deepStrictEqual(fingering.leftHandNotes, ['G', 'F']);
assert.ok(fingering.rightHandNotes.length >= 3);

const lick = E.lickFor({ key: 'Eb', chord: 'G7#5', target: 'Cm9', style: 'gospel' });
assert.strictEqual(lick.notes.at(-1), 'C');

console.log('music-engine tests passed');


const fatMajor = E.fatChordOptionsFor('1', { key: 'Eb' });
assert.ok(fatMajor.some((ch) => ch.symbol === 'Ebmaj13'));
assert.ok(fatMajor.some((ch) => ch.symbol === 'Eb6/9'));

const fatDominant = E.fatChordOptionsFor('5', { key: 'Eb' });
assert.ok(fatDominant.some((ch) => ch.symbol === 'Bb13sus'));
assert.ok(fatDominant.some((ch) => ch.symbol === 'Bb13b9'));

const fatMinor = E.fatChordOptionsFor('6', { key: 'Eb' });
assert.ok(fatMinor.some((ch) => ch.symbol === 'Cm11'));
assert.ok(E.fingeringFor('Abmaj13(#11)', { key: 'Eb' }).rightHandNotes.length >= 4);
