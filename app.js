const app = {
  body: document.body,
  cards: Array.from(document.querySelectorAll('.bento-card, .hero-card, .orbit-panel')),
  heroName: document.querySelector('[data-current-focus]'),
  fact: document.querySelector('[data-dynamic-fact]'),
  navLinks: Array.from(document.querySelectorAll('.nav-link')),
  themeToggle: document.querySelector('#themeToggle'),
};

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

  app.themeToggle.addEventListener('click', () => {
    app.body.classList.toggle('night-mode');
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

function init() {
  setupCards();
  setupNavigation();
  setupThemeToggle();
  setupMouseGlow();

  if (app.heroName) {
    setInterval(cycleFocus, 1800);
  }

  if (app.fact) {
    setInterval(cycleFact, 2600);
  }
}

init();
