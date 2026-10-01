function generateSeed() {
  return String(Math.floor(Math.random() * 900000) + 100000);
}

function createRandom(seed) {
  let value = Number(seed);

  return function () {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function findUnvisitedNeighbors(row, column, directions, cells) {
  const size = cells.length;

  return directions
    .map(([rowDelta, columnDelta]) => [row + rowDelta, column + columnDelta, rowDelta, columnDelta])
    .filter(([nextRow, nextColumn]) => nextRow > 0 && nextRow < size - 1 && nextColumn > 0 && nextColumn < size - 1)
    .filter(([nextRow, nextColumn]) => cells[nextRow][nextColumn] === "#");
}

function carvePath(row, column, nextRow, nextColumn, rowDelta, columnDelta, cells) {
  cells[row + rowDelta / 2][column + columnDelta / 2] = " ";
  cells[nextRow][nextColumn] = " ";
}

function createMaze(seed) {
  const size = 21;
  const cells = Array.from({ length: size }, () => Array(size).fill("#"));
  const random = createRandom(seed);
  const directions = [[0, 2], [0, -2], [2, 0], [-2, 0]];
  const stack = [[1, 1]];
  cells[1][1] = " ";

  while (stack.length) {
    const [row, column] = stack[stack.length - 1];
    const choices = findUnvisitedNeighbors(row, column, directions, cells);

    if (!choices.length) {
      stack.pop();
      continue;
    }

    const [nextRow, nextColumn, rowDelta, columnDelta] = choices[Math.floor(random() * choices.length)];
    carvePath(row, column, nextRow, nextColumn, rowDelta, columnDelta, cells);
    stack.push([nextRow, nextColumn]);
  }

  const openCells = [];
  cells.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (cell === " ") openCells.push({ row: rowIndex, column: columnIndex });
    });
  });

  const start = openCells.splice(Math.floor(random() * openCells.length), 1)[0];
  const exitChoices = openCells.filter((cell) =>
    Math.abs(cell.row - start.row) + Math.abs(cell.column - start.column) >= size - 4
  );
  const exit = exitChoices[Math.floor(random() * exitChoices.length)];
  cells[start.row][start.column] = "S";
  cells[exit.row][exit.column] = "E";

  return cells;
}

function renderMaze(seed, mazeElement, seedLabel) {
  const cells = createMaze(seed);
  mazeElement.replaceChildren();
  mazeElement.setAttribute("aria-label", `Maze layout for seed ${seed}`);
  seedLabel.textContent = `SEED ${seed}`;

  cells.forEach((row) => {
    row.forEach((cell) => {
      const tile = document.createElement("span");
      const type = cell === "#" ? "wall" : cell === "S" ? "start" : cell === "E" ? "exit" : "path";
      tile.className = `seed-tile seed-tile-${type}`;
      tile.setAttribute("aria-hidden", "true");
      mazeElement.append(tile);
    });
  });
}

function setupSeededMaze() {
  const form = document.querySelector("#seedForm");
  const input = document.querySelector("#seedInput");
  const randomButton = document.querySelector("#generateSeedButton");
  const mazeElement = document.querySelector("#seedMaze");
  const seedLabel = document.querySelector("#mazeSeedLabel");
  const status = document.querySelector("#seedStatus");

  if (!form || !input || !randomButton || !mazeElement || !seedLabel || !status) return;

  function buildMaze(seed) {
    renderMaze(seed, mazeElement, seedLabel);
    status.textContent = `Maze ready for seed ${seed}.`;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const seed = input.value.trim();

    if (!/^\d{6}$/.test(seed)) {
      status.textContent = "Enter exactly six digits to build a maze.";
      input.focus();
      return;
    }

    buildMaze(seed);
  });

  randomButton.addEventListener("click", () => {
    input.value = generateSeed();
    buildMaze(input.value);
  });

  buildMaze(input.value);
}

if (typeof document !== "undefined") {
  setupSeededMaze();
}

if (typeof module !== "undefined") {
  module.exports = { createMaze, createRandom, generateSeed };
}
