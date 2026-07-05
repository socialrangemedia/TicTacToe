const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

// Serveer statische bestanden
app.use(express.static(path.join(__dirname, 'public')));

// Game state met cleanup timer
const games = {};
const GAME_TIMEOUT = 3600000; // 1 uur voordat een game automatisch wordt opgeruimd

// Functie om games op te schonen
function cleanupGames() {
  const now = Date.now();
  Object.keys(games).forEach(gameId => {
    const game = games[gameId];
    // Als game leeg is of te lang geleden gemaakt, verwijderen
    if (!game || !game.players || game.players.length === 0 || (game.createdAt && now - game.createdAt > GAME_TIMEOUT)) {
      delete games[gameId];
      console.log(`Game ${gameId} opgeruimd`);
    }
  });
}

// Maak elke 30 minuten een cleanup run
setInterval(cleanupGames, 30 * 60 * 1000);

// Minimax algoritme voor de AI
function minimax(board, depth, isMaximizing, playerSymbol, computerSymbol) {
  const winner = checkWinner(board);
  
  // Basisgevallen
  if (winner === computerSymbol) {
    return 10 - depth; // Computer wint
  }
  if (winner === playerSymbol) {
    return depth - 10; // Speler wint
  }
  if (board.every(cell => cell !== null)) {
    return 0; // Gelijkspel
  }
  
  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = computerSymbol;
        const score = minimax(board, depth + 1, false, playerSymbol, computerSymbol);
        board[i] = null;
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = playerSymbol;
        const score = minimax(board, depth + 1, true, playerSymbol, computerSymbol);
        board[i] = null;
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

// Computer zet maken
function makeComputerMove(gameId) {
  const game = games[gameId];
  if (!game || game.status !== 'playing' || !game.isSinglePlayer) {
    return;
  }
  
  const playerSymbol = game.symbols[game.players[0]];
  const computerSymbol = playerSymbol === 'X' ? 'O' : 'X';
  
  // Vind de beste zet voor de computer
  let bestScore = -Infinity;
  let bestMove = null;
  
  for (let i = 0; i < game.board.length; i++) {
    if (game.board[i] === null) {
      game.board[i] = computerSymbol;
      const score = minimax(game.board, 0, false, playerSymbol, computerSymbol);
      game.board[i] = null;
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  
  // Voer de beste zet uit
  if (bestMove !== null) {
    game.board[bestMove] = computerSymbol;
    
    // Check winnaar
    const winner = checkWinner(game.board);
    if (winner) {
      game.status = 'finished';
      io.to(gameId).emit('gameOver', { winner: 'computer' });
      console.log(`Computer heeft gewonnen in game ${gameId}`);
      return;
    }
    
    // Check gelijkspel
    if (game.board.every(cell => cell !== null)) {
      game.status = 'finished';
      io.to(gameId).emit('gameOver', { winner: null });
      console.log(`Gelijkspel in game ${gameId}`);
      return;
    }
    
    // Wissel speler
    game.currentPlayer = playerSymbol;
    io.to(gameId).emit('moveMade', { board: game.board, currentPlayer: game.currentPlayer });
    console.log(`Computer heeft zet gemaakt in game ${gameId}`);
  }
}

// Socket.io verbindingen
io.on('connection', (socket) => {
  console.log('Nieuwe speler verbonden:', socket.id);

  // Nieuwe multiplayer game starten
  socket.on('newGame', () => {
    try {
      const gameId = `game-${Date.now()}`;
      const playerSymbol = Math.random() > 0.5 ? 'X' : 'O';
      games[gameId] = {
        board: Array(9).fill(null),
        currentPlayer: 'X',
        players: [socket.id],
        symbols: { [socket.id]: playerSymbol },
        status: 'waiting',
        createdAt: Date.now(),
        isSinglePlayer: false
      };
      socket.join(gameId);
      socket.emit('gameCreated', { gameId, playerSymbol, isSinglePlayer: false });
      console.log(`Multiplayer Game ${gameId} gemaakt door ${socket.id} als ${playerSymbol}`);
    } catch (error) {
      console.error('Fout bij maken van nieuwe game:', error);
      socket.emit('error', 'Kon nieuwe game niet maken');
    }
  });

  // Nieuwe single-player game starten (tegen computer)
  socket.on('newSinglePlayerGame', () => {
    try {
      const gameId = `single-${Date.now()}`;
      const playerSymbol = 'X'; // Speler is altijd X in single-player mode
      const computerSymbol = 'O';

      // Maak een nieuwe single-player game
      games[gameId] = {
        board: Array(9).fill(null),
        currentPlayer: 'X', // Speler begint altijd
        players: [socket.id],
        symbols: { [socket.id]: playerSymbol, computer: computerSymbol },
        status: 'playing',
        createdAt: Date.now(),
        isSinglePlayer: true,
        gameId: gameId
      };

      socket.join(gameId);
      socket.emit('gameCreated', { gameId, playerSymbol: 'X', isSinglePlayer: true });

      console.log(`Single-player Game ${gameId} gemaakt door ${socket.id} als X`);

      // Als de computer aan de beurt is (O), voer de eerste zet uit
      const game = games[gameId];
      if (game.currentPlayer === 'O') {
        setTimeout(() => makeComputerMove(gameId), 500); // Kleine vertraging voor betere UX
      }
    } catch (error) {
      console.error('Fout bij maken van single-player game:', error);
      socket.emit('error', 'Kon single-player game niet maken');
    }
  });

  // Join bestaande game
  socket.on('joinGame', (gameId) => {
    try {
      const game = games[gameId];
      if (!game) {
        socket.emit('error', 'Game niet gevonden of is verwijderd');
        return;
      }
      if (game.players.length >= 2) {
        socket.emit('error', 'Game is al vol (2 spelers)');
        return;
      }
      if (game.players.includes(socket.id)) {
        socket.emit('error', 'Je bent al in deze game');
        return;
      }
      const playerSymbol = game.symbols[game.players[0]] === 'X' ? 'O' : 'X';
      game.players.push(socket.id);
      game.symbols[socket.id] = playerSymbol;
      game.status = 'playing';
      socket.join(gameId);
      io.to(gameId).emit('playerJoined', { 
        gameId, 
        playerSymbol, 
        opponentId: game.players.find(id => id !== socket.id) 
      });
      console.log(`Speler ${socket.id} joined game ${gameId} als ${playerSymbol}`);
    } catch (error) {
      console.error('Fout bij join game:', error);
      socket.emit('error', 'Kon game niet joinen');
    }
  });

  // Zet een symbool op het bord
  socket.on('makeMove', ({ gameId, index }) => {
    try {
      const game = games[gameId];
      if (!game) {
        socket.emit('error', 'Game niet gevonden');
        return;
      }
      if (game.status !== 'playing') {
        socket.emit('error', 'Game is niet actief');
        return;
      }
      if (game.board[index] !== null) {
        socket.emit('error', 'Veld is al bezet');
        return;
      }
      
      const playerId = socket.id;
      const playerSymbol = game.symbols[playerId];
      
      if (game.currentPlayer !== playerSymbol) {
        socket.emit('error', 'Niet jouw beurt');
        return;
      }

      // Maak de zet
      game.board[index] = playerSymbol;

      // Check winnaar
      const winner = checkWinner(game.board);
      if (winner) {
        game.status = 'finished';
        io.to(gameId).emit('gameOver', { winner: playerId });
        console.log(`Speler ${playerId} heeft gewonnen in game ${gameId}`);
        return;
      }

      // Check gelijkspel
      if (game.board.every(cell => cell !== null)) {
        game.status = 'finished';
        io.to(gameId).emit('gameOver', { winner: null });
        console.log(`Gelijkspel in game ${gameId}`);
        return;
      }

      // Wissel speler
      game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
      
      // Als het nu de computer zijn beurt is in single-player mode
      if (game.isSinglePlayer && game.currentPlayer === 'O') {
        setTimeout(() => makeComputerMove(gameId), 500);
      }

      io.to(gameId).emit('moveMade', { 
        board: game.board, 
        currentPlayer: game.currentPlayer 
      });
    } catch (error) {
      console.error('Fout bij maken van zet:', error);
      socket.emit('error', 'Kon zet niet maken');
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Speler gedisconnect:', socket.id);
    // Cleanup games waar deze speler in zat
    Object.keys(games).forEach(gameId => {
      const game = games[gameId];
      if (game && game.players && game.players.includes(socket.id)) {
        if (game.isSinglePlayer) {
          io.to(gameId).emit('gameOver', { winner: 'computer', disconnected: true });
        } else {
          io.to(gameId).emit('playerDisconnected', { message: 'Tegenstander is weggegaan. Game beeindigd.' });
        }
        delete games[gameId];
        console.log(`Game ${gameId} verwijderd door disconnect van ${socket.id}`);
      }
    });
  });

  // Stuur welkom bericht
  socket.emit('welcome', { 
    message: 'Welkom bij Tic Tac Toe! Maak een nieuw spel of join een bestaand spel.' 
  });
});

// Win detectie functie
function checkWinner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rijen
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // kolommen
    [0, 4, 8], [2, 4, 6] // diagonalen
  ];
  
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server draait op http://localhost:${PORT}`);
  console.log('🎮 Tic Tac Toe game is klaar voor gebruik!');
});
