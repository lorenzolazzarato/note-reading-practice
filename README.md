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

- `CLARITY_THRESHOLD` (default 0.92) — quanto dev'essere "pulito" il pitch
  rilevato prima di accettarlo. Se ci sono troppi mancati riconoscimenti,
  abbassalo leggermente; se ci sono troppi falsi positivi, alzalo.
- `MIN_RMS` (default 0.012) — soglia di volume minimo per considerare il
  segnale un suono e non rumore di fondo.
- `STABILITY_WINDOW` (default 5) — quanti frame consecutivi stabili servono
  prima di accettare una risposta. Più alto = più affidabile ma più lento.
