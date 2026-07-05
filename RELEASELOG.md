# Tic Tac Toe v1 Alpha Release Notes

## 📦 Release: v1.0.0-alpha
**Datum:** 2026-07-05
**Status:** ✅ BetaalAlpha v1
**Type:** Feature Release

---

## 🚀 Wat is nieuw in v1.0.0-alpha?

### ✨ Features
- **Single-player mode:** Speel tegen de computer met slimme AI (minimax-algoritme)
- **Multiplayer mode:** Speel tegen een vriend via Game ID
- **Game state:** Bestaande games worden na 1 uur automatisch opgeruimd
- **UI:** Responsive design met duidelijke statusmeldingen
- **Docker support:** Direct draaien met `docker compose up -d`

### 🐛 Bugfixes
- **Nieuwe Ronde knop:** Nu reset de knop het bord volledig en start een nieuw spel
  - Voorheen bleef de oude game visueel staan
  - UI wordt nu volledig gereset (status, spel-ID, symbool, bord)
  - Lokale state wordt teruggezet
  - Bordcellen worden handmatig leeggemaakt

### 🛠 Technische details
- **Backend:** Node.js met Express en Socket.IO
- **Frontend:** Vanilla JS, HTML5, CSS3
- **AI:** Minimax-algoritme voor optimale computerzetten
- **Docker:** Multi-stage build met Node.js 20
- **Port:** 3000 (standaard)

---

## 📋 Installatie & Gebruik

### Docker (aanbevolen)
```bash
# Start de container
docker compose -f docker/docker-compose.yml up -d

# Open de game in je browser
open http://localhost:3000

# Stop de container
# docker compose -f docker/docker-compose.yml down
```

### Lokale installatie
```bash
npm install
npm run dev
```

### Spelmodi
1. **Tegen Computer Spelen:** Klik op de knop en speel tegen de AI
2. **Nieuw Spel Maken:** Maak een multiplayer spel en deel de Game ID met je vriend
3. **Join Spel:** Voer een bestaande Game ID in om mee te doen

### Spelregels
- Jij bent altijd **X**, de computer is **O** (single-player) of je tegenstander is **O** (multiplayer)
- Klik op een vakje om je zet te doen
- De computer reageert direct met een zet (single-player)
- Bij winst/gelijkspel kun je op **Nieuwe Ronde** klikken voor een nieuw spel

---

## 📁 Projectstructuur
```
tic-tac-toe-b605fb95/
├── public/          # Frontend assets
│   ├── index.html    # Hoofd-HTML
│   ├── style.css     # Stijlen
│   ├── game.js       # Game logica (Socket.IO client)
│   └── assets/       # Afbeeldingen, 3D-modellen
├── server.js         # Backend (Express + Socket.IO)
├── package.json      # Dependencies en scripts
├── docker/           # Docker configuratie
│   └── docker-compose.yml
└── RELEASELOG.md     # Deze release notes
```

---

## 🎮 Game Features

### AI (Single-player)
- **Minimax-algoritme:** De computer maakt optimale zetten
- **Moeilijkheidsgraad:** Standaard diepte 3 (kan aangepast worden in `server.js`)
- **Snelle reactie:** De computer zet direct na jouw zet

### Multiplayer
- **Real-time:** Updates zijn direct zichtbaar voor beide spelers
- **Game ID:** Unieke identifier voor elk spel
- **Automatische cleanup:** Games worden na 1 uur opgeruimd

### UI/UX
- **Statusmeldingen:** Duidelijke feedback bij winst/gelijkspel/verlies
- **Responsive:** Werkt op desktop en mobiel
- **Visuele feedback:** Kleurrijke X/O symbolen en meldingen

---

## 🔧 Configuratie

### `server.js`
```javascript
// Game cleanup interval (1 uur)
const GAME_CLEANUP_INTERVAL = 60 * 60 * 1000;

// AI moeilijkheidsgraad (minimax depth)
const AI_DEPTH = 3;
```

### `docker-compose.yml`
```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
    restart: unless-stopped
```

---

## 📖 Gebruikershandleiding

### Single-player mode
1. Klik op **"Tegen Computer Spelen"**
2. Jij bent **X**, de computer is **O**
3. Maak je zet door op een vakje te klikken
4. De computer reageert direct met een zet
5. Bij afloop klik op **"Nieuwe Ronde"** voor een nieuw spel

### Multiplayer mode
1. Klik op **"Nieuw Spel Maken"**
2. Deel de **Game ID** met je vriend
3. Je vriend klikt op **"Join Spel"** en voert de Game ID in
4. Speel het spel en geniet van real-time updates
5. Bij afloop klik op **"Nieuwe Ronde"** voor een nieuw spel

### Tips
- De computer gebruikt het minimax-algoritme: hoe hoger de `AI_DEPTH`, hoe slimmer de computer (maar trager)
- Bij gelijkspel kun je altijd een nieuwe ronde starten
- De game state wordt automatisch opgeschoond na 1 uur inactiviteit

---

## 🐳 Docker Commands

| Command | Beschrijving |
|---------|--------------|
| `docker compose up -d` | Start de container |
| `docker compose down` | Stop de container |
| `docker compose restart app` | Herstart de app na code-wijzigingen |
| `docker compose logs -f app` | Bekijk logs live |
| `docker compose ps` | Controleer of de container draait |

---

## 📝 Release Notes Template

```markdown
## 📦 Release: vX.X.X
**Datum:** `YYYY-MM-DD`
**Status:** ✅ BetaalAlpha v1 / 🚧 Beta / 🔒 Stable
**Type:** Feature Release / Bugfix / Breaking Change

---

## 🚀 Wat is nieuw?
- [Feature 1]
- [Feature 2]
- [Bugfix]

## 🐛 Bugfixes
- [Omschrijving bugfix]

## 🛠 Technische details
- [Technische wijziging]

---
```

---

## 🤝 Bijdragen

Wil je bijdragen aan dit project?
1. Fork de repository
2. Maak een feature branch: `git checkout -b feature/naam`
3. Commit je wijzigingen: `git commit -m "feat: beschrijving"`
4. Push naar de branch: `git push origin feature/naam`
5. Open een Pull Request

---

## 📄 Licentie
MIT License - Copyright (c) 2024 Dennis van Zanten ([Van Ambtswege Vermoord](https://vanambtswegevermoord.nl/))

---

## 📞 Contact
Voor vragen of issues: open een GitHub Issue of stuur een bericht naar de maintainers.

---

*Laatste update: 05-07-2026, 18:00:00*
