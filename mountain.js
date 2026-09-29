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

  const blockWidth = width / (window.innerWidth < 760 ? 35 : 85);
  const blockHeight = blockWidth * 2.8;
  const columns = Math.ceil(width / blockWidth);
  const mountainBase = height * 0.92;
  const peakX = width * (0.36 + random() * 0.28);
  const peakWidth = width * (0.18 + random() * 0.08);
  const peakHeight = height * (0.42 + random() * 0.15);
  const snowLine = peakHeight * 0.66;
  const noise = Array.from({ length: columns }, () => random());

  for (let column = 0; column < columns; column += 1) {
    const x = column * blockWidth;
    const ridge = Math.max(0, 1 - Math.abs(x - peakX) / peakWidth);
    const secondaryRidge = Math.max(0, 1 - Math.abs(x - width * 0.19) / (width * 0.16)) * 0.42;
    const roughness = noise[column] * 0.16 + random() * 0.12;
    const elevation = Math.pow(Math.min(1, ridge + secondaryRidge + roughness), 1.35);
    const heightInBlocks = Math.max(1, Math.round(elevation * peakHeight / blockHeight));
    const hasSnow = heightInBlocks * blockHeight > snowLine && random() > 0.22;

    for (let level = 0; level < heightInBlocks; level += 1) {
      const y = mountainBase - (level + 1) * blockHeight;
      const heightRatio = level / heightInBlocks;
      const isSnow = hasSnow && level >= heightInBlocks - 2;
      context.fillStyle = isSnow
        ? '#d5d6c3'
        : heightRatio > 0.72
          ? '#526962'
          : heightRatio > 0.38
            ? '#354e49'
            : '#263e3c';
      context.fillRect(x, y, blockWidth + 0.6, blockHeight + 0.6);
      context.strokeStyle = 'rgba(17, 37, 39, 0.38)';
      context.lineWidth = 0.55;
      context.strokeRect(x, y, blockWidth + 0.6, blockHeight + 0.6);
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
