# SION Umzüge – Website

Erweiterte One-Page-Website für SION Umzüge mit Node.js-Backend und E-Mail-Versand über Brevo.

## Enthalten

- umfangreiche Startseite mit Hero, Leistungen, Ablauf, Über uns, Einsatzgebiet, FAQ, Kontakt und CTA
- responsives helles Creme-/Gold-Design
- großes SION-Logo in Header, Kontaktbereich und Footer
- detailliertes Umzugsanfrageformular
- Upload von bis zu 15 Bildern (JPEG/PNG/WebP, insgesamt max. 12 MB nach Komprimierung)
- Node.js/Express-Backend
- Brevo API für den E-Mail-Versand
- API-Key nur serverseitig in `.env`
- Impressum- und Datenschutz-Platzhalter

## Lokal starten

Voraussetzung: Node.js 18 oder neuer (das Backend verwendet die integrierte `fetch`-API).

```bash
cd server
npm install
cp .env.example .env
npm start
```

Danach: `http://localhost:3000`

## Projektstruktur

```text
index.html          Startseite mit Leistungen und Anfrageformular
impressum.html      Impressum (noch zu vervollständigen)
datenschutz.html    Datenschutz (noch zu vervollständigen)
css/style.css       Design, Komponenten und responsive Darstellung
js/script.js        Formularversand und Jahreszahl im Footer
js/photo-upload.js  Bildkomprimierung im Browser
assets/logo.png     Firmenlogo
server/server.js    Start des HTTP-Servers
server/app.js       Express-App und Middleware
server/config/      Umgebungsvariablen und Pfade
server/routes/      API-Routen
server/controllers/ HTTP-Anfragen und Antworten
server/validators/  Pflichtfeldprüfung
server/services/    Versand über Brevo
server/templates/   HTML-Vorlage der Anfrage-E-Mail
server/middleware/  Foto-Upload und zentrale Fehlerbehandlung
server/utils/       Gemeinsame Fehlerklasse
server/tests/       API-Tests mit simuliertem Brevo-Versand
server/.env.example Vorlage für die lokale Konfiguration
```

## Code pflegen

Einheitliche Formatierung: zwei Leerzeichen pro Einrückung, konfiguriert in
`.editorconfig` und `.prettierrc.json`. Inhalte werden direkt in den HTML-Dateien
bearbeitet; ein Build-Schritt ist nicht erforderlich.

```bash
npx prettier --write .
node --check js/script.js
node --check server/server.js
```

Die Formularfelder in `index.html` sind über ihre `name`-Attribute mit dem Backend
verbunden. Bei Änderungen an diesen Namen auch `buildContactEmail` und die
Pflichtfeldprüfung in `server/validators/contact.validator.js` anpassen.
Die E-Mail-Vorlage liegt in `server/templates/contact-email.js`.

Backend-Tests: `cd server && npm test`. Dabei werden keine echten E-Mails versendet.
`app.js` startet keinen Listener und lässt sich unabhängig testen; `server.js`
startet den Server. Die `.env` wird immer aus dem Ordner `server/` geladen.

## Vor dem Livegang

1. `server/.env` ausfüllen und einen gültigen Brevo-API-Key eintragen.
2. `MAIL_FROM` muss eine in Brevo verifizierte Absenderadresse sein.
3. Falls Frontend und Backend getrennt gehostet werden, `CONTACT_ENDPOINT` in `js/script.js` auf die echte Backend-URL ändern.
4. Platzhalter für Team-/Fahrzeugfotos ersetzen.
5. Impressum und Datenschutzerklärung rechtlich prüfen und vervollständigen.
6. Inhalte, Einsatzgebiete und Leistungsdetails vor Veröffentlichung fachlich prüfen.

## Bildkomprimierung

Vor dem Versand verarbeitet der Browser Fotos nacheinander: maximal 1600 Pixel
auf der längeren Seite, JPEG-Qualität 80 %. Kleinere Bilder werden nicht vergrößert;
wenn ihre JPEG-Version größer wäre, bleibt die Originaldatei erhalten. Transparenz
wird bei der JPEG-Konvertierung weiß hinterlegt. Originale auf dem Gerät bleiben
unverändert. HEIC wird nicht unterstützt und muss vorher konvertiert werden.

Frontend und Backend erlauben maximal 15 Fotos und zusammen 12 MiB (im Formular
als MB bezeichnet). Das Backend prüft die empfangenen Dateien unabhängig vom Browser.

## Brevo-Vorlage

Der Versand nutzt die aktive Brevo-Vorlage Nr. 3. Über `BREVO_TEMPLATE_ID` in
`server/.env` kann die Nummer geändert werden (Standard: 3). Die Formulardaten
werden durch `server/templates/contact-params.js` als `params` übergeben;
optionale leere Werte erscheinen als `–`, Leistungen als kommagetrennter Text.
Antwortadresse und Foto-Anhänge werden weiterhin mitgesendet. Änderungen am
Layout erfolgen im Brevo-Editor. Der frühere lokale HTML-Generator wird nicht
mehr für den Versand verwendet. Nach Konfigurationsänderungen Server neu starten.
