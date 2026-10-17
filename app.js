// Enhanced Clearvoice AAC Application
// A browser-based AAC communication tool with extended features

const items = {
  core: [
    ['I', '\u001b', 'core'],
    ['you', '\u001d', 'core'],
    ['want', '\u001e', 'action'],
    ['need', '\u001f', 'action'],
    ['more', '+', 'core'],
    ['help', '\u0001', 'urgent'],
    ['go', '\u001c', 'action'],
    ['stop', '\u001a', 'urgent'],
    ['like', '\u0002', 'feeling'],
    ['not', '\u0003', 'core'],
    ['that', '\u0004', 'core'],
    ['it', '\u0005', 'core'],
    ['what', '?', 'core'],
    ['where', '\u0016', 'core'],
    ['good', '\u0006', 'feeling'],
    ['bad', '\u0007', 'feeling'],
    ['yes', '\u0008', 'core'],
    ['no', '\u0009', 'core'],
    ['feel', '\u000a', 'feeling'],
    ['different', '\u000b', 'core']
  ],
  quick: [
    ['I need help', '\u0001', 'urgent'],
    ['Please stop', '\u001a', 'urgent'],
    ['Give me a minute', '\u000c', 'core'],
    ["I don't know", '\u000d', 'core'],
    ['I need a break', '\u0007', 'feeling'],
    ["I'm uncomfortable", '!', 'urgent'],
    ['Too loud', '\u001c', 'feeling'],
    ['Too bright', '\u0006', 'feeling'],
    ['Not that', '\u0003', 'core'],
    ['Say it again', '\u000e', 'core'],
    ['Slower, please', '\u001f', 'core'],
    ["I can't understand", '?', 'core'],
    ['Yes, please', '\u0008', 'core'],
    ['No, thank you', '\u0009', 'core'],
    ['I am hurt', '\u001f', 'urgent'],
    ['Call my caregiver', '\u0002', 'urgent']
  ],
  more: [
    ['People', '\u001d', 'category'],
    ['Food', '\u0012', 'category'],
    ['Places', '\u0016', 'category'],
    ['Activities', '\u0005', 'category'],
    ['Home', '\u000c', 'category'],
    ['School / work', '\u0013', 'category'],
    ['Feelings', '\u000a', 'feeling'],
    ['My things', '\u0014', 'category'],
    ['pizza', '\u0012', 'core'],
    ['water', '\u0015', 'core'],
    ['music', '\u000b', 'core'],
    ['outside', '\u0006', 'core'],
    ['mom', '\u0002', 'people'],
    ['friend', '\u001d', 'people'],
    ['bathroom', '\u000c', 'core'],
    ['doctor', '\u001f', 'core']
  ],
  letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => [letter, '', 'letter']),
  custom: []
};

const labels = {
  core: ['EVERYDAY WORDS', 'Say what you mean'],
  quick: ['QUICK PHRASES', 'Useful right now'],
  more: ['PERSONAL VOCABULARY', 'People, places, and favorites'],
  letters: ['SPELLING', 'Build a word, letter by letter'],
  custom: ['CUSTOM WORDS', 'Your personalized vocabulary']
};

const state = {
  view: 'core',
  words: [],
  quiet: false,
  speechRate: 1,
  speechPitch: 1,
  voiceType: 'default',
  darkMode: false,
  history: [],
  favorites: []
};

const grid = document.querySelector('#vocabularyGrid');
const messageBar = document.querySelector('#messageBar');
const undoButton = document.querySelector('#undoButton');
const clearButton = document.querySelector('#clearButton');
const speakButton = document.querySelector('#speakButton');
const saveFavorite = document.querySelector('#saveFavorite');
const toast = document.querySelector('#toast');

// DOM Elements for new features
const historyToggle = document.querySelector('#historyToggle');
const historyPanel = document.querySelector('#historyPanel');
const historyList = document.querySelector('#historyList');
const closeHistory = document.querySelector('#closeHistory');
const clearHistoryButton = document.querySelector('#clearHistoryButton');

const favoritesToggle = document.querySelector('#favoritesToggle');
const favoritesPanel = document.querySelector('#favoritesPanel');
const favoritesList = document.querySelector('#favoritesList');
const closeFavorites = document.querySelector('#closeFavorites');
const clearFavoritesButton = document.querySelector('#clearFavoritesButton');

const darkModeToggle = document.querySelector('#darkModeToggle');

// Initialize from localStorage
function loadState() {
  const savedState = localStorage.getItem('clearvoiceState');
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState);
      state.history = parsed.history || [];
      state.favorites = parsed.favorites || [];
      state.darkMode = parsed.darkMode || false;
      state.customWords = parsed.customWords || [];
      
      // Restore custom words to items
      if (state.customWords && state.customWords.length > 0) {
        items.custom = state.customWords;
      }
    } catch (e) {
      console.error('Error loading state:', e);
    }
  }
}

// Save state to localStorage
function saveState() {
  const saveData = {
    history: state.history,
    favorites: state.favorites,
    darkMode: state.darkMode,
    customWords: items.custom
  };
  localStorage.setItem('clearvoiceState', JSON.stringify(saveData));
}

// Format the current message
function formatMessage() {
  if (!state.words.length) return '';
  let raw = state.words.join(' ');
  raw = raw.replace(/\s+([,.!?])/g, '$1');
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

// Update the message display
function updateMessage() {
  const message = formatMessage();
  messageBar.textContent = message || 'Choose words to build your message';
  messageBar.classList.toggle('placeholder', !message);
  [undoButton, clearButton, speakButton, saveFavorite].forEach(button => 
    button.disabled = !message
  );
}

// Add a word to the message
function addWord(word) {
  if (state.view === 'letters' && state.words.length) {
    state.words[state.words.length - 1] += word;
  } else {
    state.words.push(word);
  }
  updateMessage();
  if (!state.quiet) navigator.vibrate?.(12);
}

// Show a toast notification
function showToast(message, type = '') {
  toast.textContent = message;
  toast.className = 'toast';
  if (type) toast.classList.add(type);
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

// Speak the current message
function speak() {
  const text = formatMessage();
  if (!text) return;
  
  if (!('speechSynthesis' in window)) {
    showToast('Speech is not available in this browser.', 'error');
    return;
  }
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = state.speechRate;
  utterance.pitch = state.speechPitch;
  
  // Set voice based on type
  if (state.voiceType !== 'default') {
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(voice => {
      const name = voice.name.toLowerCase();
      if (state.voiceType === 'male' && name.includes('male')) return true;
      if (state.voiceType === 'female' && name.includes('female')) return true;
      if (state.voiceType === 'child' && (name.includes('child') || name.includes('kid'))) return true;
      return false;
    });
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
  }
  
  utterance.onend = () => {
    // Save to history after speaking
    saveToHistory(text);
  };
  
  window.speechSynthesis.speak(utterance);
  showToast('Speaking message');
}

// Save message to history
function saveToHistory(message) {
  const timestamp = new Date().toLocaleTimeString();
  state.history.unshift({ text: message, timestamp });
  
  // Keep only last 50 messages
  if (state.history.length > 50) {
    state.history = state.history.slice(0, 50);
  }
  
  saveState();
  renderHistory();
}

// Render message history
function renderHistory() {
  if (!historyList) return;
  
  historyList.innerHTML = '';
  
  if (state.history.length === 0) {
    historyList.innerHTML = '<p class="empty-results">No message history yet.</p>';
    return;
  }
  
  state.history.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <span class="text">${item.text}</span>
      <span class="timestamp">${item.timestamp}</span>
      <div class="actions">
        <button class="speak-btn" data-index="${index}" title="Speak">\u001e</button>
        <button class="delete-btn" data-index="${index}" title="Delete">\u0007</button>
      </div>
    `;
    historyList.appendChild(div);
  });
  
  // Add event listeners
  historyList.querySelectorAll('.speak-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      speakHistoryItem(index);
    });
  });
  
  historyList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      deleteHistoryItem(index);
    });
  });
}

// Speak a history item
function speakHistoryItem(index) {
  const item = state.history[index];
  if (!item) return;
  
  if (!('speechSynthesis' in window)) {
    showToast('Speech is not available in this browser.', 'error');
    return;
  }
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(item.text);
  utterance.rate = state.speechRate;
  utterance.pitch = state.speechPitch;
  window.speechSynthesis.speak(utterance);
  showToast(`Speaking: "${item.text}"`);
}

// Delete a history item
function deleteHistoryItem(index) {
  state.history.splice(index, 1);
  saveState();
  renderHistory();
  showToast('Message removed from history');
}

// Clear all history
function clearHistory() {
  state.history = [];
  saveState();
  renderHistory();
  showToast('Message history cleared');
}

// Save current message to favorites
function saveToFavorites() {
  const message = formatMessage();
  if (!message) return;
  
  const timestamp = new Date().toLocaleTimeString();
  
  // Check if already in favorites
  const existingIndex = state.favorites.findIndex(f => f.text === message);
  if (existingIndex !== -1) {
    showToast('Already in favorites!', 'warning');
    return;
  }
  
  state.favorites.unshift({ text: message, timestamp });
  
  // Keep only last 50 favorites
  if (state.favorites.length > 50) {
    state.favorites = state.favorites.slice(0, 50);
  }
  
  saveState();
  renderFavorites();
  showToast('Saved to favorites!', 'success');
}

// Render favorites
function renderFavorites() {
  if (!favoritesList) return;
  
  favoritesList.innerHTML = '';
  
  if (state.favorites.length === 0) {
    favoritesList.innerHTML = '<p class="empty-results">No saved favorites yet.</p>';
    return;
  }
  
  state.favorites.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'favorite-item';
    div.innerHTML = `
      <span class="text">${item.text}</span>
      <span class="timestamp">${item.timestamp}</span>
      <div class="actions">
        <button class="speak-btn" data-index="${index}" title="Speak">\u001e</button>
        <button class="delete-btn" data-index="${index}" title="Delete">\u0007</button>
      </div>
    `;
    favoritesList.appendChild(div);
  });
  
  // Add event listeners
  favoritesList.querySelectorAll('.speak-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      speakFavoriteItem(index);
    });
  });
  
  favoritesList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      deleteFavoriteItem(index);
    });
  });
}

// Speak a favorite item
function speakFavoriteItem(index) {
  const item = state.favorites[index];
  if (!item) return;
  
  if (!('speechSynthesis' in window)) {
    showToast('Speech is not available in this browser.', 'error');
    return;
  }
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(item.text);
  utterance.rate = state.speechRate;
  utterance.pitch = state.speechPitch;
  window.speechSynthesis.speak(utterance);
  showToast(`Speaking: "${item.text}"`);
}

// Delete a favorite item
function deleteFavoriteItem(index) {
  state.favorites.splice(index, 1);
  saveState();
  renderFavorites();
  showToast('Removed from favorites');
}

// Clear all favorites
function clearFavorites() {
  state.favorites = [];
  saveState();
  renderFavorites();
  showToast('Favorites cleared');
}

// Toggle dark mode
function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  document.body.setAttribute('data-theme', state.darkMode ? 'dark' : '');
  darkModeToggle.setAttribute('aria-pressed', state.darkMode);
  darkModeToggle.setAttribute('aria-label', state.darkMode ? 'Toggle light mode' : 'Toggle dark mode');
  saveState();
  showToast(state.darkMode ? 'Dark mode enabled' : 'Light mode enabled');
}

// Render the current view
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
    
    // Check if this word is in favorites
    const isFavorite = state.favorites.some(f => f.text === text);
    if (isFavorite) {
      button.classList.add('favorite');
    }
    
    button.innerHTML = symbol ? 
      `<span class="symbol" aria-hidden="true">${symbol}</span><span>${text}</span>` : 
      `<span>${text}</span>`;
    button.addEventListener('click', () => addWord(text));
    grid.append(button);
  });
}

// Add custom word to vocabulary
function addCustomWord() {
  const customWordInput = document.querySelector('#customWordInput');
  const customSymbolInput = document.querySelector('#customSymbolInput');
  
  const word = customWordInput.value.trim();
  const symbol = customSymbolInput.value.trim();
  
  if (!word) {
    showToast('Please enter a word or phrase', 'error');
    return;
  }
  
  // Check if already exists
  const exists = items.custom.some(([text]) => text === word);
  if (exists) {
    showToast('Word already in custom vocabulary', 'error');
    return;
  }
  
  items.custom.push([word, symbol, 'custom']);
  
  // Switch to custom view
  state.view = 'custom';
  document.querySelectorAll('.tab').forEach(t => {
    const active = t.dataset.view === 'custom';
    t.classList.toggle('active', active);
    if (active) t.setAttribute('aria-current', 'page');
    else t.removeAttribute('aria-current');
  });
  
  renderView();
  updateMessage();
  
  customWordInput.value = '';
  customSymbolInput.value = '';
  
  saveState();
  showToast(`"${word}" added to custom vocabulary!`, 'success');
  
  const customWordDialog = document.querySelector('#customWordDialog');
  customWordDialog.close();
}

// Initialize the application
function init() {
  // Load saved state
  loadState();
  
  // Apply dark mode if saved
  if (state.darkMode) {
    document.body.setAttribute('data-theme', 'dark');
    darkModeToggle.setAttribute('aria-pressed', true);
    darkModeToggle.setAttribute('aria-label', 'Toggle light mode');
  }
  
  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      state.view = tab.dataset.view;
      document.querySelectorAll('.tab').forEach(t => {
        const active = t === tab;
        t.classList.toggle('active', active);
        if (active) t.setAttribute('aria-current', 'page');
        else t.removeAttribute('aria-current');
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
  saveFavorite.addEventListener('click', saveToFavorites);
  
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
  
  // Speech pitch
  document.querySelector('#speechPitch').addEventListener('input', e => {
    state.speechPitch = Number(e.target.value);
    document.querySelector('#pitchValue').textContent = 
      state.speechPitch === 1 ? 'Normal' : 
      state.speechPitch < 1 ? 'Lower' : 'Higher';
  });
  
  // Voice type
  document.querySelector('#voiceType').addEventListener('change', e => {
    state.voiceType = e.target.value;
  });
  
  // History panel
  historyToggle.addEventListener('click', () => {
    const open = historyPanel.hidden;
    historyPanel.hidden = !open;
    historyToggle.setAttribute('aria-expanded', open);
    if (open) renderHistory();
  });
  
  closeHistory.addEventListener('click', () => {
    historyPanel.hidden = true;
    historyToggle.setAttribute('aria-expanded', false);
  });
  
  clearHistoryButton.addEventListener('click', clearHistory);
  
  // Favorites panel
  favoritesToggle.addEventListener('click', () => {
    const open = favoritesPanel.hidden;
    favoritesPanel.hidden = !open;
    favoritesToggle.setAttribute('aria-expanded', open);
    if (open) renderFavorites();
  });
  
  closeFavorites.addEventListener('click', () => {
    favoritesPanel.hidden = true;
    favoritesToggle.setAttribute('aria-expanded', false);
  });
  
  clearFavoritesButton.addEventListener('click', clearFavorites);
  
  // Dark mode toggle
  darkModeToggle.addEventListener('click', toggleDarkMode);
  
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
  
  document.querySelector('#finderButton').addEventListener('click', () => {
    finderDialog.showModal();
    searchInput.value = '';
    renderResults();
    setTimeout(() => searchInput.focus(), 0);
  });
  
  searchInput.addEventListener('input', e => renderResults(e.target.value));
  
  // Custom word dialog
  const customWordDialog = document.querySelector('#customWordDialog');
  const confirmCustomWord = document.querySelector('#confirmCustomWord');
  
  // Add button to open custom word dialog
  const addCustomButton = document.createElement('button');
  addCustomButton.className = 'action secondary';
  addCustomButton.id = 'addCustomButton';
  addCustomButton.innerHTML = '+ <span>Add Custom</span>';
  addCustomButton.addEventListener('click', () => {
    customWordDialog.showModal();
    setTimeout(() => document.querySelector('#customWordInput').focus(), 0);
  });
  
  // Insert add custom button next to finder
  const finderButton = document.querySelector('#finderButton');
  finderButton.parentNode.insertBefore(addCustomButton, finderButton.nextSibling);
  
  confirmCustomWord.addEventListener('click', addCustomWord);
  
  // Keyboard shortcuts
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (!settingsPanel.hidden) openSettings(false);
      if (!historyPanel.hidden) {
        historyPanel.hidden = true;
        historyToggle.setAttribute('aria-expanded', false);
      }
      if (!favoritesPanel.hidden) {
        favoritesPanel.hidden = true;
        favoritesToggle.setAttribute('aria-expanded', false);
      }
    }
    
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      speak();
    }
    
    // Ctrl/Cmd + S to save to favorites
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      saveToFavorites();
    }
    
    // Ctrl/Cmd + H to toggle history
    if ((event.ctrlKey || event.metaKey) && event.key === 'h') {
      event.preventDefault();
      historyToggle.click();
    }
    
    // Ctrl/Cmd + F to toggle favorites
    if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
      event.preventDefault();
      favoritesToggle.click();
    }
    
    // Ctrl/Cmd + D to toggle dark mode
    if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
      event.preventDefault();
      toggleDarkMode();
    }
  });
  
  // Load voices when available
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      // Voices are loaded, can be used now
    };
  }
  
  // Initial render
  renderView();
  updateMessage();
  
  // Render history and favorites on startup
  renderHistory();
  renderFavorites();
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
