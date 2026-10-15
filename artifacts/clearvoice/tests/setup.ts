import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

class TestSpeechSynthesisUtterance {
  text: string;
  rate = 1;
  voice: SpeechSynthesisVoice | null = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

const speechSynthesisMock = {
  getVoices: () => [],
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  cancel: vi.fn(),
  speak: vi.fn((utterance: TestSpeechSynthesisUtterance) => {
    utterance.onstart?.();
    utterance.onend?.();
  }),
};

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  configurable: true,
  value: TestSpeechSynthesisUtterance,
});

Object.defineProperty(window, 'speechSynthesis', {
  configurable: true,
  value: speechSynthesisMock,
});

Object.defineProperty(navigator, 'clipboard', {
  configurable: true,
  value: { writeText: vi.fn() },
});

Object.defineProperty(HTMLElement.prototype, 'getClientRects', {
  configurable: true,
  value() {
    return this.hidden ? [] : [{ width: 1, height: 1 }];
  },
});