export function groupByCategory<T extends { category?: string | null }>(
  items: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const cat = item.category ?? 'Uncategorized';
    const group = map.get(cat) ?? [];
    group.push(item);
    map.set(cat, group);
  }
  return map;
}

export function orderedCategories(allCategories: string[], priorityOrder: string[]): string[] {
  const remaining = allCategories.filter((c) => !priorityOrder.includes(c)).sort();
  const present = priorityOrder.filter((c) => allCategories.includes(c));
  return [...present, ...remaining];
}
