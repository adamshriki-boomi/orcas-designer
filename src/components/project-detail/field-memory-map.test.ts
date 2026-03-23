import {
  LOCKED_MEMORY_MAP,
  SELECTABLE_MEMORY_MAP,
  getMemoryNames,
} from './field-memory-map';
import {
  COMPANY_CONTEXT_MEMORY_ID,
  BUILT_IN_PRODUCT_MEMORY_ID,
  BUILT_IN_STORYBOOK_MEMORY_ID,
} from '@/lib/constants';
import type { SharedMemory } from '@/lib/types';

const MEMORIES: SharedMemory[] = [
  { id: COMPANY_CONTEXT_MEMORY_ID, name: 'Boomi Context', content: '', locked: true },
  { id: BUILT_IN_PRODUCT_MEMORY_ID, name: 'Rivery Context', content: '', locked: false },
  { id: BUILT_IN_STORYBOOK_MEMORY_ID, name: 'Exosphere Storybook', content: '', locked: false },
];

describe('field-memory-map', () => {
  describe('map configuration', () => {
    it('maps companyInfo to the company context memory (locked)', () => {
      expect(LOCKED_MEMORY_MAP.companyInfo).toEqual([COMPANY_CONTEXT_MEMORY_ID]);
    });

    it('maps productInfo to the product memory (selectable)', () => {
      expect(SELECTABLE_MEMORY_MAP.productInfo).toEqual([BUILT_IN_PRODUCT_MEMORY_ID]);
    });

    it('maps designSystemStorybook to the storybook memory (selectable)', () => {
      expect(SELECTABLE_MEMORY_MAP.designSystemStorybook).toEqual([BUILT_IN_STORYBOOK_MEMORY_ID]);
    });
  });

  describe('getMemoryNames', () => {
    it('returns locked memory name regardless of selection', () => {
      const result = getMemoryNames('companyInfo', [], MEMORIES);
      expect(result).toEqual(['Boomi Context']);
    });

    it('returns selectable memory name when selected', () => {
      const result = getMemoryNames('productInfo', [BUILT_IN_PRODUCT_MEMORY_ID], MEMORIES);
      expect(result).toEqual(['Rivery Context']);
    });

    it('returns storybook memory name when selected', () => {
      const result = getMemoryNames('designSystemStorybook', [BUILT_IN_STORYBOOK_MEMORY_ID], MEMORIES);
      expect(result).toEqual(['Exosphere Storybook']);
    });

    it('returns empty for selectable memory when not selected', () => {
      const result = getMemoryNames('productInfo', [], MEMORIES);
      expect(result).toEqual([]);
    });

    it('returns empty for storybook when not selected', () => {
      const result = getMemoryNames('designSystemStorybook', [], MEMORIES);
      expect(result).toEqual([]);
    });

    it('returns empty for field with no memory mapping', () => {
      const result = getMemoryNames('featureInfo', [BUILT_IN_PRODUCT_MEMORY_ID], MEMORIES);
      expect(result).toEqual([]);
    });

    it('returns empty when shared memories list is empty', () => {
      const result = getMemoryNames('companyInfo', [], []);
      expect(result).toEqual([]);
    });
  });
});
