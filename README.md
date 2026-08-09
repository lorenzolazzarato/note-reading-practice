# Leggi le note

App per esercitarsi a leggere le note sul pentagramma (scala di Do maggiore),
con conferma della risposta tramite il microfono: suoni la nota sul piano e
l'app la riconosce da sola.

## Struttura del progetto

```
index.html          markup della pagina
css/styles.css       stile
js/music-theory.js   matematica delle note diatoniche (righe/spazi, range, midi)
js/notation.js       rendering del pentagramma con VexFlow
js/audio.js          cattura microfono e rilevamento del pitch (Pitchy)
js/app.js            collega UI, teoria musicale e audio
```

Nessun build step: sono file statici, caricati dal browser così come sono
tramite moduli ES nativi (`<script type="module">`).

Chiave, posizione (righe/spazi) e range di note vengono salvati in
`localStorage` a ogni modifica e ricaricati all'avvio: riapri l'app e ritrovi
le impostazioni di prima, sullo stesso dispositivo/browser. Il range di note
è salvato **separatamente per ciascuna chiave**: passando da violino a basso
e tornando a violino si ritrova il range impostato per il violino, non
quello lasciato sul basso. Non viene salvato altro (punteggio, cronologia):
quello resta solo per la sessione corrente, come da scelta di design del
progetto.

Il toggle "Includi accidentali" fa eccezione di proposito: **non viene
salvato**, riparte sempre spento (`false`) a ogni apertura dell'app, anche se
lo hai attivato nella sessione precedente. Quando è attivo, alle note della
scala di Do maggiore vengono occasionalmente aggiunti diesis o bemolle sulla
stessa posizione diatonica (rigo/spazio), da leggere e suonare per intero
(il riconoscimento via microfono è già cromatico, non serve nulla in più).

## Sviluppo in locale

Il microfono richiede un contesto sicuro (HTTPS o `localhost`): non basta
aprire `index.html` con doppio click (`file://`). Serve un piccolo server
locale, ad esempio uno di questi, dalla cartella del progetto:

```
python3 -m http.server 8000
# oppure
npx serve
```

poi apri `http://localhost:8000`.

## Pubblicazione su GitHub Pages

1. Crea un repository su GitHub e carica questi file (mantenendo la struttura
   delle cartelle).
2. Nelle impostazioni del repository → **Pages**, scegli come sorgente il
   branch principale (es. `main`) e la cartella `/ (root)`.
3. GitHub Pages pubblica automaticamente un URL `https://<utente>.github.io/<repo>/`
   — essendo HTTPS, il microfono funziona anche su iPad (Safari, Chrome e
   qualunque altro browser, che su iOS/iPadOS usano tutti il motore WebKit).

## Parametri da tarare

In `js/audio.js`:

- `CLARITY_THRESHOLD` (default 0.88, prima 0.92) — quanto dev'essere "pulito"
  il pitch rilevato prima di accettarlo. Abbassato dopo i test dal vivo: le
  note dell'ottava 6 non venivano riconosciute, probabilmente perché le corde
  corte producono più armoniche relative al fondamentale, il che abbassa la
  "pulizia" misurata da Pitchy pur trattandosi della nota giusta. Se tornano
  troppi falsi positivi, alzalo di nuovo verso 0.92.
- `MIN_RMS` (default 0.003, prima 0.004, prima ancora 0.012) — soglia di
  volume minimo per considerare il segnale un suono e non rumore di fondo.
  Abbassato progressivamente: con il tablet sul leggio (lontano dalle corde)
  le note acute, più deboli e più brevi, restavano sotto soglia via via che
  si saliva di ottava.
- `STABILITY_WINDOW` (default 5) — quanti frame consecutivi stabili servono
  prima di accettare una risposta. Più alto = più affidabile ma più lento.
  Prossima leva da provare se le note più acute (che decadono in fretta)
  continuano a non essere agganciate in tempo: scendere a 3-4.
- `MAX_FREQ` (default 1400 Hz) — margine sopra C6 per poter estendere in
  futuro il range di note senza toccare questo file.

`getUserMedia` richiede `autoGainControl: true` (mentre `echoCancellation` e
`noiseSuppression` restano disattivati): il guadagno automatico compensa la
distanza tablet–piano, che altrimenti fa apparire tutte le note (specie le
acute) troppo deboli — è il motivo per cui la barra di livello si alzava
sempre pochissimo.
