const canvas = document.querySelector('#mountainCanvas');
const seedLabel = document.querySelector('#mountainSeed');
const altitudeLabel = document.querySelector('#mountainAltitude');
const generateButton = document.querySelector('#generateMountain');
const context = canvas.getContext('2d');

let currentSeed = Math.floor(Math.random() * 100_000_000);
let playerAltitude = 0;
let playerXPosition = 0.49;
let playerFallOffset = 0;
let fallVelocity = 0;
let hasHeldOnce = false;
let walkingPhase = 0;
let lastPlayerFrame = null;
let playerFrameRequest = 0;
const heldKeys = new Set();
const handAttachments = { left: null, right: null };
const jointPositions = {};
let visibleHolds = [];
let activePointer = null;
let bodyRotation = 0;
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
  KeyQ: { type: 'grab', hand: 'left' },
  KeyE: { type: 'grab', hand: 'right' }
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

  function drawArm(startX, upperAngle, forearmAngle, attachedHand) {
    const elbow = pointAlongArm(startX, shoulderY, scale * 0.23, upperAngle);
    const wrist = pointAlongArm(elbow.x, elbow.y, scale * 0.22, upperAngle + forearmAngle);
    const hand = attachedHand || pointAlongArm(wrist.x, wrist.y, scale * 0.09, upperAngle + forearmAngle);
    const side = startX < playerX ? 'left' : 'right';
    jointPositions[`${side}Shoulder`] = { x: startX, y: shoulderY };
    jointPositions[`${side}Elbow`] = elbow;
    drawSegment(startX, shoulderY, elbow.x, elbow.y);
    drawSegment(elbow.x, elbow.y, wrist.x, wrist.y);
    drawSegment(wrist.x, wrist.y, hand.x, hand.y);
    context.beginPath();
    context.arc(hand.x, hand.y, scale * 0.045, 0, Math.PI * 2);
    context.fillStyle = '#e8e5d4';
    context.fill();
    context.strokeStyle = '#172d30';
    context.lineWidth = Math.max(1.5, scale * 0.035);
    context.stroke();
    context.beginPath();
    context.arc(startX, shoulderY, scale * 0.045, 0, Math.PI * 2);
    context.fillStyle = '#e8e5d4';
    context.fill();
    context.strokeStyle = '#172d30';
    context.lineWidth = Math.max(1.5, scale * 0.035);
    context.stroke();
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

  drawArm(playerX - scale * 0.08, armPose.leftUpper, armPose.leftForearm, handAttachments.left);
  drawArm(playerX + scale * 0.08, armPose.rightUpper, armPose.rightForearm, handAttachments.right);

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
          id: `${row}-${column}`,
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

  visibleHolds = holds;
  holds.forEach(({ x, y, size, direction }) => drawHold(x, y, size, direction));
  handAttachments.left = holds.find(({ id }) => id === handAttachments.left?.id) || null;
  handAttachments.right = holds.find(({ id }) => id === handAttachments.right?.id) || null;
  const playerX = width * playerXPosition;
  const playerY = playerFootY - height * 0.2 * 0.48 + playerFallOffset;
  const swingPivot = handAttachments.left || handAttachments.right;
  if (swingPivot && bodyRotation) {
    context.save();
    context.translate(swingPivot.x, swingPivot.y);
    context.rotate(bodyRotation);
    context.translate(-swingPivot.x, -swingPivot.y);
  }
  drawStickFigure(playerX, playerY, height, walkingPhase);
  if (swingPivot && bodyRotation) context.restore();
}

function attachHand(hand) {
  const bounds = canvas.getBoundingClientRect();
  const scale = bounds.height * 0.2;
  if (!bounds.width || !scale) return;

  const playerX = bounds.width * playerXPosition;
  const playerY = bounds.height * 0.72 - scale * 0.48 + playerFallOffset;
  const shoulderX = playerX + (hand === 'left' ? -1 : 1) * scale * 0.08;
  const shoulderY = playerY - scale * 0.16;
  const maxReach = scale * 0.72;
  let closestHold = null;
  let closestDistance = maxReach;

  for (const hold of visibleHolds) {
    const distance = Math.hypot(hold.x - shoulderX, hold.y - shoulderY);
    if (distance < closestDistance) {
      closestHold = hold;
      closestDistance = distance;
    }
  }

  handAttachments[hand] = closestHold;
  if (closestHold) {
    hasHeldOnce = true;
    fallVelocity = 0;
    if (handAttachments.left && handAttachments.right) bodyRotation = 0;
  }
}

function hasAttachment() {
  return Boolean(handAttachments.left || handAttachments.right);
}

function getSwingPivot() {
  if (handAttachments.left && handAttachments.right) return null;
  return handAttachments.left || handAttachments.right;
}

function rotatePoint(point, pivot, angle) {
  if (!pivot || !angle) return point;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const offsetX = point.x - pivot.x;
  const offsetY = point.y - pivot.y;
  return {
    x: pivot.x + offsetX * cosine - offsetY * sine,
    y: pivot.y + offsetX * sine + offsetY * cosine
  };
}

function getCanvasPoint(event) {
  const bounds = canvas.getBoundingClientRect();
  return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
}

function startPlayerLoop() {
  if (!playerFrameRequest) playerFrameRequest = requestAnimationFrame(updatePlayer);
}

function handlePointerDown(event) {
  if (event.button !== 0) return;
  const point = getCanvasPoint(event);
  const bounds = canvas.getBoundingClientRect();
  const scale = bounds.height * 0.2;
  const pivot = getSwingPivot();
  const jointHit = Object.entries(jointPositions)
    .map(([joint, position]) => [joint, rotatePoint(position, pivot, bodyRotation)])
    .find(([, position]) => Math.hypot(position.x - point.x, position.y - point.y) < scale * 0.11);

  if (jointHit) {
    activePointer = { type: 'joint', joint: jointHit[0] };
  } else if (pivot) {
    const torsoCenter = rotatePoint({
      x: bounds.width * playerXPosition,
      y: bounds.height * 0.72 - scale * 0.48 + playerFallOffset
    }, pivot, bodyRotation);
    if (Math.hypot(point.x - torsoCenter.x, point.y - torsoCenter.y) >= scale * 0.2) return;
    activePointer = {
      type: 'swing',
      startAngle: Math.atan2(point.y - pivot.y, point.x - pivot.x),
      startRotation: bodyRotation
    };
  } else {
    return;
  }

  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  startPlayerLoop();
}

function handlePointerMove(event) {
  if (!activePointer) return;
  const point = getCanvasPoint(event);

  if (activePointer.type === 'swing') {
    const pivot = getSwingPivot();
    if (!pivot) return;
    const currentAngle = Math.atan2(point.y - pivot.y, point.x - pivot.x);
    let angleDelta = currentAngle - activePointer.startAngle;
    if (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
    if (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
    bodyRotation = activePointer.startRotation + angleDelta;
  } else {
    const bounds = canvas.getBoundingClientRect();
    const scale = bounds.height * 0.2;
    const playerX = bounds.width * playerXPosition;
    const playerY = bounds.height * 0.72 - scale * 0.48 + playerFallOffset;
    const pivot = getSwingPivot();
    const shoulderX = playerX + (activePointer.joint.startsWith('left') ? -1 : 1) * scale * 0.08;
    const shoulder = rotatePoint({ x: shoulderX, y: playerY - scale * 0.16 }, pivot, bodyRotation);
    const elbow = rotatePoint(jointPositions[`${activePointer.joint.startsWith('left') ? 'left' : 'right'}Elbow`], pivot, bodyRotation);
    const pointerAngle = (origin) => Math.atan2(point.x - origin.x, point.y - origin.y);

    if (activePointer.joint.endsWith('Shoulder')) {
      const angle = pointerAngle(shoulder) - bodyRotation;
      armPose[`${activePointer.joint.startsWith('left') ? 'left' : 'right'}Upper`] = Math.max(-2.5, Math.min(2.5, angle));
    } else {
      const side = activePointer.joint.startsWith('left') ? 'left' : 'right';
      const upperAngle = armPose[`${side}Upper`];
      const angle = pointerAngle(elbow) - bodyRotation - upperAngle;
      armPose[`${side}Forearm`] = Math.max(-2.5, Math.min(2.5, angle));
    }
  }

  drawCliffFace();
}

function handlePointerUp(event) {
  if (!activePointer) return;
  activePointer = null;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  startPlayerLoop();
}

function updatePlayer(timestamp) {
  const elapsed = lastPlayerFrame === null ? 0 : Math.min((timestamp - lastPlayerFrame) / 1000, 0.05);
  lastPlayerFrame = timestamp;
  const walkingDirection = [...heldKeys]
    .map((code) => controlActions[code])
    .filter((action) => action?.type === 'walk')
    .reduce((direction, action) => direction + action.value, 0);
  const bounds = canvas.getBoundingClientRect();

  if (walkingDirection && bounds.width && !hasAttachment()) {
    playerXPosition += walkingDirection * elapsed * 0.42;
    walkingPhase += elapsed * 9;
  }

  if (hasAttachment()) {
    fallVelocity = 0;
  } else if (hasHeldOnce && bounds.height) {
    fallVelocity += bounds.height * 1.8 * elapsed;
    playerFallOffset = Math.min(bounds.height * 0.22, playerFallOffset + fallVelocity * elapsed);
    if (playerFallOffset >= bounds.height * 0.22) fallVelocity = 0;
  }

  drawCliffFace();
  if (heldKeys.size || activePointer || (hasHeldOnce && fallVelocity > 0)) {
    playerFrameRequest = requestAnimationFrame(updatePlayer);
  } else {
    playerFrameRequest = 0;
    lastPlayerFrame = null;
  }
}

function handlePlayerKeyDown(event) {
  const action = controlActions[event.code];
  if (!action) return;
  event.preventDefault();
  if (action.type === 'grab' && !heldKeys.has(event.code)) attachHand(action.hand);
  heldKeys.add(event.code);
  startPlayerLoop();
}

function handlePlayerKeyUp(event) {
  const action = controlActions[event.code];
  if (action?.type === 'grab') {
    handAttachments[action.hand] = null;
    if (!hasAttachment()) bodyRotation = 0;
    startPlayerLoop();
  }
  heldKeys.delete(event.code);
}

function handlePlayerBlur() {
  heldKeys.clear();
  handAttachments.left = null;
  handAttachments.right = null;
  bodyRotation = 0;
  startPlayerLoop();
}

window.addEventListener('keydown', handlePlayerKeyDown);
window.addEventListener('keyup', handlePlayerKeyUp);
window.addEventListener('blur', handlePlayerBlur);
canvas.addEventListener('pointerdown', handlePointerDown);
canvas.addEventListener('pointermove', handlePointerMove);
canvas.addEventListener('pointerup', handlePointerUp);
canvas.addEventListener('pointercancel', handlePointerUp);

function generateCliff() {
  currentSeed = Math.floor(Math.random() * 100_000_000);
  handAttachments.left = null;
  handAttachments.right = null;
  playerAltitude = 0;
  playerFallOffset = 0;
  fallVelocity = 0;
  hasHeldOnce = false;
  bodyRotation = 0;
  seedLabel.textContent = `SEED / ${String(currentSeed).padStart(8, '0')}`;
  drawCliffFace();
}

generateButton.addEventListener('click', generateCliff);
const resizeObserver = new ResizeObserver(() => {
  handAttachments.left = null;
  handAttachments.right = null;
  drawCliffFace();
});
resizeObserver.observe(canvas);
seedLabel.textContent = `SEED / ${String(currentSeed).padStart(8, '0')}`;
drawCliffFace();
