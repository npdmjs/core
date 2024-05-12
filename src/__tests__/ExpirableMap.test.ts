import { ExpirableMap } from '../ExpirableMap.js';

describe('ExpirableMap', () => {
  let expirableMap: ExpirableMap<string, number>;

  beforeEach(() => {
    expirableMap = new ExpirableMap(1000);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets and get values correctly', () => {
    expirableMap.set('key1', 1);
    expirableMap.set('key2', 2);
    expect(expirableMap.get('key1')).toBe(1);
    expect(expirableMap.get('key2')).toBe(2);
  });

  it('returns undefined for expired keys', () => {
    expirableMap.set('key1', 1);
    expirableMap.set('key2', 2);
    vi.advanceTimersByTime(1100);
    expect(expirableMap.get('key1')).toBeUndefined();
    expect(expirableMap.get('key2')).toBeUndefined();
  });

  it('should update cleanup timeout when setting a key that already exists', () => {
    expirableMap.set('key1', 1);
    vi.advanceTimersByTime(600);
    expirableMap.set('key1', 2);
    vi.advanceTimersByTime(600);
    expect(expirableMap.get('key1')).toBe(2);
  });
});