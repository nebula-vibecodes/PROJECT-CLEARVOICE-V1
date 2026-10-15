import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const indexHtml = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const stylesheet = fs.readFileSync(path.join(projectRoot, 'src/index.css'), 'utf8');

describe('offline font strategy', () => {
  it('uses only local system font stacks', () => {
    expect(indexHtml).not.toMatch(/fonts\.(googleapis|gstatic)\.com/i);
    expect(stylesheet).not.toMatch(/fonts\.(googleapis|gstatic)\.com/i);
    expect(stylesheet).not.toMatch(/@font-face/i);
    expect(stylesheet).toContain('--app-font-sans: ui-sans-serif');
    expect(stylesheet).toContain('--app-font-display: ui-sans-serif');
    expect(stylesheet).toContain('--app-font-mono: ui-monospace');
  });
});