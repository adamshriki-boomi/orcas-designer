import { getRelativeTime } from './analysis-card';

describe('getRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-14T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Just now" for less than 1 minute ago', () => {
    expect(getRelativeTime('2026-04-14T11:59:30Z')).toBe('Just now');
  });

  it('returns minutes ago for less than 1 hour', () => {
    expect(getRelativeTime('2026-04-14T11:45:00Z')).toBe('15m ago');
  });

  it('returns hours ago for less than 1 day', () => {
    expect(getRelativeTime('2026-04-14T06:00:00Z')).toBe('6h ago');
  });

  it('returns days ago for less than 30 days', () => {
    expect(getRelativeTime('2026-04-07T12:00:00Z')).toBe('7d ago');
  });

  it('returns formatted date for 30+ days ago', () => {
    const result = getRelativeTime('2026-02-14T12:00:00Z');
    expect(result).toMatch(/Feb\s+14/);
  });

  it('returns "1m ago" for exactly 1 minute', () => {
    expect(getRelativeTime('2026-04-14T11:59:00Z')).toBe('1m ago');
  });

  it('returns "1h ago" for exactly 1 hour', () => {
    expect(getRelativeTime('2026-04-14T11:00:00Z')).toBe('1h ago');
  });
});
