# Gaming Platform 500+ - Full Game Platform

Bepul multiplayer gaming platform - PC/TV ekranida o'yin, telefonda boshqaruv.

## Tez Boshlash

```bash
cd server
npm install
npm start
```

Server `http://localhost:3000` da ishga tushadi:
- Ekran: http://localhost:3000/screen/
- Kontroller: http://localhost:3000/controller/

## O'yinlar (500+)

50 ta janr x 10 ta o'yin = 500+ o'yin:

- Racing (10 ta)
- Platformer (10 ta)
- Fighting (10 ta)
- Shooter (10 ta)
- Puzzle (10 ta)
- RPG (10 ta)
- Sports (10 ta)
- Arcade (10 ta)
- Va boshqa 40+ janr...

## Deploy (GitHub + Render)

1. GitHub ga yuklang
2. Render.com da "New Web Service"
3. Build: `cd server && npm install`
4. Start: `cd server && node index.js`

## Kod tuzilmasi

```
gaming-platform-500/
├── server/           # Node.js WebSocket server
├── public/           # Frontend (Screen + Controller)
├── games/           # 500+ o'yin fayllari
└── scripts/          # Generator scripts
```

## Vazifa

Her o'yin uchun alohida fayl va to'liq kod yozilgan.