# ★ STARSHOT ★ スターショット

A 4-panel chaos photo booth for your phone, with arcade vibes inspired by *Space Channel 5*, *Muscle March* and *Dance Dance Revolution*.

**Ablauf:** Drück **SHOT!** → zufällige Ansage → Countdown **3 · 2 · 1** → alle ~1 Sekunde wird ein zufälliges Viertel festgehalten. Die vier Viertel sind Ausschnitte aus *einem* Bild, aufgenommen zu vier verschiedenen Momenten: Am Ende ergibt sich ein Gesamtbild aus vier Schnipseln. Jedes Foto bekommt ein zufälliges, albernes Geräusch und eine Bewertung, das letzte ist **immer ein Furz**. 💨

## Was ist jedes Mal zufällig?

- **Start-Ansage** aus `assets/start/` (nie zweimal dieselbe hintereinander)
- **Layout:** Streifen, Säulen, 2×2, Boss + Sidekicks, Blitz-Schrägen, Pizza, Tornado … (gespiegelt und leicht verschoben)
- **Reihenfolge**, in der die Viertel gefüllt werden
- **Posen-Aufgaben** (Madlibs: `{ACTION} LIKE {CREATURE}!` oder Klassiker wie `UP! UP! CHU! CHU! CHU!`)
- **Geräusche** (Boing, Quietsch-Ente, Laser, Hupe, Kuhglocke, Kazoo, …): alles live per Web Audio synthetisiert, jeder Furz klingt anders
- **Sticker**, **Bewertungen** (PERFECT!! / GREAT! / SUGOI! / KAWAII! / BOO…) und der **Titel** auf dem fertigen Bild

Das fertige Bild (1080×1440 PNG) lässt sich speichern oder über das Teilen-Menü verschicken. Die Fotos verlassen das Handy nicht.

## Starten

Die Kamera braucht HTTPS, also am einfachsten über **GitHub Pages**:
*Settings → Pages → Source: Deploy from a branch → `main` / root*.
Danach läuft die App unter `https://rockenwocken.github.io/starshot/`.
Auf dem Handy in Chrome öffnen → Menü → *Zum Startbildschirm hinzufügen* für Vollbild.

Lokal testen: `python3 -m http.server` im Ordner starten und `http://localhost:8000` öffnen (localhost zählt als sicher).

Tastatur am Laptop: **Leertaste/Enter** = Start / Shot / Nochmal.

## Anpassen

| Datei | Inhalt |
|---|---|
| `js/start-sounds.js` + `assets/start/` | Start-Ansagen: Datei in den Ordner legen und Namen in die Liste eintragen |
| `js/words.js` | Posen, Bewertungen, Titel-Wörter, Ränge: einfach eigene Zeilen dazuschreiben |
| `js/sfx.js` | Alle Geräusche (`FUNNY`-Liste) und der Furz |
| `js/layouts.js` | Die Panel-Layouts |
| `js/app.js` | Ablauf, Timing (`INTERVAL`, `COUNT_STEP`), Rendering |

## Credits

Start-Ansagen von [Freesound.org](https://freesound.org) (gekürzt, lautstärke-angeglichen, als MP3):
- synergyxxx69: „so dance“-Reihe (#482370, #482373–#482380)
- unfa: scream let's go (#188488)
- reitanna: let's go (#241581), oh yes (#242693)
- audeption: let's go out and have fun (#478759)
- legnalegna55: oh yeah (#539277)
- lovecraft_xavier: moans (#660304), moan (#660305)
- mt4000: ready let's go high (#664605)
- rezidentevil: girl says uwu (#708541)

Ergebnis-Sound: „Nya~ ichi ni san“ (Voicy)

Sonstiges:
- Schriften (SIL Open Font License, über Fontsource): Dela Gothic One, DotGothic16, Press Start 2P
