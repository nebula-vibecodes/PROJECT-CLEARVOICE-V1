import fs from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import {
  DEFAULT_PREFERENCES,
  isSupportedPersonalSymbolDataUrl,
  LOCAL_DATA_SCHEMA,
  LOCAL_DATA_VERSION,
  MAX_PERSONAL_SYMBOL_BYTES,
  MAX_PERSONAL_VOCABULARY_BYTES,
  makeLocalDataExport,
  parseLocalDataExport,
  PERSONAL_VOCABULARY_STORAGE_KEY,
  PREFERENCES_STORAGE_KEY,
  readStoredPreferences,
  readStoredPersonalVocabulary,
  SYMBOL_DISPLAY_EXPLICIT_CHOICE_STORAGE_KEY,
  SYMBOL_DISPLAY_INITIALIZED_STORAGE_KEY,
  validatePersonalVocabulary,
  type PersonalVocabularyItem,
} from '../src/data/localData';
import { getSearchableText, getVocabularyForSection, getVocabularyForTopic, isLocalSymbolAssetLocation, vocabulary, type TopicCategory } from '../src/data/vocabulary';
import { controlSymbolMetadata, CORE_INTENTIONAL_TEXT_FALLBACK_IDS, FEELINGS_INTENTIONAL_TEXT_FALLBACK_IDS, isBundledStarterSymbol, MULBERRY_SYMBOL_INVENTORY, MULBERRY_SYMBOL_LICENSE_ID, MULBERRY_SYMBOL_LICENSE_URL, MULBERRY_SYMBOL_SOURCE, MULBERRY_YES_SYMBOL_ASSET_ID, MULBERRY_YES_SYMBOL_ASSET_LOCATION, QUICK_PHRASE_INTENTIONAL_TEXT_FALLBACK_IDS, STARTER_SYMBOL_ASSET_LOCATION, starterSymbolMetadata } from '../src/data/symbols';

const personalItem = (overrides: Partial<PersonalVocabularyItem> = {}): PersonalVocabularyItem => ({
  id: 'personal-test-word',
  displayText: 'Test word',
  spokenText: 'Test word',
  category: 'core',
  colorRole: 'teal',
  itemType: 'word',
  searchKeywords: ['test'],
  position: 1,
  isUrgent: false,
  section: 'Core',
  source: 'personal',
  ...overrides,
});

const symbolPersonalItem = (overrides: Partial<PersonalVocabularyItem> = {}): PersonalVocabularyItem => personalItem({
  id: 'personal-symbol-word',
  displayText: 'Symbol word',
  spokenText: 'Spoken symbol word',
  category: 'core',
  section: 'Core',
  symbolAssetId: 'control-search',
  symbolAssetLocation: 'symbols/clearvoice-starter.svg',
  symbolDescription: 'A local demonstration symbol',
  symbolSource: 'Local demo collection',
  symbolCreator: 'Clearvoice demo',
  symbolLicenseId: 'demo-license',
  symbolLicenseUrl: 'https://example.test/licenses/demo',
  ...overrides,
});

const personalPngDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

const renderApp = () => render(<App />);

const expandedVocabularyIds = new Set([
  'can', 'do', 'have', 'make', 'get', 'give', 'come', 'look', 'again',
  'people-sibling', 'people-neighbor', 'people-hello', 'people-please-wait',
  'food-eat', 'food-taste', 'food-that-one-please', 'food-i-am-full',
  'places-inside', 'places-near', 'places-far', 'places-take-me-there',
  'activities-wait', 'activities-start', 'activities-finish', 'activities-i-want-to-join',
  'home-chair', 'home-window', 'home-clean', 'home-turn-it-on',
  'school-work-desk', 'school-work-write', 'school-work-read-this', 'school-work-i-am-ready',
  'feelings-proud', 'feelings-confused', 'feelings-i-feel-better', 'feelings-i-need-quiet',
  'personal-items-headphones', 'personal-items-wallet', 'personal-items-i-need-this', 'personal-items-please-bring-it',
  'health-dizzy', 'health-fever', 'health-i-need-water', 'health-please-be-gentle',
]);

const legacyVocabularyOrder = {
  Core: ['i', 'you', 'want', 'need', 'more', 'help', 'go', 'stop', 'like', 'not', 'that', 'it', 'what', 'where', 'good', 'bad', 'yes', 'no', 'feel', 'different'],
  'Quick Phrases': ['i-need-help', 'please-stop', 'give-me-a-minute', 'i-dont-know', 'i-need-a-break', 'im-uncomfortable', 'too-loud', 'too-bright', 'not-that', 'say-it-again', 'slower-please', 'i-cant-understand', 'yes-please', 'no-thank-you', 'i-am-hurt', 'call-my-caregiver'],
  people: ['people-parent', 'people-caregiver', 'people-friend', 'people-family', 'people-teacher', 'people-doctor', 'people-nurse', 'people-someone', 'people-my-turn', 'people-with-me'],
  food: ['food-water', 'food-drink', 'food-breakfast', 'food-lunch', 'food-dinner', 'food-snack', 'food-hungry', 'food-thirsty', 'food-hot', 'food-cold', 'food-more-please', 'food-all-done'],
  places: ['places-home', 'places-school', 'places-work', 'places-bathroom', 'places-outside', 'places-room', 'places-store', 'places-park', 'places-here', 'places-there', 'places-where-next'],
  activities: ['activities-play', 'activities-read', 'activities-watch', 'activities-listen', 'activities-music', 'activities-draw', 'activities-walk', 'activities-rest', 'activities-go-outside', 'activities-my-turn'],
  home: ['home-bed', 'home-bathroom', 'home-kitchen', 'home-door', 'home-light', 'home-tv', 'home-clothes', 'home-blanket', 'home-open', 'home-close'],
  'school-work': ['school-work-class', 'school-work-break', 'school-work-teacher', 'school-work-coworker', 'school-work-computer', 'school-work-paper', 'school-work-meeting', 'school-work-task', 'school-work-finished', 'school-work-help-please'],
  feelings: ['feelings-happy', 'feelings-sad', 'feelings-worried', 'feelings-angry', 'feelings-calm', 'feelings-tired', 'feelings-excited', 'feelings-bored', 'feelings-uncomfortable', 'feelings-okay'],
  'personal-items': ['personal-items-phone', 'personal-items-tablet', 'personal-items-glasses', 'personal-items-shoes', 'personal-items-bag', 'personal-items-keys', 'personal-items-toy', 'personal-items-book', 'personal-items-charger', 'personal-items-my-things'],
  health: ['health-hurt', 'health-pain', 'health-sick', 'health-medicine', 'health-doctor', 'health-nurse', 'health-breathe', 'health-rest', 'health-head', 'health-stomach', 'health-i-need-care'],
} as const;

const phrasePackByTopic = {
  people: [
    { id: 'people-i-want-to-see-someone', displayText: 'I want to see someone.', spokenText: 'I want to see someone.', position: 15 },
    { id: 'people-please-stay-with-me', displayText: 'Please stay with me.', spokenText: 'Please stay with me.', position: 16 },
    { id: 'people-who-is-here', displayText: 'Who is here?', spokenText: 'Who is here?', position: 17 },
    { id: 'people-nice-to-see-you', displayText: 'Nice to see you.', spokenText: 'Nice to see you.', position: 18 },
  ],
  food: [
    { id: 'food-can-i-have-this', displayText: 'Can I have this?', spokenText: 'Can I have this?', position: 17 },
    { id: 'food-please-help-me-choose', displayText: 'Please help me choose.', spokenText: 'Please help me choose.', position: 18 },
    { id: 'food-this-is-not-what-i-want', displayText: 'This is not what I want.', spokenText: 'This is not what I want.', position: 19 },
    { id: 'food-i-am-still-hungry', displayText: 'I am still hungry.', spokenText: 'I am still hungry.', position: 20 },
  ],
  places: [
    { id: 'places-where-are-we-going', displayText: 'Where are we going?', spokenText: 'Where are we going?', position: 16 },
    { id: 'places-i-want-to-go-home', displayText: 'I want to go home.', spokenText: 'I want to go home.', position: 17 },
    { id: 'places-please-help-me-find-it', displayText: 'Please help me find it.', spokenText: 'Please help me find it.', position: 18 },
    { id: 'places-is-it-close', displayText: 'Is it close?', spokenText: 'Is it close?', position: 19 },
  ],
  activities: [
    { id: 'activities-i-need-more-time', displayText: 'I need more time.', spokenText: 'I need more time.', position: 15 },
    { id: 'activities-i-want-to-do-something-else', displayText: 'I want to do something else.', spokenText: 'I want to do something else.', position: 16 },
    { id: 'activities-what-should-we-do', displayText: 'What should we do?', spokenText: 'What should we do?', position: 17 },
    { id: 'activities-can-we-do-this-later', displayText: 'Can we do this later?', spokenText: 'Can we do this later?', position: 18 },
  ],
  home: [
    { id: 'home-i-want-to-sit-here', displayText: 'I want to sit here.', spokenText: 'I want to sit here.', position: 15 },
    { id: 'home-please-turn-it-off', displayText: 'Please turn it off.', spokenText: 'Please turn it off.', position: 16 },
    { id: 'home-can-you-help-me-with-this', displayText: 'Can you help me with this?', spokenText: 'Can you help me with this?', position: 17 },
    { id: 'home-i-want-it-here', displayText: 'I want it here.', spokenText: 'I want it here.', position: 18 },
  ],
  'school-work': [
    { id: 'school-work-please-explain-that', displayText: 'Please explain that.', spokenText: 'Please explain that.', position: 15 },
    { id: 'school-work-can-you-show-me', displayText: 'Can you show me?', spokenText: 'Can you show me?', position: 16 },
    { id: 'school-work-i-want-a-different-task', displayText: 'I want a different task.', spokenText: 'I want a different task.', position: 17 },
    { id: 'school-work-what-comes-next', displayText: 'What comes next?', spokenText: 'What comes next?', position: 18 },
  ],
  feelings: [
    { id: 'feelings-i-feel-unsure', displayText: 'I feel unsure.', spokenText: 'I feel unsure.', position: 15 },
    { id: 'feelings-i-feel-overwhelmed', displayText: 'I feel overwhelmed.', spokenText: 'I feel overwhelmed.', position: 16 },
    { id: 'feelings-i-want-to-be-alone', displayText: 'I want to be alone.', spokenText: 'I want to be alone.', position: 17 },
    { id: 'feelings-i-want-to-talk', displayText: 'I want to talk.', spokenText: 'I want to talk.', position: 18 },
  ],
  'personal-items': [
    { id: 'personal-items-please-put-it-here', displayText: 'Please put it here.', spokenText: 'Please put it here.', position: 15 },
    { id: 'personal-items-can-i-use-it', displayText: 'Can I use it?', spokenText: 'Can I use it?', position: 16 },
    { id: 'personal-items-please-keep-it-nearby', displayText: 'Please keep it nearby.', spokenText: 'Please keep it nearby.', position: 17 },
    { id: 'personal-items-which-one-is-mine', displayText: 'Which one is mine?', spokenText: 'Which one is mine?', position: 18 },
  ],
  health: [
    { id: 'health-it-hurts-here', displayText: 'It hurts here.', spokenText: 'It hurts here.', position: 16 },
    { id: 'health-i-feel-sick', displayText: 'I feel sick.', spokenText: 'I feel sick.', position: 17 },
    { id: 'health-please-check-this', displayText: 'Please check this.', spokenText: 'Please check this.', position: 18 },
    { id: 'health-i-need-some-rest', displayText: 'I need some rest.', spokenText: 'I need some rest.', position: 19 },
  ],
} as const;

const phrasePackIds = new Set(Object.values(phrasePackByTopic).flat().map((phrase) => phrase.id));

async function createPersonalEntry(user: ReturnType<typeof userEvent.setup>, text: string, category = 'core') {
  await user.click(screen.getByTestId('button-open-customize'));
  await user.type(screen.getByTestId('input-personal-display-text'), text);
  await user.selectOptions(screen.getByTestId('select-personal-category'), category);
  await user.click(screen.getByTestId('button-save-personal-entry'));
}

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Clearvoice communication workspace', () => {
  it('selects Core vocabulary, supports Undo, and clears the message', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByTestId('button-word-i'));
    expect(screen.getByTestId('text-composed-message')).toHaveTextContent('I');
    expect(screen.getByTestId('button-undo-selection')).toBeEnabled();

    await user.click(screen.getByTestId('button-undo-selection'));
    expect(screen.getByTestId('text-composed-message')).toHaveTextContent('No message yet');

    await user.click(screen.getByTestId('button-word-you'));
    await user.click(screen.getByTestId('button-clear-message'));
    expect(screen.getByTestId('text-composed-message')).toHaveTextContent('No message yet');
  });

  it('allows deliberate rapid repetition of the same vocabulary item', async () => {
    const user = userEvent.setup();
    renderApp();
    const word = screen.getByTestId('button-word-i');

    await user.click(word);
    await user.click(word);

    expect([...screen.getByTestId('text-composed-message').querySelectorAll('.message-token')].map((token) => token.textContent)).toEqual(['I', 'I']);
  });

  it('does not debounce different vocabulary items selected in succession', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByTestId('button-word-i'));
    await user.click(screen.getByTestId('button-word-you'));

    expect([...screen.getByTestId('text-composed-message').querySelectorAll('.message-token')].map((token) => token.textContent)).toEqual(['I', 'you']);
  });

  it('keeps separate keyboard and touch activations available for repeated communication', async () => {
    const user = userEvent.setup();
    renderApp();
    const word = screen.getByTestId('button-word-i');

    word.focus();
    await user.keyboard('{Enter}{Enter}');
    fireEvent.pointerDown(word, { pointerId: 1, pointerType: 'touch' });
    fireEvent.pointerUp(word, { pointerId: 1, pointerType: 'touch' });
    fireEvent.click(word);

    expect([...screen.getByTestId('text-composed-message').querySelectorAll('.message-token')].map((token) => token.textContent)).toEqual(['I', 'I', 'I']);
  });

  it('preserves Quick Phrase display text and sends spoken text to browser speech', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByTestId('button-category-quick-phrases'));
    await user.click(screen.getByTestId('button-word-i-need-help'));
    expect(screen.getByTestId('text-composed-message')).toHaveTextContent('I need help');

    await user.click(screen.getByTestId('button-speak-message'));
    const speak = window.speechSynthesis.speak as unknown as ReturnType<typeof vi.fn>;
    expect(speak).toHaveBeenCalledWith(expect.objectContaining({ text: 'I need help' }));
  });

  it('keeps Review first as the default and does not speak on selection', async () => {
    const user = userEvent.setup();
    const legacyPreferences = { ...DEFAULT_PREFERENCES } as Record<string, unknown>;
    delete legacyPreferences.speechBehavior;
    window.localStorage.setItem('clearvoice-preferences', JSON.stringify(legacyPreferences));
    renderApp();

    await user.click(screen.getByTestId('button-open-settings'));
    expect(screen.getByTestId('input-speech-behavior-review-first')).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Close Settings' }));
    await user.click(screen.getByTestId('button-category-quick-phrases'));
    await user.click(screen.getByTestId('button-word-i-need-help'));

    expect(screen.getByTestId('text-composed-message')).toHaveTextContent('I need help');
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
  });

  it('speaks each repeated selection with its spoken text', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByTestId('button-open-settings'));
    await user.click(screen.getByTestId('input-speech-behavior-speak-on-selection'));
    expect(screen.getByTestId('input-speech-behavior-speak-on-selection')).toBeChecked();
    expect(JSON.parse(window.localStorage.getItem('clearvoice-preferences') ?? '{}')).toMatchObject({ speechBehavior: 'speak-on-selection' });
    await user.click(screen.getByRole('button', { name: 'Close Settings' }));

    const speak = window.speechSynthesis.speak as unknown as ReturnType<typeof vi.fn>;
    const cancel = window.speechSynthesis.cancel as unknown as ReturnType<typeof vi.fn>;
    vi.clearAllMocks();

    await user.click(screen.getByTestId('button-category-quick-phrases'));
    await user.click(screen.getByTestId('button-word-i-dont-know'));
    expect(speak).toHaveBeenCalledTimes(1);
    expect(speak).toHaveBeenCalledWith(expect.objectContaining({ text: 'I do not know', rate: 0.95, voice: null }));
    expect(screen.getByTestId('text-composed-message')).toHaveTextContent('I don’t know');

    await user.click(screen.getByTestId('button-word-i-dont-know'));
    expect(speak).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('text-composed-message').querySelectorAll('.message-token')).toHaveLength(2);

    const cancelCallsBeforeNextSelection = cancel.mock.calls.length;
    await user.click(screen.getByTestId('button-word-i-need-help'));
    expect(speak).toHaveBeenCalledTimes(3);
    expect(cancel.mock.calls.length).toBeGreaterThan(cancelCallsBeforeNextSelection);

    await user.click(screen.getByTestId('button-speak-message'));
    expect(speak).toHaveBeenLastCalledWith(expect.objectContaining({ text: 'I do not know I do not know I need help' }));
  });

  it('handles unavailable speech APIs without blocking message selection', async () => {
    const originalSpeechSynthesis = Object.getOwnPropertyDescriptor(window, 'speechSynthesis');
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined });

    try {
      const user = userEvent.setup();
      renderApp();
      await user.click(screen.getByTestId('button-open-settings'));
      expect(screen.getByText('Speech synthesis is not available in this browser.')).toBeInTheDocument();
      expect(screen.getByTestId('button-test-voice')).toBeDisabled();
      await user.click(screen.getByRole('button', { name: 'Close Settings' }));
      await user.click(screen.getByTestId('button-word-i'));
      expect(screen.getByTestId('text-composed-message')).toHaveTextContent('I');
    } finally {
      if (originalSpeechSynthesis) Object.defineProperty(window, 'speechSynthesis', originalSpeechSynthesis);
    }
  });

  it('uses the browser default when a saved voice is no longer available', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({
      ...DEFAULT_PREFERENCES,
      voiceName: 'Voice that is no longer installed',
    }));
    renderApp();

    await user.click(screen.getByTestId('button-word-i'));
    await user.click(screen.getByTestId('button-speak-message'));

    expect(window.speechSynthesis.speak).toHaveBeenCalledWith(expect.objectContaining({
      text: 'I',
      voice: null,
    }));
  });

  it('reports speech synthesis errors without leaving the workspace speaking', async () => {
    const user = userEvent.setup();
    const speak = window.speechSynthesis.speak as unknown as ReturnType<typeof vi.fn>;
    speak.mockImplementationOnce((utterance: { onstart?: () => void; onerror?: (event: { error: string }) => void }) => {
      utterance.onstart?.();
      utterance.onerror?.({ error: 'network' });
    });
    renderApp();

    await user.click(screen.getByTestId('button-word-i'));
    await user.click(screen.getByTestId('button-speak-message'));

    expect(screen.getByTestId('button-speak-message')).toHaveTextContent('Speak');
    await waitFor(() => expect(screen.getByTestId('status-feedback')).toHaveTextContent('Speech could not be started'));
  });

  it('supports custom spoken text and pronunciation preview for personal entries', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByTestId('button-open-customize'));
    await user.type(screen.getByTestId('input-personal-display-text'), 'Favorite snack');
    await user.type(screen.getByTestId('input-personal-spoken-text'), 'FAV-or-it snack');

    vi.clearAllMocks();
    await user.click(screen.getByTestId('button-preview-pronunciation'));
    expect(window.speechSynthesis.speak).toHaveBeenCalledWith(expect.objectContaining({ text: 'FAV-or-it snack', rate: 0.95 }));

    await user.click(screen.getByTestId('button-save-personal-entry'));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Edit Favorite snack' }));
    expect(within(dialog).getByTestId('input-personal-spoken-text')).toHaveValue('FAV-or-it snack');
  });

  it('supports Spell buffer editing, commit, and clear', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByTestId('button-category-spell'));
    await user.click(screen.getByTestId('button-word-letter-h'));
    await user.click(screen.getByTestId('button-word-letter-i'));
    expect(document.getElementById('spell-builder-heading')).toHaveTextContent('HI');

    await user.click(screen.getByTestId('button-spell-space'));
    expect(document.getElementById('spell-builder-heading')?.textContent).toBe('HI ');
    await user.click(screen.getByTestId('button-spell-backspace'));
    expect(document.getElementById('spell-builder-heading')).toHaveTextContent('HI');
    await user.click(screen.getByTestId('button-add-spelled-word'));
    expect(screen.getByTestId('text-composed-message')).toHaveTextContent('HI');
    expect(document.getElementById('spell-builder-heading')).toHaveTextContent('Choose letters to build a word.');

    await user.click(screen.getByTestId('button-word-letter-a'));
    await user.click(screen.getByTestId('button-spell-clear'));
    expect(document.getElementById('spell-builder-heading')).toHaveTextContent('Choose letters to build a word.');
  });

  it('searches default and personal vocabulary', async () => {
    const user = userEvent.setup();
    renderApp();
    await createPersonalEntry(user, 'Favorite blanket', 'home');
    await user.click(screen.getByTestId('button-close-customize-vocabulary'));

    await user.click(screen.getByTestId('button-open-word-finder'));
    const search = screen.getByTestId('input-word-search');
    await user.type(search, 'favorite');
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: /Favorite blanket/ })).toBeInTheDocument();
    expect(screen.getByText('Favorite blanket')).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'help');
    expect(screen.getByTestId('button-search-result-help')).toBeInTheDocument();
  });

  it('keeps existing personal vocabulary when an import contains an invalid record', async () => {
    const user = userEvent.setup();
    const existing = personalItem({
      id: 'personal-existing-word',
      displayText: 'Existing word',
    });
    window.localStorage.setItem(PERSONAL_VOCABULARY_STORAGE_KEY, JSON.stringify([existing]));
    renderApp();

    const imported = JSON.parse(makeLocalDataExport(DEFAULT_PREFERENCES, [
      personalItem({ id: 'personal-imported-word', displayText: 'Imported word' }),
    ])) as Record<string, unknown>;
    (imported.personalVocabulary as unknown[]).push({
      ...personalItem({ id: 'personal-broken-symbol', displayText: 'Broken symbol' }),
      symbolAssetId: 'broken-symbol',
      symbolAssetLocation: 'data:image/png;base64,AAAA',
    });

    await user.click(screen.getByTestId('button-open-customize'));
    const dialog = screen.getByRole('dialog');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File([JSON.stringify(imported)], 'partial-export.json', { type: 'application/json' })] },
    });

    await waitFor(() => expect(screen.getByTestId('status-feedback')).toHaveTextContent(/symbol|malformed|unsupported/i));
    expect(within(dialog).getByText('Existing word')).toBeInTheDocument();
    expect(screen.queryByText('Imported word')).not.toBeInTheDocument();
  });

  it('creates, edits, reorders, and removes personal vocabulary entries', async () => {
    const user = userEvent.setup();
    renderApp();
    await createPersonalEntry(user, 'First personal');
    await user.click(screen.getByTestId('button-close-customize-vocabulary'));
    await createPersonalEntry(user, 'Second personal');

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('First personal')).toBeInTheDocument();
    expect(within(dialog).getByText('Second personal')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Edit First personal' }));
    const displayInput = within(dialog).getByTestId('input-personal-display-text');
    await user.clear(displayInput);
    await user.type(displayInput, 'Edited personal');
    await user.click(within(dialog).getByTestId('button-save-personal-entry'));
    expect(within(dialog).getByText('Edited personal')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Move Edited personal later' }));
    const entries = within(dialog).getAllByRole('article');
    expect(entries[0]).toHaveTextContent('Second personal');
    expect(entries[1]).toHaveTextContent('Edited personal');

    await user.click(within(dialog).getByRole('button', { name: 'Remove Second personal' }));
    expect(within(dialog).queryByText('Second personal')).not.toBeInTheDocument();
  });

  it('persists and resets accessibility preferences without changing messages', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByTestId('button-word-i'));
    await user.click(screen.getByTestId('button-open-settings'));

    const highContrast = screen.getByTestId('input-high-contrast');
    await user.click(highContrast);
    expect(JSON.parse(window.localStorage.getItem('clearvoice-preferences') ?? '{}')).toMatchObject({ highContrast: true });
    expect(screen.getByText(/Speech uses browser-native capabilities/)).toBeInTheDocument();

    await user.click(screen.getByTestId('button-reset-settings'));
    expect(highContrast).not.toBeChecked();
    expect(JSON.parse(window.localStorage.getItem('clearvoice-preferences') ?? '{}')).toEqual(DEFAULT_PREFERENCES);
    expect(screen.getByTestId('text-composed-message')).toHaveTextContent('I');
  });

  it('keeps active settings and personal vocabulary usable when local writes fail', async () => {
    const user = userEvent.setup();
    renderApp();
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    await user.click(screen.getByTestId('button-open-settings'));
    await user.click(screen.getByTestId('input-high-contrast'));
    expect(screen.getByTestId('input-high-contrast')).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Close Settings' }));

    await createPersonalEntry(user, 'Session-only word');
    expect(within(screen.getByRole('dialog')).getByText('Session-only word')).toBeInTheDocument();
    expect(setItem).toHaveBeenCalled();
  });

  it('reports clipboard rejection without losing the composed message', async () => {
    const writeText = vi.spyOn(window.navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('clipboard denied'));
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByTestId('button-word-i'));
    await user.click(screen.getByTestId('button-share-message'));

    await waitFor(() => expect(screen.getByTestId('status-feedback')).toHaveTextContent('Copying was not available'));
    expect(screen.getByTestId('text-composed-message')).toHaveTextContent('I');
  });

  it('reports when clipboard support is unavailable', async () => {
    const clipboard = window.navigator.clipboard;
    const originalWriteText = Object.getOwnPropertyDescriptor(clipboard, 'writeText');
    Object.defineProperty(clipboard, 'writeText', { configurable: true, value: undefined });
    try {
      const user = userEvent.setup();
      renderApp();
      await user.click(screen.getByTestId('button-word-i'));
      await user.click(screen.getByTestId('button-share-message'));

      await waitFor(() => expect(screen.getByTestId('status-feedback')).toHaveTextContent('Copying is not supported'));
      expect(screen.getByTestId('text-composed-message')).toHaveTextContent('I');
    } finally {
      if (originalWriteText) Object.defineProperty(clipboard, 'writeText', originalWriteText);
    }
  });

  it('falls back to clipboard when native sharing fails', async () => {
    const originalClipboard = Object.getOwnPropertyDescriptor(window.navigator, 'clipboard');
    const originalShare = Object.getOwnPropertyDescriptor(navigator, 'share');
    const share = vi.fn().mockRejectedValue(new Error('share unavailable'));
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    try {
      const user = userEvent.setup();
      renderApp();
      await user.click(screen.getByTestId('button-word-i'));
      await user.click(screen.getByTestId('button-share-message'));

      await waitFor(() => expect(screen.getByTestId('status-feedback')).toHaveTextContent('Sharing was not available, so the message was copied'));
      expect(share).toHaveBeenCalledWith({ title: 'Clearvoice message', text: 'I' });
      expect(screen.getByTestId('text-composed-message')).toHaveTextContent('I');
    } finally {
      if (originalClipboard) Object.defineProperty(window.navigator, 'clipboard', originalClipboard);
      else Reflect.deleteProperty(window.navigator, 'clipboard');
      if (originalShare) Object.defineProperty(navigator, 'share', originalShare);
      else Reflect.deleteProperty(navigator, 'share');
    }
  });

  it('guards repeated speech activation while preserving repeated vocabulary selection', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByTestId('button-word-i'));
    vi.clearAllMocks();

    fireEvent.click(screen.getByTestId('button-speak-message'));
    fireEvent.click(screen.getByTestId('button-speak-message'));

    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('text-composed-message')).toHaveTextContent('I');
  });

  it('migrates the inherited legacy Text only default once', () => {
    const legacyPreferences = { ...DEFAULT_PREFERENCES, symbolDisplayMode: 'text-only' };
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(legacyPreferences));

    expect(readStoredPreferences().symbolDisplayMode).toBe('symbol-and-text');
    expect(window.localStorage.getItem(SYMBOL_DISPLAY_INITIALIZED_STORAGE_KEY)).toBe('1');

    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(legacyPreferences));
    expect(readStoredPreferences().symbolDisplayMode).toBe('text-only');
  });

  it('preserves a stored explicit Text only choice during migration', () => {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ ...DEFAULT_PREFERENCES, symbolDisplayMode: 'text-only' }));
    window.localStorage.setItem(SYMBOL_DISPLAY_EXPLICIT_CHOICE_STORAGE_KEY, '1');

    expect(readStoredPreferences().symbolDisplayMode).toBe('text-only');
    expect(window.localStorage.getItem(SYMBOL_DISPLAY_INITIALIZED_STORAGE_KEY)).toBe('1');
  });

  it('persists display modes with Symbol and text as the default', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(PERSONAL_VOCABULARY_STORAGE_KEY, JSON.stringify([personalItem({
      id: 'personal-no-symbol',
      displayText: 'No symbol fallback',
      category: 'core',
      section: 'Core',
      symbolAssetId: 'missing-bundled-symbol',
      symbolAssetLocation: 'symbols/clearvoice-starter.svg',
    })]));
    renderApp();
    await user.click(screen.getByTestId('button-open-settings'));

    expect(screen.getByTestId('input-symbol-display-symbol-and-text')).toBeChecked();
    await user.click(screen.getByTestId('input-symbol-display-symbol-dominant'));
    expect(JSON.parse(window.localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? '{}')).toMatchObject({ symbolDisplayMode: 'symbol-dominant' });
    await user.click(screen.getByRole('button', { name: 'Close Settings' }));

    const fallbackWord = screen.getByTestId('button-word-personal-no-symbol');
    expect(fallbackWord).toHaveClass('vocab-button');
    expect(fallbackWord).not.toHaveClass('symbol-symbol-dominant');
    expect(fallbackWord).not.toContainElement(screen.queryByTestId('symbol-personal-no-symbol'));
    expect(fallbackWord).toHaveAccessibleName('Personal item. Add No symbol fallback to message');
  });

  it('shows supported Core and Quick Phrase pictograms by default with complete labels', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(screen.getByTestId('button-word-good')).toHaveClass('symbol-symbol-and-text');
    expect(screen.getByTestId('symbol-good')).toBeInTheDocument();
    expect(screen.getByTestId('button-word-i')).toHaveClass('vocab-button');
    expect(screen.getByTestId('symbol-i')).toBeInTheDocument();
    expect(screen.getByTestId('button-word-i')).toHaveAccessibleName('Add I to message');

    await user.click(screen.getByTestId('button-category-quick-phrases'));
    const quickPhrase = screen.getByTestId('button-word-i-need-help');
    expect(quickPhrase).toHaveClass('symbol-symbol-and-text');
    expect(screen.getByTestId('symbol-i-need-help')).toBeInTheDocument();
    expect(quickPhrase).toHaveAccessibleName('Urgent communication. Add I need help to message');
  });

  it('preserves deliberate Text only and keeps it after reload', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByTestId('button-open-settings'));
    await user.click(screen.getByTestId('input-symbol-display-text-only'));
    expect(window.localStorage.getItem(SYMBOL_DISPLAY_EXPLICIT_CHOICE_STORAGE_KEY)).toBe('1');
    await user.click(screen.getByRole('button', { name: 'Close Settings' }));

    expect(screen.getByTestId('button-word-i')).not.toHaveClass('symbol-symbol-and-text');
    expect(screen.queryByTestId('symbol-i')).not.toBeInTheDocument();

    cleanup();
    renderApp();
    await user.click(screen.getByTestId('button-open-settings'));
    expect(screen.getByTestId('input-symbol-display-text-only')).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Close Settings' }));
    expect(screen.getByTestId('button-word-i')).not.toHaveClass('symbol-symbol-and-text');
    expect(screen.queryByTestId('symbol-i')).not.toBeInTheDocument();
  });

  it('falls back to default preferences when saved settings are corrupt', () => {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, '{not valid json');

    expect(readStoredPreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  it('recovers calmly when local storage reads are unavailable', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    expect(readStoredPreferences()).toEqual(DEFAULT_PREFERENCES);
    expect(readStoredPersonalVocabulary()).toMatchObject({
      items: [],
      recoveryMessage: expect.stringMatching(/could not be read/i),
    });
    expect(getItem).toHaveBeenCalled();
  });

  it('recovers from corrupt saved personal vocabulary without accepting broken symbols', () => {
    window.localStorage.setItem(PERSONAL_VOCABULARY_STORAGE_KEY, JSON.stringify([
      personalItem({ id: 'personal-valid-before-corruption', displayText: 'Valid word' }),
      {
        ...personalItem({ id: 'personal-broken-image', displayText: 'Broken image' }),
        symbolAssetId: 'broken-image',
        symbolAssetLocation: 'data:image/png;base64,AAAA',
      },
    ]));

    expect(readStoredPersonalVocabulary()).toMatchObject({
      items: [],
      recoveryMessage: expect.stringMatching(/could not be read/i),
    });
  });

  it('keeps visible symbols usable with high contrast and extra-large buttons', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByTestId('button-open-settings'));
    await user.click(screen.getByTestId('input-high-contrast'));
    await user.click(screen.getByLabelText('Extra-large'));
    await user.click(screen.getByRole('button', { name: 'Close Settings' }));

    const card = screen.getByTestId('button-word-good');
    expect(document.querySelector('.app-shell')).toHaveClass('high-contrast', 'button-extra-large');
    expect(card).toHaveClass('symbol-symbol-and-text');
    expect(screen.getByTestId('symbol-good')).toBeInTheDocument();
    expect(screen.getByText('good')).toBeInTheDocument();
  });

  it('renders safe local symbols without changing labels, positions, messages, or speech', async () => {
    const user = userEvent.setup();
    const symbolItem = symbolPersonalItem();
    window.localStorage.setItem(PERSONAL_VOCABULARY_STORAGE_KEY, JSON.stringify([symbolItem]));
    renderApp();

    expect(isLocalSymbolAssetLocation(symbolItem.symbolAssetLocation ?? '')).toBe(true);
    expect(getVocabularyForSection('Core', [symbolItem]).find((item) => item.id === symbolItem.id)?.position).toBe(1);

    await user.click(screen.getByTestId('button-open-settings'));
    await user.click(screen.getByTestId('input-symbol-display-symbol-and-text'));
    await user.click(screen.getByRole('button', { name: 'Close Settings' }));

    const card = screen.getByTestId('button-word-personal-symbol-word');
    const symbol = screen.getByTestId('symbol-personal-symbol-word');
    expect(card).toHaveClass('symbol-symbol-and-text');
    expect(card).toBeInstanceOf(HTMLButtonElement);
    expect(card).toHaveAccessibleName('Personal item. Add Symbol word to message');
    expect(symbol.tagName.toLowerCase()).toBe('svg');
    expect(symbol).toHaveAttribute('aria-hidden', 'true');
    expect(symbol.querySelector('use')).toHaveAttribute('href', 'symbols/clearvoice-starter.svg#control-search');
    expect(screen.getByText('Symbol word')).toBeInTheDocument();

    await user.click(card);
    expect(screen.getByTestId('text-composed-message')).toHaveTextContent('Symbol word');
    vi.clearAllMocks();
    await user.click(screen.getByTestId('button-speak-message'));
    expect(window.speechSynthesis.speak).toHaveBeenCalledWith(expect.objectContaining({ text: 'Spoken symbol word' }));

    await user.click(screen.getByTestId('button-open-settings'));
    await user.click(screen.getByTestId('input-symbol-display-symbol-dominant'));
    await user.click(screen.getByRole('button', { name: 'Close Settings' }));
    expect(screen.getByTestId('button-word-personal-symbol-word')).toHaveClass('symbol-symbol-dominant');
  });

  it('renders supported personal image data while keeping the text fallback visible and accessible', async () => {
    const user = userEvent.setup();
    const symbolItem = personalItem({
      id: 'personal-png-symbol',
      displayText: 'Picture word',
      spokenText: 'Spoken picture word',
      symbolAssetId: 'personal-picture',
      symbolAssetLocation: personalPngDataUrl,
    });
    window.localStorage.setItem(PERSONAL_VOCABULARY_STORAGE_KEY, JSON.stringify([symbolItem]));
    renderApp();

    const card = screen.getByTestId('button-word-personal-png-symbol');
    const symbol = screen.getByTestId('symbol-personal-png-symbol');
    expect(card).toHaveClass('symbol-symbol-and-text');
    expect(symbol.tagName.toLowerCase()).toBe('img');
    expect(symbol).toHaveAttribute('src', personalPngDataUrl);
    expect(symbol).toHaveAttribute('alt', '');
    expect(symbol).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Picture word')).toBeInTheDocument();
    expect(card).toHaveAccessibleName('Personal item. Add Picture word to message');

    await user.click(card);
    expect(screen.getByTestId('text-composed-message')).toHaveTextContent('Picture word');
  });

  it('keeps symbol cards responsive and falls back to text cards without assets', () => {
    const stylesheet = fs.readFileSync(path.resolve(import.meta.dirname, '../src/index.css'), 'utf8');
    expect(stylesheet).toContain('.vocabulary-grid {');
    expect(stylesheet).toContain('@media (min-width: 620px)');
    expect(stylesheet).toContain('@media (min-width: 900px)');
    expect(stylesheet).toContain('.vocab-button.symbol-symbol-dominant');
  });

  it('never stores composed messages or communication history', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByTestId('button-word-i'));
    await user.click(screen.getByTestId('button-word-need'));

    const localStorageValues = Object.entries(window.localStorage);
    expect(localStorageValues.some(([key, value]) => key.toLowerCase().includes('message') || value.includes('I need'))).toBe(false);
    expect(localStorageValues.some(([key]) => key.toLowerCase().includes('history'))).toBe(false);
  });
});

describe('expanded default vocabulary contract', () => {
  it('contains 45 unique append-only additions and 246 static items', () => {
    expect(vocabulary).toHaveLength(246);
    expect(new Set(vocabulary.map((item) => item.id)).size).toBe(246);

    const additions = vocabulary.filter((item) => expandedVocabularyIds.has(item.id));
    expect(expandedVocabularyIds).toHaveLength(45);
    expect(additions).toHaveLength(45);
    expect(additions.every((item) => item.source !== 'personal')).toBe(true);
    expect(additions.filter((item) => item.itemType === 'phrase')).toHaveLength(15);

    for (const item of additions) {
      expect(item.displayText).toBeTruthy();
      expect(item.spokenText).toBeTruthy();
      expect(item.searchKeywords.length).toBeGreaterThan(1);
      expect(Number.isFinite(item.position)).toBe(true);
      for (const keyword of item.searchKeywords) {
        expect(getSearchableText(item)).toContain(keyword.toLowerCase());
        expect(vocabulary.some((candidate) => getSearchableText(candidate).includes(keyword.toLowerCase()) && candidate.id === item.id)).toBe(true);
      }
    }
  });

  it('keeps every legacy default in its original order and position range', () => {
    for (const [category, legacyIds] of Object.entries(legacyVocabularyOrder)) {
      const section = category === 'Core' || category === 'Quick Phrases'
        ? getVocabularyForSection(category, [])
        : getVocabularyForTopic(category as TopicCategory, []);
      const legacyItems = section.filter((item) => !expandedVocabularyIds.has(item.id) && !phrasePackIds.has(item.id));
      expect(legacyItems.map((item) => item.id)).toEqual(legacyIds);
      expect(legacyItems.map((item) => item.position)).toEqual(legacyIds.map((_, index) => index + 1));
    }
  });

  it('keeps the expanded Core, More, and Spell counts', () => {
    expect(getVocabularyForSection('Core')).toHaveLength(29);
    expect(getVocabularyForSection('Quick Phrases')).toHaveLength(16);
    expect(getVocabularyForSection('More').filter((item) => item.itemType === 'category')).toHaveLength(9);
    expect(getVocabularyForSection('Spell')).toHaveLength(26);

    const topicCounts = {
      people: 18,
      food: 20,
      places: 19,
      activities: 18,
      home: 18,
      'school-work': 18,
      feelings: 18,
      'personal-items': 18,
      health: 19,
    } as const;
    for (const [topic, count] of Object.entries(topicCounts)) {
      expect(getVocabularyForTopic(topic as TopicCategory)).toHaveLength(count);
    }
  });

  it('keeps default entries before personal entries in expanded categories', () => {
    const people = getVocabularyForTopic('people', [personalItem({
      id: 'personal-people-entry',
      displayText: 'My person',
      category: 'people',
      section: 'More',
      position: 1,
    })]);
    expect(people.slice(0, 18).every((item) => item.source !== 'personal')).toBe(true);
    expect(people[people.length - 1]).toMatchObject({ id: 'personal-people-entry', source: 'personal' });

    const core = getVocabularyForSection('Core', [personalItem({ id: 'personal-core-entry', position: 1 })]);
    expect(core.slice(0, 29).every((item) => item.source !== 'personal')).toBe(true);
    expect(core[core.length - 1]).toMatchObject({ id: 'personal-core-entry', source: 'personal' });
  });
});

describe('structured conversational phrase packs', () => {
  it('contains exactly four reviewed phrases per More topic', () => {
    const phrasePackItems = vocabulary.filter((item) => phrasePackIds.has(item.id));
    expect(phrasePackIds).toHaveLength(36);
    expect(phrasePackItems).toHaveLength(36);
    expect(new Set(phrasePackItems.map((item) => item.id)).size).toBe(36);

    for (const [topic, expectedPhrases] of Object.entries(phrasePackByTopic)) {
      const topicPhrases = getVocabularyForTopic(topic as TopicCategory).filter((item) => phrasePackIds.has(item.id));
      expect(topicPhrases.map((item) => item.id)).toEqual(expectedPhrases.map((phrase) => phrase.id));
      for (const expected of expectedPhrases) {
        const phrase = topicPhrases.find((item) => item.id === expected.id);
        expect(phrase).toMatchObject({
          category: topic,
          section: 'More',
          itemType: 'phrase',
          displayText: expected.displayText,
          spokenText: expected.spokenText,
          position: expected.position,
        });
        expect(phrase?.displayText).toMatch(/[.!?]$/);
        expect(phrase?.spokenText).not.toMatch(/[’']/);
        expect(phrase?.searchKeywords.length).toBeGreaterThan(1);
        for (const keyword of phrase?.searchKeywords ?? []) {
          expect(vocabulary.some((candidate) => candidate.id === expected.id && getSearchableText(candidate).includes(keyword.toLowerCase()))).toBe(true);
        }
      }
    }
  });

  it('adds every phrase as one message segment without changing review-before-speaking', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByTestId('button-category-more'));

    let segmentCount = 0;
    for (const [topicIndex, [topic, phrases]] of Object.entries(phrasePackByTopic).entries()) {
      await user.click(screen.getByTestId(`button-word-${topic}`));
      for (const phrase of phrases) {
        await user.click(screen.getByTestId(`button-word-${phrase.id}`));
        segmentCount += 1;
        expect(screen.getByTestId('text-composed-message').querySelectorAll('.message-token')).toHaveLength(segmentCount);
      }
      if (topicIndex < Object.keys(phrasePackByTopic).length - 1) {
        await user.click(screen.getByTestId('button-back-to-more-categories'));
      }
    }

    expect(segmentCount).toBe(36);
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
  });

  it('keeps phrase-pack defaults compatible with local export and personal ordering', () => {
    const personal = personalItem({
      id: 'personal-health-phrase',
      displayText: 'My care phrase',
      spokenText: 'My care phrase',
      category: 'health',
      section: 'More',
      itemType: 'phrase',
      position: 1,
    });
    const imported = parseLocalDataExport(makeLocalDataExport(DEFAULT_PREFERENCES, [personal]));
    const health = getVocabularyForTopic('health', imported.personalVocabulary);
    expect(health.slice(0, 19).every((item) => item.source !== 'personal')).toBe(true);
    expect(health[health.length - 1]).toMatchObject({ id: 'personal-health-phrase', source: 'personal' });
    expect(imported.personalVocabulary).toHaveLength(1);
  });
});

describe('local data validation and recovery', () => {
  const exportText = (personalVocabulary: PersonalVocabularyItem[] = [personalItem()]) => makeLocalDataExport(DEFAULT_PREFERENCES, personalVocabulary);

  it('round trips valid exports and normalizes personal positions without touching defaults', () => {
    const imported = parseLocalDataExport(exportText([
      personalItem({ id: 'personal-late', displayText: 'Late', position: 9000 }),
      personalItem({ id: 'personal-early', displayText: 'Early', position: 2 }),
    ]));
    expect(imported.personalVocabulary.map((item) => item.position)).toEqual([2, 1]);
    const core = getVocabularyForSection('Core', imported.personalVocabulary);
    expect(core.slice(-2).map((item) => item.id)).toEqual(['personal-early', 'personal-late']);
    expect(getVocabularyForTopic('people', imported.personalVocabulary).every((item) => item.source !== 'personal')).toBe(true);
  });

  it('preserves custom spoken text and defaults missing legacy speech behavior safely', () => {
    const parsed = JSON.parse(exportText([personalItem({
      id: 'personal-pronunciation',
      displayText: 'Display word',
      spokenText: 'Spoken pronunciation',
    })]));
    delete parsed.preferences.speechBehavior;
    delete parsed.preferences.symbolDisplayMode;
    const imported = parseLocalDataExport(JSON.stringify(parsed));
    expect(imported.preferences.speechBehavior).toBe('review-first');
    expect(imported.preferences.symbolDisplayMode).toBe('symbol-and-text');
    expect(imported.personalVocabulary[0]).toMatchObject({
      displayText: 'Display word',
      spokenText: 'Spoken pronunciation',
    });
  });

  it('preserves optional symbol metadata through local export and import', () => {
    const imported = parseLocalDataExport(exportText([symbolPersonalItem()]));
    expect(imported.personalVocabulary[0]).toMatchObject({
      symbolAssetId: 'control-search',
      symbolAssetLocation: 'symbols/clearvoice-starter.svg',
      symbolDescription: 'A local demonstration symbol',
      symbolSource: 'Local demo collection',
      symbolCreator: 'Clearvoice demo',
      symbolLicenseId: 'demo-license',
      symbolLicenseUrl: 'https://example.test/licenses/demo',
    });
  });

  it('round trips a supported personal PNG symbol and keeps the local size limits bounded', () => {
    const item = personalItem({
      id: 'personal-png-symbol',
      displayText: 'Picture word',
      symbolAssetId: 'personal-picture',
      symbolAssetLocation: personalPngDataUrl,
      symbolDescription: 'A local PNG picture',
    });
    expect(isSupportedPersonalSymbolDataUrl(personalPngDataUrl)).toBe(true);
    const exported = makeLocalDataExport(DEFAULT_PREFERENCES, [item]);
    const imported = parseLocalDataExport(exported);

    expect(imported.personalVocabulary[0]).toMatchObject({
      id: 'personal-png-symbol',
      symbolAssetId: 'personal-picture',
      symbolAssetLocation: personalPngDataUrl,
    });
    expect(new TextEncoder().encode(JSON.stringify(imported.personalVocabulary)).byteLength).toBeLessThanOrEqual(MAX_PERSONAL_VOCABULARY_BYTES);
    expect(personalPngDataUrl.length).toBeLessThan(MAX_PERSONAL_SYMBOL_BYTES * 2);
  });

  it.each([
    ['malformed JSON', '{'],
    ['unsupported version', exportText().replace(`"version": ${LOCAL_DATA_VERSION}`, '"version": 999')],
    ['invalid preference', exportText().replace('"speechRate": 0.95', '"speechRate": 9')],
    ['invalid speech behavior', exportText().replace('"speechBehavior": "review-first"', '"speechBehavior": "automatic"')],
    ['invalid symbol display mode', exportText().replace('"symbolDisplayMode": "symbol-and-text"', '"symbolDisplayMode": "automatic"')],
    ['unsafe markup', exportText().replace('Test word', '<strong>unsafe</strong>')],
    ['executable URI scheme', exportText().replace('Test word', 'javascript:alert(1)')],
  ])('rejects %s imports', (_label, value) => {
    expect(() => parseLocalDataExport(value)).toThrow();
  });

  it('rejects oversized imports by encoded byte size', () => {
    expect(() => parseLocalDataExport('x'.repeat(256 * 1024 + 1))).toThrow(/too large/i);
  });

  it('rejects structurally invalid personal records', () => {
    const parsed = JSON.parse(exportText());
    parsed.personalVocabulary[0].unsupported = true;
    expect(() => parseLocalDataExport(JSON.stringify(parsed))).toThrow(/unsupported fields/i);
  });

  it('rejects remote symbol assets while allowing license URLs as metadata', () => {
    const parsed = JSON.parse(exportText([symbolPersonalItem()]));
    parsed.personalVocabulary[0].symbolAssetLocation = 'https://example.test/symbol.svg';
    expect(() => parseLocalDataExport(JSON.stringify(parsed))).toThrow(/symbol asset location/i);
  });

  it.each([
    ['SVG data URLs', 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='],
    ['bad PNG bytes', 'data:image/png;base64,AAAA'],
    ['malformed image data', 'data:image/png;base64,not-base64!'],
  ])('rejects %s personal symbols', (_label, symbolAssetLocation) => {
    const parsed = JSON.parse(exportText());
    parsed.personalVocabulary[0].symbolAssetId = 'invalid-symbol';
    parsed.personalVocabulary[0].symbolAssetLocation = symbolAssetLocation;
    expect(isSupportedPersonalSymbolDataUrl(symbolAssetLocation)).toBe(false);
    expect(() => parseLocalDataExport(JSON.stringify(parsed))).toThrow(/symbol|malformed|unsupported/i);
  });

  it('rejects incomplete symbol metadata and oversized personal symbol data', () => {
    const incomplete = JSON.parse(exportText());
    incomplete.personalVocabulary[0].symbolAssetId = 'only-an-id';
    expect(() => parseLocalDataExport(JSON.stringify(incomplete))).toThrow(/incomplete|symbol/i);

    const oversizedDataUrl = `data:image/png;base64,${personalPngDataUrl.split(',')[1].slice(0, 12)}${'A'.repeat(65540 - 12)}`;
    const oversized = JSON.parse(exportText());
    oversized.personalVocabulary[0].symbolAssetId = 'oversized-symbol';
    oversized.personalVocabulary[0].symbolAssetLocation = oversizedDataUrl;
    expect(() => parseLocalDataExport(JSON.stringify(oversized))).toThrow(/symbol|malformed|large/i);
  });

  it('rejects personal vocabulary that would exceed the bounded local storage budget', () => {
    const largePayload = `data:image/png;base64,${personalPngDataUrl.split(',')[1].slice(0, 12)}${'A'.repeat(64000 - 12)}`;
    const items = Array.from({ length: 5 }, (_, index) => personalItem({
      id: `personal-large-${index + 1}`,
      displayText: `Large ${index + 1}`,
      symbolAssetId: `large-symbol-${index + 1}`,
      symbolAssetLocation: largePayload,
    }));
    expect(() => validatePersonalVocabulary(items)).toThrow(/192 KB|limited/i);
  });

  it('rejects duplicate personal IDs after an otherwise valid export is altered', () => {
    const parsed = JSON.parse(exportText([
      personalItem(),
      personalItem({ id: 'personal-other-word', displayText: 'Other' }),
    ]));
    parsed.personalVocabulary[1].id = parsed.personalVocabulary[0].id;
    expect(() => parseLocalDataExport(JSON.stringify(parsed))).toThrow(/duplicate|invalid ID/i);
  });

  it('rejects out-of-range positions after an otherwise valid export is altered', () => {
    const parsed = JSON.parse(exportText());
    parsed.personalVocabulary[0].position = 10001;
    expect(() => parseLocalDataExport(JSON.stringify(parsed))).toThrow(/metadata|position/i);
  });
});

describe('starter symbol coverage and offline delivery', () => {
  it('covers Core, Quick Phrases, urgent communication, and distinct essential symbols', () => {
    const essentialIds = ['places-bathroom', 'home-bathroom', 'school-work-break'];
    const requiredItems = [
      ...getVocabularyForSection('Core'),
      ...getVocabularyForSection('Quick Phrases'),
      ...vocabulary.filter((item) => item.isUrgent),
      ...essentialIds.map((id) => vocabulary.find((item) => item.id === id)).filter((item): item is typeof vocabulary[number] => Boolean(item)),
    ].filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)
      .filter((item) => !CORE_INTENTIONAL_TEXT_FALLBACK_IDS.includes(item.id as typeof CORE_INTENTIONAL_TEXT_FALLBACK_IDS[number]))
      .filter((item) => !QUICK_PHRASE_INTENTIONAL_TEXT_FALLBACK_IDS.includes(item.id as typeof QUICK_PHRASE_INTENTIONAL_TEXT_FALLBACK_IDS[number]));

    expect(requiredItems.length).toBe(52);
    expect(new Set(requiredItems.map((item) => item.id)).size).toBe(requiredItems.length);
    requiredItems.forEach((item) => {
      expect(item.symbolAssetId, `${item.id} needs a symbol asset ID`).toBeTruthy();
      expect(isBundledStarterSymbol(item)).toBe(true);
      expect(item.symbolDescription).toBeTruthy();
      const mulberryItem = MULBERRY_SYMBOL_INVENTORY.find((candidate) => candidate.vocabularyIds.includes(item.id));
      if (mulberryItem) {
        expect(item.symbolAssetId).toBe(mulberryItem.label);
        expect(item.symbolAssetLocation).toBe(`symbols/${mulberryItem.fileName}`);
        expect(item.symbolSource).toBe(MULBERRY_SYMBOL_SOURCE);
        expect(item.symbolCreator).toBe('Steve Lee');
        expect(item.symbolLicenseId).toBe(MULBERRY_SYMBOL_LICENSE_ID);
        expect(item.symbolLicenseUrl).toBe(MULBERRY_SYMBOL_LICENSE_URL);
      } else {
        expect(item.symbolAssetLocation).toBe(STARTER_SYMBOL_ASSET_LOCATION);
        expect(item.symbolSource).toBe('Original Clearvoice starter pictograms');
        expect(item.symbolCreator).toBe('Clearvoice project');
        expect(item.symbolLicenseId).toBe('Clearvoice-Original-1.0');
      }
    });

    expect(starterSymbolMetadata.stop).toMatchObject({ symbolAssetId: 'core-stop' });
    expect(starterSymbolMetadata.again).toMatchObject({ symbolAssetId: 'core-again' });
    expect(starterSymbolMetadata.help.symbolAssetId).not.toBe(starterSymbolMetadata.want.symbolAssetId);
    expect(starterSymbolMetadata.yes.symbolAssetId).not.toBe(starterSymbolMetadata.no.symbolAssetId);
    expect(starterSymbolMetadata['i-need-a-break'].symbolAssetId).not.toBe(starterSymbolMetadata['health-hurt'].symbolAssetId);
  });

  it('maps the five Core response and quality concepts to distinct local pictograms', () => {
    const sprite = fs.readFileSync(path.resolve(import.meta.dirname, '../public/symbols/clearvoice-starter.svg'), 'utf8');
    const responseIds = ['good', 'yes', 'help', 'bad', 'no'];
    const responseAssets = responseIds.map((id) => starterSymbolMetadata[id]);
    expect(new Set(responseAssets.map((item) => `${item.symbolAssetLocation}#${item.symbolAssetId}`)).size).toBe(responseIds.length);
    expect(starterSymbolMetadata.yes).toMatchObject({
      symbolAssetId: MULBERRY_YES_SYMBOL_ASSET_ID,
      symbolAssetLocation: MULBERRY_YES_SYMBOL_ASSET_LOCATION,
    });
    expect(CORE_INTENTIONAL_TEXT_FALLBACK_IDS).not.toContain('can');
    expect(fs.existsSync(path.resolve(import.meta.dirname, '../public', MULBERRY_YES_SYMBOL_ASSET_LOCATION))).toBe(true);
  });

  it('keeps symbol assets local, attributed, and cached for offline use', () => {
    const sprite = fs.readFileSync(path.resolve(import.meta.dirname, '../public/symbols/clearvoice-starter.svg'), 'utf8');
    const manifest = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../public/symbols/attribution.json'), 'utf8'));
    const serviceWorker = fs.readFileSync(path.resolve(import.meta.dirname, '../public/sw.js'), 'utf8');

    expect(manifest.source).toBe('Original Clearvoice starter pictograms');
    expect(manifest.creator).toBe('Clearvoice project');
    expect(manifest.license).toBe('Clearvoice-Original-1.0');
    expect(manifest.assetLocation).toBe(STARTER_SYMBOL_ASSET_LOCATION);
    expect(manifest.affectedVocabularyIds).toContain('health-hurt');
    expect(manifest.affectedVocabularyIds).not.toContain('places-bathroom');
    expect(manifest.affectedControlIds).toEqual(Object.values(controlSymbolMetadata).map((item) => item.symbolAssetId));
    expect(serviceWorker).toContain(`'${STARTER_SYMBOL_ASSET_LOCATION}'`);
    expect(manifest.thirdPartyAssets).toHaveLength(MULBERRY_SYMBOL_INVENTORY.length);
    MULBERRY_SYMBOL_INVENTORY.forEach((item) => {
      const assetLocation = `symbols/${item.fileName}`;
      const mulberryAttribution = manifest.thirdPartyAssets.find((asset: { assetId: string }) => asset.assetId === item.label);
      expect(fs.existsSync(path.resolve(import.meta.dirname, '../public', assetLocation)), `${item.fileName} should be bundled`).toBe(true);
      expect(serviceWorker).toContain(`'${assetLocation}'`);
      expect(mulberryAttribution).toMatchObject({
        assetLocation,
        mulberryLabel: item.label,
        creator: item.modified ? 'Clearvoice project' : 'Steve Lee',
        source: MULBERRY_SYMBOL_SOURCE,
        license: MULBERRY_SYMBOL_LICENSE_ID,
        licenseUrl: MULBERRY_SYMBOL_LICENSE_URL,
        modified: item.modified ?? false,
        affectedVocabularyIds: item.vocabularyIds,
      });
      if (item.modified) {
        expect(mulberryAttribution).toMatchObject({
          sourceCreator: 'Steve Lee',
          sourceAssets: item.sourceAssets?.map((asset) => `symbols/${asset}.svg`),
        });
      }
    });
    expect(sprite).not.toMatch(/(?:src|href)=["']https?:\/\//);

    [...Object.values(starterSymbolMetadata), ...Object.values(controlSymbolMetadata)].forEach((item) => {
      if (item.symbolAssetLocation === STARTER_SYMBOL_ASSET_LOCATION) {
        expect(sprite).toContain(`id="${item.symbolAssetId}"`);
      } else {
        expect(fs.existsSync(path.resolve(import.meta.dirname, '../public', item.symbolAssetLocation ?? ''))).toBe(true);
      }
    });
  });

  it('classifies every default item and verifies the complete symbol asset matrix', () => {
    const originalUrgentIds = new Set(['health-hurt', 'health-pain', 'health-i-need-care', 'health-it-hurts-here']);
    const mulberryByVocabularyId = new Map(
      MULBERRY_SYMBOL_INVENTORY.flatMap((asset) => asset.vocabularyIds.map((id) => [id, asset] as const)),
    );
    const mappedItems = vocabulary.filter((item) => item.symbolAssetId);
    const originalUrgentItems = vocabulary.filter((item) => originalUrgentIds.has(item.id));
    const mulberryItems = mappedItems.filter((item) => mulberryByVocabularyId.has(item.id));
    const directMulberryItems = mulberryItems.filter((item) => !mulberryByVocabularyId.get(item.id)?.modified);
    const derivedMulberryItems = mulberryItems.filter((item) => mulberryByVocabularyId.get(item.id)?.modified);
    const clearvoiceFallbackItems = mappedItems.filter((item) => (
      item.symbolAssetLocation === STARTER_SYMBOL_ASSET_LOCATION && !originalUrgentIds.has(item.id)
    ));
    const textFallbackItems = vocabulary.filter((item) => !item.symbolAssetId);
    const publicSymbolFiles = new Set(
      fs.readdirSync(path.resolve(import.meta.dirname, '../public/symbols'))
        .filter((fileName) => fileName.endsWith('.svg'))
        .map((fileName) => `symbols/${fileName}`),
    );
    const expectedPublicSymbolFiles = new Set([
      STARTER_SYMBOL_ASSET_LOCATION,
      ...MULBERRY_SYMBOL_INVENTORY.map((asset) => `symbols/${asset.fileName}`),
    ]);

    expect(vocabulary).toHaveLength(246);
    expect(new Set(vocabulary.map((item) => item.id)).size).toBe(246);
    expect(mappedItems).toHaveLength(220);
    expect(originalUrgentItems).toHaveLength(4);
    expect(mulberryItems).toHaveLength(189);
    expect(directMulberryItems).toHaveLength(111);
    expect(derivedMulberryItems).toHaveLength(78);
    expect(clearvoiceFallbackItems).toHaveLength(27);
    expect(textFallbackItems).toHaveLength(26);
    expect(vocabulary.filter((item) => item.itemType !== 'letter' && !item.symbolAssetId)).toHaveLength(0);
    expect(publicSymbolFiles).toEqual(expectedPublicSymbolFiles);

    vocabulary.forEach((item) => {
      if (item.itemType === 'letter') {
        expect(item.symbolAssetId, `${item.id} Spell letters must remain text-only`).toBeUndefined();
        expect(item.symbolAssetLocation).toBeUndefined();
        return;
      }

      if (originalUrgentIds.has(item.id)) {
        expect(item.isUrgent).toBe(true);
        expect(item.symbolAssetLocation).toBe(STARTER_SYMBOL_ASSET_LOCATION);
        expect(isBundledStarterSymbol(item)).toBe(true);
        return;
      }

      if (!item.symbolAssetId) {
        expect(item.symbolAssetLocation).toBeUndefined();
        return;
      }

      const asset = mulberryByVocabularyId.get(item.id);
      if (asset) {
        expect(item.symbolAssetId).toBe(asset.label);
        expect(item.symbolAssetLocation).toBe(`symbols/${asset.fileName}`);
        expect(item.symbolSource).toBe(MULBERRY_SYMBOL_SOURCE);
        expect(item.symbolCreator).toBe('Steve Lee');
        expect(item.symbolLicenseId).toBe(MULBERRY_SYMBOL_LICENSE_ID);
        expect(item.symbolLicenseUrl).toBe(MULBERRY_SYMBOL_LICENSE_URL);
      } else {
        expect(item.symbolAssetLocation).toBe(STARTER_SYMBOL_ASSET_LOCATION);
        expect(item.symbolSource).toBe('Original Clearvoice starter pictograms');
        expect(item.symbolCreator).toBe('Clearvoice project');
        expect(item.symbolLicenseId).toBe('Clearvoice-Original-1.0');
      }
      expect(isBundledStarterSymbol(item)).toBe(true);
    });
  });

  it('keeps accessible names stable for all default vocabulary cards', async () => {
    const user = userEvent.setup();
    renderApp();

    const expectLabels = (items: typeof vocabulary) => {
      items.forEach((item) => {
        const expectedName = item.itemType === 'category'
          ? `Open ${item.displayText} vocabulary`
          : `${item.isUrgent ? 'Urgent communication. ' : ''}Add ${item.displayText} to message`;
        expect(screen.getByTestId(`button-word-${item.id}`)).toHaveAccessibleName(expectedName);
      });
    };

    expectLabels(getVocabularyForSection('Core'));
    await user.click(screen.getByTestId('button-category-quick-phrases'));
    expectLabels(getVocabularyForSection('Quick Phrases'));
    await user.click(screen.getByTestId('button-category-more'));

    const moreCategories = getVocabularyForSection('More').filter((item) => item.itemType === 'category');
    expectLabels(moreCategories);
    for (const category of moreCategories) {
      await user.click(screen.getByTestId(`button-word-${category.id}`));
      expectLabels(getVocabularyForTopic(category.category));
      await user.click(screen.getByTestId('button-back-to-more-categories'));
    }

    await user.click(screen.getByTestId('button-category-spell'));
    expectLabels(getVocabularyForSection('Spell'));
  });

  it('maps Food, Places, Activities, and Home matches while preserving remaining text fallbacks', () => {
    const mappedIds = [
      'food-water', 'food-drink', 'food-breakfast', 'food-lunch', 'food-dinner',
      'food-more-please', 'food-hungry', 'food-thirsty', 'food-hot', 'food-cold', 'food-eat', 'food-taste',
      'food-all-done', 'food-i-am-full',
      'places-home', 'places-school', 'places-bathroom', 'places-outside', 'places-room', 'places-store', 'places-near', 'places-inside',
      'activities-play', 'activities-read', 'activities-watch', 'activities-music', 'activities-draw',
      'activities-walk', 'activities-rest', 'activities-go-outside', 'activities-wait', 'activities-finish',
      'activities-listen', 'activities-my-turn', 'activities-start', 'activities-i-want-to-join',
      'activities-i-need-more-time', 'activities-i-want-to-do-something-else',
      'activities-what-should-we-do', 'activities-can-we-do-this-later',
      'home-bed', 'home-bathroom', 'home-door', 'home-light', 'home-tv', 'home-clothes',
      'home-blanket', 'home-open', 'home-close', 'home-chair', 'home-window',
      'home-clean',
      'home-turn-it-on', 'home-please-turn-it-off',
      'food-snack', 'food-that-one-please', 'food-can-i-have-this', 'food-please-help-me-choose',
      'food-this-is-not-what-i-want', 'food-i-am-still-hungry',
      'places-work', 'places-park', 'places-here', 'places-there', 'places-where-next',
      'places-far', 'places-take-me-there', 'places-where-are-we-going',
      'places-i-want-to-go-home', 'places-please-help-me-find-it', 'places-is-it-close',
      'home-kitchen', 'home-i-want-to-sit-here', 'home-can-you-help-me-with-this', 'home-i-want-it-here',
    ];
    const fallbackIds: string[] = [];
    const expectedFoodAssets = {
      'food-all-done': ['finish', 'symbols/finish.svg'],
      'food-i-am-full': ['full', 'symbols/full.svg'],
      'food-snack': ['wave3-food-snack', 'symbols/wave3-food-snack.svg'],
      'food-that-one-please': ['wave3-food-that-one', 'symbols/wave3-food-that-one.svg'],
      'food-can-i-have-this': ['wave3-food-can-have', 'symbols/wave3-food-can-have.svg'],
      'food-please-help-me-choose': ['wave3-food-help-choose', 'symbols/wave3-food-help-choose.svg'],
      'food-this-is-not-what-i-want': ['wave3-food-not-want', 'symbols/wave3-food-not-want.svg'],
      'food-i-am-still-hungry': ['wave3-food-still-hungry', 'symbols/wave3-food-still-hungry.svg'],
    } as const;
    const expectedPlacesAssets = {
      'places-inside': ['inside_room', 'symbols/inside_room.svg'],
      'places-work': ['wave3-places-work', 'symbols/wave3-places-work.svg'],
      'places-park': ['wave3-places-park', 'symbols/wave3-places-park.svg'],
      'places-here': ['wave3-places-here', 'symbols/wave3-places-here.svg'],
      'places-there': ['wave3-places-there', 'symbols/wave3-places-there.svg'],
      'places-where-next': ['wave3-places-where-next', 'symbols/wave3-places-where-next.svg'],
      'places-far': ['wave3-places-far', 'symbols/wave3-places-far.svg'],
      'places-take-me-there': ['wave3-places-take-there', 'symbols/wave3-places-take-there.svg'],
      'places-where-are-we-going': ['wave3-places-where-going', 'symbols/wave3-places-where-going.svg'],
      'places-i-want-to-go-home': ['wave3-places-go-home', 'symbols/wave3-places-go-home.svg'],
      'places-please-help-me-find-it': ['wave3-places-find', 'symbols/wave3-places-find.svg'],
      'places-is-it-close': ['wave3-places-close', 'symbols/wave3-places-close.svg'],
    } as const;
    const expectedActivityAssets = {
      'activities-play': ['play_,_to', 'symbols/play_,_to.svg'],
      'activities-read': ['read_,_to', 'symbols/read_,_to.svg'],
      'activities-watch': ['watch_,_to', 'symbols/watch_,_to.svg'],
      'activities-music': ['music', 'symbols/music.svg'],
      'activities-draw': ['draw_,_to', 'symbols/draw_,_to.svg'],
      'activities-walk': ['walk_,_to', 'symbols/walk_,_to.svg'],
      'activities-rest': ['rest_,_to', 'symbols/rest_,_to.svg'],
      'activities-go-outside': ['go_outside_,_to', 'symbols/go_outside_,_to.svg'],
      'activities-wait': ['wait_,_to', 'symbols/wait_,_to.svg'],
      'activities-finish': ['finish', 'symbols/finish.svg'],
      'activities-listen': ['wave2-activities-listen', 'symbols/wave2-activities-listen.svg'],
      'activities-my-turn': ['wave2-people-my-turn', 'symbols/wave2-people-my-turn.svg'],
      'activities-start': ['wave2-activities-start', 'symbols/wave2-activities-start.svg'],
      'activities-i-want-to-join': ['wave2-activities-join', 'symbols/wave2-activities-join.svg'],
      'activities-i-need-more-time': ['wave2-activities-more-time', 'symbols/wave2-activities-more-time.svg'],
      'activities-i-want-to-do-something-else': ['wave2-activities-else', 'symbols/wave2-activities-else.svg'],
      'activities-what-should-we-do': ['wave2-activities-what-do', 'symbols/wave2-activities-what-do.svg'],
      'activities-can-we-do-this-later': ['wave2-activities-later', 'symbols/wave2-activities-later.svg'],
    } as const;
    const expectedHomeAssets = {
      'home-clean': ['clean_room', 'symbols/clean_room.svg'],
      'home-kitchen': ['wave3-home-kitchen', 'symbols/wave3-home-kitchen.svg'],
      'home-i-want-to-sit-here': ['wave3-home-sit-here', 'symbols/wave3-home-sit-here.svg'],
      'home-can-you-help-me-with-this': ['wave3-home-help-this', 'symbols/wave3-home-help-this.svg'],
      'home-i-want-it-here': ['wave3-home-want-here', 'symbols/wave3-home-want-here.svg'],
    } as const;

    mappedIds.forEach((id) => {
      const item = vocabulary.find((candidate) => candidate.id === id);
      expect(item, `${id} should remain in the vocabulary`).toBeTruthy();
      expect(item?.symbolAssetId, `${id} should have a mapped symbol`).toBeTruthy();
      expect(isBundledStarterSymbol(item ?? {})).toBe(true);
    });
    Object.entries(expectedFoodAssets).forEach(([id, [assetId, assetLocation]]) => {
      const item = vocabulary.find((candidate) => candidate.id === id);
      expect([item?.symbolAssetId, item?.symbolAssetLocation]).toEqual([assetId, assetLocation]);
      expect(item?.symbolSource).toBe(MULBERRY_SYMBOL_SOURCE);
    });
    Object.entries(expectedPlacesAssets).forEach(([id, [assetId, assetLocation]]) => {
      const item = vocabulary.find((candidate) => candidate.id === id);
      expect([item?.symbolAssetId, item?.symbolAssetLocation]).toEqual([assetId, assetLocation]);
      expect(item?.symbolSource).toBe(MULBERRY_SYMBOL_SOURCE);
    });
    Object.entries(expectedActivityAssets).forEach(([id, [assetId, assetLocation]]) => {
      const item = vocabulary.find((candidate) => candidate.id === id);
      expect([item?.symbolAssetId, item?.symbolAssetLocation]).toEqual([assetId, assetLocation]);
      expect(item?.symbolSource).toBe(MULBERRY_SYMBOL_SOURCE);
    });
    Object.entries(expectedHomeAssets).forEach(([id, [assetId, assetLocation]]) => {
      const item = vocabulary.find((candidate) => candidate.id === id);
      expect([item?.symbolAssetId, item?.symbolAssetLocation]).toEqual([assetId, assetLocation]);
      expect(item?.symbolSource).toBe(MULBERRY_SYMBOL_SOURCE);
    });
    fallbackIds.forEach((id) => {
      const item = vocabulary.find((candidate) => candidate.id === id);
      expect(item, `${id} should remain in the vocabulary`).toBeTruthy();
      expect(item?.symbolAssetId, `${id} should preserve text fallback behavior`).toBeUndefined();
      expect(item?.symbolAssetLocation).toBeUndefined();
    });
  });

  it('maps More navigation categories to official symbols without changing accessible names', async () => {
    const user = userEvent.setup();
    const expected = [
      ['people', 'People', 'family', 'symbols/family.svg'],
      ['food', 'Food', 'food', 'symbols/food.svg'],
      ['places', 'Places', 'outside', 'symbols/outside.svg'],
      ['activities', 'Activities', 'play_,_to', 'symbols/play_,_to.svg'],
      ['home', 'Home', 'house', 'symbols/house.svg'],
      ['school-work', 'School or work', 'school', 'symbols/school.svg'],
      ['feelings', 'Feelings', 'face_neutral_3', 'symbols/face_neutral_3.svg'],
      ['personal-items', 'Personal items', 'hand_bag', 'symbols/hand_bag.svg'],
      ['health', 'Health', 'healthy', 'symbols/healthy.svg'],
    ] as const;

    const categories = getVocabularyForSection('More').filter((item) => item.itemType === 'category');
    expect(categories.map((item) => [item.id, item.displayText])).toEqual(expected.map(([id, label]) => [id, label]));

    expected.forEach(([id, label, assetId, assetLocation]) => {
      const item = categories.find((candidate) => candidate.id === id);
      expect(item?.symbolAssetId).toBe(assetId);
      expect(item?.symbolAssetLocation).toBe(assetLocation);
      expect(item?.symbolSource).toBe(MULBERRY_SYMBOL_SOURCE);
      expect(isBundledStarterSymbol(item ?? {})).toBe(true);
    });

    renderApp();
    await user.click(screen.getByRole('tab', { name: /More: Topic categories/ }));
    expected.forEach(([id, label]) => {
      const button = screen.getByTestId(`button-word-${id}`);
      expect(button).toHaveAccessibleName(`Open ${label} vocabulary`);
      expect(button).not.toHaveAccessibleName(/\.svg/i);
    });
  });

  it('maps all People targets with direct or derived local symbols', () => {
    const mappedIds = ['people-family', 'people-hello', 'people-please-wait'];
    const expectedAssets = {
      'people-family': ['family_2', 'symbols/family_2.svg'],
      'people-hello': ['hello', 'symbols/hello.svg'],
      'people-please-wait': ['wait_,_to', 'symbols/wait_,_to.svg'],
      'people-parent': ['wave2-people-parent', 'symbols/wave2-people-parent.svg'],
      'people-friend': ['wave2-people-friend', 'symbols/wave2-people-friend.svg'],
      'people-teacher': ['wave2-people-teacher', 'symbols/wave2-people-teacher.svg'],
      'people-doctor': ['wave2-people-medical-role', 'symbols/wave2-people-medical-role.svg'],
      'people-nurse': ['wave2-people-medical-role', 'symbols/wave2-people-medical-role.svg'],
      'people-someone': ['wave2-people-someone', 'symbols/wave2-people-someone.svg'],
      'people-my-turn': ['wave2-people-my-turn', 'symbols/wave2-people-my-turn.svg'],
      'people-with-me': ['wave2-people-come-with-me', 'symbols/wave2-people-come-with-me.svg'],
      'people-sibling': ['wave2-people-sibling', 'symbols/wave2-people-sibling.svg'],
      'people-neighbor': ['wave2-people-neighbor', 'symbols/wave2-people-neighbor.svg'],
      'people-i-want-to-see-someone': ['wave2-people-see-someone', 'symbols/wave2-people-see-someone.svg'],
      'people-please-stay-with-me': ['wave2-people-stay-with-me', 'symbols/wave2-people-stay-with-me.svg'],
      'people-who-is-here': ['wave2-people-who-is-here', 'symbols/wave2-people-who-is-here.svg'],
      'people-nice-to-see-you': ['wave2-people-nice-to-see-you', 'symbols/wave2-people-nice-to-see-you.svg'],
    } as const;
    const allMappedIds = Object.keys(expectedAssets);

    allMappedIds.forEach((id) => {
      const item = vocabulary.find((candidate) => candidate.id === id);
      expect(item, `${id} should remain in the vocabulary`).toBeTruthy();
      expect([item?.symbolAssetId, item?.symbolAssetLocation]).toEqual(expectedAssets[id as keyof typeof expectedAssets]);
      expect(item?.symbolSource).toBe(MULBERRY_SYMBOL_SOURCE);
      expect(isBundledStarterSymbol(item ?? {})).toBe(true);
    });

    expect(getVocabularyForTopic('people').map((item) => item.id)).toEqual([
      'people-parent',
      'people-caregiver',
      'people-friend',
      'people-family',
      'people-teacher',
      'people-doctor',
      'people-nurse',
      'people-someone',
      'people-my-turn',
      'people-with-me',
      'people-sibling',
      'people-neighbor',
      'people-hello',
      'people-please-wait',
      'people-i-want-to-see-someone',
      'people-please-stay-with-me',
      'people-who-is-here',
      'people-nice-to-see-you',
    ]);
  });

  it('maps only direct Quick Phrase matches while preserving nuanced text fallbacks', () => {
    const mappedIds = [
      'yes-please', 'no-thank-you',
      'please-stop', 'i-dont-know', 'im-uncomfortable', 'not-that',
      'say-it-again', 'slower-please', 'i-am-hurt',
    ];
    const fallbackIds: string[] = [];
    const expectedAssets = {
      'yes-please': ['nod_,_to', 'symbols/nod_,_to.svg'],
      'no-thank-you': ['mistake_no_wrong', 'symbols/mistake_no_wrong.svg'],
    } as const;

    mappedIds.forEach((id) => {
      const item = vocabulary.find((candidate) => candidate.id === id);
      expect(item, `${id} should remain in the vocabulary`).toBeTruthy();
      if (id in expectedAssets) {
        expect(item?.symbolAssetId).toBe(expectedAssets[id as keyof typeof expectedAssets][0]);
        expect(item?.symbolAssetLocation).toBe(expectedAssets[id as keyof typeof expectedAssets][1]);
      } else {
        expect(item?.symbolAssetLocation).toBe(STARTER_SYMBOL_ASSET_LOCATION);
      }
      expect(isBundledStarterSymbol(item ?? {})).toBe(true);
    });

    fallbackIds.forEach((id) => {
      const item = vocabulary.find((candidate) => candidate.id === id);
      expect(item, `${id} should remain in the vocabulary`).toBeTruthy();
      expect(item?.symbolAssetId, `${id} should preserve text fallback behavior`).toBeUndefined();
      expect(item?.symbolAssetLocation).toBeUndefined();
    });
  });

  it('keeps the clear phrase aliases on their shared exact symbols', () => {
    const expected = {
      'food-more-please': ['more', 'symbols/more.svg'],
      'school-work-help-please': ['help_,_to', 'symbols/help_,_to.svg'],
    } as const;
    Object.entries(expected).forEach(([id, [assetId, assetLocation]]) => {
      const item = vocabulary.find((candidate) => candidate.id === id);
      expect(item, `${id} should remain in the vocabulary`).toBeTruthy();
      expect(item?.symbolAssetId).toBe(assetId);
      expect(item?.symbolAssetLocation).toBe(assetLocation);
      expect(isBundledStarterSymbol(item ?? {})).toBe(true);
    });
  });

  it('maps all School/work targets with direct or derived local symbols', () => {
    const expectedAssets = {
      'school-work-class': ['class_room', 'symbols/class_room.svg'],
      'school-work-computer': ['computer_1', 'symbols/computer_1.svg'],
      'school-work-paper': ['paper', 'symbols/paper.svg'],
      'school-work-finished': ['finish', 'symbols/finish.svg'],
      'school-work-desk': ['desk', 'symbols/desk.svg'],
      'school-work-write': ['write_,_to', 'symbols/write_,_to.svg'],
      'school-work-i-am-ready': ['ready', 'symbols/ready.svg'],
      'school-work-can-you-show-me': ['show_me_,_to', 'symbols/show_me_,_to.svg'],
      'school-work-teacher': ['wave2-people-teacher', 'symbols/wave2-people-teacher.svg'],
      'school-work-coworker': ['wave3-school-coworker', 'symbols/wave3-school-coworker.svg'],
      'school-work-meeting': ['wave3-school-meeting', 'symbols/wave3-school-meeting.svg'],
      'school-work-task': ['wave3-school-task', 'symbols/wave3-school-task.svg'],
      'school-work-read-this': ['wave3-school-read-this', 'symbols/wave3-school-read-this.svg'],
      'school-work-please-explain-that': ['wave3-school-explain', 'symbols/wave3-school-explain.svg'],
      'school-work-i-want-a-different-task': ['wave3-school-different-task', 'symbols/wave3-school-different-task.svg'],
      'school-work-what-comes-next': ['wave3-school-what-next', 'symbols/wave3-school-what-next.svg'],
    } as const;

    Object.entries(expectedAssets).forEach(([id, [assetId, assetLocation]]) => {
      const item = vocabulary.find((candidate) => candidate.id === id);
      expect(item, `${id} should remain in the vocabulary`).toBeTruthy();
      expect([item?.symbolAssetId, item?.symbolAssetLocation]).toEqual([assetId, assetLocation]);
      expect(item?.symbolSource).toBe(MULBERRY_SYMBOL_SOURCE);
      expect(isBundledStarterSymbol(item ?? {})).toBe(true);
    });

  });

  it('maps all Personal items targets with direct or derived local symbols', () => {
    const expectedAssets = {
      'personal-items-phone': ['mobile_phone', 'symbols/mobile_phone.svg'],
      'personal-items-glasses': ['glasses', 'symbols/glasses.svg'],
      'personal-items-bag': ['hand_bag', 'symbols/hand_bag.svg'],
      'personal-items-keys': ['key_2', 'symbols/key_2.svg'],
      'personal-items-toy': ['toys', 'symbols/toys.svg'],
      'personal-items-charger': ['charger_electric', 'symbols/charger_electric.svg'],
      'personal-items-headphones': ['headphones', 'symbols/headphones.svg'],
      'personal-items-wallet': ['wallet', 'symbols/wallet.svg'],
      'personal-items-tablet': ['wave3-personal-tablet', 'symbols/wave3-personal-tablet.svg'],
      'personal-items-shoes': ['wave3-personal-shoes', 'symbols/wave3-personal-shoes.svg'],
      'personal-items-book': ['wave3-personal-book', 'symbols/wave3-personal-book.svg'],
      'personal-items-my-things': ['wave3-personal-my-things', 'symbols/wave3-personal-my-things.svg'],
      'personal-items-i-need-this': ['wave3-personal-need-this', 'symbols/wave3-personal-need-this.svg'],
      'personal-items-please-bring-it': ['wave3-personal-bring', 'symbols/wave3-personal-bring.svg'],
      'personal-items-please-put-it-here': ['wave3-personal-put-here', 'symbols/wave3-personal-put-here.svg'],
      'personal-items-can-i-use-it': ['wave3-personal-use', 'symbols/wave3-personal-use.svg'],
      'personal-items-please-keep-it-nearby': ['wave3-personal-keep-nearby', 'symbols/wave3-personal-keep-nearby.svg'],
      'personal-items-which-one-is-mine': ['wave3-personal-which-mine', 'symbols/wave3-personal-which-mine.svg'],
    } as const;

    Object.entries(expectedAssets).forEach(([id, [assetId, assetLocation]]) => {
      const item = vocabulary.find((candidate) => candidate.id === id);
      expect(item, `${id} should remain in the vocabulary`).toBeTruthy();
      expect([item?.symbolAssetId, item?.symbolAssetLocation]).toEqual([assetId, assetLocation]);
      expect(item?.symbolSource).toBe(MULBERRY_SYMBOL_SOURCE);
      expect(isBundledStarterSymbol(item ?? {})).toBe(true);
    });

  });

  it('maps People and Body matches while preserving bundled urgent symbols', () => {
    const mappedIds = [
      'people-caregiver', 'people-family', 'people-hello', 'people-please-wait',
      'people-parent', 'people-friend', 'people-teacher', 'people-doctor', 'people-nurse',
      'people-someone', 'people-my-turn', 'people-with-me', 'people-sibling', 'people-neighbor',
      'people-i-want-to-see-someone', 'people-please-stay-with-me',
      'people-who-is-here', 'people-nice-to-see-you',
      'health-i-need-water',
    ];
    const bundledFallbackIds = ['health-hurt', 'health-pain', 'health-i-need-care', 'health-it-hurts-here'];
    const fallbackIds: string[] = [];
    const bundledHealthIds = [
      'health-sick', 'health-doctor', 'health-nurse', 'health-dizzy', 'health-fever',
      'health-please-be-gentle', 'health-i-feel-sick', 'health-please-check-this',
    ];

    [...mappedIds, ...bundledFallbackIds, ...bundledHealthIds, ...fallbackIds].forEach((id) => {
      expect(vocabulary.some((candidate) => candidate.id === id), `${id} should remain in the vocabulary`).toBe(true);
    });
    expect(new Set([...mappedIds, ...bundledFallbackIds, ...bundledHealthIds, ...fallbackIds]).size)
      .toBe(mappedIds.length + bundledFallbackIds.length + bundledHealthIds.length + fallbackIds.length);

    mappedIds.forEach((id) => {
      const item = vocabulary.find((candidate) => candidate.id === id);
      expect(item?.symbolAssetId, `${id} should have a mapped symbol`).toBeTruthy();
      expect(isBundledStarterSymbol(item ?? {})).toBe(true);
    });
    bundledFallbackIds.forEach((id) => {
      const item = vocabulary.find((candidate) => candidate.id === id);
      expect(item?.symbolAssetLocation).toBe(STARTER_SYMBOL_ASSET_LOCATION);
      expect(isBundledStarterSymbol(item ?? {})).toBe(true);
    });
    bundledHealthIds.forEach((id) => {
      const item = vocabulary.find((candidate) => candidate.id === id);
      expect(item?.symbolAssetLocation).toBe(STARTER_SYMBOL_ASSET_LOCATION);
      expect(isBundledStarterSymbol(item ?? {})).toBe(true);
    });
    fallbackIds.forEach((id) => {
      const item = vocabulary.find((candidate) => candidate.id === id);
      expect(item?.symbolAssetId, `${id} should preserve text fallback behavior`).toBeUndefined();
      expect(item?.symbolAssetLocation).toBeUndefined();
    });
  });

  it('maps only direct Feelings and Health matches while preserving nuanced fallbacks', () => {
    const expectedAssets = {
      'feelings-confused': ['confused_man', 'symbols/confused_man.svg'],
      'health-i-need-water': ['water', 'symbols/water.svg'],
      'health-medicine': ['medicine', 'symbols/medicine.svg'],
      'health-breathe': ['airways', 'symbols/airways.svg'],
      'health-rest': ['rest_,_to', 'symbols/rest_,_to.svg'],
      'health-head': ['head', 'symbols/head.svg'],
      'health-stomach': ['stomach', 'symbols/stomach.svg'],
      'health-i-need-some-rest': ['rest_,_to', 'symbols/rest_,_to.svg'],
    } as const;
    const mappedIds = Object.keys(expectedAssets);
    const bundledFallbackIds = ['health-hurt', 'health-pain', 'health-i-need-care', 'health-it-hurts-here'];
    const bundledHealthIds = [
      'health-sick', 'health-doctor', 'health-nurse', 'health-dizzy', 'health-fever',
      'health-please-be-gentle', 'health-i-feel-sick', 'health-please-check-this',
    ];
    const fallbackIds = [
      ...FEELINGS_INTENTIONAL_TEXT_FALLBACK_IDS,
    ];

    [...mappedIds, ...bundledFallbackIds, ...bundledHealthIds, ...fallbackIds].forEach((id) => {
      expect(vocabulary.some((candidate) => candidate.id === id), `${id} should remain in the vocabulary`).toBe(true);
    });
    expect(new Set([...mappedIds, ...bundledFallbackIds, ...bundledHealthIds, ...fallbackIds]).size)
      .toBe(mappedIds.length + bundledFallbackIds.length + bundledHealthIds.length + fallbackIds.length);

    Object.entries(expectedAssets).forEach(([id, [assetId, assetLocation]]) => {
      const item = vocabulary.find((candidate) => candidate.id === id);
      expect([item?.symbolAssetId, item?.symbolAssetLocation]).toEqual([assetId, assetLocation]);
      expect(item?.symbolSource).toBe(MULBERRY_SYMBOL_SOURCE);
      expect(isBundledStarterSymbol(item ?? {})).toBe(true);
    });
    bundledFallbackIds.forEach((id) => {
      const item = vocabulary.find((candidate) => candidate.id === id);
      expect(item?.symbolAssetLocation).toBe(STARTER_SYMBOL_ASSET_LOCATION);
      expect(isBundledStarterSymbol(item ?? {})).toBe(true);
    });
    bundledHealthIds.forEach((id) => {
      const item = vocabulary.find((candidate) => candidate.id === id);
      expect(item?.symbolAssetLocation).toBe(STARTER_SYMBOL_ASSET_LOCATION);
      expect(isBundledStarterSymbol(item ?? {})).toBe(true);
    });
    fallbackIds.forEach((id) => {
      const item = vocabulary.find((candidate) => candidate.id === id);
      expect(item?.symbolAssetId, `${id} should preserve text fallback behavior`).toBeUndefined();
      expect(item?.symbolAssetLocation).toBeUndefined();
    });
  });

  it('preserves the original urgent Health pictograms and urgency semantics', () => {
    const urgentHealthIds = ['health-hurt', 'health-pain', 'health-i-need-care', 'health-it-hurts-here'];
    const expectedOriginalAssets = {
      'health-hurt': 'urgent-hurt',
      'health-pain': 'urgent-pain',
      'health-i-need-care': 'urgent-care',
      'health-it-hurts-here': 'urgent-it-hurts-here',
    } as const;

    urgentHealthIds.forEach((id) => {
      const item = vocabulary.find((candidate) => candidate.id === id);
      expect(item?.isUrgent, `${id} should remain urgent`).toBe(true);
      expect(item?.symbolAssetLocation, `${id} should retain the original Clearvoice sprite`).toBe(STARTER_SYMBOL_ASSET_LOCATION);
      expect(item?.symbolAssetId).toBe(expectedOriginalAssets[id as keyof typeof expectedOriginalAssets]);
      expect(isBundledStarterSymbol(item ?? {})).toBe(true);
    });
  });

  it('maps all Feelings targets with neutral derived symbols', () => {
    expect(FEELINGS_INTENTIONAL_TEXT_FALLBACK_IDS).toHaveLength(0);
    [
      'feelings-happy', 'feelings-sad', 'feelings-worried', 'feelings-angry',
      'feelings-calm', 'feelings-tired', 'feelings-excited', 'feelings-bored',
      'feelings-uncomfortable', 'feelings-okay', 'feelings-proud',
      'feelings-i-feel-better', 'feelings-i-need-quiet', 'feelings-i-feel-unsure',
      'feelings-i-feel-overwhelmed', 'feelings-i-want-to-be-alone', 'feelings-i-want-to-talk',
    ].forEach((id) => {
      const item = vocabulary.find((candidate) => candidate.id === id);
      expect(item?.symbolAssetId, `${id} should have a derived symbol`).toMatch(/^wave2-feelings-/);
      expect(item?.symbolModified).toBe(true);
      expect(item?.symbolSourceAssets?.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows the Mulberry credit and license links in Settings', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    const attribution = screen.getByTestId('mulberry-attribution');
    expect(attribution).toHaveTextContent('Mulberry Symbols by Steve Lee');
    expect(attribution).toHaveTextContent(`${MULBERRY_SYMBOL_INVENTORY.length} bundled Mulberry symbols`);
    expect(attribution.querySelector('a[href="https://mulberrysymbols.org/"]')).toBeTruthy();
    expect(attribution.querySelector('a[href="https://creativecommons.org/licenses/by-sa/4.0/"]')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Close Settings' }));
  });
});

describe('drawer keyboard behavior', () => {
  it('contains focus and restores the exact opener for every drawer', async () => {
    const user = userEvent.setup();
    renderApp();

    const drawers = [
      ['button-open-word-finder', 'Close Find a word'],
      ['button-open-customize', 'Close Customize vocabulary'],
      ['button-open-settings', 'Close Settings'],
    ] as const;

    for (const [openerId, closeLabel] of drawers) {
      const opener = screen.getByTestId(openerId);
      opener.focus();
      fireEvent.click(opener);
      const dialog = screen.getByRole('dialog');
      expect(document.activeElement).toBe(screen.getByRole('button', { name: closeLabel }));

      if (openerId === 'button-open-customize') {
        expect(dialog.querySelector('input[type="file"]')).toHaveAttribute('tabindex', '-1');
      }

      for (let index = 0; index < 35; index += 1) {
        await user.tab();
        expect(dialog).toContainElement(document.activeElement);
      }
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      await waitFor(() => expect(screen.getByTestId(openerId)).toHaveFocus());
    }
  });
});

describe('PWA shell contract', () => {
  const publicDir = path.resolve(import.meta.dirname, '../public');
  const serviceWorker = fs.readFileSync(path.join(publicDir, 'sw.js'), 'utf8');
  const manifest = JSON.parse(fs.readFileSync(path.join(publicDir, 'manifest.webmanifest'), 'utf8')) as {
    start_url: string;
    scope: string;
    icons: Array<{ src: string; sizes: string; type: string }>;
  };

  it('caches the actual shell and install assets', () => {
    expect(serviceWorker).toContain('discoverShellAssets');
    expect(serviceWorker).toContain('manifest.webmanifest');
    expect(serviceWorker).toContain('icon.svg');
    expect(manifest.start_url).toBe('./');
    expect(manifest.scope).toBe('./');
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ src: 'icon.svg', sizes: '512x512', type: 'image/svg+xml' }),
    ]));
  });

  it('limits the application-page fallback to navigation requests', () => {
    expect(serviceWorker).toContain("event.request.mode === 'navigate'");
    expect(serviceWorker).toContain("caches.match(appUrl('index.html'))");
    expect(serviceWorker).toContain('Asset request failed; no application-page fallback will be used');
    expect(serviceWorker).not.toContain("catch(() => caches.match('./index.html'))");
  });
});