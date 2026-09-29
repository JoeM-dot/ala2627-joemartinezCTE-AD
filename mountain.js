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

  const blockWidth = width / 18;
  const blockHeight = height / 12;
  const horizontalStep = blockWidth * 0.78;
  const verticalStep = blockHeight * 0.76;
  const cliffBase = height * 0.96;
  const cliffTop = height * 0.12;
  const rows = Math.ceil((cliffBase - cliffTop - blockHeight) / verticalStep) + 1;
  const edgeNoise = Array.from({ length: rows }, () => random());
  const rockColors = ['#263e3c', '#354e49', '#496159', '#526962', '#687b72'];

  for (let row = 0; row < rows; row += 1) {
    const progress = row / Math.max(1, rows - 1);
    const edgeX = width * (0.16 + progress * 0.12)
      + (edgeNoise[row] - 0.5) * blockWidth * 0.36;
    const y = cliffBase - blockHeight - row * verticalStep;
    const rowOffset = row % 2 ? horizontalStep / 2 : 0;
    const startX = edgeX - rowOffset;
    const blocks = Math.ceil((width - startX) / horizontalStep) + 1;

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
    }
  }

  const ground = context.createLinearGradient(0, height * 0.88, 0, height);
  ground.addColorStop(0, '#587d53');
  ground.addColorStop(1, '#294b3d');
  context.beginPath();
  context.moveTo(0, height * 0.91);
  for (let step = 1; step <= 8; step += 1) {
    context.lineTo((width * step) / 8, height * (0.89 + random() * 0.035));
  }
  context.lineTo(width, height);
  context.lineTo(0, height);
  context.closePath();
  context.fillStyle = ground;
  context.fill();
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
