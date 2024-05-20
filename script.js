
const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const grid = 32;
const tetrominoSequence = [];
const MAX_BEST_SCORES = 5;
let bestScores = [];

const playfield = [];
for (let row = -2; row < 20; row++) {
  playfield[row] = Array.from({ length: 10 }).fill(0);
}

const tetrominos = {
  'I': [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  'J': [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  'L': [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
  'O': [[1, 1], [1, 1]],
  'S': [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  'Z': [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  'T': [[0, 1, 0], [1, 1, 1], [0, 0, 0]]
};

const colors = {
  'I': '#00FFFF',   // Cyan
  'J': '#1E90FF',   // DodgerBlue
  'L': '#FFA500',   // Orange
  'O': '#FFD700',   // Gold
  'S': '#32CD32',   // LimeGreen
  'Z': '#FF4500',   // OrangeRed
  'T': '#9370DB'    // MediumPurple
};

let count = 0;
let tetromino = null;
let rAF = null;
let gameOver = false;
let score = 0;
let startTime = null;
let timerInterval = null;

// Initialization functions
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSequence() {
  const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  while (sequence.length) {
    const rand = getRandomInt(0, sequence.length - 1);
    const name = sequence.splice(rand, 1)[0];
    tetrominoSequence.push(name);
  }
}

function updateTimer() {
  const currentTime = Date.now();
  const elapsedTime = currentTime - startTime;
  const minutes = Math.floor(elapsedTime / 60000);
  const seconds = Math.floor((elapsedTime % 60000) / 1000);
  document.getElementById('Timer').innerText = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function stopTimer() {
  clearInterval(timerInterval);
}

function getNextTetromino() {
  if (tetrominoSequence.length === 0) {
    generateSequence();
  }
  const name = tetrominoSequence.pop();
  const matrix = tetrominos[name];
  const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);
  const row = name === 'I' ? -1 : -2;
  return { name, matrix, row, col };
}

function startGame() {
  tetromino = getNextTetromino();
  rAF = requestAnimationFrame(loop);
  initBestScores();
  startTime = Date.now();
  timerInterval = setInterval(updateTimer, 1000);
}

// Game mechanics functions
function rotate(matrix) {
  const N = matrix.length;
  const rotatedMatrix = [];
  for (let i = 0; i < N; i++) {
    const newRow = [];
    for (let j = 0; j < N; j++) {
      newRow.push(matrix[N - j - 1][i]);
    }
    rotatedMatrix.push(newRow);
  }
  return rotatedMatrix;
}

function isValidMove(matrix, cellRow, cellCol) {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col] && (
          cellCol + col < 0 ||
          cellCol + col >= playfield[0].length ||
          cellRow + row >= playfield.length ||
          playfield[cellRow + row][cellCol + col])) {
        return false;
      }
    }
  }
  return true;
}

function calculateScore(linesCleared) {
  const pointsPerLine = 100;
  const lineClearMultiplier = [0, 1, 3, 6, 10]; // Multipliers for 1, 2, 3, and 4 lines cleared

  return pointsPerLine * lineClearMultiplier[linesCleared];
}

function updateBestScores() {
  const welcomingDiv = document.getElementById('Welcomming').innerHTML;
  const pattern = /Bienvenido,<br>(.+?)!/;
  const playerName = pattern.exec(welcomingDiv);
  const playername = playerName[1]
  const elapsedTime = document.getElementById('Timer').innerText.replace('Time: ', '');
  bestScores.push({ name: playername, score: score, time: elapsedTime });
  bestScores.sort((a, b) => b.score - a.score);
  bestScores = bestScores.slice(0, MAX_BEST_SCORES);
  localStorage.setItem('bestScores', JSON.stringify(bestScores)); // Save best scores in localStorage
}

function displayBestScores() {
  const scoresList = document.getElementById('scoresList');
  scoresList.innerHTML = ''; // Clear previous best scores
  bestScores.forEach((record) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${record.name}</span>
      <span class="score">${record.score}</span>
      <span class="time">(${record.time})</span>
    `;
    scoresList.appendChild(li);
  });
}

function initBestScores() {
  console.log("Initializing best scores...");
  const storedBestScores = localStorage.getItem('bestScores');
  if (storedBestScores) {
    bestScores = JSON.parse(storedBestScores);
    displayBestScores();
  }
}

function updateScore() {
  document.getElementById('Score').innerHTML = 'Score: ' + score;
}

function checkAndClearLines() {
  let linesCleared = 0;
  for (let row = playfield.length - 1; row >= 0; row--) {
    if (playfield[row].every(cell => !!cell)) {
      linesCleared++;
      // Move all rows above down by one
      for (let r = row; r > 0; r--) {
        for (let c = 0; c < playfield[r].length; c++) {
          playfield[r][c] = playfield[r - 1][c];
        }
      }
      // Clear the top row
      for (let c = 0; c < playfield[0].length; c++) {
        playfield[0][c] = 0;
      }
      // Adjust row to check the same row again as rows above have moved down
      row++;
    }
  }
  // Update score based on the number of lines cleared at once
  if (linesCleared > 0) {
    score += calculateScore(linesCleared);
    updateScore();
  }
}

function placeTetromino() {
  for (let row = 0; row < tetromino.matrix.length; row++) {
    for (let col = 0; col < tetromino.matrix[row].length; col++) {
      if (tetromino.matrix[row][col]) {
        if (tetromino.row + row < 0) {
          return showGameOver();
        }
        playfield[tetromino.row + row][tetromino.col + col] = tetromino.name;
      }
    }
  }
  checkAndClearLines();
  tetromino = getNextTetromino();
}

function showGameOver() {
  cancelAnimationFrame(rAF);
  gameOver = true;
  stopTimer();
  context.fillStyle = 'black';
  context.globalAlpha = 0.75;
  context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
  context.globalAlpha = 1;
  context.fillStyle = 'white';
  context.font = '36px monospace';
  context.textAlign = 'center';
  context.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2);
  updateBestScores()
}

function moveTetrominoDown() {
  if (++count > 35) {
    tetromino.row++;
    count = 0;
    if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
      tetromino.row--;
      placeTetromino();
    }
  }
}

// Drawing functions
function drawPlayfield() {
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 10; col++) {
      if (playfield[row][col]) {
        const name = playfield[row][col];
        context.fillStyle = colors[name];
        context.fillRect(col * grid, row * grid, grid - 1, grid - 1);
      }
    }
  }
}

function drawTetromino() {
  if (tetromino) {
    context.fillStyle = colors[tetromino.name];
    for (let row = 0; row < tetromino.matrix.length; row++) {
      for (let col = 0; col < tetromino.matrix[row].length; col++) {
        if (tetromino.matrix[row][col]) {
          context.fillRect(
            (tetromino.col + col) * grid,
            (tetromino.row + row) * grid,
            grid - 1,
            grid - 1
          );
        }
      }
    }
  }
}


// Game loop
function loop() {
  rAF = requestAnimationFrame(loop);
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawPlayfield();
  drawTetromino();
  moveTetrominoDown();
  updateScore();
  displayBestScores();

}

function restartGame() {
  cancelAnimationFrame(rAF); // Cancel any running animation frame
  gameOver = false;
  score = 0;
  document.getElementById('Timer').innerText = "Time: 00:00"
  playfield.forEach(row => row.fill(0)); // Clear the playfield
  displayBestScores();

  startGame();
}

// Event handling
document.addEventListener('keydown', function(e) {
  if (gameOver) return;
  if (e.which === 37 || e.which === 39) {
    const col = e.which === 37 ? tetromino.col - 1 : tetromino.col + 1;
    if (isValidMove(tetromino.matrix, tetromino.row, col)) {
      tetromino.col = col;
    }
  }
  if (e.which === 38) {
    const matrix = rotate(tetromino.matrix);
    if (isValidMove(matrix, tetromino.row, tetromino.col)) {
      tetromino.matrix = matrix;
    }
  }
  if (e.which === 40) {
    const row = tetromino.row + 1;
    if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
      tetromino.row = row - 1;
      placeTetromino();
      return;
    }
    tetromino.row = row;
  }
});

document.getElementById('restartButton').addEventListener('click', function() {
  restartGame();
});

// Start the game
startGame();
