import { type KeyboardEvent as ReactKeyboardEvent, type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Check, ChevronDown, CircleHelp, Search, SlidersHorizontal, Sparkles, Volume2, X } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { CustomizeVocabulary } from '@/components/customize-vocabulary';
import { SymbolGlyph } from '@/components/symbol-glyph';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import {
  getSearchableText,
  getVocabularyForSection,
  getVocabularyForTopic,
  getVocabularyWithPersonalItems,
  isLocalSymbolAssetLocation,
  moreTopicDefinitions,
  vocabularySections,
  type VocabularyItem,
  type VocabularySection,
  type TopicCategory,
} from '@/data/vocabulary';
import {
  DEFAULT_PREFERENCES,
  isSupportedPersonalSymbolDataUrl,
  makeLocalDataExport,
  parseLocalDataExport,
  PERSONAL_VOCABULARY_STORAGE_KEY,
  PREFERENCES_STORAGE_KEY,
  markSymbolDisplayModeExplicit,
  readStoredPersonalVocabulary,
  readStoredPreferences,
  type AccessibilityPreferences,
  type ButtonSize,
  type PersonalVocabularyItem,
  type SymbolDisplayMode,
  type TextSize,
} from '@/data/localData';
import { controlSymbolMetadata, isBundledStarterSymbol, MULBERRY_SYMBOL_INVENTORY } from '@/data/symbols';

const queryClient = new QueryClient();
const mulberryDerivedSymbolCount = MULBERRY_SYMBOL_INVENTORY.filter((item) => item.modified).length;
const mulberryDirectSymbolCount = MULBERRY_SYMBOL_INVENTORY.length - mulberryDerivedSymbolCount;

type MessageSegment = {
  id: string;
  displayText: string;
  spokenText: string;
  source: 'vocabulary' | 'spelled';
};

type SpeechState = 'idle' | 'speaking' | 'unavailable';

function WordButton({ word, onSelect, pressedId, symbolDisplayMode }: { word: VocabularyItem; onSelect: (word: VocabularyItem) => void; pressedId: string | null; symbolDisplayMode: SymbolDisplayMode }) {
  const opensTopic = word.itemType === 'category' && word.section === 'More';
  const hasLocalSymbol = Boolean(
    word.symbolAssetLocation
    && (
      (isLocalSymbolAssetLocation(word.symbolAssetLocation) && isBundledStarterSymbol(word))
      || (word.source === 'personal' && isSupportedPersonalSymbolDataUrl(word.symbolAssetLocation))
    ),
  );
  const showSymbol = symbolDisplayMode !== 'text-only' && hasLocalSymbol;
  return (
    <button type="button" className={`vocab-card vocab-button tone-${word.colorRole} ${showSymbol ? `symbol-${symbolDisplayMode}` : ''} ${word.isUrgent ? 'is-urgent' : ''} ${pressedId === word.id ? 'is-pressed' : ''}`} onClick={() => onSelect(word)} data-testid={`button-word-${word.id}`} aria-haspopup={opensTopic ? 'true' : undefined} aria-label={opensTopic ? `Open ${word.displayText} vocabulary` : `${word.isUrgent ? 'Urgent communication. ' : ''}${word.source === 'personal' ? 'Personal item. ' : ''}Add ${word.displayText} to message`}>
      {showSymbol && <SymbolGlyph symbol={word} className="word-symbol" testId={`symbol-${word.id}`} />}
      <span className="word-label">{word.displayText}</span>
      {word.source === 'personal' && <span className="word-flag personal-flag">Personal</span>}
      {word.isUrgent && <span className="word-flag">Urgent</span>}
      {word.detail && <span className="word-detail">{word.detail}</span>}
    </button>
  );
}

const DRAWER_FOCUSABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([aria-disabled="true"]):not([tabindex="-1"])',
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  'select:not([disabled]):not([aria-disabled="true"]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([aria-disabled="true"]):not([tabindex="-1"])',
  '[contenteditable="true"]:not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getDrawerFocusableElements(panel: HTMLElement | null): HTMLElement[] {
  if (!panel) return [];
  return Array.from(panel.querySelectorAll<HTMLElement>(DRAWER_FOCUSABLE_SELECTOR)).filter((element) => {
    if (element.hidden || element.tabIndex < 0 || element.matches(':disabled,[aria-disabled="true"]')) return false;
    if (element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
    const styles = window.getComputedStyle(element);
    if (styles.display === 'none' || styles.visibility === 'hidden' || styles.visibility === 'collapse' || styles.opacity === '0' || styles.pointerEvents === 'none') return false;
    return element.getClientRects().length > 0;
  });
}

function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const panelRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  );
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const restoreFocus = () => {
    const previouslyFocused = previouslyFocusedRef.current;
    if (!previouslyFocused?.isConnected) return;
    queueMicrotask(() => previouslyFocused.focus({ preventScroll: true }));
  };

  const closeDrawer = () => {
    onCloseRef.current();
    restoreFocus();
  };

  useLayoutEffect(() => {
    closeButtonRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDrawer();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      restoreFocus();
    };
  }, []);

  const handlePanelKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') return;
    const focusable = getDrawerFocusableElements(panelRef.current);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
    if (currentIndex === -1) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && currentIndex === 0) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && currentIndex === focusable.length - 1) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="panel-backdrop" role="presentation" onMouseDown={closeDrawer}>
      <aside ref={panelRef} className="side-panel" aria-label={title} role="dialog" aria-modal="true" onKeyDown={handlePanelKeyDown} onMouseDown={(event) => event.stopPropagation()}>
        <div className="panel-heading">
          <h2>{title}</h2>
          <button ref={closeButtonRef} type="button" className="icon-button" onClick={closeDrawer} aria-label={`Close ${title}`} data-testid={`button-close-${title.toLowerCase().replaceAll(' ', '-')}`}><X size={21} strokeWidth={2.2} /></button>
        </div>
        {children}
      </aside>
    </div>
  );
}

function Home() {
  const [category, setCategory] = useState<VocabularySection>('Core');
  const [activeTopic, setActiveTopic] = useState<TopicCategory | null>(null);
  const [message, setMessage] = useState<MessageSegment[]>([]);
  const [spellingBuffer, setSpellingBuffer] = useState('');
  const [notice, setNotice] = useState('');
  const [activePanel, setActivePanel] = useState<'settings' | 'finder' | 'customize' | null>(null);
  const [search, setSearch] = useState('');
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(readStoredPreferences);
  const [storedPersonalVocabulary] = useState(readStoredPersonalVocabulary);
  const [personalItems, setPersonalItems] = useState<PersonalVocabularyItem[]>(storedPersonalVocabulary.items);
  const [personalVocabularyRecoveryNotice, setPersonalVocabularyRecoveryNotice] = useState<string | null>(storedPersonalVocabulary.recoveryMessage);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [pressedId, setPressedId] = useState<string | null>(null);
  const [speechState, setSpeechState] = useState<SpeechState>('idle');
  const actionTimesRef = useRef(new Map<string, number>());
  const segmentNumberRef = useRef(0);
  const speechRunRef = useRef(0);
  const noticeTimerRef = useRef<number | undefined>(undefined);
  const topicHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const categoriesHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const pendingTopicFocusRef = useRef<'topic' | 'categories' | null>(null);
  const speechSupported = typeof window !== 'undefined'
    && typeof window.speechSynthesis?.speak === 'function'
    && typeof window.speechSynthesis?.cancel === 'function'
    && typeof window.speechSynthesis?.getVoices === 'function'
    && typeof window.speechSynthesis?.addEventListener === 'function'
    && typeof window.SpeechSynthesisUtterance !== 'undefined';
  const nativeShareSupported = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const words = useMemo(
    () => category === 'More'
      ? activeTopic
        ? getVocabularyForTopic(activeTopic, personalItems)
        : getVocabularyForSection(category, personalItems).filter((item) => item.itemType === 'category')
      : getVocabularyForSection(category, personalItems),
    [activeTopic, category, personalItems],
  );
  const activeTopicDefinition = activeTopic ? moreTopicDefinitions[activeTopic] : null;
  const allVocabulary = useMemo(() => getVocabularyWithPersonalItems(personalItems), [personalItems]);
  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? allVocabulary.filter((word) => getSearchableText(word).includes(query)) : allVocabulary;
  }, [allVocabulary, search]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Preferences remain active for this session if storage is unavailable.
    }
  }, [preferences]);

  useEffect(() => {
    if (personalVocabularyRecoveryNotice) return;
    try {
      if (personalItems.length) {
        window.localStorage.setItem(PERSONAL_VOCABULARY_STORAGE_KEY, JSON.stringify(personalItems));
      } else {
        window.localStorage.removeItem(PERSONAL_VOCABULARY_STORAGE_KEY);
      }
    } catch {
      // Personal vocabulary remains active for this session if storage is unavailable.
    }
  }, [personalItems, personalVocabularyRecoveryNotice]);

  useEffect(() => {
    if (!speechSupported) {
      setVoices([]);
      return;
    }
    const updateVoices = () => setVoices(window.speechSynthesis.getVoices());
    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
  }, [speechSupported]);

  useEffect(() => {
    const pendingFocus = pendingTopicFocusRef.current;
    if (!pendingFocus || category !== 'More') return;
    pendingTopicFocusRef.current = null;
    const frame = window.requestAnimationFrame(() => {
      (pendingFocus === 'topic' ? topicHeadingRef.current : categoriesHeadingRef.current)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeTopic, category]);

  const giveFeedback = (text: string, duration = 1800, force = false) => {
    if (preferences.quietMode && !force) return;
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    setNotice(text);
    noticeTimerRef.current = window.setTimeout(() => setNotice(''), duration);
  };

  useEffect(() => {
    if (personalVocabularyRecoveryNotice) {
      giveFeedback(personalVocabularyRecoveryNotice, 6500, true);
    }
  }, [personalVocabularyRecoveryNotice]);

  const isRapidRepeat = (key: string) => {
    const now = Date.now();
    const previous = actionTimesRef.current.get(key) ?? 0;
    if (now - previous < 320) return true;
    actionTimesRef.current.set(key, now);
    return false;
  };

  const cancelSpeech = () => {
    speechRunRef.current += 1;
    if (typeof window !== 'undefined' && typeof window.speechSynthesis?.cancel === 'function') {
      window.speechSynthesis.cancel();
    }
    setSpeechState('idle');
  };

  const speakText = (text: string, completionMessage: string) => {
    if (!speechSupported) {
      setSpeechState('unavailable');
      giveFeedback('Speech is not available in this browser', 2200, true);
      return;
    }
    window.speechSynthesis.cancel();
    const runId = speechRunRef.current + 1;
    speechRunRef.current = runId;
    const utterance = new window.SpeechSynthesisUtterance(text);
    const selectedVoice = voices.find((voice) => voice.name === preferences.voiceName);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = preferences.speechRate;
    utterance.onstart = () => {
      if (runId === speechRunRef.current) setSpeechState('speaking');
    };
    utterance.onend = () => {
      if (runId === speechRunRef.current) {
        setSpeechState('idle');
        if (completionMessage) giveFeedback(completionMessage);
      }
    };
    utterance.onerror = (event) => {
      if (runId === speechRunRef.current) {
        setSpeechState('idle');
        if (event.error !== 'canceled') giveFeedback('Speech could not be started', 2200, true);
      }
    };
    setSpeechState('speaking');
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeak = () => {
    if (isRapidRepeat('speak')) return;
    if (speechState === 'speaking') {
      cancelSpeech();
      giveFeedback('Speech stopped');
      return;
    }
    if (!message.length) {
      giveFeedback('Add a few words first');
      return;
    }
    speakText(message.map((segment) => segment.spokenText).join(' '), 'Message spoken');
  };

  const testVoice = () => {
    if (isRapidRepeat('test-voice')) return;
    speakText('This is a Clearvoice voice test.', 'Voice test complete');
  };

  const previewPronunciation = (text: string) => {
    if (isRapidRepeat('preview-pronunciation')) return;
    if (!text.trim()) {
      giveFeedback('Add a word or phrase before previewing pronunciation', 2200, true);
      return;
    }
    speakText(text.trim(), 'Pronunciation preview complete');
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target;
      const isTextEntry = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !isTextEntry) {
        event.preventDefault();
        handleSpeak();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [message, speechState, preferences, voices]);

  useEffect(() => () => {
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    if (typeof window !== 'undefined' && typeof window.speechSynthesis?.cancel === 'function') window.speechSynthesis.cancel();
  }, []);

  const openMoreTopic = (topic: TopicCategory) => {
    pendingTopicFocusRef.current = 'topic';
    setCategory('More');
    setActiveTopic(topic);
  };

  const showMoreCategories = () => {
    pendingTopicFocusRef.current = 'categories';
    setCategory('More');
    setActiveTopic(null);
  };

  const changeCategory = (nextCategory: VocabularySection) => {
    pendingTopicFocusRef.current = null;
    setActiveTopic(null);
    setCategory(nextCategory);
  };

  const handleCategoryKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    const key = event.key;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return;
    event.preventDefault();
    const nextIndex = key === 'Home'
      ? 0
      : key === 'End'
        ? vocabularySections.length - 1
        : (currentIndex + (key === 'ArrowRight' ? 1 : -1) + vocabularySections.length) % vocabularySections.length;
    const nextCategory = vocabularySections[nextIndex].id;
    changeCategory(nextCategory);
    window.requestAnimationFrame(() => {
      document.getElementById(`vocabulary-tab-${nextCategory.toLowerCase().replace(/\s+/g, '-')}`)?.focus();
    });
  };

  const selectWord = (word: VocabularyItem) => {
    cancelSpeech();
    const segmentNumber = segmentNumberRef.current++;
    setMessage((current) => [...current, {
      id: `message-${segmentNumber}`,
      displayText: word.displayText,
      spokenText: word.spokenText,
      source: 'vocabulary',
    }]);
    if (preferences.speechBehavior === 'speak-on-selection') {
      speakText(word.spokenText, '');
    }
    setPressedId(word.id);
    window.setTimeout(() => setPressedId((current) => current === word.id ? null : current), 260);
    giveFeedback(`${word.displayText} added`, 1300);
  };

  const selectVocabularyItem = (word: VocabularyItem) => {
    if (word.itemType === 'category' && word.section === 'More') {
      openMoreTopic(word.category as TopicCategory);
      return;
    }
    selectWord(word);
  };

  const selectSpellingLetter = (word: VocabularyItem) => {
    if (isRapidRepeat(`letter:${word.id}`)) return;
    setSpellingBuffer((current) => current + word.spokenText);
    setPressedId(word.id);
    window.setTimeout(() => setPressedId((current) => current === word.id ? null : current), 260);
  };

  const addSpellingSpace = () => {
    if (isRapidRepeat('spell-space')) return;
    setSpellingBuffer((current) => current && !current.endsWith(' ') ? `${current} ` : current);
  };

  const backspaceSpelling = () => {
    if (isRapidRepeat('spell-backspace')) return;
    setSpellingBuffer((current) => current.slice(0, -1));
  };

  const clearSpelling = () => {
    if (isRapidRepeat('spell-clear')) return;
    setSpellingBuffer('');
    giveFeedback('Spelling cleared');
  };

  const commitSpelling = () => {
    if (isRapidRepeat('spell-commit')) return;
    const spokenText = spellingBuffer.trim();
    if (!spokenText) {
      giveFeedback('Spell a word first');
      return;
    }
    const segmentNumber = segmentNumberRef.current++;
    setMessage((current) => [...current, {
      id: `spelled-${segmentNumber}`,
      displayText: spokenText,
      spokenText,
      source: 'spelled',
    }]);
    setSpellingBuffer('');
    giveFeedback(`${spokenText} added`, 1300);
  };

  const undoLastSelection = () => {
    if (isRapidRepeat('undo')) return;
    if (!message.length) {
      giveFeedback('Nothing to undo');
      return;
    }
    cancelSpeech();
    const lastSegment = message[message.length - 1];
    setMessage((current) => current.slice(0, -1));
    giveFeedback(`${lastSegment.displayText} removed`, 1300);
  };

  const clearMessage = () => {
    if (isRapidRepeat('clear')) return;
    if (!message.length && !spellingBuffer) {
      giveFeedback('Message is already empty');
      return;
    }
    cancelSpeech();
    setMessage([]);
    setSpellingBuffer('');
    giveFeedback('Message cleared', 1300);
  };

  const copyMessage = async (text: string, feedback = 'Message copied to your clipboard. Clearvoice did not transmit it.') => {
    if (!navigator.clipboard?.writeText) {
      giveFeedback('Copying is not supported in this browser. Your message stayed here.', 2600, true);
      return false;
    }
    try {
      await navigator.clipboard.writeText(text);
      giveFeedback(feedback, 2200, true);
      return true;
    } catch {
      giveFeedback('Copying was not available. Your message stayed here.', 2600, true);
      return false;
    }
  };

  const shareMessage = async () => {
    if (isRapidRepeat('share')) return;
    if (!message.length) return;
    const text = message.map((segment) => segment.spokenText).join(' ');
    if (!nativeShareSupported) {
      await copyMessage(text);
      return;
    }
    try {
      await navigator.share({ title: 'Clearvoice message', text });
      giveFeedback('Message shared using your device.', 2200, true);
    } catch (error) {
      const errorName = typeof error === 'object' && error !== null && 'name' in error ? String(error.name) : '';
      if (errorName === 'AbortError') {
        giveFeedback('Share cancelled. Your message stayed here.', 2200, true);
        return;
      }
      const copied = await copyMessage(text, 'Sharing was not available, so the message was copied to your clipboard.');
      if (!copied) {
        giveFeedback('Sharing was not available. Your message stayed here.', 2600, true);
      }
    }
  };

  const selectFinderResult = (word: VocabularyItem) => {
    selectVocabularyItem(word);
    setActivePanel(null);
  };

  const updatePersonalItems = (items: PersonalVocabularyItem[]) => {
    setPersonalItems(items);
    setPersonalVocabularyRecoveryNotice(null);
  };

  const exportLocalData = () => {
    const blob = new Blob([makeLocalDataExport(preferences, personalItems)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clearvoice-local-data.json';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    giveFeedback('Settings and personal vocabulary exported', 1800, true);
  };

  const importLocalData = (text: string) => {
    try {
      const imported = parseLocalDataExport(text);
      setPreferences(imported.preferences);
      updatePersonalItems(imported.personalVocabulary);
      setActivePanel(null);
      giveFeedback('Settings and personal vocabulary imported', 1800, true);
    } catch (error) {
      giveFeedback(error instanceof Error ? error.message : 'That Clearvoice export could not be imported.', 2800, true);
    }
  };

  const restoreDefaultVocabulary = () => {
    if (!window.confirm('Remove all personal vocabulary and restore the default set? Accessibility settings and the current message will stay unchanged.')) return;
    updatePersonalItems([]);
    giveFeedback('Default vocabulary restored', 1800, true);
  };

  const updatePreferences = (patch: Partial<AccessibilityPreferences>) => {
    if (Object.prototype.hasOwnProperty.call(patch, 'symbolDisplayMode')) {
      markSymbolDisplayModeExplicit();
    }
    setPreferences((current) => ({ ...current, ...patch }));
  };

  const resetPreferences = () => {
    cancelSpeech();
    markSymbolDisplayModeExplicit();
    setPreferences(DEFAULT_PREFERENCES);
    giveFeedback('Settings reset to defaults', 1800, true);
  };

  const vocabularyAnnouncement = activeTopicDefinition
    ? `${activeTopicDefinition.label} topic open.`
    : category === 'More'
      ? 'More vocabulary categories open.'
      : `${category} vocabulary open.`;

  return (
    <main className={`app-shell grain button-${preferences.buttonSize} text-${preferences.textSize} symbol-display-${preferences.symbolDisplayMode} ${preferences.highContrast ? 'high-contrast' : ''} ${preferences.reducedMotion ? 'reduce-motion' : ''} ${preferences.quietMode ? 'quiet-mode' : ''}`}>
      <header className="topbar clearvoice-wrap">
        <div className="brand-lockup" aria-label="Clearvoice home">
          <div className="brand-mark" aria-hidden="true"><Sparkles size={17} /></div>
          <div><p className="brand-name">Clearvoice</p><p className="brand-kicker">a calm communication workspace</p></div>
        </div>
        <div className="top-actions">
          <button type="button" className="utility-button" onClick={() => setActivePanel('finder')} aria-label="Find a word" aria-haspopup="dialog" aria-expanded={activePanel === 'finder'} data-testid="button-open-word-finder"><SymbolGlyph symbol={controlSymbolMetadata.search} className="control-symbol" testId="symbol-control-search" /><span>Find a word</span></button>
          <button type="button" className="utility-button" onClick={() => setActivePanel('customize')} aria-label="Customize vocabulary" aria-haspopup="dialog" aria-expanded={activePanel === 'customize'} data-testid="button-open-customize"><SlidersHorizontal size={18} aria-hidden="true" /><span>Customize</span></button>
          <button type="button" className="icon-button" onClick={() => setActivePanel('settings')} aria-label="Open settings" aria-haspopup="dialog" aria-expanded={activePanel === 'settings'} data-testid="button-open-settings"><SymbolGlyph symbol={controlSymbolMetadata.settings} className="control-symbol" testId="symbol-control-settings" /></button>
        </div>
      </header>

      <div className="clearvoice-wrap">
        <section className="message-card" aria-labelledby="message-heading">
          <div className="message-topline">
            <div><p className="eyebrow">Your message</p><h1 id="message-heading">{message.length ? 'Ready when you are.' : spellingBuffer ? 'Building a word.' : 'Take your time.'}</h1></div>
            <div className="message-controls">
              <button type="button" className="undo-button" onClick={undoLastSelection} disabled={!message.length} aria-label="Undo last selection" data-testid="button-undo-selection"><SymbolGlyph symbol={controlSymbolMetadata.undo} className="control-symbol" testId="symbol-control-undo" />Undo</button>
              <button type="button" className="clear-button" onClick={clearMessage} disabled={!message.length && !spellingBuffer} data-testid="button-clear-message"><SymbolGlyph symbol={controlSymbolMetadata.clear} className="control-symbol" testId="symbol-control-clear" />Clear</button>
            </div>
          </div>
          <div className={`message-display ${message.length || spellingBuffer ? 'has-message' : 'empty-message'}`} aria-live="polite" data-testid="text-composed-message">
            {message.length || spellingBuffer ? <>
              {message.map((segment) => <span key={segment.id} className={`message-token ${segment.source === 'spelled' ? 'spelled-token' : ''}`}>{segment.displayText}</span>)}
              {spellingBuffer && <span className="message-token spelling-token" aria-label={`Spelling in progress: ${spellingBuffer}`}>{spellingBuffer}</span>}
            </> : <span className="message-placeholder"><strong>No message yet</strong><span>Select a word, choose a phrase, or open Spell to begin.</span></span>}
          </div>
          <p id="speak-help" className="composer-help">Quick phrases are added for review. Press <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd> to speak.</p>
          <p id="share-help" className="composer-help share-help">Share message uses your device's share sheet, or copies the message to your clipboard. Clearvoice does not store, monitor, or independently deliver it.</p>
          <div className="message-actions">
            <button type="button" className={`speak-button ${speechState === 'speaking' ? 'is-speaking' : ''}`} onClick={handleSpeak} aria-describedby="speak-help" aria-keyshortcuts="Control+Enter Meta+Enter" data-testid="button-speak-message"><SymbolGlyph symbol={speechState === 'speaking' ? controlSymbolMetadata['stop-speaking'] : controlSymbolMetadata.speak} className="control-symbol" testId={`symbol-control-${speechState === 'speaking' ? 'stop-speaking' : 'speak'}`} /><span>{speechState === 'speaking' ? 'Stop speaking' : 'Speak'}</span></button>
            <button type="button" className="share-button" onClick={shareMessage} disabled={!message.length} aria-describedby="share-help" aria-label={nativeShareSupported ? 'Share message using your device' : 'Copy message to your clipboard'} data-testid="button-share-message">
              <SymbolGlyph symbol={controlSymbolMetadata.share} className="control-symbol" testId="symbol-control-share" />
              <span>{nativeShareSupported ? 'Share message' : 'Copy message'}</span>
            </button>
          </div>
        </section>

        <section className="workspace-section" aria-labelledby="vocabulary-heading">
          <p className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">{vocabularyAnnouncement}</p>
          <div className={`section-heading ${activeTopic ? 'topic-heading' : ''}`}>
            <div>
              {activeTopic && activeTopicDefinition ? <>
                <button type="button" className="back-to-categories" onClick={showMoreCategories} data-testid="button-back-to-more-categories"><SymbolGlyph symbol={controlSymbolMetadata.back} className="control-symbol" testId="symbol-control-back" />Back to Categories</button>
                <p className="eyebrow">More · Topic</p>
                <h2 id="vocabulary-heading" ref={topicHeadingRef} tabIndex={-1}>{activeTopicDefinition.label}</h2>
                <p className="topic-description">{activeTopicDefinition.description}</p>
              </> : <><p className="eyebrow">Vocabulary</p><h2 id="vocabulary-heading" ref={category === 'More' ? categoriesHeadingRef : undefined} tabIndex={category === 'More' ? -1 : undefined}>Choose what feels right</h2></>}
            </div>
            <div className="count-label">{words.length} {words.length === 1 ? 'choice' : 'choices'}</div>
          </div>
          <nav className="category-nav" role="tablist" aria-orientation="horizontal" aria-label="Vocabulary sections">
            {vocabularySections.map((item, index) => {
              const tabId = `vocabulary-tab-${item.id.toLowerCase().replace(/\s+/g, '-')}`;
              return <button key={item.id} id={tabId} type="button" role="tab" className={`category-tab ${category === item.id ? 'is-selected' : ''}`} onClick={() => changeCategory(item.id)} onKeyDown={(event) => handleCategoryKeyDown(event, index)} aria-selected={category === item.id} aria-controls="vocabulary-panel" tabIndex={category === item.id ? 0 : -1} aria-label={`${item.label}: ${item.description}`} data-testid={`button-category-${item.id.toLowerCase().replace(/\s+/g, '-')}`}>{item.label}{item.id === 'Core' && <span className="category-dot" aria-hidden="true" />}</button>;
            })}
          </nav>
          <div id="vocabulary-panel" role="tabpanel" aria-labelledby={`vocabulary-tab-${category.toLowerCase().replace(/\s+/g, '-')}`}>
            {category === 'Spell' && <section className="spell-builder" aria-labelledby="spell-builder-heading">
              <div>
                <p className="eyebrow">Spelling</p>
                <p id="spell-builder-heading" className={`spell-buffer ${spellingBuffer ? 'has-spelling' : ''}`}>{spellingBuffer || 'Choose letters to build a word.'}</p>
              </div>
              <div className="spell-actions">
                <button type="button" className="spell-action" onClick={addSpellingSpace} data-testid="button-spell-space">Space</button>
                <button type="button" className="spell-action" onClick={backspaceSpelling} data-testid="button-spell-backspace">Backspace</button>
                <button type="button" className="spell-action" onClick={clearSpelling} disabled={!spellingBuffer} data-testid="button-spell-clear">Clear spelling</button>
                <button type="button" className="add-spelled-word" onClick={commitSpelling} disabled={!spellingBuffer.trim()} data-testid="button-add-spelled-word">Add word to message</button>
              </div>
            </section>}
            {category === 'More' && activeTopic && !words.length
              ? <div className="empty-topic" role="status"><strong>No vocabulary here yet.</strong><span>Add a personal entry for this topic in Customize, or use another category.</span></div>
              : <div className={`vocabulary-grid ${category === 'Spell' ? 'letter-grid' : ''}`} aria-label={`${activeTopicDefinition?.label ?? category} vocabulary`}>
                 {words.map((word) => <WordButton key={word.id} word={word} pressedId={pressedId} symbolDisplayMode={preferences.symbolDisplayMode} onSelect={category === 'Spell' ? selectSpellingLetter : selectVocabularyItem} />)}
              </div>}
            <div className="grid-hint"><CircleHelp size={16} aria-hidden="true" /> {activeTopicDefinition?.context ?? (category === 'Spell' ? 'Letters stay editable until you add the word to your message.' : category === 'Quick Phrases' ? 'Choose a phrase to add it to your message, then review before speaking.' : category === 'More' ? 'Choose a topic to see more words and phrases.' : 'Select a word to add it to your message.')}</div>
          </div>
        </section>
        <footer className="demo-notice"><div className="notice-rule" /><p><strong>Usability demo.</strong> Clearvoice is not a clinical AAC device or a substitute for individualized AAC assessment.</p></footer>
      </div>

      {notice && <div className="toast-note" role="status" data-testid="status-feedback"><Check size={16} /> {notice}</div>}
      {activePanel === 'finder' && <Drawer title="Find a word" onClose={() => setActivePanel(null)}>
        <label className="field-label" htmlFor="word-search">Search vocabulary</label>
        <div className="search-field"><Search size={18} aria-hidden="true" /><input id="word-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Type a word" autoFocus data-testid="input-word-search" /></div>
        <div className="finder-results" aria-live="polite">{searchResults.length ? searchResults.map((word) => <button key={word.id} type="button" className="finder-result" onClick={() => selectFinderResult(word)} data-testid={`button-search-result-${word.id}`}><span><strong>{word.displayText}</strong><small>{word.source === 'personal' ? 'Personal' : 'Default'} · {word.section} · {word.category}</small></span><ChevronDown size={16} className="result-arrow" aria-hidden="true" /></button>) : <p className="empty-search">No words found. Try a shorter search.</p>}</div>
      </Drawer>}
      {activePanel === 'customize' && <Drawer title="Customize vocabulary" onClose={() => setActivePanel(null)}>
        <CustomizeVocabulary
          items={personalItems}
          onChange={updatePersonalItems}
          onFeedback={(text) => giveFeedback(text, 1500)}
           onPreviewPronunciation={previewPronunciation}
          onExport={exportLocalData}
          onImportText={importLocalData}
          onRestoreDefaults={restoreDefaultVocabulary}
        />
      </Drawer>}
      {activePanel === 'settings' && <Drawer title="Settings" onClose={() => setActivePanel(null)}>
        <p className="panel-intro">Make this workspace fit the way you communicate today. These preferences are saved on this device only.</p>
        <fieldset className="preference-group preference-group-featured" data-testid="settings-vocabulary-display">
          <legend>Vocabulary display</legend>
          <p className="preference-help">Symbols are shown with their complete written labels by default. Choose Text only if you prefer a text-first layout.</p>
          <div className="preference-options">
            {([
              ['text-only', 'Text only', 'Keep the current text-first cards.'],
              ['symbol-and-text', 'Symbol and text', 'Show a symbol with the complete text label.'],
              ['symbol-dominant', 'Symbol dominant', 'Show a larger symbol with readable text.'],
            ] as Array<[SymbolDisplayMode, string, string]>).map(([mode, label, description]) => (
              <label key={mode} className="preference-option">
                <input type="radio" name="symbol-display-mode" value={mode} checked={preferences.symbolDisplayMode === mode} onChange={() => updatePreferences({ symbolDisplayMode: mode })} data-testid={`input-symbol-display-${mode}`} />
                <span><strong>{label}</strong><small>{description}</small></span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="preference-group">
          <legend>Communication button size</legend>
          <div className="preference-options">
            {(['regular', 'large', 'extra-large'] as ButtonSize[]).map((size) => <label key={size} className="preference-option"><input type="radio" name="button-size" value={size} checked={preferences.buttonSize === size} onChange={() => updatePreferences({ buttonSize: size })} /><span>{size === 'extra-large' ? 'Extra-large' : size[0].toUpperCase() + size.slice(1)}</span></label>)}
          </div>
        </fieldset>
        <fieldset className="preference-group">
          <legend>Text size</legend>
          <div className="preference-options">
            {(['regular', 'large'] as TextSize[]).map((size) => <label key={size} className="preference-option"><input type="radio" name="text-size" value={size} checked={preferences.textSize === size} onChange={() => updatePreferences({ textSize: size })} /><span>{size[0].toUpperCase() + size.slice(1)}</span></label>)}
          </div>
        </fieldset>
        <div className="settings-toggles">
          <label className="setting-row"><span><strong>High contrast</strong><small>Increase contrast and border definition.</small></span><input type="checkbox" checked={preferences.highContrast} onChange={(event) => updatePreferences({ highContrast: event.target.checked })} data-testid="input-high-contrast" /></label>
          <label className="setting-row"><span><strong>Reduced motion</strong><small>Keep transitions and movement to a minimum.</small></span><input type="checkbox" checked={preferences.reducedMotion} onChange={(event) => updatePreferences({ reducedMotion: event.target.checked })} data-testid="input-reduced-motion" /></label>
          <label className="setting-row"><span><strong>Quiet mode</strong><small>No vibration; reduce transient selection and completion feedback.</small></span><input type="checkbox" checked={preferences.quietMode} onChange={(event) => updatePreferences({ quietMode: event.target.checked })} data-testid="input-quiet-mode" /></label>
        </div>
        <section className="privacy-note symbol-attribution" aria-labelledby="about-clearvoice-title" data-testid="mulberry-attribution">
          <CircleHelp size={17} aria-hidden="true" />
          <div>
            <p><strong id="about-clearvoice-title">About Clearvoice symbols</strong><br />Selected vocabulary symbols are from <a href="https://mulberrysymbols.org/" target="_blank" rel="noreferrer">Mulberry Symbols by Steve Lee</a>, used under <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>. Clearvoice bundles direct symbols unchanged and clearly marks restrained derived compositions.</p>
            <details>
              <summary>{MULBERRY_SYMBOL_INVENTORY.length} bundled Mulberry symbols ({mulberryDirectSymbolCount} unmodified, {mulberryDerivedSymbolCount} derived)</summary>
              <ul>
                {MULBERRY_SYMBOL_INVENTORY.map((item) => <li key={item.fileName}><span>{item.label}</span> — {item.modified ? `derived from ${item.sourceAssets?.join(', ') ?? 'documented Mulberry sources'}` : 'unmodified'} — {item.vocabularyIds.join(', ')}</li>)}
              </ul>
            </details>
          </div>
        </section>
        <fieldset className="preference-group speech-preferences">
          <legend>Speech</legend>
          <div className="speech-behavior">
            <p className="field-label">Speech behavior</p>
            <div className="preference-options">
              <label className="preference-option"><input type="radio" name="speech-behavior" value="review-first" checked={preferences.speechBehavior === 'review-first'} onChange={() => updatePreferences({ speechBehavior: 'review-first' })} data-testid="input-speech-behavior-review-first" /><span><strong>Review first</strong><small>Add selections to the message without speaking.</small></span></label>
              <label className="preference-option"><input type="radio" name="speech-behavior" value="speak-on-selection" checked={preferences.speechBehavior === 'speak-on-selection'} onChange={() => updatePreferences({ speechBehavior: 'speak-on-selection' })} data-testid="input-speech-behavior-speak-on-selection" /><span><strong>Speak on selection</strong><small>Speak each selected word or phrase immediately.</small></span></label>
            </div>
          </div>
          <label className="range-label" htmlFor="speech-rate"><span>Speech rate</span><output htmlFor="speech-rate">{preferences.speechRate.toFixed(1)}×</output></label>
          <input id="speech-rate" className="speech-rate" type="range" min="0.5" max="1.5" step="0.05" value={preferences.speechRate} onChange={(event) => updatePreferences({ speechRate: Number(event.target.value) })} />
          <label className="field-label voice-label" htmlFor="voice-select">Browser voice</label>
          {speechSupported ? <select id="voice-select" className="voice-select" value={preferences.voiceName} onChange={(event) => updatePreferences({ voiceName: event.target.value })}>
            <option value="">Browser default</option>
            {voices.map((voice) => <option key={`${voice.name}-${voice.lang}`} value={voice.name}>{voice.name} ({voice.lang})</option>)}
          </select> : <p className="speech-note">Speech synthesis is not available in this browser.</p>}
          <button type="button" className="setting-action" onClick={testVoice} disabled={!speechSupported} data-testid="button-test-voice"><Volume2 size={17} />Test voice</button>
        </fieldset>
        <div className="privacy-note"><CircleHelp size={17} aria-hidden="true" /><p>Messages stay on this device unless you explicitly use Share message or Copy message through your own device. Clearvoice does not store, monitor, or independently deliver messages. Speech uses browser-native capabilities and does not transmit to a server.</p></div>
        <button type="button" className="reset-settings" onClick={resetPreferences} data-testid="button-reset-settings">Reset to defaults</button>
      </Drawer>}
    </main>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
