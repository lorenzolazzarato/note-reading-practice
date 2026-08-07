import * as theory from './music-theory.js';
import { renderNote } from './notation.js';
import { createPitchTracker } from './audio.js';

/* ---------- riferimenti DOM ---------- */
const staffContainer = document.getElementById('staff');
const scoreEl = document.getElementById('score');
const feedbackEl = document.getElementById('feedback');
const hintEl = document.getElementById('hint');
const listenBtn = document.getElementById('listen-btn');
const levelFill = document.getElementById('level-fill');
const micErrorEl = document.getElementById('mic-error');
const toggleManualBtn = document.getElementById('toggle-manual');
const manualButtonsEl = document.getElementById('manual-buttons');
const clefSelect = document.getElementById('clef-select');
const positionSelect = document.getElementById('position-select');
const minSelect = document.getElementById('min-note');
const maxSelect = document.getElementById('max-note');

/* ---------- popolamento select nota minima / massima ---------- */
const NOTE_OPTIONS_MIN_IDX = theory.diatonicIndex('C', 2);
const NOTE_OPTIONS_MAX_IDX = theory.diatonicIndex('C', 6);
for (let idx = NOTE_OPTIONS_MIN_IDX; idx <= NOTE_OPTIONS_MAX_IDX; idx++) {
  const label = `${theory.letterOfIndex(idx)}${theory.octaveOfIndex(idx)}`;
  const optA = document.createElement('option');
  optA.value = idx;
  optA.textContent = label;
  const optB = document.createElement('option');
  optB.value = idx;
  optB.textContent = label;
  minSelect.appendChild(optA);
  maxSelect.appendChild(optB);
}
minSelect.value = theory.diatonicIndex('C', 3);
maxSelect.value = theory.diatonicIndex('C', 6);

/* ---------- pulsanti risposta manuale (fallback se il microfono non è disponibile) ---------- */
theory.LETTERS.forEach((letter) => {
  const btn = document.createElement('button');
  btn.textContent = letter;
  btn.addEventListener('click', () => evaluateManualLetter(letter));
  manualButtonsEl.appendChild(btn);
});
toggleManualBtn.addEventListener('click', () => {
  const visible = manualButtonsEl.style.display !== 'none';
  manualButtonsEl.style.display = visible ? 'none' : 'flex';
  toggleManualBtn.textContent = visible
    ? 'Preferisci rispondere toccando lo schermo?'
    : 'Nascondi le risposte a tocco';
});

/* ---------- stato dell'esercizio ---------- */
let currentNote = null;
let correctCount = 0;
let totalCount = 0;
let locked = false; // durante il feedback, ignora nuove risposte

function readConfig() {
  return {
    clef: clefSelect.value,
    position: positionSelect.value,
    minIdx: parseInt(minSelect.value, 10),
    maxIdx: parseInt(maxSelect.value, 10),
  };
}

function nextNote() {
  const config = readConfig();
  const note = theory.pickRandomNote(config);
  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';
  if (!note) {
    staffContainer.innerHTML = '';
    feedbackEl.textContent = 'Nessuna nota disponibile con questi filtri: allarga il range.';
    feedbackEl.className = 'feedback wrong';
    currentNote = null;
    return;
  }
  currentNote = note;
  renderNote(staffContainer, note, config.clef);
}

function updateScore() {
  scoreEl.textContent = `Corrette: ${correctCount} / ${totalCount}`;
}

function lockAndAdvance(delay) {
  locked = true;
  tracker.setPaused(true);
  updateScore();
  setTimeout(() => {
    locked = false;
    tracker.setPaused(false);
    nextNote();
  }, delay);
}

function evaluateMidi(detectedMidi) {
  if (!currentNote || locked) return;
  totalCount++;
  const diff = ((detectedMidi - currentNote.midi) % 12 + 12) % 12;

  if (detectedMidi === currentNote.midi) {
    correctCount++;
    feedbackEl.textContent = 'Corretta';
    feedbackEl.className = 'feedback correct';
    lockAndAdvance(900);
  } else if (diff === 0) {
    feedbackEl.textContent = `Nota giusta, ottava sbagliata (hai suonato ${theory.midiToName(detectedMidi)})`;
    feedbackEl.className = 'feedback octave';
    lockAndAdvance(1800);
  } else {
    feedbackEl.textContent = `Non corretta — hai suonato ${theory.midiToName(detectedMidi)}, era ${currentNote.letter}${currentNote.octave}`;
    feedbackEl.className = 'feedback wrong';
    lockAndAdvance(1800);
  }
}

function evaluateManualLetter(letter) {
  if (!currentNote || locked) return;
  totalCount++;
  if (letter === currentNote.letter) {
    correctCount++;
    feedbackEl.textContent = 'Corretta';
    feedbackEl.className = 'feedback correct';
    lockAndAdvance(900);
  } else {
    feedbackEl.textContent = `Non corretta — era ${currentNote.letter}${currentNote.octave}`;
    feedbackEl.className = 'feedback wrong';
    lockAndAdvance(1800);
  }
}

/* ---------- pipeline audio ---------- */
const tracker = createPitchTracker({
  onLevel: (rms) => {
    // Scala non lineare: rende visibile anche il livello delle note acute (più deboli),
    // senza far sbattere la barra al 100% sulle note gravi suonate forte.
    const pct = Math.min(100, Math.round(Math.sqrt(rms) * 250));
    levelFill.style.width = pct + '%';
  },
  onStablePitch: (midi) => evaluateMidi(midi),
  onError: (err) => {
    listenBtn.classList.remove('active');
    listenBtn.textContent = 'Ascolta';
    micErrorEl.style.display = 'block';
    micErrorEl.textContent =
      'Non riesco ad accedere al microfono. Controlla i permessi del browser, oppure usa le risposte a tocco qui sotto.';
    manualButtonsEl.style.display = 'flex';
  },
});

listenBtn.addEventListener('click', () => {
  if (tracker.isListening()) {
    tracker.stop();
    listenBtn.classList.remove('active');
    listenBtn.textContent = 'Ascolta';
    levelFill.style.width = '0%';
    hintEl.textContent = 'Premi "Ascolta", consenti l\'uso del microfono, poi suona la nota sul piano.';
  } else {
    micErrorEl.style.display = 'none';
    tracker.start();
    listenBtn.classList.add('active');
    listenBtn.textContent = 'In ascolto…';
    hintEl.textContent = 'Suona la nota mostrata sul pentagramma.';
  }
});

/* ---------- aggiornamento impostazioni ---------- */
[clefSelect, positionSelect, minSelect, maxSelect].forEach((el) => {
  el.addEventListener('change', () => nextNote());
});

/* ---------- avvio ---------- */
nextNote();
