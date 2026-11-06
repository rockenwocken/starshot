# ★ STARSHOT ★ スターショット

A 4-panel chaos photo booth for your phone, with arcade vibes inspired by *Space Channel 5*, *Muscle March* and *Dance Dance Revolution*.

**Ablauf:** Drück **SHOT!** → Ansage → Countdown **3 · 2 · 1** → alle ~1 Sekunde wird ein zufälliges Viertel mit dem Kamerabild gefüllt. Jedes Foto bekommt ein zufälliges, albernes Geräusch und eine Bewertung, das letzte ist **immer ein Furz**. 💨

## Was ist jedes Mal zufällig?

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
| `js/words.js` | Posen, Bewertungen, Titel-Wörter, Ränge: einfach eigene Zeilen dazuschreiben |
| `js/sfx.js` | Alle Geräusche (`FUNNY`-Liste) und der Furz |
| `js/layouts.js` | Die Panel-Layouts |
| `js/app.js` | Ablauf, Timing (`INTERVAL`, `COUNT_STEP`), Rendering |

## Credits

- Start-Ansage: [„femalemid02_so_dance03“ von synergyxxx69](https://freesound.org/people/synergyxxx69/sounds/482370/) auf Freesound.org (gekürzt, als MP3)
- Schriften (SIL Open Font License, über Fontsource): Dela Gothic One, DotGothic16, Press Start 2P
