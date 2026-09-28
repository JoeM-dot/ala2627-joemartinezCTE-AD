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

function hexPath(x, y, radius) {
  const points = Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 3) * index;
    return [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius];
  });
  context.beginPath();
  context.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([pointX, pointY]) => context.lineTo(pointX, pointY));
  context.closePath();
  return points;
}

function paintHexColumn(x, y, radius, depth, shade, isSnow) {
  const points = hexPath(x, y, radius);
  const frontFaces = [[0, 1, shade.left], [1, 2, shade.right], [2, 3, shade.left]];
  frontFaces.forEach(([startIndex, endIndex, color]) => {
    const start = points[startIndex];
    const end = points[endIndex];
    context.beginPath();
    context.moveTo(start[0], start[1]);
    context.lineTo(end[0], end[1]);
    context.lineTo(end[0], end[1] + depth);
    context.lineTo(start[0], start[1] + depth);
    context.closePath();
    context.fillStyle = isSnow ? '#87948e' : color;
    context.fill();
  });

  hexPath(x, y, radius);
  context.fillStyle = isSnow ? '#d5d6c3' : shade.top;
  context.fill();
  context.strokeStyle = 'rgba(17, 37, 39, 0.38)';
  context.lineWidth = Math.max(0.7, radius * 0.035);
  context.stroke();
}

function drawMountain() {
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

  const radius = width / (window.innerWidth < 760 ? 19 : 34);
  const horizontalStep = radius * 1.5;
  const rowStep = radius * 1.4;
  const depth = radius * 0.52;
  const columns = Math.ceil(width / horizontalStep) + 2;
  const rows = Math.max(7, Math.ceil(height / rowStep) + 3);
  const mountainBase = height * 0.8;
  const heightUnit = Math.min(radius * 0.9, height / 18);
  const peakX = width * (0.36 + random() * 0.28);
  const peakWidth = width * (0.18 + random() * 0.08);
  const peakHeight = height * (0.42 + random() * 0.15);
  const noise = Array.from({ length: columns + 2 }, () => random());

  for (let row = 0; row < rows; row += 1) {
    const distance = row / Math.max(1, rows - 1);
    for (let column = -1; column < columns; column += 1) {
      const x = column * horizontalStep + (row % 2) * horizontalStep / 2;
      const ridge = Math.max(0, 1 - Math.abs(x - peakX) / peakWidth);
      const secondaryRidge = Math.max(0, 1 - Math.abs(x - width * 0.19) / (width * 0.16)) * 0.42;
      const roughness = noise[column + 1] * 0.16 + random() * 0.12;
      const elevation = Math.pow(Math.min(1, ridge + secondaryRidge + roughness), 1.35);
      const heightInLevels = Math.max(0, Math.round(elevation * peakHeight / heightUnit));
      const y = mountainBase + row * rowStep - heightInLevels * heightUnit;
      const colorShift = Math.min(1, distance * 0.7 + elevation * 0.45);
      const shade = {
        top: colorShift > 0.78 ? '#687b72' : '#496159',
        left: colorShift > 0.78 ? '#526962' : '#354e49',
        right: colorShift > 0.78 ? '#3c5550' : '#263e3c'
      };
      const snowLine = peakHeight * 0.66;
      const isSnow = heightInLevels * heightUnit > snowLine && random() > 0.22;
      paintHexColumn(x, y, radius, depth, shade, isSnow);
    }
  }

  context.fillStyle = 'rgba(20, 39, 43, 0.28)';
  context.fillRect(0, height * 0.92, width, height * 0.08);
}

function generateMountain() {
  currentSeed = Math.floor(Math.random() * 100_000_000);
  seedLabel.textContent = `SEED / ${String(currentSeed).padStart(8, '0')}`;
  drawMountain();
}

generateButton.addEventListener('click', generateMountain);
const resizeObserver = new ResizeObserver(drawMountain);
resizeObserver.observe(canvas);
seedLabel.textContent = `SEED / ${String(currentSeed).padStart(8, '0')}`;
drawMountain();
