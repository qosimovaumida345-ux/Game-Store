const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Redirect root to screen
app.get('/', (req, res) => res.redirect('/screen/'));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/games', express.static(path.join(__dirname, '../games')));
app.use(express.json());

const { buildUnityGame } = require('./unity-builder');

app.post('/api/build-game', async (req, res) => {
    const { gameId, code } = req.body;
    if (!gameId || !code) return res.status(400).json({ error: 'Missing gameId or code' });

    console.log(`[API] Triggering Unity Build for ${gameId}`);
    try {
        const result = await buildUnityGame(gameId, code);
        res.json(result);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// In-memory storage
const rooms = new Map();
const connections = new Map();

// Generate 6-digit room code
function generateRoomCode() {
  let code;
  let attempts = 0;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    attempts++;
    if (attempts > 100) break;
  } while (rooms.has(code));
  return code;
}

// Cleanup stale rooms (older than 2 hours)
setInterval(() => {
  const now = Date.now();
  rooms.forEach((room, code) => {
    if (now - room.createdAt > 7200000) {
      room.players.forEach((player) => {
        const playerConn = connections.get(player.connId);
        if (playerConn && playerConn.ws.readyState === WebSocket.OPEN) {
          playerConn.ws.send(JSON.stringify({ type: 'room-closed' }));
        }
      });
      rooms.delete(code);
    }
  });
}, 60000);

// WebSocket connection
wss.on('connection', (ws) => {
  const connectionId = uuidv4();
  connections.set(connectionId, { ws, roomCode: null, playerName: null, type: null });

  // Heartbeat
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(connectionId, data);
    } catch (e) {
      console.error('Invalid message:', e.message);
      safeSend(ws, { type: 'error', message: 'Invalid message format' });
    }
  });

  ws.on('close', () => handleDisconnect(connectionId));
  ws.on('error', (err) => console.error('WS Error:', err.message));

  safeSend(ws, { type: 'connected', connectionId });
});

// Heartbeat interval
const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => clearInterval(heartbeat));

function safeSend(ws, data) {
  try {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  } catch (e) {
    console.error('Send error:', e.message);
  }
}

function handleMessage(connId, data) {
  const conn = connections.get(connId);
  if (!conn) return;

  switch (data.type) {
    case 'create-room': handleCreateRoom(connId, data); break;
    case 'join-room': handleJoinRoom(connId, data); break;
    case 'start-game': handleStartGame(connId, data); break;
    case 'game-input': handleGameInput(connId, data); break;
    case 'game-state': handleGameState(connId, data); break;
    case 'get-games': handleGetGames(connId); break;
    case 'back-to-lobby': handleBackToLobby(connId); break;
    case 'chat': handleChat(connId, data); break;
    default: break;
  }
}

function handleCreateRoom(connId, data) {
  const conn = connections.get(connId);
  const roomCode = generateRoomCode();

  rooms.set(roomCode, {
    code: roomCode,
    screenId: connId,
    players: new Map(),
    gameState: null,
    currentGame: null,
    createdAt: Date.now()
  });

  conn.roomCode = roomCode;
  conn.type = 'screen';

  const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  safeSend(conn.ws, {
    type: 'room-created',
    roomCode,
    qrUrl: `${baseUrl}/controller/?code=${roomCode}`
  });
}

function handleJoinRoom(connId, data) {
  const { roomCode, playerName } = data;
  
  if (!roomCode || !playerName) {
    const conn = connections.get(connId);
    safeSend(conn.ws, { type: 'error', message: 'Room code and name required' });
    return;
  }

  const room = rooms.get(roomCode);
  if (!room) {
    const conn = connections.get(connId);
    safeSend(conn.ws, { type: 'error', message: 'Xona topilmadi (Room not found)' });
    return;
  }

  const conn = connections.get(connId);
  
  // Check duplicate name
  if (room.players.has(playerName)) {
    safeSend(conn.ws, { type: 'error', message: 'Bu ism band (Name taken)' });
    return;
  }

  // Max 8 players
  if (room.players.size >= 8) {
    safeSend(conn.ws, { type: 'error', message: 'Xona to\'la (Room full)' });
    return;
  }

  conn.roomCode = roomCode;
  conn.type = 'controller';
  conn.playerName = playerName;

  const playerColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#a29bfe', '#fd79a8', '#00b894', '#e17055'];
  const playerIndex = room.players.size;

  room.players.set(playerName, {
    connId,
    name: playerName,
    color: playerColors[playerIndex % playerColors.length],
    input: {},
    score: 0,
    ready: false
  });

  const playerList = Array.from(room.players.values()).map(p => ({
    name: p.name,
    color: p.color
  }));

  // Notify screen
  const screenConn = connections.get(room.screenId);
  if (screenConn) {
    safeSend(screenConn.ws, {
      type: 'player-joined',
      players: playerList
    });
  }

  // Notify the joining player
  safeSend(conn.ws, {
    type: 'joined',
    roomCode,
    playerName,
    color: playerColors[playerIndex % playerColors.length],
    players: playerList,
    currentGame: room.currentGame
  });

  // Notify other players
  room.players.forEach((player) => {
    if (player.connId !== connId) {
      const otherConn = connections.get(player.connId);
      if (otherConn) {
        safeSend(otherConn.ws, {
          type: 'player-update',
          players: playerList
        });
      }
    }
  });
}

function handleStartGame(connId, data) {
  const conn = connections.get(connId);
  if (!conn || conn.type !== 'screen') return;

  const room = rooms.get(conn.roomCode);
  if (!room) return;

  const { gameId, gameFile, genre } = data;
  room.currentGame = gameId;

  const playerList = Array.from(room.players.values()).map(p => ({
    name: p.name,
    color: p.color
  }));

  // Notify all controllers
  room.players.forEach((player) => {
    const playerConn = connections.get(player.connId);
    if (playerConn) {
      safeSend(playerConn.ws, {
        type: 'game-starting',
        gameId,
        genre: genre || gameId.split('-')[0],
        players: playerList
      });
    }
  });

  // Confirm to screen
  safeSend(conn.ws, {
    type: 'game-started',
    gameId,
    players: playerList
  });
}

function handleGameInput(connId, data) {
  const conn = connections.get(connId);
  if (!conn || conn.type !== 'controller') return;

  const room = rooms.get(conn.roomCode);
  if (!room) return;

  // Forward input to screen
  const screenConn = connections.get(room.screenId);
  if (screenConn) {
    safeSend(screenConn.ws, {
      type: 'player-input',
      playerName: conn.playerName,
      input: data.input
    });
  }
}

function handleGameState(connId, data) {
  const conn = connections.get(connId);
  if (!conn || conn.type !== 'screen') return;

  const room = rooms.get(conn.roomCode);
  if (!room) return;

  // Forward game state to all controllers (scores, etc)
  room.players.forEach((player) => {
    const playerConn = connections.get(player.connId);
    if (playerConn) {
      safeSend(playerConn.ws, {
        type: 'game-state-update',
        state: data.state
      });
    }
  });
}

function handleBackToLobby(connId) {
  const conn = connections.get(connId);
  if (!conn) return;

  const room = rooms.get(conn.roomCode);
  if (!room) return;

  room.currentGame = null;

  const playerList = Array.from(room.players.values()).map(p => ({
    name: p.name,
    color: p.color
  }));

  // Notify screen
  if (conn.type === 'screen') {
    room.players.forEach((player) => {
      const playerConn = connections.get(player.connId);
      if (playerConn) {
        safeSend(playerConn.ws, {
          type: 'back-to-lobby',
          players: playerList
        });
      }
    });
  }
}

function handleChat(connId, data) {
  const conn = connections.get(connId);
  if (!conn || !conn.roomCode) return;

  const room = rooms.get(conn.roomCode);
  if (!room) return;

  // Broadcast to room
  const msg = {
    type: 'chat',
    playerName: conn.playerName || 'Screen',
    message: (data.message || '').substring(0, 200)
  };

  const screenConn = connections.get(room.screenId);
  if (screenConn) safeSend(screenConn.ws, msg);

  room.players.forEach((player) => {
    const playerConn = connections.get(player.connId);
    if (playerConn) safeSend(playerConn.ws, msg);
  });
}

function handleGetGames(connId) {
  try {
    const gameListModule = require('../games/gameList.js');
    const games = Array.isArray(gameListModule) ? gameListModule : (gameListModule.gameList || []);
    safeSend(connections.get(connId).ws, { type: 'game-list', games });
  } catch (e) {
    console.error('Failed to load game list:', e.message);
    safeSend(connections.get(connId).ws, { type: 'game-list', games: [] });
  }
}

function handleDisconnect(connId) {
  const conn = connections.get(connId);
  if (!conn || !conn.roomCode) {
    connections.delete(connId);
    return;
  }

  const room = rooms.get(conn.roomCode);
  if (!room) {
    connections.delete(connId);
    return;
  }

  if (conn.type === 'screen') {
    // Screen disconnected - close room
    room.players.forEach((player) => {
      const playerConn = connections.get(player.connId);
      if (playerConn) {
        safeSend(playerConn.ws, { type: 'room-closed' });
      }
    });
    rooms.delete(conn.roomCode);
  } else if (conn.type === 'controller') {
    room.players.delete(conn.playerName);

    const playerList = Array.from(room.players.values()).map(p => ({
      name: p.name,
      color: p.color
    }));

    // Notify screen
    const screenConn = connections.get(room.screenId);
    if (screenConn) {
      safeSend(screenConn.ws, {
        type: 'player-left',
        playerName: conn.playerName,
        players: playerList
      });
    }

    // Notify other players
    room.players.forEach((player) => {
      const playerConn = connections.get(player.connId);
      if (playerConn) {
        safeSend(playerConn.ws, {
          type: 'player-update',
          players: playerList
        });
      }
    });
  }

  connections.delete(connId);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🎮 Gaming Platform running on port ${PORT}`);
  console.log(`📺 Screen: http://localhost:${PORT}/screen/`);
  console.log(`📱 Controller: http://localhost:${PORT}/controller/`);
  console.log(`🌐 Rooms active: ${rooms.size}\n`);
});