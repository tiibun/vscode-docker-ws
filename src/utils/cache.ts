export class Cache<K, V> {
    private cacheStore = new Map<K, V>();

    public getOrCreate(key: K, callback: () => V): V {
        let value = this.cacheStore.get(key);
        if (value === undefined) {
            value = callback();
            this.cacheStore.set(key, value);
        }
        return value;
    }
}
