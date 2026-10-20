// Clearvoice AAC - Main Application
// Uses configuration from config.js for vocabulary and custom images

// Load configuration
const items = VocabularyData;
const labels = { 
  core: ['EVERYDAY WORDS', 'Say what you mean'],
  quick: ['QUICK PHRASES', 'Useful right now'],
  more: ['PERSONAL VOCABULARY', 'People, places, and favorites'],
  letters: ['SPELLING', 'Build a word, letter by letter'] 
};

const state = { 
  view: 'core', 
  words: [], 
  quiet: false, 
  speechRate: 1 
};

const grid = document.querySelector('#vocabularyGrid');
const messageBar = document.querySelector('#messageBar');
const undoButton = document.querySelector('#undoButton');
const clearButton = document.querySelector('#clearButton');
const speakButton = document.querySelector('#speakButton');
const toast = document.querySelector('#toast');

// Image loading and caching
const imageCache = new Map();

// Preload images for better performance
function preloadImage(url) {
  if (!url || imageCache.has(url)) return Promise.resolve();
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => {
      imageCache.set(url, null);
      resolve(null);
    };
    img.src = url;
  });
}

// Preload all custom images
async function preloadAllImages() {
  const imageUrls = Object.values(ClearvoiceConfig.customImages).filter(url => url);
  await Promise.all(imageUrls.map(preloadImage));
}

function renderView() {
  const [eyebrow, title] = labels[state.view];
  document.querySelector('#viewEyebrow').textContent = eyebrow;
  document.querySelector('#viewTitle').textContent = title;
  grid.setAttribute('aria-label', `${title} vocabulary`);
  grid.innerHTML = '';
  
  items[state.view].forEach(([text, symbol, type]) => {
    const button = document.createElement('button');
    button.className = `word ${type}`;
    button.dataset.text = text;
    button.setAttribute('aria-label', `Add ${text} to message`);
    
    // Check if this tile has a custom image
    const imageUrl = ClearvoiceConfig.getImageUrl(text);
    
    if (imageUrl) {
      // Create tile with image
      const img = document.createElement('img');
      img.className = 'tile-image';
      img.src = imageUrl;
      img.alt = ''; // Decorative image
      img.loading = 'lazy';
      
      // Add error handling for images
      img.onerror = () => {
        img.style.display = 'none';
      };
      
      const textSpan = document.createElement('span');
      textSpan.textContent = text;
      
      button.innerHTML = '';
      button.appendChild(img);
      button.appendChild(textSpan);
      button.classList.add('has-image');
    } else if (symbol) {
      // Use symbol
      button.innerHTML = `<span class="symbol" aria-hidden="true">${symbol}</span><span>${text}</span>`;
    } else {
      // Text only
      button.innerHTML = `<span>${text}</span>`;
    }
    
    button.addEventListener('click', () => addWord(text));
    grid.append(button);
  });
}

function formatMessage() {
  if (!state.words.length) return '';
  let raw = state.words.join(' ');
  raw = raw.replace(/\s+([,.!?])/g, '$1');
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function updateMessage() {
  const message = formatMessage();
  messageBar.textContent = message || 'Choose words to build your message';
  messageBar.classList.toggle('placeholder', !message);
  [undoButton, clearButton, speakButton].forEach(button => button.disabled = !message);
}

function addWord(word) {
  if (state.view === 'letters' && state.words.length) {
    state.words[state.words.length - 1] += word;
  } else {
    state.words.push(word);
  }
  updateMessage();
  if (!state.quiet) navigator.vibrate?.(12);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2200);
}

function speak() {
  const text = formatMessage();
  if (!text) return;
  
  if (!('speechSynthesis' in window)) {
    showToast('Speech is not available in this browser.');
    return;
  }
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = state.speechRate;
  window.speechSynthesis.speak(utterance);
  showToast('Speaking message');
}

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    state.view = tab.dataset.view;
    document.querySelectorAll('.tab').forEach(t => {
      const active = t === tab;
      t.classList.toggle('active', active);
      if (active) {
        t.setAttribute('aria-current', 'page');
      } else {
        t.removeAttribute('aria-current');
      }
    });
    renderView();
  });
});

// Message actions
undoButton.addEventListener('click', () => {
  state.words.pop();
  updateMessage();
});

clearButton.addEventListener('click', () => {
  state.words = [];
  updateMessage();
});

speakButton.addEventListener('click', speak);

// Settings panel
const settingsPanel = document.querySelector('#settingsPanel');
const settingsToggle = document.querySelector('#settingsToggle');

function openSettings(open) {
  settingsPanel.hidden = !open;
  settingsToggle.setAttribute('aria-expanded', open);
  if (open) document.querySelector('#buttonSize').focus();
}

settingsToggle.addEventListener('click', () => openSettings(settingsPanel.hidden));

document.querySelector('#closeSettings').addEventListener('click', () => openSettings(false));

// Quiet mode
document.querySelector('#quietToggle').addEventListener('click', event => {
  state.quiet = !state.quiet;
  document.body.classList.toggle('quiet', state.quiet);
  event.currentTarget.setAttribute('aria-pressed', state.quiet);
  event.currentTarget.setAttribute('aria-label', state.quiet ? 'Turn quiet mode off' : 'Turn quiet mode on');
  showToast(state.quiet ? 'Quiet mode on' : 'Quiet mode off');
});

// Button size
document.querySelector('#buttonSize').addEventListener('change', e => {
  document.body.classList.remove('large-buttons', 'extra-large-buttons');
  if (e.target.value !== 'regular') {
    document.body.classList.add(`${e.target.value}-buttons`);
  }
});

// Text size
document.querySelector('#textSize').addEventListener('change', e => {
  document.body.classList.toggle('large-text', e.target.value === 'large');
});

// High contrast
document.querySelector('#contrastToggle').addEventListener('change', e => {
  document.body.classList.toggle('high-contrast', e.target.checked);
});

// Reduced motion
document.querySelector('#motionToggle').addEventListener('change', e => {
  document.body.classList.toggle('reduced-motion', e.target.checked);
});

// Speech rate
document.querySelector('#speechRate').addEventListener('input', e => {
  state.speechRate = Number(e.target.value);
  document.querySelector('#rateValue').textContent = 
    state.speechRate === 1 ? 'Normal' : 
    state.speechRate < 1 ? 'Slower' : 'Faster';
});

// Word finder
const finderDialog = document.querySelector('#finderDialog');
const searchInput = document.querySelector('#searchInput');
const searchResults = document.querySelector('#searchResults');

function allItems() {
  return Object.values(items).flat();
}

function renderResults(query = '') {
  const matches = allItems()
    .filter(([text]) => text.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 18);
  
  searchResults.innerHTML = '';
  
  if (!matches.length) {
    searchResults.innerHTML = '<p class="empty-results">No matching words or phrases yet.</p>';
    return;
  }
  
  matches.forEach(([text, symbol]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'result';
    b.setAttribute('role', 'listitem');
    b.textContent = `${symbol ? symbol + '  ' : ''}${text}`;
    b.addEventListener('click', () => {
      addWord(text);
      finderDialog.close();
    });
    searchResults.append(b);
  });
}

// Initialize word finder
document.querySelector('#finderButton').addEventListener('click', () => {
  finderDialog.showModal();
  searchInput.value = '';
  renderResults();
  setTimeout(() => searchInput.focus(), 0);
});

searchInput.addEventListener('input', e => renderResults(e.target.value));

// Keyboard shortcuts
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !settingsPanel.hidden) {
    openSettings(false);
  }
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    speak();
  }
});

// Initialize the app
async function init() {
  await preloadAllImages();
  renderView();
  updateMessage();
}

// Start the application
init();
