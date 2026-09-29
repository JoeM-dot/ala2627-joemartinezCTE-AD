const canvas = document.querySelector('#mountainCanvas');
const seedLabel = document.querySelector('#mountainSeed');
const altitudeLabel = document.querySelector('#mountainAltitude');
const generateButton = document.querySelector('#generateMountain');
const context = canvas.getContext('2d');

let currentSeed = Math.floor(Math.random() * 100_000_000);
let playerAltitude = 0;
let playerXPosition = 0.49;
let walkingPhase = 0;
let lastPlayerFrame = null;
let playerFrameRequest = 0;
const heldKeys = new Set();
const armPose = {
  leftUpper: -0.65,
  leftForearm: -0.2,
  rightUpper: 0.65,
  rightForearm: 0.2
};
const goalAltitude = 1000;
const controlActions = {
  KeyA: { type: 'walk', value: -1 },
  KeyD: { type: 'walk', value: 1 },
  KeyW: { type: 'arm', joint: 'leftUpper', value: -1 },
  KeyS: { type: 'arm', joint: 'leftUpper', value: 1 },
  KeyE: { type: 'arm', joint: 'leftForearm', value: -1 },
  KeyR: { type: 'arm', joint: 'leftForearm', value: 1 },
  KeyI: { type: 'arm', joint: 'rightUpper', value: -1 },
  KeyK: { type: 'arm', joint: 'rightUpper', value: 1 },
  KeyO: { type: 'arm', joint: 'rightForearm', value: -1 },
  KeyP: { type: 'arm', joint: 'rightForearm', value: 1 }
};

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

function drawStickFigure(playerX, playerY, height, gaitPhase) {
  const scale = height * 0.2;
  const headX = playerX + scale * 0.01;
  const headY = playerY - scale * 0.34;
  const headRadius = scale * 0.14;
  const shoulderY = playerY - scale * 0.16;
  const hipY = playerY + scale * 0.16;

  function drawSegment(startX, startY, endX, endY) {
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.strokeStyle = '#172d30';
    context.lineWidth = Math.max(4, scale * 0.11);
    context.lineCap = 'round';
    context.stroke();
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.strokeStyle = '#e8e5d4';
    context.lineWidth = Math.max(2.5, scale * 0.06);
    context.stroke();
  }

  function pointAlongArm(startX, startY, length, angle) {
    return {
      x: startX + Math.sin(angle) * length,
      y: startY + Math.cos(angle) * length
    };
  }

  function drawArm(startX, upperAngle, forearmAngle) {
    const elbow = pointAlongArm(startX, shoulderY, scale * 0.25, upperAngle);
    const wrist = pointAlongArm(elbow.x, elbow.y, scale * 0.24, upperAngle + forearmAngle);
    const hand = pointAlongArm(wrist.x, wrist.y, scale * 0.09, upperAngle + forearmAngle);
    drawSegment(startX, shoulderY, elbow.x, elbow.y);
    drawSegment(elbow.x, elbow.y, wrist.x, wrist.y);
    drawSegment(wrist.x, wrist.y, hand.x, hand.y);
    context.beginPath();
    context.arc(elbow.x, elbow.y, scale * 0.045, 0, Math.PI * 2);
    context.fillStyle = '#e8e5d4';
    context.fill();
    context.strokeStyle = '#172d30';
    context.lineWidth = Math.max(1.5, scale * 0.035);
    context.stroke();
  }

  const stride = Math.sin(gaitPhase) * scale * 0.2;
  const lift = Math.max(0, Math.cos(gaitPhase)) * scale * 0.05;
  context.beginPath();
  context.moveTo(headX, headY + headRadius);
  context.lineTo(playerX, hipY);
  context.moveTo(playerX, hipY);
  context.lineTo(playerX + stride, playerY + scale * 0.43 - lift);
  context.moveTo(playerX, hipY);
  context.lineTo(playerX - stride, playerY + scale * 0.48 - (scale * 0.05 - lift));
  context.strokeStyle = '#172d30';
  context.lineWidth = Math.max(4, scale * 0.11);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.stroke();
  context.strokeStyle = '#e8e5d4';
  context.lineWidth = Math.max(2.5, scale * 0.06);
  context.stroke();

  drawArm(playerX - scale * 0.08, armPose.leftUpper, armPose.leftForearm);
  drawArm(playerX + scale * 0.08, armPose.rightUpper, armPose.rightForearm);

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
  playerXPosition = Math.max(0.04, Math.min(0.96, playerXPosition));
  const random = createRandom(currentSeed);
  const worldScale = height / 400;
  const playerFootY = height * 0.72;
  const altitudeToY = (altitude) => playerFootY - (altitude - playerAltitude) * worldScale;
  if (altitudeLabel) {
    altitudeLabel.textContent = `ALTITUDE ${String(playerAltitude).padStart(3, '0')} / ${goalAltitude}`;
  }
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

  const groundGradient = context.createLinearGradient(0, playerFootY, 0, height);
  groundGradient.addColorStop(0, '#9a936f');
  groundGradient.addColorStop(0.12, '#716b50');
  groundGradient.addColorStop(1, '#383f35');
  context.fillStyle = groundGradient;
  context.fillRect(0, playerFootY, width, height - playerFootY);
  context.fillStyle = 'rgba(213, 214, 195, 0.7)';
  context.fillRect(0, playerFootY, width, 2);
  for (let index = 0; index < 34; index += 1) {
    const pebbleX = random() * width;
    const pebbleY = playerFootY + 8 + random() * (height - playerFootY - 8);
    context.fillStyle = `rgba(30, 43, 38, ${0.12 + random() * 0.2})`;
    context.fillRect(pebbleX, pebbleY, 2 + random() * 5, 1 + random() * 2);
  }

  const cliffLeft = width * 0.6;
  const cliffRight = width;
  const cliffWidth = cliffRight - cliffLeft;
  const blockWidth = cliffWidth / 4.5;
  const blockHeightWorld = 48;
  const blockHeight = blockHeightWorld * worldScale;
  const horizontalStep = blockWidth * 0.78;
  const verticalStepWorld = 38;
  const rows = Math.ceil(goalAltitude / verticalStepWorld) + 1;
  const edgeNoise = Array.from({ length: rows }, () => random());
  const rockColors = ['#263e3c', '#354e49', '#496159', '#526962', '#687b72'];
  const holds = [];

  for (let row = 0; row < rows; row += 1) {
    const edgeX = cliffLeft + (edgeNoise[row] - 0.5) * blockWidth * 0.5;
    const y = altitudeToY(row * verticalStepWorld + blockHeightWorld);
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
      const rectHeight = row === 0 ? blockHeight : blockHeight * (0.92 + random() * 0.18);
      context.fillStyle = rockColors[Math.floor(random() * rockColors.length)];
      context.fillRect(x, y, rectWidth, rectHeight);
      context.strokeStyle = 'rgba(17, 37, 39, 0.48)';
      context.lineWidth = 1;
      context.strokeRect(x, y, rectWidth, rectHeight);

      if (isLedge) {
        context.fillStyle = '#87948e';
        context.fillRect(x, y, rectWidth, 2);
      }

      if (random() < 0.32) {
        const directions = ['left', 'right', 'up', 'down'];
        const direction = directions[Math.floor(random() * directions.length)];
        const size = Math.min(blockWidth, blockHeight) * 0.33;
        const holdX = direction === 'left'
          ? x + size / 2
          : direction === 'right'
            ? x + rectWidth - size / 2
            : x + size / 2 + random() * (rectWidth - size);
        const holdY = direction === 'up'
          ? y + size / 2
          : direction === 'down'
            ? y + rectHeight - size / 2
            : y + size / 2 + random() * (rectHeight - size);
        holds.push({
          x: holdX,
          y: holdY,
          size,
          direction
        });
      }
    }
  }

  const rulerX = width * 0.09;
  const firstTick = Math.ceil(playerAltitude / 100) * 100;
  const lastTick = Math.min(
    goalAltitude,
    Math.floor((playerAltitude + (playerFootY - 24) / worldScale) / 100) * 100
  );
  context.strokeStyle = 'rgba(232, 229, 212, 0.7)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(rulerX, altitudeToY(lastTick));
  context.lineTo(rulerX, playerFootY);
  context.stroke();
  context.font = `${Math.max(10, width * 0.016)}px monospace`;
  context.textBaseline = 'middle';
  for (let altitude = firstTick; altitude <= lastTick; altitude += 100) {
    const tickY = altitudeToY(altitude);
    context.beginPath();
    context.moveTo(rulerX - 5, tickY);
    context.lineTo(rulerX + 5, tickY);
    context.stroke();
    context.fillStyle = 'rgba(238, 240, 232, 0.88)';
    context.fillText(String(altitude), rulerX + 10, tickY);
  }

  holds.forEach(({ x, y, size, direction }) => drawHold(x, y, size, direction));
  drawStickFigure(width * playerXPosition, playerFootY - height * 0.2 * 0.48, height, walkingPhase);
}

function updatePlayer(timestamp) {
  const elapsed = lastPlayerFrame === null ? 0 : Math.min((timestamp - lastPlayerFrame) / 1000, 0.05);
  lastPlayerFrame = timestamp;
  const walkingDirection = [...heldKeys]
    .map((code) => controlActions[code])
    .filter((action) => action?.type === 'walk')
    .reduce((direction, action) => direction + action.value, 0);
  const bounds = canvas.getBoundingClientRect();

  if (walkingDirection && bounds.width) {
    playerXPosition += walkingDirection * elapsed * 0.42;
    walkingPhase += elapsed * 9;
  }

  for (const code of heldKeys) {
    const action = controlActions[code];
    if (action?.type === 'arm') {
      armPose[action.joint] = Math.max(-2.5, Math.min(2.5, armPose[action.joint] + action.value * elapsed * 2.2));
    }
  }

  drawCliffFace();
  if (heldKeys.size) {
    playerFrameRequest = requestAnimationFrame(updatePlayer);
  } else {
    playerFrameRequest = 0;
    lastPlayerFrame = null;
  }
}

function handlePlayerKeyDown(event) {
  if (!controlActions[event.code]) return;
  event.preventDefault();
  heldKeys.add(event.code);
  if (!playerFrameRequest) playerFrameRequest = requestAnimationFrame(updatePlayer);
}

function handlePlayerKeyUp(event) {
  heldKeys.delete(event.code);
}

window.addEventListener('keydown', handlePlayerKeyDown);
window.addEventListener('keyup', handlePlayerKeyUp);
window.addEventListener('blur', () => heldKeys.clear());

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
