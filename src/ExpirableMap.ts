export class ExpirableMap<K, V> extends Map<K, V> {
  private readonly expirationMap = new Map<K, ReturnType<typeof setTimeout>>();

  constructor(private readonly ttl: number) {
    super();
  }

  public set(key: K, value: V): this {
    super.set(key, value);
    this.updateCleanupTimeout(key);
    return this;
  }

  public get(key: K): V | undefined {
    const value = super.get(key);
    this.updateCleanupTimeout(key);
    return value;
  }

  private updateCleanupTimeout(key: K) {
    const timeout = setTimeout(() => {
      this.delete(key);
    }, this.ttl);
    if (this.expirationMap.has(key)) {
      clearTimeout(this.expirationMap.get(key));
    }
    this.expirationMap.set(key, timeout);
  }
}