import { type ChangeEvent, type FormEvent, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, FileDown, FileUp, Pencil, Plus, RotateCcw, Save, Trash2, Volume2, X } from 'lucide-react';
import {
  createPersonalVocabularyItem,
  getNextPersonalPosition,
  MAX_LOCAL_DATA_BYTES,
  PERSONAL_CATEGORY_OPTIONS,
  PERSONAL_COLOR_OPTIONS,
  validatePersonalVocabulary,
  type PersonalCategory,
  type PersonalItemType,
  type PersonalVocabularyItem,
} from '@/data/localData';

type CustomizeVocabularyProps = {
  items: PersonalVocabularyItem[];
  onChange: (items: PersonalVocabularyItem[]) => void;
  onFeedback: (message: string) => void;
  onPreviewPronunciation: (text: string) => void;
  onExport: () => void;
  onImportText: (text: string) => void;
  onRestoreDefaults: () => void;
};

type EntryForm = {
  displayText: string;
  spokenText: string;
  itemType: PersonalItemType;
  category: PersonalCategory;
  searchKeywords: string;
  colorRole: PersonalVocabularyItem['colorRole'];
};

const EMPTY_FORM: EntryForm = {
  displayText: '',
  spokenText: '',
  itemType: 'word',
  category: 'core',
  searchKeywords: '',
  colorRole: 'teal',
};

function makePersonalId(items: PersonalVocabularyItem[]): string {
  const randomPart = typeof window !== 'undefined' && typeof window.crypto?.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const base = `personal-${randomPart.toLowerCase()}`;
  return items.some((item) => item.id === base) ? makePersonalId(items) : base;
}

function getSectionOrder(section: PersonalVocabularyItem['section']): number {
  return section === 'Core' ? 0 : section === 'Quick Phrases' ? 1 : 2;
}

export function CustomizeVocabulary({
  items,
  onChange,
  onFeedback,
  onPreviewPronunciation,
  onExport,
  onImportText,
  onRestoreDefaults,
}: CustomizeVocabularyProps) {
  const [form, setForm] = useState<EntryForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sortedItems = useMemo(
    () => [...items].sort((first, second) => {
      const firstCategory = PERSONAL_CATEGORY_OPTIONS.findIndex((option) => option.value === first.category);
      const secondCategory = PERSONAL_CATEGORY_OPTIONS.findIndex((option) => option.value === second.category);
      return getSectionOrder(first.section) - getSectionOrder(second.section)
        || firstCategory - secondCategory
        || first.position - second.position;
    }),
    [items],
  );

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    const displayText = form.displayText.trim();
    const spokenText = form.spokenText.trim() || displayText;
    const searchKeywords = form.searchKeywords.split(',').map((keyword) => keyword.trim()).filter(Boolean);
    if (!displayText) {
      setFormError('Add a word or phrase before saving.');
      return;
    }
    if (searchKeywords.length > 12) {
      setFormError('Use 12 or fewer search keywords.');
      return;
    }
    const existing = editingId ? items.find((item) => item.id === editingId) : undefined;
    const position = existing?.category === form.category
      ? existing.position
      : getNextPersonalPosition(items.filter((item) => item.id !== editingId), form.category);
    const nextItem = createPersonalVocabularyItem({
      id: editingId ?? makePersonalId(items),
      displayText,
      spokenText,
      itemType: form.itemType,
      category: form.category,
      colorRole: form.colorRole,
      searchKeywords,
      position,
    });
    const nextItems = editingId ? items.map((item) => item.id === editingId ? nextItem : item) : [...items, nextItem];
    try {
      onChange(validatePersonalVocabulary(nextItems));
      resetForm();
      onFeedback(editingId ? `${displayText} updated` : `${displayText} added to personal vocabulary`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'That personal entry could not be saved.');
    }
  };

  const editItem = (item: PersonalVocabularyItem) => {
    setEditingId(item.id);
    setForm({
      displayText: item.displayText,
      spokenText: item.spokenText,
      itemType: item.itemType,
      category: item.category,
      searchKeywords: item.searchKeywords.join(', '),
      colorRole: item.colorRole,
    });
    setFormError('');
  };

  const removeItem = (item: PersonalVocabularyItem) => {
    if (!window.confirm(`Remove “${item.displayText}” from personal vocabulary?`)) return;
    onChange(items.filter((candidate) => candidate.id !== item.id));
    if (editingId === item.id) resetForm();
    onFeedback(`${item.displayText} removed`);
  };

  const moveItem = (item: PersonalVocabularyItem, direction: -1 | 1) => {
    const siblings = items
      .filter((candidate) => candidate.category === item.category)
      .sort((first, second) => first.position - second.position);
    const index = siblings.findIndex((candidate) => candidate.id === item.id);
    const neighbor = siblings[index + direction];
    if (!neighbor) return;
    const nextItems = items.map((candidate) => {
      if (candidate.id === item.id) return { ...candidate, position: neighbor.position };
      if (candidate.id === neighbor.id) return { ...candidate, position: item.position };
      return candidate;
    });
    onChange(validatePersonalVocabulary(nextItems));
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setFileError('');
    if (!file) return;
    if (file.size > MAX_LOCAL_DATA_BYTES) {
      setFileError('That file is too large. Choose a Clearvoice JSON export under 256 KB.');
      return;
    }
    try {
      const text = await file.text();
      onImportText(text);
    } catch {
      setFileError('That file could not be read.');
    }
  };

  return (
    <div className="customize-panel-content">
      <p className="panel-intro">Add words that matter to this device user. Personal entries stay on this device and are marked clearly.</p>
      <p className="section-note">Personal symbols render from bundled Clearvoice symbols or imported PNG, JPEG, and WebP data URLs up to 48 KB each. Custom files, SVG, remote URLs, and uploads are not supported; unsupported local symbols stay text-only. Personal data is limited to 192 KB.</p>

      <form className="custom-vocabulary-form" onSubmit={handleSubmit} noValidate>
        <div className="custom-form-heading">
          <div>
            <p className="eyebrow">Personal vocabulary</p>
            <h3>{editingId ? 'Edit an entry' : 'Create an entry'}</h3>
          </div>
          {editingId && <button type="button" className="small-inline-button" onClick={resetForm}><X size={15} />Cancel edit</button>}
        </div>
        <label className="field-label" htmlFor="personal-display-text">Word or phrase</label>
        <input id="personal-display-text" className="text-input" type="text" value={form.displayText} onChange={(event) => setForm((current) => ({ ...current, displayText: event.target.value }))} maxLength={80} required placeholder="For example, favorite snack" data-testid="input-personal-display-text" />
        <label className="field-label" htmlFor="personal-spoken-text">Spoken text <span className="field-hint">(optional)</span></label>
        <div className="speech-preview-row">
          <input id="personal-spoken-text" className="text-input" type="text" value={form.spokenText} onChange={(event) => setForm((current) => ({ ...current, spokenText: event.target.value }))} maxLength={120} placeholder="Defaults to the word or phrase above" data-testid="input-personal-spoken-text" />
          <button type="button" className="setting-action compact-setting-action" onClick={() => onPreviewPronunciation(form.spokenText.trim() || form.displayText.trim())} data-testid="button-preview-pronunciation"><Volume2 size={17} />Preview pronunciation</button>
        </div>
        <div className="custom-form-grid">
          <div>
            <label className="field-label" htmlFor="personal-item-type">Entry type</label>
            <select id="personal-item-type" className="voice-select" value={form.itemType} onChange={(event) => setForm((current) => ({ ...current, itemType: event.target.value as PersonalItemType }))} data-testid="select-personal-item-type">
              <option value="word">Word</option>
              <option value="phrase">Phrase</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="personal-category">Category</label>
            <select id="personal-category" className="voice-select" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as PersonalCategory }))} data-testid="select-personal-category">
              {PERSONAL_CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        </div>
        <label className="field-label" htmlFor="personal-keywords">Search keywords <span className="field-hint">(comma separated)</span></label>
        <input id="personal-keywords" className="text-input" type="text" value={form.searchKeywords} onChange={(event) => setForm((current) => ({ ...current, searchKeywords: event.target.value }))} maxLength={480} placeholder="snack, food, favorite" data-testid="input-personal-keywords" />
        <label className="field-label" htmlFor="personal-color-role">Visual role</label>
        <select id="personal-color-role" className="voice-select" value={form.colorRole} onChange={(event) => setForm((current) => ({ ...current, colorRole: event.target.value as PersonalVocabularyItem['colorRole'] }))} data-testid="select-personal-color-role">
          {PERSONAL_COLOR_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        {formError && <p className="form-error" role="alert">{formError}</p>}
        <button type="submit" className="setting-action custom-save-button" data-testid="button-save-personal-entry"><Save size={17} />{editingId ? 'Save changes' : 'Add personal entry'}</button>
      </form>

      <section className="personal-list-section" aria-labelledby="personal-list-heading">
        <div className="custom-form-heading">
          <div>
            <p className="eyebrow">On this device</p>
            <h3 id="personal-list-heading">Personal entries <span className="item-count">{items.length}</span></h3>
          </div>
        </div>
        {sortedItems.length ? <div className="personal-entry-list">
          {sortedItems.map((item) => {
            const sameSectionItems = sortedItems.filter((candidate) => candidate.section === item.section);
            const itemIndex = sameSectionItems.findIndex((candidate) => candidate.id === item.id);
            return (
              <article className="personal-entry" key={item.id}>
                <div className="personal-entry-main">
                  <span className={`personal-entry-swatch tone-${item.colorRole}`} aria-hidden="true" />
                  <div>
                    <strong>{item.displayText}</strong>
                    <small>Personal · {PERSONAL_CATEGORY_OPTIONS.find((option) => option.value === item.category)?.label ?? item.category}</small>
                  </div>
                </div>
                <div className="personal-entry-actions">
                  <button type="button" className="icon-button compact-icon-button" onClick={() => moveItem(item, -1)} disabled={itemIndex === 0} aria-label={`Move ${item.displayText} earlier`}><ArrowUp size={16} /></button>
                  <button type="button" className="icon-button compact-icon-button" onClick={() => moveItem(item, 1)} disabled={itemIndex === sameSectionItems.length - 1} aria-label={`Move ${item.displayText} later`}><ArrowDown size={16} /></button>
                  <button type="button" className="icon-button compact-icon-button" onClick={() => editItem(item)} aria-label={`Edit ${item.displayText}`}><Pencil size={16} /></button>
                  <button type="button" className="icon-button compact-icon-button danger-icon-button" onClick={() => removeItem(item)} aria-label={`Remove ${item.displayText}`}><Trash2 size={16} /></button>
                </div>
              </article>
            );
          })}
        </div> : <p className="empty-personal-list">No personal entries yet. Add one above when you are ready.</p>}
      </section>

      <section className="local-data-section" aria-labelledby="local-data-heading">
        <p className="eyebrow">Local backup</p>
        <h3 id="local-data-heading">Move this setup safely</h3>
        <p className="section-note">Export or import accessibility settings and personal vocabulary only. Messages and history are never included.</p>
        <div className="local-data-actions">
          <button type="button" className="setting-action" onClick={onExport} data-testid="button-export-local-data"><FileDown size={17} />Export JSON</button>
          <button type="button" className="setting-action" onClick={() => fileInputRef.current?.click()} data-testid="button-import-local-data"><FileUp size={17} />Import JSON</button>
          <input ref={fileInputRef} className="visually-hidden-file-input" type="file" accept=".json,application/json,text/json" tabIndex={-1} onChange={handleFileChange} />
        </div>
        {fileError && <p className="form-error" role="alert">{fileError}</p>}
      </section>

      <section className="restore-section" aria-labelledby="restore-vocabulary-heading">
        <p className="eyebrow">Defaults</p>
        <h3 id="restore-vocabulary-heading">Restore default vocabulary</h3>
        <p className="section-note">Remove all personal entries and keep accessibility settings unchanged.</p>
        <button type="button" className="reset-settings" onClick={onRestoreDefaults} data-testid="button-restore-default-vocabulary"><RotateCcw size={17} />Restore defaults</button>
      </section>
    </div>
  );
}