// Disegna una nota sul pentagramma usando VexFlow (caricato globalmente come `Vex` in index.html).
// Riceve un oggetto nota già risolto da music-theory.js: { letter, octave, clef }.

export function renderNote(container, note, clefMode) {
  container.innerHTML = '';
  const VF = Vex.Flow;
  const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
  const key = `${note.letter.toLowerCase()}/${note.octave}`;

  if (clefMode !== 'grand') {
    renderer.resize(300, 160);
    const context = renderer.getContext();
    const stave = new VF.Stave(10, 30, 260);
    stave.addClef(note.clef);
    stave.setContext(context).draw();

    const staveNote = new VF.StaveNote({ clef: note.clef, keys: [key], duration: 'w' });
    const voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
    voice.addTickables([staveNote]);
    new VF.Formatter().joinVoices([voice]).format([voice], 200);
    voice.draw(context, stave);
  } else {
    renderer.resize(300, 280);
    const context = renderer.getContext();
    const trebleStave = new VF.Stave(10, 10, 260);
    trebleStave.addClef('treble');
    trebleStave.setContext(context).draw();

    const bassStave = new VF.Stave(10, 140, 260);
    bassStave.addClef('bass');
    bassStave.setContext(context).draw();

    new VF.StaveConnector(trebleStave, bassStave).setType(VF.StaveConnector.type.BRACE).setContext(context).draw();
    new VF.StaveConnector(trebleStave, bassStave).setType(VF.StaveConnector.type.SINGLE_LEFT).setContext(context).draw();

    const activeStave = note.clef === 'treble' ? trebleStave : bassStave;
    const staveNote = new VF.StaveNote({ clef: note.clef, keys: [key], duration: 'w' });
    const voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
    voice.addTickables([staveNote]);
    new VF.Formatter().joinVoices([voice]).format([voice], 200);
    voice.draw(context, activeStave);
  }
}
