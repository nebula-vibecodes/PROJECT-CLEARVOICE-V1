import type { VocabularySymbolMetadata } from '@/data/vocabulary';
import { STARTER_SYMBOL_ASSET_LOCATION } from '@/data/symbols';

type SymbolGlyphProps = {
  symbol: VocabularySymbolMetadata;
  className?: string;
  testId?: string;
};

export function SymbolGlyph({ symbol, className = '', testId }: SymbolGlyphProps) {
  if (!symbol.symbolAssetLocation || !symbol.symbolAssetId) return null;
  if (symbol.symbolAssetLocation !== STARTER_SYMBOL_ASSET_LOCATION) {
    return <img className={`symbol-glyph ${className}`.trim()} src={symbol.symbolAssetLocation} alt="" aria-hidden="true" draggable="false" data-testid={testId} />;
  }
  return (
    <svg className={`symbol-glyph ${className}`.trim()} viewBox="0 0 64 64" aria-hidden="true" focusable="false" data-testid={testId}>
      <use href={`${symbol.symbolAssetLocation}#${symbol.symbolAssetId}`} />
    </svg>
  );
}