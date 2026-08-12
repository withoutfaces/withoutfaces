WITHOUT FACES — SO STARTET DIE WEBSITE

1. ZIP-Datei entpacken.
2. Den Ordner „without-faces-final“ öffnen.
3. Doppelklick auf „index.html“.
   Die Website öffnet sich direkt im Browser.

IN VS CODE ÖFFNEN

1. VS Code öffnen.
2. File → Open Folder.
3. Den kompletten Ordner „without-faces-final“ auswählen.
4. Texte stehen in index.html.
5. Design steht in style.css.
6. Bilder liegen in assets/images.

BILDER ERSETZEN

Am einfachsten behältst du die Dateinamen bei.
Beispiel:
- Dein echtes Eventfoto bekommt den Namen event-01.svg nicht, wenn es JPG ist.
  Dann ändere in index.html:
  event-01.svg → event-01.jpg

ADOBE FONTS

Der Link ist bereits in index.html eingebaut:
https://use.typekit.net/xtb0pvw.css

Verwendet werden:
- Span Compressed, font-weight 600
- Neue Haas Grotesk Text, font-weight 400

GITHUB PAGES

1. Auf GitHub ein neues PUBLIC Repository erstellen.
2. Im Repository: Add file → Upload files.
3. Den INHALT des Ordners hochladen:
   index.html, style.css, script.js, assets, README.txt
4. Commit changes anklicken.
5. Settings → Pages.
6. Source: Deploy from a branch.
7. Branch: main.
8. Folder: / (root).
9. Save.
10. Etwa eine Minute warten.

WICHTIG:
index.html muss direkt oben im Repository liegen, nicht noch in einem zusätzlichen Unterordner.
