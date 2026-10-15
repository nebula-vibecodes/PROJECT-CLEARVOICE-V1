export type VocabularySection = 'Core' | 'Quick Phrases' | 'More' | 'Spell';

export type VocabularyCategory =
  | 'core'
  | 'quick-phrases'
  | 'people'
  | 'food'
  | 'places'
  | 'activities'
  | 'home'
  | 'school-work'
  | 'feelings'
  | 'personal-items'
  | 'health'
  | 'spell';

export type VocabularyColorRole = 'teal' | 'sand' | 'coral' | 'blue';

export type VocabularyItemType = 'word' | 'phrase' | 'category' | 'letter';
export type VocabularySource = 'default' | 'personal';

export type VocabularySymbolMetadata = {
  symbolAssetId?: string;
  symbolAssetLocation?: string;
  symbolDescription?: string;
  symbolSource?: string;
  symbolCreator?: string;
  symbolLicenseId?: string;
  symbolLicenseUrl?: string;
  symbolModified?: boolean;
  symbolSourceAssets?: string[];
};

import { starterSymbolMetadata } from '@/data/symbols';

export function isLocalSymbolAssetLocation(location: string): boolean {
  return location.length > 0
    && !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(location)
    && !location.includes('\\')
    && !location.split('/').includes('..');
}

export type VocabularyItem = {
  id: string;
  displayText: string;
  spokenText: string;
  symbol?: string;
  symbolAssetId?: string;
  symbolAssetLocation?: string;
  symbolDescription?: string;
  symbolSource?: string;
  symbolCreator?: string;
  symbolLicenseId?: string;
  symbolLicenseUrl?: string;
  symbolModified?: boolean;
  symbolSourceAssets?: string[];
  category: VocabularyCategory;
  colorRole: VocabularyColorRole;
  itemType: VocabularyItemType;
  searchKeywords: string[];
  position: number;
  isUrgent: boolean;
  section: VocabularySection;
  source?: VocabularySource;
  detail?: string;
};

export type VocabularySectionDefinition = {
  id: VocabularySection;
  label: VocabularySection;
  description: string;
};

type WordSeed = readonly [
  id: string,
  displayText: string,
  spokenText: string,
  colorRole: VocabularyColorRole,
  position: number,
  isUrgent: boolean,
  searchKeywords?: string[],
];

export type TopicCategory = Exclude<VocabularyCategory, 'core' | 'quick-phrases' | 'spell'>;

type MoreCategorySeed = readonly [
  id: TopicCategory,
  displayText: string,
  spokenText: string,
  colorRole: VocabularyColorRole,
  position: number,
  isUrgent: boolean,
  detail: string,
];

export type VocabularyTopicDefinition = {
  label: string;
  description: string;
  context: string;
};

type TopicWordSeed = {
  id: string;
  displayText: string;
  spokenText?: string;
  colorRole: VocabularyColorRole;
  itemType: 'word' | 'phrase';
  position: number;
  isUrgent?: boolean;
  detail?: string;
  searchKeywords?: string[];
};

export const vocabularySections: VocabularySectionDefinition[] = [
  { id: 'Core', label: 'Core', description: 'High-frequency words' },
  { id: 'Quick Phrases', label: 'Quick Phrases', description: 'Add a phrase, then review before speaking' },
  { id: 'More', label: 'More', description: 'Topic categories' },
  { id: 'Spell', label: 'Spell', description: 'Build a word letter by letter' },
];

const coreWords: VocabularyItem[] = ([
  ['i', 'I', 'I', 'teal', 1, false],
  ['you', 'you', 'you', 'sand', 2, false],
  ['want', 'want', 'want', 'coral', 3, false],
  ['need', 'need', 'need', 'blue', 4, false],
  ['more', 'more', 'more', 'teal', 5, false],
  ['help', 'help', 'help', 'coral', 6, true],
  ['go', 'go', 'go', 'sand', 7, false],
  ['stop', 'stop', 'stop', 'coral', 8, true],
  ['like', 'like', 'like', 'blue', 9, false],
  ['not', 'not', 'not', 'teal', 10, false],
  ['that', 'that', 'that', 'sand', 11, false],
  ['it', 'it', 'it', 'blue', 12, false],
  ['what', 'what', 'what', 'coral', 13, false],
  ['where', 'where', 'where', 'teal', 14, false],
  ['good', 'good', 'good', 'sand', 15, false],
  ['bad', 'bad', 'bad', 'coral', 16, false],
  ['yes', 'yes', 'yes', 'blue', 17, false],
  ['no', 'no', 'no', 'coral', 18, false],
  ['feel', 'feel', 'feel', 'teal', 19, false],
  ['different', 'different', 'different', 'sand', 20, false],
  ['can', 'can', 'can', 'teal', 21, false, ['can', 'able', 'possible']],
  ['do', 'do', 'do', 'sand', 22, false, ['do', 'action', 'make happen']],
  ['have', 'have', 'have', 'coral', 23, false, ['have', 'own', 'with me']],
  ['make', 'make', 'make', 'blue', 24, false, ['make', 'create', 'build']],
  ['get', 'get', 'get', 'teal', 25, false, ['get', 'receive', 'bring']],
  ['give', 'give', 'give', 'sand', 26, false, ['give', 'hand', 'offer']],
  ['come', 'come', 'come', 'coral', 27, false, ['come', 'arrive', 'join']],
  ['look', 'look', 'look', 'blue', 28, false, ['look', 'see', 'watch']],
  ['again', 'again', 'again', 'teal', 29, false, ['again', 'repeat', 'another time']],
  ] satisfies WordSeed[]).map(([id, displayText, spokenText, colorRole, position, isUrgent, searchKeywords]) => ({
  id,
  displayText,
  spokenText,
  category: 'core',
  colorRole,
  itemType: 'word',
  searchKeywords: searchKeywords ?? [displayText.toLowerCase()],
  position,
  isUrgent,
  section: 'Core',
}));

const quickPhrases: VocabularyItem[] = ([
  ['i-need-help', 'I need help', 'I need help', 'coral', 1, true],
  ['please-stop', 'Please stop', 'Please stop', 'coral', 2, true],
  ['give-me-a-minute', 'Give me a minute', 'Give me a minute', 'teal', 3, false],
  ['i-dont-know', 'I don’t know', 'I do not know', 'blue', 4, false],
  ['i-need-a-break', 'I need a break', 'I need a break', 'sand', 5, true],
  ['im-uncomfortable', 'I’m uncomfortable', 'I am uncomfortable', 'coral', 6, true],
  ['too-loud', 'Too loud', 'It is too loud', 'blue', 7, true],
  ['too-bright', 'Too bright', 'It is too bright', 'sand', 8, false],
  ['not-that', 'Not that', 'Not that one', 'teal', 9, false],
  ['say-it-again', 'Say it again', 'Say it again', 'blue', 10, false],
  ['slower-please', 'Slower, please', 'Slower, please', 'teal', 11, false],
  ['i-cant-understand', 'I can’t understand', 'I cannot understand', 'blue', 12, false],
  ['yes-please', 'Yes, please', 'Yes, please', 'teal', 13, false],
  ['no-thank-you', 'No, thank you', 'No, thank you', 'sand', 14, false],
  ['i-am-hurt', 'I am hurt', 'I am hurt', 'coral', 15, true],
  ['call-my-caregiver', 'Call my caregiver', 'Call my caregiver', 'coral', 16, true],
 ] satisfies WordSeed[]).map(([id, displayText, spokenText, colorRole, position, isUrgent]) => ({
  id,
  displayText,
  spokenText,
  category: 'quick-phrases',
  colorRole,
  itemType: 'phrase',
  searchKeywords: displayText.toLowerCase().split(/\s+/),
  position,
  isUrgent,
  section: 'Quick Phrases',
}));

export const moreTopicDefinitions: Record<TopicCategory, VocabularyTopicDefinition> = {
  people: {
    label: 'People',
    description: 'People you may want to name, greet, or ask for.',
    context: 'Choose a person or relationship to add to your message.',
  },
  food: {
    label: 'Food',
    description: 'Meals, drinks, and simple food preferences.',
    context: 'Use these words for eating, drinking, and food choices.',
  },
  places: {
    label: 'Places',
    description: 'Familiar places and destinations.',
    context: 'Choose where you are, where you want to go, or where to meet.',
  },
  activities: {
    label: 'Activities',
    description: 'Things to do, enjoy, or pause.',
    context: 'Choose an activity, a break, or something you want to do next.',
  },
  home: {
    label: 'Home',
    description: 'Rooms, routines, and helpful things at home.',
    context: 'Use these words for home routines, objects, and requests.',
  },
  'school-work': {
    label: 'School or work',
    description: 'People, places, and routines for school or work.',
    context: 'Choose something about your class, job, task, or break.',
  },
  feelings: {
    label: 'Feelings',
    description: 'Words for emotions, comfort, and how you feel.',
    context: 'Choose a feeling or tell someone how your body and mind are doing.',
  },
  'personal-items': {
    label: 'Personal items',
    description: 'Things you use, carry, or want nearby.',
    context: 'Choose an item you need, want, or want someone to find.',
  },
  health: {
    label: 'Health',
    description: 'Body words, care, comfort, and health needs.',
    context: 'Use these words to describe your body or ask for care.',
  },
};

const moreCategories: VocabularyItem[] = ([
  ['people', 'People', 'People', 'teal', 1, false, 'people and names'],
  ['food', 'Food', 'Food', 'sand', 2, false, 'meals and drinks'],
  ['places', 'Places', 'Places', 'blue', 3, false, 'where to go'],
  ['activities', 'Activities', 'Activities', 'coral', 4, false, 'things to do'],
  ['home', 'Home', 'Home', 'teal', 5, false, 'things at home'],
  ['school-work', 'School or work', 'School or work', 'sand', 6, false, 'places and routines'],
  ['feelings', 'Feelings', 'Feelings', 'coral', 7, false, 'how I feel'],
  ['personal-items', 'Personal items', 'Personal items', 'blue', 8, false, 'things that belong to me'],
  ['health', 'Health', 'Health', 'coral', 9, false, 'body and care'],
 ] satisfies MoreCategorySeed[]).map(([id, displayText, spokenText, colorRole, position, isUrgent, detail]) => ({
  id,
  displayText,
  spokenText,
  category: id,
  colorRole,
  itemType: 'category',
  searchKeywords: displayText.toLowerCase().split(/\s+/),
  position,
  isUrgent,
  section: 'More',
  detail,
}));

const topicWordSeeds: Record<TopicCategory, readonly TopicWordSeed[]> = {
  people: [
    { id: 'people-parent', displayText: 'Parent', colorRole: 'teal', itemType: 'word', position: 1 },
    { id: 'people-caregiver', displayText: 'Caregiver', colorRole: 'sand', itemType: 'word', position: 2 },
    { id: 'people-friend', displayText: 'Friend', colorRole: 'blue', itemType: 'word', position: 3 },
    { id: 'people-family', displayText: 'Family', colorRole: 'coral', itemType: 'word', position: 4 },
    { id: 'people-teacher', displayText: 'Teacher', colorRole: 'teal', itemType: 'word', position: 5 },
    { id: 'people-doctor', displayText: 'Doctor', colorRole: 'sand', itemType: 'word', position: 6 },
    { id: 'people-nurse', displayText: 'Nurse', colorRole: 'blue', itemType: 'word', position: 7 },
    { id: 'people-someone', displayText: 'Someone', colorRole: 'coral', itemType: 'word', position: 8 },
    { id: 'people-my-turn', displayText: 'My turn', colorRole: 'teal', itemType: 'phrase', position: 9 },
    { id: 'people-with-me', displayText: 'Come with me', colorRole: 'sand', itemType: 'phrase', position: 10 },
    { id: 'people-sibling', displayText: 'Sibling', colorRole: 'blue', itemType: 'word', position: 11, searchKeywords: ['sibling', 'brother', 'sister', 'family'] },
    { id: 'people-neighbor', displayText: 'Neighbor', colorRole: 'coral', itemType: 'word', position: 12, searchKeywords: ['neighbor', 'neighbour', 'nearby person'] },
    { id: 'people-hello', displayText: 'Hello', colorRole: 'teal', itemType: 'phrase', position: 13, searchKeywords: ['hello', 'hi', 'greeting'] },
    { id: 'people-please-wait', displayText: 'Please wait', colorRole: 'sand', itemType: 'phrase', position: 14, searchKeywords: ['please wait', 'hold on', 'pause'] },
    { id: 'people-i-want-to-see-someone', displayText: 'I want to see someone.', spokenText: 'I want to see someone.', colorRole: 'blue', itemType: 'phrase', position: 15, searchKeywords: ['i want to see someone', 'see someone', 'person'] },
    { id: 'people-please-stay-with-me', displayText: 'Please stay with me.', spokenText: 'Please stay with me.', colorRole: 'coral', itemType: 'phrase', position: 16, searchKeywords: ['please stay with me', 'stay', 'companionship'] },
    { id: 'people-who-is-here', displayText: 'Who is here?', spokenText: 'Who is here?', colorRole: 'teal', itemType: 'phrase', position: 17, searchKeywords: ['who is here', 'who', 'person here'] },
    { id: 'people-nice-to-see-you', displayText: 'Nice to see you.', spokenText: 'Nice to see you.', colorRole: 'sand', itemType: 'phrase', position: 18, searchKeywords: ['nice to see you', 'greeting', 'hello response'] },
  ],
  food: [
    { id: 'food-water', displayText: 'Water', colorRole: 'blue', itemType: 'word', position: 1 },
    { id: 'food-drink', displayText: 'Drink', colorRole: 'teal', itemType: 'word', position: 2 },
    { id: 'food-breakfast', displayText: 'Breakfast', colorRole: 'sand', itemType: 'word', position: 3 },
    { id: 'food-lunch', displayText: 'Lunch', colorRole: 'coral', itemType: 'word', position: 4 },
    { id: 'food-dinner', displayText: 'Dinner', colorRole: 'blue', itemType: 'word', position: 5 },
    { id: 'food-snack', displayText: 'Snack', colorRole: 'teal', itemType: 'word', position: 6 },
    { id: 'food-hungry', displayText: 'Hungry', colorRole: 'sand', itemType: 'word', position: 7 },
    { id: 'food-thirsty', displayText: 'Thirsty', colorRole: 'coral', itemType: 'word', position: 8 },
    { id: 'food-hot', displayText: 'Hot', colorRole: 'blue', itemType: 'word', position: 9 },
    { id: 'food-cold', displayText: 'Cold', colorRole: 'teal', itemType: 'word', position: 10 },
    { id: 'food-more-please', displayText: 'More, please', colorRole: 'sand', itemType: 'phrase', position: 11 },
    { id: 'food-all-done', displayText: 'All done', colorRole: 'coral', itemType: 'phrase', position: 12 },
    { id: 'food-eat', displayText: 'Eat', colorRole: 'blue', itemType: 'word', position: 13, searchKeywords: ['eat', 'eating', 'have food'] },
    { id: 'food-taste', displayText: 'Taste', colorRole: 'teal', itemType: 'word', position: 14, searchKeywords: ['taste', 'flavor', 'try food'] },
    { id: 'food-that-one-please', displayText: 'That one, please', colorRole: 'sand', itemType: 'phrase', position: 15, searchKeywords: ['that one please', 'choose', 'select food'] },
    { id: 'food-i-am-full', displayText: 'I am full', colorRole: 'coral', itemType: 'phrase', position: 16, searchKeywords: ['i am full', 'full', 'finished eating'] },
    { id: 'food-can-i-have-this', displayText: 'Can I have this?', spokenText: 'Can I have this?', colorRole: 'blue', itemType: 'phrase', position: 17, searchKeywords: ['can i have this', 'request food', 'ask for food'] },
    { id: 'food-please-help-me-choose', displayText: 'Please help me choose.', spokenText: 'Please help me choose.', colorRole: 'teal', itemType: 'phrase', position: 18, searchKeywords: ['please help me choose', 'choose food', 'food decision'] },
    { id: 'food-this-is-not-what-i-want', displayText: 'This is not what I want.', spokenText: 'This is not what I want.', colorRole: 'sand', itemType: 'phrase', position: 19, searchKeywords: ['this is not what i want', 'wrong food', 'reject food'] },
    { id: 'food-i-am-still-hungry', displayText: 'I am still hungry.', spokenText: 'I am still hungry.', colorRole: 'coral', itemType: 'phrase', position: 20, searchKeywords: ['i am still hungry', 'still hungry', 'need more food'] },
  ],
  places: [
    { id: 'places-home', displayText: 'Home', colorRole: 'teal', itemType: 'word', position: 1 },
    { id: 'places-school', displayText: 'School', colorRole: 'sand', itemType: 'word', position: 2 },
    { id: 'places-work', displayText: 'Work', colorRole: 'blue', itemType: 'word', position: 3 },
    { id: 'places-bathroom', displayText: 'Bathroom', colorRole: 'coral', itemType: 'word', position: 4 },
    { id: 'places-outside', displayText: 'Outside', colorRole: 'teal', itemType: 'word', position: 5 },
    { id: 'places-room', displayText: 'Room', colorRole: 'sand', itemType: 'word', position: 6 },
    { id: 'places-store', displayText: 'Store', colorRole: 'blue', itemType: 'word', position: 7 },
    { id: 'places-park', displayText: 'Park', colorRole: 'coral', itemType: 'word', position: 8 },
    { id: 'places-here', displayText: 'Here', colorRole: 'teal', itemType: 'word', position: 9 },
    { id: 'places-there', displayText: 'There', colorRole: 'sand', itemType: 'word', position: 10 },
    { id: 'places-where-next', displayText: 'Where next?', colorRole: 'blue', itemType: 'phrase', position: 11 },
    { id: 'places-inside', displayText: 'Inside', colorRole: 'coral', itemType: 'word', position: 12, searchKeywords: ['inside', 'indoors', 'in'] },
    { id: 'places-near', displayText: 'Near', colorRole: 'teal', itemType: 'word', position: 13, searchKeywords: ['near', 'close', 'nearby'] },
    { id: 'places-far', displayText: 'Far', colorRole: 'sand', itemType: 'word', position: 14, searchKeywords: ['far', 'away', 'distant'] },
    { id: 'places-take-me-there', displayText: 'Take me there', colorRole: 'blue', itemType: 'phrase', position: 15, searchKeywords: ['take me there', 'go there', 'bring me'] },
    { id: 'places-where-are-we-going', displayText: 'Where are we going?', spokenText: 'Where are we going?', colorRole: 'coral', itemType: 'phrase', position: 16, searchKeywords: ['where are we going', 'destination', 'where'] },
    { id: 'places-i-want-to-go-home', displayText: 'I want to go home.', spokenText: 'I want to go home.', colorRole: 'teal', itemType: 'phrase', position: 17, searchKeywords: ['i want to go home', 'go home', 'home request'] },
    { id: 'places-please-help-me-find-it', displayText: 'Please help me find it.', spokenText: 'Please help me find it.', colorRole: 'sand', itemType: 'phrase', position: 18, searchKeywords: ['please help me find it', 'find it', 'locate'] },
    { id: 'places-is-it-close', displayText: 'Is it close?', spokenText: 'Is it close?', colorRole: 'blue', itemType: 'phrase', position: 19, searchKeywords: ['is it close', 'nearby', 'distance'] },
  ],
  activities: [
    { id: 'activities-play', displayText: 'Play', colorRole: 'coral', itemType: 'word', position: 1 },
    { id: 'activities-read', displayText: 'Read', colorRole: 'teal', itemType: 'word', position: 2 },
    { id: 'activities-watch', displayText: 'Watch', colorRole: 'sand', itemType: 'word', position: 3 },
    { id: 'activities-listen', displayText: 'Listen', colorRole: 'blue', itemType: 'word', position: 4 },
    { id: 'activities-music', displayText: 'Music', colorRole: 'coral', itemType: 'word', position: 5 },
    { id: 'activities-draw', displayText: 'Draw', colorRole: 'teal', itemType: 'word', position: 6 },
    { id: 'activities-walk', displayText: 'Walk', colorRole: 'sand', itemType: 'word', position: 7 },
    { id: 'activities-rest', displayText: 'Rest', colorRole: 'blue', itemType: 'word', position: 8 },
    { id: 'activities-go-outside', displayText: 'Go outside', colorRole: 'coral', itemType: 'phrase', position: 9 },
    { id: 'activities-my-turn', displayText: 'My turn', colorRole: 'teal', itemType: 'phrase', position: 10 },
    { id: 'activities-wait', displayText: 'Wait', colorRole: 'sand', itemType: 'word', position: 11, searchKeywords: ['wait', 'pause', 'hold'] },
    { id: 'activities-start', displayText: 'Start', colorRole: 'blue', itemType: 'word', position: 12, searchKeywords: ['start', 'begin', 'go'] },
    { id: 'activities-finish', displayText: 'Finish', colorRole: 'coral', itemType: 'word', position: 13, searchKeywords: ['finish', 'end', 'done'] },
    { id: 'activities-i-want-to-join', displayText: 'I want to join', colorRole: 'teal', itemType: 'phrase', position: 14, searchKeywords: ['i want to join', 'join', 'participate'] },
    { id: 'activities-i-need-more-time', displayText: 'I need more time.', spokenText: 'I need more time.', colorRole: 'sand', itemType: 'phrase', position: 15, searchKeywords: ['i need more time', 'more time', 'not ready'] },
    { id: 'activities-i-want-to-do-something-else', displayText: 'I want to do something else.', spokenText: 'I want to do something else.', colorRole: 'blue', itemType: 'phrase', position: 16, searchKeywords: ['i want to do something else', 'different activity', 'change activity'] },
    { id: 'activities-what-should-we-do', displayText: 'What should we do?', spokenText: 'What should we do?', colorRole: 'coral', itemType: 'phrase', position: 17, searchKeywords: ['what should we do', 'what next', 'activity question'] },
    { id: 'activities-can-we-do-this-later', displayText: 'Can we do this later?', spokenText: 'Can we do this later?', colorRole: 'teal', itemType: 'phrase', position: 18, searchKeywords: ['can we do this later', 'later', 'postpone activity'] },
  ],
  home: [
    { id: 'home-bed', displayText: 'Bed', colorRole: 'teal', itemType: 'word', position: 1 },
    { id: 'home-bathroom', displayText: 'Bathroom', colorRole: 'sand', itemType: 'word', position: 2 },
    { id: 'home-kitchen', displayText: 'Kitchen', colorRole: 'blue', itemType: 'word', position: 3 },
    { id: 'home-door', displayText: 'Door', colorRole: 'coral', itemType: 'word', position: 4 },
    { id: 'home-light', displayText: 'Light', colorRole: 'teal', itemType: 'word', position: 5 },
    { id: 'home-tv', displayText: 'TV', colorRole: 'sand', itemType: 'word', position: 6 },
    { id: 'home-clothes', displayText: 'Clothes', colorRole: 'blue', itemType: 'word', position: 7 },
    { id: 'home-blanket', displayText: 'Blanket', colorRole: 'coral', itemType: 'word', position: 8 },
    { id: 'home-open', displayText: 'Open it', colorRole: 'teal', itemType: 'phrase', position: 9 },
    { id: 'home-close', displayText: 'Close it', colorRole: 'sand', itemType: 'phrase', position: 10 },
    { id: 'home-chair', displayText: 'Chair', colorRole: 'blue', itemType: 'word', position: 11, searchKeywords: ['chair', 'seat', 'sit'] },
    { id: 'home-window', displayText: 'Window', colorRole: 'coral', itemType: 'word', position: 12, searchKeywords: ['window', 'outside view'] },
    { id: 'home-clean', displayText: 'Clean', colorRole: 'teal', itemType: 'word', position: 13, searchKeywords: ['clean', 'clean up', 'tidy'] },
    { id: 'home-turn-it-on', displayText: 'Please turn it on', colorRole: 'sand', itemType: 'phrase', position: 14, searchKeywords: ['please turn it on', 'turn on', 'switch on'] },
    { id: 'home-i-want-to-sit-here', displayText: 'I want to sit here.', spokenText: 'I want to sit here.', colorRole: 'blue', itemType: 'phrase', position: 15, searchKeywords: ['i want to sit here', 'sit here', 'seat request'] },
    { id: 'home-please-turn-it-off', displayText: 'Please turn it off.', spokenText: 'Please turn it off.', colorRole: 'coral', itemType: 'phrase', position: 16, searchKeywords: ['please turn it off', 'turn off', 'switch off'] },
    { id: 'home-can-you-help-me-with-this', displayText: 'Can you help me with this?', spokenText: 'Can you help me with this?', colorRole: 'teal', itemType: 'phrase', position: 17, searchKeywords: ['can you help me with this', 'help with this', 'assistance'] },
    { id: 'home-i-want-it-here', displayText: 'I want it here.', spokenText: 'I want it here.', colorRole: 'sand', itemType: 'phrase', position: 18, searchKeywords: ['i want it here', 'put here', 'location request'] },
  ],
  'school-work': [
    { id: 'school-work-class', displayText: 'Class', colorRole: 'blue', itemType: 'word', position: 1 },
    { id: 'school-work-break', displayText: 'Break', colorRole: 'teal', itemType: 'word', position: 2 },
    { id: 'school-work-teacher', displayText: 'Teacher', colorRole: 'sand', itemType: 'word', position: 3 },
    { id: 'school-work-coworker', displayText: 'Coworker', colorRole: 'coral', itemType: 'word', position: 4 },
    { id: 'school-work-computer', displayText: 'Computer', colorRole: 'blue', itemType: 'word', position: 5 },
    { id: 'school-work-paper', displayText: 'Paper', colorRole: 'teal', itemType: 'word', position: 6 },
    { id: 'school-work-meeting', displayText: 'Meeting', colorRole: 'sand', itemType: 'word', position: 7 },
    { id: 'school-work-task', displayText: 'Task', colorRole: 'coral', itemType: 'word', position: 8 },
    { id: 'school-work-finished', displayText: 'Finished', colorRole: 'blue', itemType: 'word', position: 9 },
    { id: 'school-work-help-please', displayText: 'Help, please', colorRole: 'coral', itemType: 'phrase', position: 10 },
    { id: 'school-work-desk', displayText: 'Desk', colorRole: 'teal', itemType: 'word', position: 11, searchKeywords: ['desk', 'workspace', 'table'] },
    { id: 'school-work-write', displayText: 'Write', colorRole: 'sand', itemType: 'word', position: 12, searchKeywords: ['write', 'writing', 'put on paper'] },
    { id: 'school-work-read-this', displayText: 'Read this', colorRole: 'blue', itemType: 'phrase', position: 13, searchKeywords: ['read this', 'look at this', 'review'] },
    { id: 'school-work-i-am-ready', displayText: 'I am ready', colorRole: 'coral', itemType: 'phrase', position: 14, searchKeywords: ['i am ready', 'ready', 'prepared'] },
    { id: 'school-work-please-explain-that', displayText: 'Please explain that.', spokenText: 'Please explain that.', colorRole: 'teal', itemType: 'phrase', position: 15, searchKeywords: ['please explain that', 'explain', 'clarify'] },
    { id: 'school-work-can-you-show-me', displayText: 'Can you show me?', spokenText: 'Can you show me?', colorRole: 'sand', itemType: 'phrase', position: 16, searchKeywords: ['can you show me', 'demonstrate', 'help me learn'] },
    { id: 'school-work-i-want-a-different-task', displayText: 'I want a different task.', spokenText: 'I want a different task.', colorRole: 'blue', itemType: 'phrase', position: 17, searchKeywords: ['i want a different task', 'different assignment', 'new task'] },
    { id: 'school-work-what-comes-next', displayText: 'What comes next?', spokenText: 'What comes next?', colorRole: 'coral', itemType: 'phrase', position: 18, searchKeywords: ['what comes next', 'next step', 'what now'] },
  ],
  feelings: [
    { id: 'feelings-happy', displayText: 'Happy', colorRole: 'teal', itemType: 'word', position: 1 },
    { id: 'feelings-sad', displayText: 'Sad', colorRole: 'blue', itemType: 'word', position: 2 },
    { id: 'feelings-worried', displayText: 'Worried', colorRole: 'sand', itemType: 'word', position: 3 },
    { id: 'feelings-angry', displayText: 'Angry', colorRole: 'coral', itemType: 'word', position: 4 },
    { id: 'feelings-calm', displayText: 'Calm', colorRole: 'teal', itemType: 'word', position: 5 },
    { id: 'feelings-tired', displayText: 'Tired', colorRole: 'blue', itemType: 'word', position: 6 },
    { id: 'feelings-excited', displayText: 'Excited', colorRole: 'sand', itemType: 'word', position: 7 },
    { id: 'feelings-bored', displayText: 'Bored', colorRole: 'coral', itemType: 'word', position: 8 },
    { id: 'feelings-uncomfortable', displayText: 'Uncomfortable', colorRole: 'blue', itemType: 'word', position: 9 },
    { id: 'feelings-okay', displayText: 'I am okay', colorRole: 'teal', itemType: 'phrase', position: 10 },
    { id: 'feelings-proud', displayText: 'Proud', colorRole: 'sand', itemType: 'word', position: 11, searchKeywords: ['proud', 'pleased', 'good about myself'] },
    { id: 'feelings-confused', displayText: 'Confused', colorRole: 'coral', itemType: 'word', position: 12, searchKeywords: ['confused', 'do not understand', 'unclear'] },
    { id: 'feelings-i-feel-better', displayText: 'I feel better', colorRole: 'teal', itemType: 'phrase', position: 13, searchKeywords: ['i feel better', 'better', 'improving'] },
    { id: 'feelings-i-need-quiet', displayText: 'I need quiet', colorRole: 'blue', itemType: 'phrase', position: 14, searchKeywords: ['i need quiet', 'quiet', 'silence', 'calm'] },
    { id: 'feelings-i-feel-unsure', displayText: 'I feel unsure.', spokenText: 'I feel unsure.', colorRole: 'sand', itemType: 'phrase', position: 15, searchKeywords: ['i feel unsure', 'unsure', 'uncertain'] },
    { id: 'feelings-i-feel-overwhelmed', displayText: 'I feel overwhelmed.', spokenText: 'I feel overwhelmed.', colorRole: 'coral', itemType: 'phrase', position: 16, searchKeywords: ['i feel overwhelmed', 'overwhelmed', 'too much'] },
    { id: 'feelings-i-want-to-be-alone', displayText: 'I want to be alone.', spokenText: 'I want to be alone.', colorRole: 'teal', itemType: 'phrase', position: 17, searchKeywords: ['i want to be alone', 'alone', 'private'] },
    { id: 'feelings-i-want-to-talk', displayText: 'I want to talk.', spokenText: 'I want to talk.', colorRole: 'blue', itemType: 'phrase', position: 18, searchKeywords: ['i want to talk', 'talk', 'conversation'] },
  ],
  'personal-items': [
    { id: 'personal-items-phone', displayText: 'Phone', colorRole: 'blue', itemType: 'word', position: 1 },
    { id: 'personal-items-tablet', displayText: 'Tablet', colorRole: 'teal', itemType: 'word', position: 2 },
    { id: 'personal-items-glasses', displayText: 'Glasses', colorRole: 'sand', itemType: 'word', position: 3 },
    { id: 'personal-items-shoes', displayText: 'Shoes', colorRole: 'coral', itemType: 'word', position: 4 },
    { id: 'personal-items-bag', displayText: 'Bag', colorRole: 'blue', itemType: 'word', position: 5 },
    { id: 'personal-items-keys', displayText: 'Keys', colorRole: 'teal', itemType: 'word', position: 6 },
    { id: 'personal-items-toy', displayText: 'Toy', colorRole: 'sand', itemType: 'word', position: 7 },
    { id: 'personal-items-book', displayText: 'Book', colorRole: 'coral', itemType: 'word', position: 8 },
    { id: 'personal-items-charger', displayText: 'Charger', colorRole: 'blue', itemType: 'word', position: 9 },
    { id: 'personal-items-my-things', displayText: 'My things', colorRole: 'teal', itemType: 'phrase', position: 10 },
    { id: 'personal-items-headphones', displayText: 'Headphones', colorRole: 'sand', itemType: 'word', position: 11, searchKeywords: ['headphones', 'earphones', 'headset'] },
    { id: 'personal-items-wallet', displayText: 'Wallet', colorRole: 'coral', itemType: 'word', position: 12, searchKeywords: ['wallet', 'money holder', 'purse'] },
    { id: 'personal-items-i-need-this', displayText: 'I need this', colorRole: 'blue', itemType: 'phrase', position: 13, searchKeywords: ['i need this', 'need item', 'need that'] },
    { id: 'personal-items-please-bring-it', displayText: 'Please bring it', colorRole: 'teal', itemType: 'phrase', position: 14, searchKeywords: ['please bring it', 'bring', 'get it for me'] },
    { id: 'personal-items-please-put-it-here', displayText: 'Please put it here.', spokenText: 'Please put it here.', colorRole: 'sand', itemType: 'phrase', position: 15, searchKeywords: ['please put it here', 'put here', 'place item'] },
    { id: 'personal-items-can-i-use-it', displayText: 'Can I use it?', spokenText: 'Can I use it?', colorRole: 'coral', itemType: 'phrase', position: 16, searchKeywords: ['can i use it', 'use item', 'permission'] },
    { id: 'personal-items-please-keep-it-nearby', displayText: 'Please keep it nearby.', spokenText: 'Please keep it nearby.', colorRole: 'blue', itemType: 'phrase', position: 17, searchKeywords: ['please keep it nearby', 'nearby item', 'keep close'] },
    { id: 'personal-items-which-one-is-mine', displayText: 'Which one is mine?', spokenText: 'Which one is mine?', colorRole: 'teal', itemType: 'phrase', position: 18, searchKeywords: ['which one is mine', 'mine', 'choose item'] },
  ],
  health: [
    { id: 'health-hurt', displayText: 'Hurt', colorRole: 'coral', itemType: 'word', position: 1, isUrgent: true },
    { id: 'health-pain', displayText: 'Pain', colorRole: 'coral', itemType: 'word', position: 2, isUrgent: true },
    { id: 'health-sick', displayText: 'Sick', colorRole: 'sand', itemType: 'word', position: 3 },
    { id: 'health-medicine', displayText: 'Medicine', colorRole: 'blue', itemType: 'word', position: 4 },
    { id: 'health-doctor', displayText: 'Doctor', colorRole: 'teal', itemType: 'word', position: 5 },
    { id: 'health-nurse', displayText: 'Nurse', colorRole: 'sand', itemType: 'word', position: 6 },
    { id: 'health-breathe', displayText: 'Breathe', colorRole: 'blue', itemType: 'word', position: 7 },
    { id: 'health-rest', displayText: 'Rest', colorRole: 'teal', itemType: 'word', position: 8 },
    { id: 'health-head', displayText: 'Head', colorRole: 'coral', itemType: 'word', position: 9 },
    { id: 'health-stomach', displayText: 'Stomach', colorRole: 'sand', itemType: 'word', position: 10 },
    { id: 'health-i-need-care', displayText: 'I need care', colorRole: 'coral', itemType: 'phrase', position: 11, isUrgent: true },
    { id: 'health-dizzy', displayText: 'Dizzy', colorRole: 'blue', itemType: 'word', position: 12, searchKeywords: ['dizzy', 'lightheaded', 'spinning'] },
    { id: 'health-fever', displayText: 'Fever', colorRole: 'sand', itemType: 'word', position: 13, searchKeywords: ['fever', 'temperature', 'hot body'] },
    { id: 'health-i-need-water', displayText: 'I need water', colorRole: 'teal', itemType: 'phrase', position: 14, searchKeywords: ['i need water', 'water', 'thirsty'] },
    { id: 'health-please-be-gentle', displayText: 'Please be gentle', colorRole: 'coral', itemType: 'phrase', position: 15, searchKeywords: ['please be gentle', 'gentle', 'careful'] },
    { id: 'health-it-hurts-here', displayText: 'It hurts here.', spokenText: 'It hurts here.', colorRole: 'coral', itemType: 'phrase', position: 16, isUrgent: true, searchKeywords: ['it hurts here', 'pain here', 'hurt location'] },
    { id: 'health-i-feel-sick', displayText: 'I feel sick.', spokenText: 'I feel sick.', colorRole: 'sand', itemType: 'phrase', position: 17, searchKeywords: ['i feel sick', 'sick', 'unwell'] },
    { id: 'health-please-check-this', displayText: 'Please check this.', spokenText: 'Please check this.', colorRole: 'teal', itemType: 'phrase', position: 18, searchKeywords: ['please check this', 'check health', 'look at this'] },
    { id: 'health-i-need-some-rest', displayText: 'I need some rest.', spokenText: 'I need some rest.', colorRole: 'blue', itemType: 'phrase', position: 19, searchKeywords: ['i need some rest', 'rest', 'break'] },
  ],
};

const moreTopicWords: VocabularyItem[] = (Object.entries(topicWordSeeds) as Array<[TopicCategory, readonly TopicWordSeed[]]>).flatMap(([category, seeds]) =>
  seeds.map((seed) => ({
    id: seed.id,
    displayText: seed.displayText,
    spokenText: seed.spokenText ?? seed.displayText,
    category,
    colorRole: seed.colorRole,
    itemType: seed.itemType,
    searchKeywords: seed.searchKeywords ?? seed.displayText.toLowerCase().split(/\s+/),
    position: seed.position,
    isUrgent: seed.isUrgent ?? false,
    section: 'More' as const,
    detail: seed.detail,
  })),
);

const spellLetters: VocabularyItem[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter, index) => ({
  id: `letter-${letter.toLowerCase()}`,
  displayText: letter,
  spokenText: letter,
  category: 'spell',
  colorRole: index < 7 ? 'teal' : index < 13 ? 'sand' : index < 19 ? 'blue' : 'coral',
  itemType: 'letter',
  searchKeywords: [letter.toLowerCase()],
  position: index + 1,
  isUrgent: false,
  section: 'Spell',
}));

export const vocabulary: VocabularyItem[] = [...coreWords, ...quickPhrases, ...moreCategories, ...moreTopicWords, ...spellLetters].map((item) => ({
  ...item,
  ...(starterSymbolMetadata[item.id] ?? {}),
}));

function sortByPosition(items: VocabularyItem[]): VocabularyItem[] {
  return [...items].sort((first, second) => first.position - second.position);
}

export function getVocabularyForSection(section: VocabularySection, personalItems: VocabularyItem[] = []): VocabularyItem[] {
  const defaultItems = vocabulary.filter((item) => item.section === section);
  const personal = personalItems.filter((item) => item.section === section);
  return [...sortByPosition(defaultItems), ...sortByPosition(personal)];
}

export function getVocabularyForTopic(topic: TopicCategory, personalItems: VocabularyItem[] = []): VocabularyItem[] {
  const defaultItems = vocabulary.filter((item) => item.section === 'More' && item.category === topic && item.itemType !== 'category');
  const personal = personalItems.filter((item) => item.section === 'More' && item.category === topic && item.itemType !== 'category');
  return [...sortByPosition(defaultItems), ...sortByPosition(personal)];
}

export function getVocabularyWithPersonalItems(personalItems: VocabularyItem[] = []): VocabularyItem[] {
  return [...vocabulary, ...personalItems];
}

export function getSearchableText(item: VocabularyItem): string {
  return [item.displayText, item.spokenText, item.category, item.section, ...item.searchKeywords].join(' ').toLowerCase();
}