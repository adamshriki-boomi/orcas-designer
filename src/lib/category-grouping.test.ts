import { describe, it, expect } from 'vitest';
import { groupByCategory, orderedCategories } from './category-grouping';

describe('groupByCategory', () => {
  it('groups items by their category', () => {
    const items = [
      { name: 'a', category: 'X' },
      { name: 'b', category: 'Y' },
      { name: 'c', category: 'X' },
    ];
    const groups = groupByCategory(items);
    expect(groups.get('X')).toHaveLength(2);
    expect(groups.get('Y')).toHaveLength(1);
  });

  it('treats null/undefined categories as "Uncategorized"', () => {
    const items = [
      { name: 'a', category: null },
      { name: 'b', category: undefined },
    ];
    const groups = groupByCategory(items);
    expect(groups.get('Uncategorized')).toHaveLength(2);
  });
});

describe('orderedCategories', () => {
  it('returns categories in the requested priority order, with remaining categories alphabetically', () => {
    const result = orderedCategories(
      ['X', 'Y', 'Z', 'A'],
      ['Y', 'A'],
    );
    expect(result).toEqual(['Y', 'A', 'X', 'Z']);
  });
});
