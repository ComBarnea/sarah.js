"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MainCacheProvider_1 = require("./MainCacheProvider");
/**
 * Controll caches lifetime.
 */
class MemoryProvider extends MainCacheProvider_1.CacheProvider {
    constructor(options) {
        super();
        this.caches = {};
        this.name = options.providerName;
        if (options) {
            if (options.compareFn) {
                this.compare = options.compareFn;
            }
        }
    }
    compare(singleHash) {
        let value = null;
        Object.keys(this.caches).forEach((singleStoredHash) => {
            if (singleStoredHash === singleHash)
                value = this.caches[singleStoredHash];
        });
        return value;
    }
    async set(requestedData, ttl) {
        // console.log('set', requestedData, ttl);
        for (let i = 0; i < requestedData.length; i++) {
            const singleRequestData = requestedData[i];
            if (!this.compare(singleRequestData.hash)) {
                this.caches[singleRequestData.hash] = singleRequestData.val;
            }
            if (ttl) {
                this.invalidateCache(singleRequestData.hash, ttl)
                    .then(() => {
                    // console.log();
                })
                    .catch((err) => {
                    // console.log();
                });
            }
        }
        return requestedData.map((single) => single.val);
    }
    async get(requestedHashes) {
        // console.log('get', requestedHashes);
        const foundCache = [];
        requestedHashes.forEach((singleRequest) => {
            const isFound = this.compare(singleRequest);
            if (isFound)
                foundCache.push(this.caches[singleRequest]);
        });
        return foundCache;
    }
    async invalidateCache(requestedHash, ttl) {
        setTimeout(() => {
            this.removeFromCache(requestedHash);
        }, ttl);
    }
    removeFromCache(requestedHash) {
        // console.log('removing', requestedHash);
        this.caches[requestedHash] = null;
    }
}
exports.MemoryProvider = MemoryProvider;
//# sourceMappingURL=memoeryProvider.js.map