import {
  vocabulary,
  type VocabularyCategory,
  type VocabularyColorRole,
  type VocabularyItem,
  type VocabularySection,
  type VocabularySymbolMetadata,
  isLocalSymbolAssetLocation,
} from '@/data/vocabulary';

export type ButtonSize = 'regular' | 'large' | 'extra-large';
export type TextSize = 'regular' | 'large';
export type SpeechBehavior = 'review-first' | 'speak-on-selection';
export type SymbolDisplayMode = 'text-only' | 'symbol-and-text' | 'symbol-dominant';

export type AccessibilityPreferences = {
  buttonSize: ButtonSize;
  textSize: TextSize;
  highContrast: boolean;
  reducedMotion: boolean;
  quietMode: boolean;
  speechRate: number;
  voiceName: string;
  speechBehavior: SpeechBehavior;
  symbolDisplayMode: SymbolDisplayMode;
};

export type PersonalCategory = Exclude<VocabularyCategory, 'spell'>;
export type PersonalItemType = 'word' | 'phrase';
export type PersonalVocabularyItem = VocabularyItem & {
  source: 'personal';
  category: PersonalCategory;
  itemType: PersonalItemType;
};

export type PersonalCategoryOption = {
  value: PersonalCategory;
  label: string;
  section: Exclude<VocabularySection, 'Spell'>;
};

export const PREFERENCES_STORAGE_KEY = 'clearvoice-preferences';
export const SYMBOL_DISPLAY_INITIALIZED_STORAGE_KEY = 'clearvoice-symbol-display-initialized-v1';
export const SYMBOL_DISPLAY_EXPLICIT_CHOICE_STORAGE_KEY = 'clearvoice-symbol-display-explicit-v1';
export const PERSONAL_VOCABULARY_STORAGE_KEY = 'clearvoice-personal-vocabulary';
export const LOCAL_DATA_SCHEMA = 'clearvoice-local-data';
export const LOCAL_DATA_VERSION = 1;
export const MAX_LOCAL_DATA_BYTES = 256 * 1024;
export const MAX_PERSONAL_ITEMS = 100;
export const MAX_PERSONAL_POSITION = 10000;
export const MAX_PERSONAL_SYMBOL_BYTES = 48 * 1024;
export const MAX_PERSONAL_VOCABULARY_BYTES = 192 * 1024;

export const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  buttonSize: 'regular',
  textSize: 'regular',
  highContrast: false,
  reducedMotion: false,
  quietMode: false,
  speechRate: 0.95,
  voiceName: '',
  speechBehavior: 'review-first',
  symbolDisplayMode: 'symbol-and-text',
};

export const PERSONAL_CATEGORY_OPTIONS: PersonalCategoryOption[] = [
  { value: 'core', label: 'Core', section: 'Core' },
  { value: 'quick-phrases', label: 'Quick Phrases', section: 'Quick Phrases' },
  { value: 'people', label: 'People', section: 'More' },
  { value: 'food', label: 'Food', section: 'More' },
  { value: 'places', label: 'Places', section: 'More' },
  { value: 'activities', label: 'Activities', section: 'More' },
  { value: 'home', label: 'Home', section: 'More' },
  { value: 'school-work', label: 'School or work', section: 'More' },
  { value: 'feelings', label: 'Feelings', section: 'More' },
  { value: 'personal-items', label: 'Personal items', section: 'More' },
  { value: 'health', label: 'Health', section: 'More' },
];

export const PERSONAL_COLOR_OPTIONS: Array<{ value: VocabularyColorRole; label: string }> = [
  { value: 'teal', label: 'Teal' },
  { value: 'sand', label: 'Sand' },
  { value: 'coral', label: 'Coral' },
  { value: 'blue', label: 'Blue' },
];

const PERSONAL_CATEGORY_VALUES = new Set<PersonalCategory>(PERSONAL_CATEGORY_OPTIONS.map((option) => option.value));
const PERSONAL_COLOR_VALUES = new Set<VocabularyColorRole>(PERSONAL_COLOR_OPTIONS.map((option) => option.value));
const PERSONAL_TYPE_VALUES = new Set<PersonalItemType>(['word', 'phrase']);
const SYMBOL_METADATA_KEYS: Array<keyof VocabularySymbolMetadata> = [
  'symbolAssetId',
  'symbolAssetLocation',
  'symbolDescription',
  'symbolSource',
  'symbolCreator',
  'symbolLicenseId',
  'symbolLicenseUrl',
];
const SECTION_BY_CATEGORY = new Map<PersonalCategory, Exclude<VocabularySection, 'Spell'>>(
  PERSONAL_CATEGORY_OPTIONS.map((option) => [option.value, option.section]),
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasUnsafeText(value: unknown, allowImageDataUrl = false): boolean {
  if (typeof value === 'string') {
    if (allowImageDataUrl && /^data:image\//i.test(value)) return false;
    return /<\s*\/?\s*[a-z][^>]*>|<!--|-->|(?:javascript|vbscript|data|file)\s*:/i.test(value);
  }
  if (Array.isArray(value)) return value.some((entry) => hasUnsafeText(entry, allowImageDataUrl));
  if (isRecord(value)) return Object.values(value).some((entry) => hasUnsafeText(entry, allowImageDataUrl));
  return false;
}

function isPlainText(value: unknown, minLength: number, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length >= minLength && value.length <= maxLength && !hasUnsafeText(value);
}

function getUtf8ByteLength(value: string): number {
  return typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(value).byteLength : value.length;
}

function hasBytesAtStart(bytes: Uint8Array, expected: number[]): boolean {
  return expected.every((byte, index) => bytes[index] === byte);
}

export function isSupportedPersonalSymbolDataUrl(value: string): boolean {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/i.exec(value);
  if (!match || match[2].length % 4 !== 0) return false;

  const encodedBytes = match[2];
  const padding = encodedBytes.endsWith('==') ? 2 : encodedBytes.endsWith('=') ? 1 : 0;
  const decodedLength = (encodedBytes.length / 4) * 3 - padding;
  if (decodedLength < 1 || decodedLength > MAX_PERSONAL_SYMBOL_BYTES) return false;

  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(atob(encodedBytes), (character) => character.charCodeAt(0));
  } catch {
    return false;
  }

  const mimeType = match[1].toLowerCase();
  return (mimeType === 'image/png' && hasBytesAtStart(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    || (mimeType === 'image/jpeg' && hasBytesAtStart(bytes, [0xff, 0xd8, 0xff]))
    || (mimeType === 'image/webp' && hasBytesAtStart(bytes, [0x52, 0x49, 0x46, 0x46]) && hasBytesAtStart(bytes.slice(8), [0x57, 0x45, 0x42, 0x50]));
}

function isPersonalCategory(value: unknown): value is PersonalCategory {
  return typeof value === 'string' && PERSONAL_CATEGORY_VALUES.has(value as PersonalCategory);
}

function isPersonalColor(value: unknown): value is VocabularyColorRole {
  return typeof value === 'string' && PERSONAL_COLOR_VALUES.has(value as VocabularyColorRole);
}

function isPersonalType(value: unknown): value is PersonalItemType {
  return typeof value === 'string' && PERSONAL_TYPE_VALUES.has(value as PersonalItemType);
}

function isValidSection(value: unknown): value is Exclude<VocabularySection, 'Spell'> {
  return value === 'Core' || value === 'Quick Phrases' || value === 'More';
}

function assertExactKeys(value: Record<string, unknown>, expected: string[], label: string) {
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (actual.length !== required.length || actual.some((key, index) => key !== required[index])) {
    throw new Error(`${label} contains unsupported fields.`);
  }
}

function assertRequiredAndOptionalKeys(value: Record<string, unknown>, required: string[], optional: string[], label: string) {
  const actual = Object.keys(value);
  const allowed = new Set([...required, ...optional]);
  if (required.some((key) => !Object.prototype.hasOwnProperty.call(value, key)) || actual.some((key) => !allowed.has(key))) {
    throw new Error(`${label} contains unsupported fields.`);
  }
}

function parsePreferences(value: unknown, requireExactKeys: boolean): AccessibilityPreferences {
  if (!isRecord(value)) throw new Error('Settings are missing or malformed.');
  if (requireExactKeys) {
    const baseKeys = ['buttonSize', 'textSize', 'highContrast', 'reducedMotion', 'quietMode', 'speechRate', 'voiceName'];
    const optionalKeys = ['speechBehavior', 'symbolDisplayMode'].filter((key) => Object.prototype.hasOwnProperty.call(value, key));
    const keys = [...baseKeys, ...optionalKeys];
    assertExactKeys(value, keys, 'Settings');
  }
  const buttonSize = value.buttonSize === 'large' || value.buttonSize === 'extra-large' ? value.buttonSize : value.buttonSize === 'regular' ? 'regular' : null;
  const textSize = value.textSize === 'large' || value.textSize === 'regular' ? value.textSize : null;
  const speechRate = typeof value.speechRate === 'number' && Number.isFinite(value.speechRate) && value.speechRate >= 0.5 && value.speechRate <= 1.5 ? value.speechRate : null;
  const speechBehavior = value.speechBehavior === undefined
    ? 'review-first'
    : value.speechBehavior === 'review-first' || value.speechBehavior === 'speak-on-selection'
      ? value.speechBehavior
      : null;
  const symbolDisplayMode = value.symbolDisplayMode === undefined
    ? 'symbol-and-text'
    : value.symbolDisplayMode === 'text-only' || value.symbolDisplayMode === 'symbol-and-text' || value.symbolDisplayMode === 'symbol-dominant'
      ? value.symbolDisplayMode
      : null;
  if (!buttonSize || !textSize || speechRate === null
    || typeof value.highContrast !== 'boolean'
    || typeof value.reducedMotion !== 'boolean'
    || typeof value.quietMode !== 'boolean'
    || typeof value.voiceName !== 'string'
    || value.voiceName.length > 200
    || speechBehavior === null
    || symbolDisplayMode === null
    || hasUnsafeText(value)) {
    throw new Error('Settings contain an invalid value.');
  }
  return {
    buttonSize,
    textSize,
    highContrast: value.highContrast,
    reducedMotion: value.reducedMotion,
    quietMode: value.quietMode,
    speechRate,
    voiceName: value.voiceName,
    speechBehavior,
    symbolDisplayMode,
  };
}

function validateSymbolMetadata(candidate: Record<string, unknown>, index: number): Partial<VocabularySymbolMetadata> {
  const result: Partial<VocabularySymbolMetadata> = {};
  const textFields: Array<
    | 'symbolAssetId'
    | 'symbolAssetLocation'
    | 'symbolDescription'
    | 'symbolSource'
    | 'symbolCreator'
    | 'symbolLicenseId'
    | 'symbolLicenseUrl'
  > = [
    'symbolAssetId',
    'symbolAssetLocation',
    'symbolDescription',
    'symbolSource',
    'symbolCreator',
    'symbolLicenseId',
    'symbolLicenseUrl',
  ];
  for (const key of textFields) {
    if (!Object.prototype.hasOwnProperty.call(candidate, key)) continue;
    const rawValue = candidate[key];
    if (key === 'symbolAssetLocation' && typeof rawValue === 'string' && rawValue.trim().toLowerCase().startsWith('data:')) {
      if (!isSupportedPersonalSymbolDataUrl(rawValue.trim())) {
        throw new Error(`Personal vocabulary item ${index + 1} has an unsupported or malformed personal symbol.`);
      }
      result[key] = rawValue.trim();
      continue;
    }
    const maxLength = key === 'symbolAssetLocation' ? 240 : key === 'symbolLicenseUrl' ? 300 : key === 'symbolDescription' ? 240 : 160;
    if (!isPlainText(rawValue, 1, maxLength)) {
      throw new Error(`Personal vocabulary item ${index + 1} has invalid symbol metadata.`);
    }
    result[key] = (rawValue as string).trim();
  }
  const hasAssetId = Boolean(result.symbolAssetId);
  const hasAssetLocation = Boolean(result.symbolAssetLocation);
  if (hasAssetId !== hasAssetLocation) {
    throw new Error(`Personal vocabulary item ${index + 1} has incomplete symbol metadata.`);
  }
  if (result.symbolAssetLocation && !isLocalSymbolAssetLocation(result.symbolAssetLocation)) {
    if (!isSupportedPersonalSymbolDataUrl(result.symbolAssetLocation)) {
      throw new Error(`Personal vocabulary item ${index + 1} has an invalid symbol asset location.`);
    }
  }
  if (result.symbolLicenseUrl && !/^https?:\/\/[^\s]+$/i.test(result.symbolLicenseUrl)) {
    throw new Error(`Personal vocabulary item ${index + 1} has an invalid symbol license URL.`);
  }
  return result;
}

export function readStoredPreferences(): AccessibilityPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const stored = JSON.parse(window.localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? 'null');
    const preferences = isRecord(stored)
      ? parsePreferences({ ...DEFAULT_PREFERENCES, ...stored }, false)
      : DEFAULT_PREFERENCES;
    const initialized = window.localStorage.getItem(SYMBOL_DISPLAY_INITIALIZED_STORAGE_KEY) === '1';
    if (initialized) return preferences;

    const explicitChoice = window.localStorage.getItem(SYMBOL_DISPLAY_EXPLICIT_CHOICE_STORAGE_KEY) === '1';
    const inheritedTextOnlyDefault = isRecord(stored)
      && stored.symbolDisplayMode === 'text-only'
      && !explicitChoice;
    window.localStorage.setItem(SYMBOL_DISPLAY_INITIALIZED_STORAGE_KEY, '1');
    return inheritedTextOnlyDefault
      ? { ...preferences, symbolDisplayMode: 'symbol-and-text' }
      : preferences;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function markSymbolDisplayModeExplicit(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SYMBOL_DISPLAY_EXPLICIT_CHOICE_STORAGE_KEY, '1');
  } catch {
    // The selected display mode remains active for this session if storage is unavailable.
  }
}

export function validatePersonalVocabulary(value: unknown): PersonalVocabularyItem[] {
  if (!Array.isArray(value)) throw new Error('Personal vocabulary must be a list.');
  if (value.length > MAX_PERSONAL_ITEMS) throw new Error(`Personal vocabulary is limited to ${MAX_PERSONAL_ITEMS} items.`);
  const defaultIds = new Set(vocabulary.map((item) => item.id));
  const ids = new Set<string>();
  const recordKeys = new Set(vocabulary.map((item) => `${item.displayText.trim().toLowerCase()}|${item.spokenText.trim().toLowerCase()}|${item.category}`));
  const items = value.map((candidate, index) => {
    if (!isRecord(candidate)) throw new Error(`Personal vocabulary item ${index + 1} is malformed.`);
    assertRequiredAndOptionalKeys(candidate, ['id', 'displayText', 'spokenText', 'category', 'colorRole', 'itemType', 'searchKeywords', 'position', 'isUrgent', 'section', 'source'], SYMBOL_METADATA_KEYS, `Personal vocabulary item ${index + 1}`);
    const id = candidate.id;
    const category = candidate.category;
    const section = candidate.section;
    const itemType = candidate.itemType;
    if (typeof id !== 'string' || !/^personal-[a-z0-9-]{4,100}$/i.test(id) || ids.has(id) || defaultIds.has(id)) {
      throw new Error(`Personal vocabulary item ${index + 1} has a duplicate or invalid ID.`);
    }
    if (!isPlainText(candidate.displayText, 1, 80) || !isPlainText(candidate.spokenText, 1, 120)) {
      throw new Error(`Personal vocabulary item ${index + 1} has invalid text.`);
    }
    if (!isPersonalCategory(category) || !isPersonalColor(candidate.colorRole) || !isPersonalType(itemType)
      || !isValidSection(section) || SECTION_BY_CATEGORY.get(category) !== section
      || typeof candidate.position !== 'number' || !Number.isInteger(candidate.position) || candidate.position < 1 || candidate.position > MAX_PERSONAL_POSITION
      || candidate.isUrgent !== false
      || candidate.source !== 'personal'
      || !Array.isArray(candidate.searchKeywords)
      || candidate.searchKeywords.length > 12
      || candidate.searchKeywords.some((keyword) => !isPlainText(keyword, 1, 40))) {
      throw new Error(`Personal vocabulary item ${index + 1} has invalid metadata.`);
    }
    const recordKey = `${candidate.displayText.trim().toLowerCase()}|${candidate.spokenText.trim().toLowerCase()}|${category}`;
    if (recordKeys.has(recordKey)) {
      throw new Error(`Personal vocabulary item ${index + 1} duplicates an existing vocabulary record.`);
    }
    const symbolMetadata = validateSymbolMetadata(candidate, index);
    ids.add(id);
    recordKeys.add(recordKey);
    return {
      id,
      displayText: candidate.displayText.trim(),
      spokenText: candidate.spokenText.trim(),
      category,
      colorRole: candidate.colorRole,
      itemType,
      searchKeywords: candidate.searchKeywords.map((keyword) => keyword.trim().toLowerCase()),
      position: candidate.position,
      isUrgent: false,
      section,
      source: 'personal' as const,
      ...symbolMetadata,
    };
  });
  const positionGroups = new Map<PersonalCategory, Array<{ item: PersonalVocabularyItem; index: number }>>();
  items.forEach((item, index) => {
    const group = positionGroups.get(item.category) ?? [];
    group.push({ item, index });
    positionGroups.set(item.category, group);
  });
  const normalizedPositions = new Map<string, number>();
  positionGroups.forEach((group) => {
    group
      .sort((first, second) => first.item.position - second.item.position || first.index - second.index)
      .forEach(({ item }, index) => normalizedPositions.set(item.id, index + 1));
  });
  const normalizedItems = items.map((item) => ({ ...item, position: normalizedPositions.get(item.id) ?? item.position }));
  if (getUtf8ByteLength(JSON.stringify(normalizedItems)) > MAX_PERSONAL_VOCABULARY_BYTES) {
    throw new Error('Personal vocabulary is limited to 192 KB on this device.');
  }
  return normalizedItems;
}

export type StoredPersonalVocabulary = {
  items: PersonalVocabularyItem[];
  recoveryMessage: string | null;
};

export function readStoredPersonalVocabulary(): StoredPersonalVocabulary {
  if (typeof window === 'undefined') return { items: [], recoveryMessage: null };
  try {
    return {
      items: validatePersonalVocabulary(JSON.parse(window.localStorage.getItem(PERSONAL_VOCABULARY_STORAGE_KEY) ?? '[]')),
      recoveryMessage: null,
    };
  } catch {
    return {
      items: [],
      recoveryMessage: 'Saved personal vocabulary could not be read, so Clearvoice kept it safely for recovery. You can restore personal vocabulary defaults or import a valid local backup.',
    };
  }
}

export function getSectionForPersonalCategory(category: PersonalCategory): Exclude<VocabularySection, 'Spell'> {
  return SECTION_BY_CATEGORY.get(category) ?? 'Core';
}

export function getNextPersonalPosition(items: PersonalVocabularyItem[], category: PersonalCategory): number {
  return Math.max(0, ...items.filter((item) => item.category === category).map((item) => item.position)) + 1;
}

export function createPersonalVocabularyItem(input: {
  id: string;
  displayText: string;
  spokenText?: string;
  itemType: PersonalItemType;
  category: PersonalCategory;
  colorRole: VocabularyColorRole;
  searchKeywords: string[];
  position: number;
} & Partial<VocabularySymbolMetadata>): PersonalVocabularyItem {
  const section = getSectionForPersonalCategory(input.category);
  const symbolMetadata = Object.fromEntries(
    SYMBOL_METADATA_KEYS
      .filter((key) => input[key] !== undefined)
      .map((key) => [key, input[key]]),
  ) as Partial<VocabularySymbolMetadata>;
  return {
    id: input.id,
    displayText: input.displayText.trim(),
    spokenText: input.spokenText?.trim() || input.displayText.trim(),
    category: input.category,
    colorRole: input.colorRole,
    itemType: input.itemType,
    searchKeywords: input.searchKeywords.map((keyword) => keyword.trim().toLowerCase()).filter(Boolean),
    position: input.position,
    isUrgent: false,
    section,
    source: 'personal',
    ...symbolMetadata,
  };
}

export function makeLocalDataExport(preferences: AccessibilityPreferences, personalVocabulary: PersonalVocabularyItem[]): string {
  const validatedPreferences = parsePreferences(preferences, true);
  const validatedPersonalVocabulary = validatePersonalVocabulary(personalVocabulary);
  return JSON.stringify({
    schema: LOCAL_DATA_SCHEMA,
    version: LOCAL_DATA_VERSION,
    preferences: validatedPreferences,
    personalVocabulary: validatedPersonalVocabulary,
  }, null, 2);
}

export function parseLocalDataExport(text: string): { preferences: AccessibilityPreferences; personalVocabulary: PersonalVocabularyItem[] } {
  const textBytes = typeof text === 'string' && typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(text).byteLength : typeof text === 'string' ? text.length : 0;
  if (typeof text !== 'string' || textBytes > MAX_LOCAL_DATA_BYTES) {
    throw new Error('That file is too large. Choose a Clearvoice JSON export under 256 KB.');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (!isRecord(parsed)) throw new Error('The Clearvoice export must be a JSON object.');
  assertExactKeys(parsed, ['schema', 'version', 'preferences', 'personalVocabulary'], 'Clearvoice export');
  if (hasUnsafeText(parsed, true)) throw new Error('Only plain Clearvoice JSON exports are allowed.');
  if (parsed.schema !== LOCAL_DATA_SCHEMA || parsed.version !== LOCAL_DATA_VERSION) {
    throw new Error('This Clearvoice export version is not supported.');
  }
  const preferences = parsePreferences(parsed.preferences, true);
  const personalVocabulary = validatePersonalVocabulary(parsed.personalVocabulary);
  return { preferences, personalVocabulary };
}