const canvas = document.querySelector('#mountainCanvas');
const seedLabel = document.querySelector('#mountainSeed');
const generateButton = document.querySelector('#generateMountain');
const context = canvas.getContext('2d');

let currentSeed = Math.floor(Math.random() * 100_000_000);

function createRandom(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function drawHold(centerX, centerY, size, direction) {
  const halfSize = size / 2;
  const points = {
    left: [[centerX - halfSize, centerY], [centerX + halfSize, centerY - halfSize], [centerX + halfSize, centerY + halfSize]],
    right: [[centerX + halfSize, centerY], [centerX - halfSize, centerY - halfSize], [centerX - halfSize, centerY + halfSize]],
    up: [[centerX, centerY - halfSize], [centerX + halfSize, centerY + halfSize], [centerX - halfSize, centerY + halfSize]],
    down: [[centerX, centerY + halfSize], [centerX + halfSize, centerY - halfSize], [centerX - halfSize, centerY - halfSize]]
  }[direction];

  context.beginPath();
  context.moveTo(points[0][0], points[0][1]);
  context.lineTo(points[1][0], points[1][1]);
  context.lineTo(points[2][0], points[2][1]);
  context.closePath();
  context.fillStyle = {
    left: '#1b2d2d',
    right: '#c2cbb9',
    up: '#74867b',
    down: '#465d57'
  }[direction];
  context.fill();
  context.strokeStyle = '#172d30';
  context.lineWidth = 1;
  context.stroke();

  context.beginPath();
  context.moveTo(points[0][0], points[0][1]);
  context.lineTo(centerX, centerY);
  context.strokeStyle = direction === 'right' ? '#e1e5d6' : '#102526';
  context.lineWidth = Math.max(1, size * 0.07);
  context.stroke();
}

function drawStickFigure(playerX, playerY, height) {
  const scale = height * 0.2;
  const headX = playerX + scale * 0.01;
  const headY = playerY - scale * 0.34;
  const headRadius = scale * 0.14;
  const shoulderY = playerY - scale * 0.16;
  const hipY = playerY + scale * 0.16;

  context.beginPath();
  context.moveTo(headX, headY + headRadius);
  context.lineTo(playerX, hipY);
  context.moveTo(playerX, shoulderY);
  context.lineTo(playerX + scale * 0.23, playerY - scale * 0.32);
  context.lineTo(playerX + scale * 0.35, playerY - scale * 0.27);
  context.moveTo(playerX, shoulderY);
  context.lineTo(playerX - scale * 0.2, playerY - scale * 0.02);
  context.lineTo(playerX - scale * 0.31, playerY - scale * 0.12);
  context.moveTo(playerX, hipY);
  context.lineTo(playerX + scale * 0.2, playerY + scale * 0.43);
  context.moveTo(playerX, hipY);
  context.lineTo(playerX - scale * 0.17, playerY + scale * 0.48);
  context.strokeStyle = '#172d30';
  context.lineWidth = Math.max(4, scale * 0.11);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.stroke();
  context.strokeStyle = '#e8e5d4';
  context.lineWidth = Math.max(2.5, scale * 0.06);
  context.stroke();

  context.beginPath();
  context.arc(headX, headY, headRadius, 0, Math.PI * 2);
  context.fillStyle = '#e8e5d4';
  context.fill();
  context.strokeStyle = '#172d30';
  context.lineWidth = Math.max(1.5, scale * 0.04);
  context.stroke();
}

function drawCliffFace() {
  const bounds = canvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(bounds.width * pixelRatio);
  canvas.height = Math.round(bounds.height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const width = bounds.width;
  const height = bounds.height;
  const random = createRandom(currentSeed);
  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#263b3d');
  sky.addColorStop(0.56, '#71847a');
  sky.addColorStop(1, '#bdad83');
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);

  for (let index = 0; index < 48; index += 1) {
    const starX = random() * width;
    const starY = random() * height * 0.38;
    context.fillStyle = `rgba(243, 240, 223, ${0.16 + random() * 0.42})`;
    context.fillRect(starX, starY, random() * 1.5 + 0.5, random() * 1.5 + 0.5);
  }

  const cliffLeft = width * 0.6;
  const cliffRight = width;
  const cliffWidth = cliffRight - cliffLeft;
  const blockWidth = cliffWidth / 4.5;
  const blockHeight = height / 12;
  const horizontalStep = blockWidth * 0.78;
  const verticalStep = blockHeight * 0.76;
  const rows = Math.ceil((height * 3) / verticalStep);
  const centerRow = (rows - 1) / 2;
  const edgeNoise = Array.from({ length: rows }, () => random());
  const rockColors = ['#263e3c', '#354e49', '#496159', '#526962', '#687b72'];
  const holds = [];

  for (let row = 0; row < rows; row += 1) {
    const edgeX = cliffLeft + (edgeNoise[row] - 0.5) * blockWidth * 0.5;
    const y = height / 2 + (row - centerRow) * verticalStep;
    const rowOffset = row % 2 ? horizontalStep / 2 : 0;
    const startX = edgeX - rowOffset;
    const blocks = Math.ceil((cliffRight - startX) / horizontalStep) + 1;

    for (let column = 0; column < blocks; column += 1) {
      const isLedge = column === 0 && row % 3 === 1;
      const x = isLedge
        ? edgeX - blockWidth * (0.5 + random() * 0.3)
        : startX + column * horizontalStep;
      const rectWidth = isLedge
        ? blockWidth * 1.8
        : blockWidth * (0.95 + random() * 0.18);
      const rectHeight = blockHeight * (0.92 + random() * 0.18);
      context.fillStyle = rockColors[Math.floor(random() * rockColors.length)];
      context.fillRect(x, y, rectWidth, rectHeight);
      context.strokeStyle = 'rgba(17, 37, 39, 0.48)';
      context.lineWidth = 1;
      context.strokeRect(x, y, rectWidth, rectHeight);

      if (isLedge) {
        context.fillStyle = '#87948e';
        context.fillRect(x, y, rectWidth, 2);
      }

      if (random() < 0.22) {
        const directions = ['left', 'right', 'up', 'down'];
        holds.push({
          x: x + rectWidth * (0.35 + random() * 0.3),
          y: y + rectHeight * (0.35 + random() * 0.3),
          size: Math.min(blockWidth, blockHeight) * 0.33,
          direction: directions[Math.floor(random() * directions.length)]
        });
      }
    }
  }

  holds.forEach(({ x, y, size, direction }) => drawHold(x, y, size, direction));
  drawStickFigure(width * 0.49, height * 0.52, height);
}

function generateCliff() {
  currentSeed = Math.floor(Math.random() * 100_000_000);
  seedLabel.textContent = `SEED / ${String(currentSeed).padStart(8, '0')}`;
  drawCliffFace();
}

generateButton.addEventListener('click', generateCliff);
const resizeObserver = new ResizeObserver(drawCliffFace);
resizeObserver.observe(canvas);
seedLabel.textContent = `SEED / ${String(currentSeed).padStart(8, '0')}`;
drawCliffFace();
