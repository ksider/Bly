(function (global) {
    const DEFAULT_PREFIX = 'badge-studio';

    class LocalStore {
        constructor(prefix = DEFAULT_PREFIX, storage = window.localStorage) {
            this.prefix = prefix;
            this.storage = storage;
        }

        _key(key) {
            return `${this.prefix}:${key}`;
        }

        load(key, fallback = null) {
            const namespacedKey = this._key(key);
            try {
                const raw = this.storage.getItem(namespacedKey);
                if (raw === null || raw === undefined) {
                    return fallback;
                }
                return JSON.parse(raw);
            } catch (error) {
                console.warn(`LocalStore: не удалось прочитать ключ ${namespacedKey}`, error);
                return fallback;
            }
        }

        save(key, value) {
            const namespacedKey = this._key(key);
            try {
                this.storage.setItem(namespacedKey, JSON.stringify(value));
            } catch (error) {
                console.warn(`LocalStore: не удалось сохранить ключ ${namespacedKey}`, error);
            }
        }

        remove(key) {
            const namespacedKey = this._key(key);
            try {
                this.storage.removeItem(namespacedKey);
            } catch (error) {
                console.warn(`LocalStore: не удалось удалить ключ ${namespacedKey}`, error);
            }
        }

        clearNamespace() {
            const keysToRemove = [];
            for (let i = 0; i < this.storage.length; i += 1) {
                const key = this.storage.key(i);
                if (key && key.startsWith(`${this.prefix}:`)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach((key) => this.storage.removeItem(key));
        }
    }

    global.BadgeStorage = {
        LocalStore,
    };
})(window);
