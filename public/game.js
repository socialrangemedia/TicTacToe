// Tic Tac Toe Game Client-side Logic
const socket = io();

// DOM elementen
const newGameBtn = document.getElementById('newGameBtn');
const newSinglePlayerBtn = document.getElementById('newSinglePlayerBtn');
const joinGameBtn = document.getElementById('joinGameBtn');
const gameIdInput = document.getElementById('gameIdInput');
const modeSelection = document.getElementById('modeSelection');
const gameLobby = document.getElementById('gameLobby');
const gameBoard = document.getElementById('gameBoard');
const currentGameId = document.getElementById('currentGameId');
const yourSymbol = document.getElementById('yourSymbol');
const currentTurn = document.getElementById('currentTurn');
const board = document.getElementById('board');
const gameStatus = document.getElementById('gameStatus');
const rematchBtn = document.getElementById('rematchBtn');

// Game state
let currentGameIdValue = '';
let playerSymbolValue = '';
let isMyTurn = false;
let isSinglePlayerMode = false;

// Event listeners
newGameBtn.addEventListener('click', createNewGame);
newSinglePlayerBtn.addEventListener('click', createNewSinglePlayerGame);
joinGameBtn.addEventListener('click', joinExistingGame);
rematchBtn.addEventListener('click', startNewRound);

// Maak nieuw multiplayer spel
function createNewGame() {
  socket.emit('newGame');
}

// Maak nieuw single-player spel (tegen computer)
function createNewSinglePlayerGame() {
  socket.emit('newSinglePlayerGame');
}

// Join bestaand spel
function joinExistingGame() {
  const gameId = gameIdInput.value.trim();
  if (gameId) {
    socket.emit('joinGame', gameId);
  }
}

// Start een nieuwe ronde (reset het bord en start een nieuw spel)
function startNewRound() {
  // Reset UI state volledig
  modeSelection.classList.add('hidden');
  gameLobby.classList.add('hidden');
  gameBoard.classList.remove('hidden');
  rematchBtn.classList.add('hidden');
  gameStatus.textContent = '';
  currentTurn.textContent = '';
  yourSymbol.textContent = '';
  currentGameId.textContent = '';
  
  // Reset lokale state
  currentGameIdValue = '';
  playerSymbolValue = '';
  isMyTurn = false;
  
  // Verwijder alle cellinhoud
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    cell.textContent = '';
    cell.classList.remove('x', 'o');
  });
  
  // Start een nieuw spel op basis van de huidige modus
  if (isSinglePlayerMode) {
    createNewSinglePlayerGame();
  } else {
    createNewGame();
  }
}

// Board cell klik handler
board.addEventListener('click', (e) => {
  if (!e.target.classList.contains('cell')) return;
  const index = parseInt(e.target.dataset.index);
  if (isMyTurn && currentGameIdValue) {
    socket.emit('makeMove', { gameId: currentGameIdValue, index });
  }
});

// Socket.io events
socket.on('gameCreated', ({ gameId, playerSymbol, isSinglePlayer }) => {
  currentGameIdValue = gameId;
  playerSymbolValue = playerSymbol;
  isSinglePlayerMode = isSinglePlayer;
  isMyTurn = playerSymbol === 'X';
  modeSelection.classList.add('hidden');
  gameLobby.classList.add('hidden');
  gameBoard.classList.remove('hidden');
  rematchBtn.classList.add('hidden');
  currentGameId.textContent = gameId;
  yourSymbol.textContent = playerSymbol;
  currentTurn.textContent = isMyTurn ? 'Jij' : isSinglePlayerMode ? 'Computer' : 'Tegenstander';
  gameStatus.textContent = isSinglePlayerMode ? 'Spel gestart! Jij bent X, de computer is O. Jij begint!' : 'Spel gestart! Deel deze Game ID met je vriend: ' + gameId;
  console.log(`Game ${gameId} gemaakt. Jij bent ${playerSymbol} in ${isSinglePlayerMode ? 'single-player' : 'multiplayer'} mode`);
});

socket.on('playerJoined', ({ gameId, playerSymbol, opponentId }) => {
  if (gameId === currentGameIdValue) {
    isMyTurn = playerSymbol === 'X';
    modeSelection.classList.add('hidden');
    gameLobby.classList.add('hidden');
    gameBoard.classList.remove('hidden');
    yourSymbol.textContent = playerSymbol;
    currentTurn.textContent = isMyTurn ? 'Jij' : 'Tegenstander';
    gameStatus.textContent = 'Spel gestart! Jij bent ' + (isMyTurn ? 'X' : 'O');
    console.log(`Speler joined game ${gameId}. Jij bent ${playerSymbol}`);
  }
});

socket.on('moveMade', ({ board: updatedBoard, currentPlayer }) => {
  updateBoard(updatedBoard);
  isMyTurn = currentPlayer === playerSymbolValue;
  if (isSinglePlayerMode && currentPlayer === 'O') {
    currentTurn.textContent = 'Computer is aan het nadenken...';
  } else {
    currentTurn.textContent = isMyTurn ? 'Jij' : isSinglePlayerMode ? 'Computer' : 'Tegenstander';
  }
  gameStatus.textContent = '';
});

socket.on('gameOver', ({ winner, disconnected }) => {
  if (disconnected) {
    gameStatus.textContent = '❌ Je tegenstander is weggegaan. Je wint automatisch!';
  } else if (winner) {
    if (winner === 'computer') {
      gameStatus.textContent = '😢 De computer heeft gewonnen!';
    } else if (winner === playerSymbolValue) {
      gameStatus.textContent = '🎉 Je hebt gewonnen!';
    } else {
      gameStatus.textContent = '😢 Je hebt verloren!';
    }
  } else {
    gameStatus.textContent = '🤝 Gelijkspel!';
  }
  rematchBtn.classList.remove('hidden');
});

socket.on('error', (message) => {
  gameStatus.textContent = '⚠️ ' + message;
  console.error('Error:', message);
});

socket.on('playerDisconnected', ({ message }) => {
  gameStatus.textContent = '❌ ' + message;
  rematchBtn.classList.remove('hidden');
});

// Update bord
function updateBoard(boardState) {
  const cells = document.querySelectorAll('.cell');
  cells.forEach((cell, index) => {
    cell.textContent = '';
    if (boardState[index] === 'X') {
      cell.classList.add('x');
      cell.textContent = '❌';
    } else if (boardState[index] === 'O') {
      cell.classList.add('o');
      cell.textContent = '⭕';
    } else {
      cell.classList.remove('x', 'o');
    }
  });
}

// Toon welkom bericht
console.log('Tic Tac Toe game geladen! Kies "Tegen Computer Spelen" om tegen de computer te spelen.');
gameStatus.textContent = 'Welkom bij Tic Tac Toe! Kies "Tegen Computer Spelen" of maak een nieuw spel.';
