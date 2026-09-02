const items = {
  core: [
    ['I','◉','core'],['you','☻','core'],['want','✦','action'],['need','✚','action'],['more','＋','core'],['help','✋','urgent'],['go','→','action'],['stop','■','urgent'],['like','♥','feeling'],['not','⊘','core'],['that','☝','core'],['it','●','core'],['what','?','core'],['where','⌖','core'],['good','☀','feeling'],['bad','☁','feeling'],['yes','✓','core'],['no','×','core'],['feel','♡','feeling'],['different','◇','core']
  ],
  quick: [
    ['I need help','✋','urgent'],['Please stop','■','urgent'],['Give me a minute','◷','core'],["I don't know",'…','core'],['I need a break','☁','feeling'],["I'm uncomfortable",'!','urgent'],['Too loud','⌁','feeling'],['Too bright','☀','feeling'],['Not that','↶','core'],['Say it again','↺','core'],['Slower, please','↓','core'],["I can't understand",'?','core'],['Yes, please','✓','core'],['No, thank you','×','core'],['I am hurt','✚','urgent'],['Call my caregiver','☎','urgent']
  ],
  more: [
    ['People','☻','category'],['Food','◒','category'],['Places','⌖','category'],['Activities','★','category'],['Home','⌂','category'],['School / work','▣','category'],['Feelings','♡','feeling'],['My things','◎','category'],['pizza','◒','core'],['water','≈','core'],['music','♫','core'],['outside','☀','core'],['mom','♥','people'],['friend','☻','people'],['bathroom','⌂','core'],['doctor','✚','core']
  ],
  letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => [letter, '', 'letter'])
};

const labels = { core:['EVERYDAY WORDS','Say what you mean'], quick:['QUICK PHRASES','Useful right now'], more:['PERSONAL VOCABULARY','People, places, and favorites'], letters:['SPELLING','Build a word, letter by letter'] };
const state = { view:'core', words:[], quiet:false, speechRate:1 };
const grid = document.querySelector('#vocabularyGrid');
const messageBar = document.querySelector('#messageBar');
const undoButton = document.querySelector('#undoButton');
const clearButton = document.querySelector('#clearButton');
const speakButton = document.querySelector('#speakButton');
const toast = document.querySelector('#toast');

function renderView() {
  const [eyebrow,title] = labels[state.view];
  document.querySelector('#viewEyebrow').textContent = eyebrow;
  document.querySelector('#viewTitle').textContent = title;
  grid.setAttribute('aria-label', `${title} vocabulary`);
  grid.innerHTML = '';
  items[state.view].forEach(([text,symbol,type]) => {
    const button = document.createElement('button');
    button.className = `word ${type}`;
    button.dataset.text = text;
    button.setAttribute('aria-label', `Add ${text} to message`);
    button.innerHTML = symbol ? `<span class="symbol" aria-hidden="true">${symbol}</span><span>${text}</span>` : `<span>${text}</span>`;
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
  [undoButton,clearButton,speakButton].forEach(button => button.disabled = !message);
}
function addWord(word) {
  if (state.view === 'letters' && state.words.length) state.words[state.words.length - 1] += word;
  else state.words.push(word);
  updateMessage();
  if (!state.quiet) navigator.vibrate?.(12);
}
function showToast(message) { toast.textContent = message; toast.classList.add('show'); window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(()=>toast.classList.remove('show'), 2200); }
function speak() {
  const text = formatMessage(); if (!text) return;
  if (!('speechSynthesis' in window)) { showToast('Speech is not available in this browser.'); return; }
  window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.rate = state.speechRate; window.speechSynthesis.speak(utterance); showToast('Speaking message');
}

document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => { state.view = tab.dataset.view; document.querySelectorAll('.tab').forEach(t=>{ const active=t===tab; t.classList.toggle('active',active); if(active)t.setAttribute('aria-current','page'); else t.removeAttribute('aria-current');}); renderView(); }));
undoButton.addEventListener('click',()=>{state.words.pop(); updateMessage();});
clearButton.addEventListener('click',()=>{state.words=[]; updateMessage();});
speakButton.addEventListener('click',speak);

const settingsPanel = document.querySelector('#settingsPanel');
const settingsToggle = document.querySelector('#settingsToggle');
function openSettings(open) { settingsPanel.hidden = !open; settingsToggle.setAttribute('aria-expanded', open); if(open) document.querySelector('#buttonSize').focus(); }
settingsToggle.addEventListener('click',()=>openSettings(settingsPanel.hidden)); document.querySelector('#closeSettings').addEventListener('click',()=>openSettings(false));
document.querySelector('#quietToggle').addEventListener('click', event=>{ state.quiet=!state.quiet; document.body.classList.toggle('quiet',state.quiet); event.currentTarget.setAttribute('aria-pressed',state.quiet); event.currentTarget.setAttribute('aria-label',state.quiet?'Turn quiet mode off':'Turn quiet mode on'); showToast(state.quiet?'Quiet mode on':'Quiet mode off'); });
document.querySelector('#buttonSize').addEventListener('change',e=>{ document.body.classList.remove('large-buttons','extra-large-buttons'); if(e.target.value!=='regular')document.body.classList.add(`${e.target.value}-buttons`); });
document.querySelector('#textSize').addEventListener('change',e=>document.body.classList.toggle('large-text',e.target.value==='large'));
document.querySelector('#contrastToggle').addEventListener('change',e=>document.body.classList.toggle('high-contrast',e.target.checked));
document.querySelector('#motionToggle').addEventListener('change',e=>document.body.classList.toggle('reduced-motion',e.target.checked));
document.querySelector('#speechRate').addEventListener('input',e=>{state.speechRate=Number(e.target.value); document.querySelector('#rateValue').textContent=state.speechRate===1?'Normal':state.speechRate<1?'Slower':'Faster';});

const finderDialog = document.querySelector('#finderDialog'); const searchInput = document.querySelector('#searchInput'); const searchResults = document.querySelector('#searchResults');
function allItems() { return Object.values(items).flat(); }
function renderResults(query='') { const matches=allItems().filter(([text])=>text.toLowerCase().includes(query.toLowerCase())).slice(0,18); searchResults.innerHTML=''; if(!matches.length){searchResults.innerHTML='<p class="empty-results">No matching words or phrases yet.</p>';return;} matches.forEach(([text,symbol])=>{const b=document.createElement('button');b.type='button';b.className='result';b.setAttribute('role','listitem');b.textContent=`${symbol ? symbol+'  ' : ''}${text}`;b.addEventListener('click',()=>{addWord(text);finderDialog.close();});searchResults.append(b);}); }
document.querySelector('#finderButton').addEventListener('click',()=>{finderDialog.showModal();searchInput.value='';renderResults();setTimeout(()=>searchInput.focus(),0);}); searchInput.addEventListener('input',e=>renderResults(e.target.value));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!settingsPanel.hidden)openSettings(false); if((event.ctrlKey||event.metaKey)&&event.key==='Enter')speak();});
renderView(); updateMessage();
