// Pipeline audio: cattura il microfono, stima l'altezza con Pitchy (McLeod Pitch Method)
// e segnala una nota solo quando il segnale è stabile per una finestra di frame,
// per evitare falsi trigger su rumore, transitori d'attacco o sustain prolungato.
import { PitchDetector } from 'https://esm.sh/pitchy@4';
import { freqToMidi } from './music-theory.js';

const STABILITY_WINDOW = 5;
const CLARITY_THRESHOLD = 0.88;
const MIN_FREQ = 55; // poco sotto A1
const MAX_FREQ = 1400; // sopra C6, margine per estendere il range in futuro
const MIN_RMS = 0.003;

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}
function spread(arr) {
  return Math.max(...arr) - Math.min(...arr);
}

// callbacks: { onLevel(rms), onStablePitch(midi), onError(err) }
export function createPitchTracker(callbacks) {
  let audioContext = null;
  let analyserNode = null;
  let micStream = null;
  let detector = null;
  let listening = false;
  let rafId = null;
  let stabilityBuffer = [];
  let paused = false; // sospende la valutazione (es. durante il feedback) senza fermare il microfono

  async function start() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    await audioContext.resume();
    if (!micStream) {
      micStream = await navigator.mediaDevices.getUserMedia({
        // AGC attivo: il tablet è sul leggio, lontano dalle corde, e da solo non basta a
        // portare in soglia le note acute (più deboli e più brevi). echoCancellation e
        // noiseSuppression restano disattivati per non alterare il timbro del pitch.
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true },
      });
    }
    if (!analyserNode) {
      analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 4096;
      audioContext.createMediaStreamSource(micStream).connect(analyserNode);
      detector = PitchDetector.forFloat32Array(analyserNode.fftSize);
    }
    listening = true;
    stabilityBuffer = [];
    loop();
  }

  function stop() {
    listening = false;
    if (rafId) cancelAnimationFrame(rafId);
  }

  function setPaused(value) {
    paused = value;
    if (value) stabilityBuffer = [];
  }

  function loop() {
    if (!listening) return;
    const buf = new Float32Array(detector.inputLength);
    analyserNode.getFloatTimeDomainData(buf);

    let sumSq = 0;
    for (let i = 0; i < buf.length; i++) sumSq += buf[i] * buf[i];
    const rms = Math.sqrt(sumSq / buf.length);
    callbacks.onLevel(rms);

    const [pitch, clarity] = detector.findPitch(buf, audioContext.sampleRate);

    if (!paused && clarity > CLARITY_THRESHOLD && pitch >= MIN_FREQ && pitch <= MAX_FREQ && rms > MIN_RMS) {
      const midi = freqToMidi(pitch);
      stabilityBuffer.push(midi);
      if (stabilityBuffer.length > STABILITY_WINDOW) stabilityBuffer.shift();
      if (stabilityBuffer.length === STABILITY_WINDOW && spread(stabilityBuffer) <= 1) {
        const stableMidi = Math.round(median(stabilityBuffer));
        stabilityBuffer = [];
        callbacks.onStablePitch(stableMidi);
      }
    } else if (!paused) {
      stabilityBuffer = [];
    }
    rafId = requestAnimationFrame(loop);
  }

  return {
    start: () => start().catch((err) => callbacks.onError(err)),
    stop,
    setPaused,
    isListening: () => listening,
  };
}
