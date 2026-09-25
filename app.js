const app = {
  body: document.body,
  cards: Array.from(document.querySelectorAll('.bento-card, .hero-card, .orbit-panel')),
  heroName: document.querySelector('[data-current-focus]'),
  fact: document.querySelector('[data-dynamic-fact]'),
  navLinks: Array.from(document.querySelectorAll('.nav-link')),
  themeToggle: document.querySelector('#themeToggle'),
  themeLabel: document.querySelector('#themeToggle .theme-toggle-text'),
};

const THEME_KEY = 'joemartinez-theme';

function applyTheme(theme) {
  const isDark = theme === 'dark';
  app.body.classList.toggle('night-mode', isDark);
  app.body.classList.toggle('light-mode', !isDark);

  if (app.themeToggle) {
    const label = isDark ? 'Dark' : 'Light';
    app.themeToggle.setAttribute('aria-pressed', String(isDark));
    app.themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');

    if (app.themeLabel) {
      app.themeLabel.textContent = label;
    }
  }

  localStorage.setItem(THEME_KEY, theme);
}

const focusItems = ['Game Design', '3D Modeling', 'Music', 'Luau', 'C++'];
const facts = [
  'building a horror game prototype',
  'learning 3D systems and tooling',
  'composing game-ready music',
  'designing interactive systems',
  'making splashy visual worlds'
];

let factIndex = 0;
let focusIndex = 0;

function cycleFocus() {
  if (!app.heroName) return;

  focusIndex = (focusIndex + 1) % focusItems.length;
  app.heroName.textContent = focusItems[focusIndex];
}

function cycleFact() {
  if (!app.fact) return;

  factIndex = (factIndex + 1) % facts.length;
  app.fact.textContent = facts[factIndex];
}

function setupCards() {
  if (!app.cards.length) return;

  app.cards.forEach((card, index) => {
    card.style.transitionDelay = `${Math.min(index * 80, 460)}ms`;
  });
}

function setupNavigation() {
  if (!app.navLinks.length) return;

  app.navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      app.navLinks.forEach((item) => item.classList.toggle('is-active', item === link));
    });
  });
}

function setupThemeToggle() {
  if (!app.themeToggle) return;

  const savedTheme = localStorage.getItem(THEME_KEY);
  const initialTheme = savedTheme || 'dark';
  applyTheme(initialTheme);

  app.themeToggle.addEventListener('click', () => {
    const nextTheme = app.body.classList.contains('light-mode') ? 'dark' : 'light';
    applyTheme(nextTheme);
  });
}

function setupMouseGlow() {
  const root = document.documentElement;

  window.addEventListener('mousemove', (event) => {
    const x = Math.round((event.clientX / window.innerWidth) * 100);
    const y = Math.round((event.clientY / window.innerHeight) * 100);

    root.style.setProperty('--cursor-x', `${x}%`);
    root.style.setProperty('--cursor-y', `${y}%`);
  });
}

function setupMazeGame() {
  const mazeElement = document.querySelector('#maze');
  const resetButton = document.querySelector('#resetGame');
  const statusBox = document.querySelector('#gameStatusBox');
  const statusElement = document.querySelector('#gameStatus');
  const moveElement = document.querySelector('#moveCount');
  const mazeNumberElement = document.querySelector('#mazeNumber');
  const mazeSeedElement = document.querySelector('#mazeSeed');
  const mazeViewport = mazeElement?.parentElement;

  if (!mazeElement || !mazeViewport || !resetButton || !statusBox || !statusElement || !moveElement || !mazeNumberElement || !mazeSeedElement) return;

  function generateSeed() {
    return String(Math.floor(Math.random() * 100_000_000)).padStart(8, '0');
  }

  function createMaze(seed) {
    const size = 21;
    const cells = Array.from({ length: size }, () => Array(size).fill('#'));
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const directions = [[0, 2], [0, -2], [2, 0], [-2, 0]];
    const stack = [[1, 1]];
    cells[1][1] = ' ';

    while (stack.length) {
      const [row, column] = stack[stack.length - 1];
      const options = directions
        .map(([rowDelta, columnDelta]) => [row + rowDelta, column + columnDelta, rowDelta, columnDelta])
        .filter(([nextRow, nextColumn]) => nextRow > 0 && nextRow < size - 1 && nextColumn > 0 && nextColumn < size - 1)
        .filter(([nextRow, nextColumn]) => cells[nextRow][nextColumn] === '#');

      if (!options.length) {
        stack.pop();
        continue;
      }

      const [nextRow, nextColumn, rowDelta, columnDelta] = options[Math.floor(random() * options.length)];
      cells[row + rowDelta / 2][column + columnDelta / 2] = ' ';
      cells[nextRow][nextColumn] = ' ';
      stack.push([nextRow, nextColumn]);
    }

    const paths = [];
    cells.forEach((row, rowIndex) => {
      row.forEach((cell, columnIndex) => {
        if (cell === ' ') paths.push({ row: rowIndex, column: columnIndex });
      });
    });
    const start = paths.splice(Math.floor(random() * paths.length), 1)[0];
    const exitCandidates = paths.filter((path) => Math.abs(path.row - start.row) + Math.abs(path.column - start.column) >= size - 4);
    const exit = exitCandidates[Math.floor(random() * exitCandidates.length)];
    cells[start.row][start.column] = 'S';
    cells[exit.row][exit.column] = 'E';
    return { cells: cells.map((row) => row.join('')), start };
  }

  let mazeNumber = 1;
  let mazeSeed = generateSeed();
  let generatedMaze = createMaze(mazeSeed);
  let maze = generatedMaze.cells;
  let start = generatedMaze.start;
  let player = { ...start };
  let moves = 0;
  let hasWon = false;

  function render() {
    mazeElement.style.setProperty('--maze-columns', maze[0].length);
    mazeElement.replaceChildren();
    maze.forEach((row, rowIndex) => {
      [...row].forEach((cell, columnIndex) => {
        const tile = document.createElement('span');
        const isPlayer = player.row === rowIndex && player.column === columnIndex;
        const isExit = cell === 'E';
        tile.className = `maze-tile tile-${cell === '#' ? 'wall' : 'floor'}`;
        tile.setAttribute('role', 'gridcell');
        tile.setAttribute('aria-label', isPlayer ? 'Player' : isExit ? 'Exit' : cell === '#' ? 'Wall' : 'Path');

        if (isPlayer) {
          tile.classList.add('is-player');
        } else if (isExit) {
          tile.classList.add('is-exit');
          tile.textContent = '×';
        }

        mazeElement.append(tile);
      });
    });

    const tileSize = mazeElement.querySelector('.maze-tile').getBoundingClientRect().width;
    const mazeWidth = maze[0].length * tileSize;
    const mazeHeight = maze.length * tileSize;
    const cameraX = Math.min(0, Math.max(mazeViewport.clientWidth - mazeWidth, mazeViewport.clientWidth / 2 - (player.column + 0.5) * tileSize));
    const cameraY = Math.min(0, Math.max(mazeViewport.clientHeight - mazeHeight, mazeViewport.clientHeight / 2 - (player.row + 0.5) * tileSize));
    mazeElement.style.setProperty('--camera-x', `${cameraX}px`);
    mazeElement.style.setProperty('--camera-y', `${cameraY}px`);

    moveElement.textContent = `Moves: ${moves}`;
    mazeNumberElement.textContent = `Maze ${mazeNumber}`;
    mazeSeedElement.textContent = `Seed: ${mazeSeed}`;
  }

  function reset() {
    player = { ...start };
    moves = 0;
    hasWon = false;
    statusElement.textContent = 'Reach the exit.';
    statusBox.hidden = true;
    mazeElement.focus();
    render();
  }

  function movePlayer(rowDelta, columnDelta) {
    if (hasWon) return;

    const nextRow = player.row + rowDelta;
    const nextColumn = player.column + columnDelta;
    const nextCell = maze[nextRow]?.[nextColumn];

    if (!nextCell || nextCell === '#') {
      statusElement.textContent = 'A wall blocks the way.';
      return;
    }

    player = { row: nextRow, column: nextColumn };
    moves += 1;
    hasWon = nextCell === 'E';
    if (hasWon) {
      statusElement.textContent = `Maze ${mazeNumber} cleared!`;
      statusBox.hidden = false;
    }
    render();
  }

  mazeElement.addEventListener('keydown', (event) => {
    const directions = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
      w: [-1, 0],
      s: [1, 0],
      a: [0, -1],
      d: [0, 1]
    };
    const direction = directions[event.key] || directions[event.key.toLowerCase()];

    if (!direction) return;
    event.preventDefault();
    movePlayer(...direction);
  });

  resetButton.addEventListener('click', () => {
    mazeNumber += 1;
    mazeSeed = generateSeed();
    generatedMaze = createMaze(mazeSeed);
    maze = generatedMaze.cells;
    start = generatedMaze.start;
    reset();
  });
  reset();
}

function init() {
  setupCards();
  setupNavigation();
  setupThemeToggle();
  setupMouseGlow();
  setupMazeGame();

  if (app.heroName) {
    setInterval(cycleFocus, 1800);
  }

  if (app.fact) {
    setInterval(cycleFact, 2600);
  }
}

init();
