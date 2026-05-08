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

// In-memory storage
const rooms = new Map();
const connections = new Map();

// Generate 6-digit room code
function generateRoomCode() {
  let code;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms.has(code));
  return code;
}

// WebSocket connection
wss.on('connection', (ws) => {
  const connectionId = uuidv4();
  connections.set(connectionId, { ws, roomCode: null, playerName: null, type: null });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(connectionId, data);
    } catch (e) {
      console.error('Invalid message:', e);
    }
  });

  ws.on('close', () => handleDisconnect(connectionId));

  ws.send(JSON.stringify({ type: 'connected', connectionId }));
});

function handleMessage(connId, data) {
  const conn = connections.get(connId);
  if (!conn) return;

  switch (data.type) {
    case 'create-room':
      handleCreateRoom(connId, data);
      break;
    case 'join-room':
      handleJoinRoom(connId, data);
      break;
    case 'set-name':
      handleSetName(connId, data);
      break;
    case 'start-game':
      handleStartGame(connId, data);
      break;
    case 'game-input':
      handleGameInput(connId, data);
      break;
    case 'get-games':
      handleGetGames(connId);
      break;
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
  
  conn.ws.send(JSON.stringify({
    type: 'room-created',
    roomCode,
    qrUrl: `${process.env.RENDER_EXTERNAL_URL || 'https://game-store-8xi7.onrender.com'}/controller/?code=${roomCode}`
  }));
}

function handleJoinRoom(connId, data) {
  const { roomCode, playerName } = data;
  const room = rooms.get(roomCode);
  
  if (!room) {
    connections.get(connId).ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
    return;
  }

  const conn = connections.get(connId);
  conn.roomCode = roomCode;
  conn.type = 'controller';
  conn.playerName = playerName;

  if (room.players.has(playerName)) {
    conn.ws.send(JSON.stringify({ type: 'error', message: 'Name already taken' }));
    return;
  }

  room.players.set(playerName, { connId, name: playerName, input: {} });

  // Notify screen
  const screenConn = connections.get(room.screenId);
  console.log('Notifying screen:', room.screenId, 'players:', Array.from(room.players.values()).map(p => p.name));
  if (screenConn && screenConn.ws.readyState === WebSocket.OPEN) {
    const msg = JSON.stringify({
      type: 'player-joined',
      players: Array.from(room.players.values()).map(p => p.name)
    });
    console.log('Sending to screen:', msg);
    screenConn.ws.send(msg);
  } else {
    console.log('Screen connection not found or not open');
  }

  conn.ws.send(JSON.stringify({
    type: 'joined',
    roomCode,
    playerName,
    players: Array.from(room.players.values()).map(p => p.name)
  }));
}

function handleSetName(connId, data) {
  const { playerName } = data;
  const conn = connections.get(connId);
  if (!conn.roomCode) return;

  const room = rooms.get(conn.roomCode);
  if (!room) return;

  if (room.players.has(playerName)) {
    conn.ws.send(JSON.stringify({ type: 'error', message: 'Name already taken' }));
    return;
  }

  conn.playerName = playerName;
  room.players.set(playerName, { connId, name: playerName, input: {} });
  conn.ws.send(JSON.stringify({ type: 'name-set', playerName }));
}

function handleStartGame(connId, data) {
  const conn = connections.get(connId);
  if (!conn || conn.type !== 'screen') return;

  const room = rooms.get(conn.roomCode);
  if (!room) return;

  const { gameId } = data;
  room.currentGame = gameId;

  room.players.forEach((player) => {
    const playerConn = connections.get(player.connId);
    if (playerConn && playerConn.ws.readyState === WebSocket.OPEN) {
      playerConn.ws.send(JSON.stringify({
        type: 'game-starting',
        gameId,
        players: Array.from(room.players.values()).map(p => p.name)
      }));
    }
  });

  conn.ws.send(JSON.stringify({
    type: 'game-started',
    gameId,
    players: Array.from(room.players.values()).map(p => p.name)
  }));
}

function handleGameInput(connId, data) {
  const conn = connections.get(connId);
  if (!conn || conn.type !== 'controller') return;

  const room = rooms.get(conn.roomCode);
  if (!room) return;

  const player = room.players.get(conn.playerName);
  if (!player) return;

  player.input = data.input;

  const screenConn = connections.get(room.screenId);
  if (screenConn && screenConn.ws.readyState === WebSocket.OPEN) {
    screenConn.ws.send(JSON.stringify({
      type: 'player-input',
      playerName: conn.playerName,
      input: data.input
    }));
  }
}

function handleGetGames(connId) {
  const games = require('../games/gameList.js');
  connections.get(connId).ws.send(JSON.stringify({ type: 'game-list', games }));
}

function handleDisconnect(connId) {
  const conn = connections.get(connId);
  if (!conn || !conn.roomCode) return;

  const room = rooms.get(conn.roomCode);
  if (!room) return;

  if (conn.type === 'screen') {
    room.players.forEach((player) => {
      const playerConn = connections.get(player.connId);
      if (playerConn && playerConn.ws.readyState === WebSocket.OPEN) {
        playerConn.ws.send(JSON.stringify({ type: 'room-closed' }));
      }
    });
    rooms.delete(conn.roomCode);
  } else if (conn.type === 'controller') {
    room.players.delete(conn.playerName);
    
    const screenConn = connections.get(room.screenId);
    if (screenConn && screenConn.ws.readyState === WebSocket.OPEN) {
      screenConn.ws.send(JSON.stringify({
        type: 'player-left',
        playerName: conn.playerName,
        players: Array.from(room.players.values()).map(p => p.name)
      }));
    }
  }
  connections.delete(connId);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Gaming Platform 500+ running on port ${PORT}`);
  console.log(`Screen: http://localhost:${PORT}/screen/`);
  console.log(`Controller: http://localhost:${PORT}/controller/`);
});