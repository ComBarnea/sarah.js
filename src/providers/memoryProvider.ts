import { ICacheProvider, ICacheProviderOptions } from '../main.types';
import { CacheProvider } from './MainCacheProvider';


/**
 * Controll caches lifetime.
 */
export class MemoryProvider extends CacheProvider implements ICacheProvider {
    private caches: any;
    name: string;

    constructor(options?: ICacheProviderOptions) {
        super();

        this.caches = {};
        this.name = options.providerName;

        if (options) {
            if (options.compareFn) {
                this.compare = options.compareFn;
            }
        }
    }

    private compare(singleHash: string) {
        let value = null;
        Object.keys(this.caches).forEach((singleStoredHash)  => {
            if (singleStoredHash === singleHash) value = this.caches[singleStoredHash];
        });

        return value;
    }

    public async set(requestedData: {val: any, hash: string}[], ttl?: number): Promise<any | any[]> {
        for (let i = 0; i < requestedData.length; i ++) {
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


    public async get(requestedHashes: string[]): Promise<any | any[]> {
        // console.log('get', requestedHashes);
        const foundCache = [];

        requestedHashes.forEach((singleRequest) => {
            const isFound = this.compare(singleRequest);

            if (isFound) foundCache.push(this.caches[singleRequest]);
        });


        return foundCache;
    }

    public async invalidateCache(requestedHash: any, ttl: number) {
        setTimeout(() => {
            this.removeFromCache(requestedHash);
        }, ttl);
    }

    private removeFromCache(requestedHash: string) {
        // console.log('removing', requestedHash);
        this.caches[requestedHash] = null;
    }
}

