// Teoria musicale per la scala di Do maggiore (solo note naturali, nessun accidente).
// Modulo puro: nessuna dipendenza da DOM, VexFlow o audio.

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SEMITONE_OF = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function diatonicIndex(letter, octave) {
  return octave * 7 + LETTERS.indexOf(letter);
}
export function letterOfIndex(idx) {
  return LETTERS[((idx % 7) + 7) % 7];
}
export function octaveOfIndex(idx) {
  return Math.floor(idx / 7);
}
export function noteToMidi(letter, octave) {
  return (octave + 1) * 12 + SEMITONE_OF[letter];
}
export function midiToName(midi) {
  const name = SHARP_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}
export function freqToMidi(freq) {
  return 69 + 12 * Math.log2(freq / 440);
}

// Riga inferiore di ciascuna chiave, usata come riferimento a "posizione zero"
export const TREBLE_REF = diatonicIndex('E', 4);
export const BASS_REF = diatonicIndex('G', 2);
export const MIDDLE_C_IDX = diatonicIndex('C', 4);

// Distanza in passi diatonici dalla riga inferiore: pari = riga, dispari = spazio.
// Funziona anche oltre il pentagramma (righe/spazi tratteggiati), perché è calcolata
// e non su una tabella scritta a mano.
export function staffPosition(diatonicIdx, clef) {
  const ref = clef === 'treble' ? TREBLE_REF : BASS_REF;
  return diatonicIdx - ref;
}
export function isLine(position) {
  return ((position % 2) + 2) % 2 === 0;
}

export function buildRange(minIdx, maxIdx) {
  const notes = [];
  for (let idx = minIdx; idx <= maxIdx; idx++) {
    notes.push({ letter: letterOfIndex(idx), octave: octaveOfIndex(idx), diatonicIdx: idx });
  }
  return notes;
}

// Per il gran pentagramma: Do4 e note superiori vanno in chiave di violino, il resto in chiave di basso.
export function assignedClef(diatonicIdx, clefMode) {
  if (clefMode !== 'grand') return clefMode;
  return diatonicIdx >= MIDDLE_C_IDX ? 'treble' : 'bass';
}

// excludeIdx: diatonicIdx da evitare se possibile (tipicamente la nota appena mostrata),
// per non ripetere la stessa nota due volte di fila. Se è l'unico candidato disponibile,
// viene comunque riproposto: non c'è altro modo di generarne una diversa.
export function pickRandomNote(config, excludeIdx) {
  const range = buildRange(config.minIdx, config.maxIdx);
  const candidates = range.filter((n) => {
    const clef = assignedClef(n.diatonicIdx, config.clef);
    const line = isLine(staffPosition(n.diatonicIdx, clef));
    if (config.position === 'lines') return line;
    if (config.position === 'spaces') return !line;
    return true;
  });
  if (!candidates.length) return null;
  const pool = candidates.filter((n) => n.diatonicIdx !== excludeIdx);
  const usable = pool.length ? pool : candidates;
  const note = usable[Math.floor(Math.random() * usable.length)];
  note.clef = assignedClef(note.diatonicIdx, config.clef);
  note.midi = noteToMidi(note.letter, note.octave);
  return note;
}
