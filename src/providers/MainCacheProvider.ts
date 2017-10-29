

import {ICacheProvider, ICacheProviderOptions} from '../main';

/**
 * Controll caches lifetime.
 */
export abstract class CacheProvider implements ICacheProvider {
    abstract name: string;

    constructor(options?: ICacheProviderOptions) {

    }

    abstract async set(requestedData: { val: any, hash: string }[], ttl?: number): Promise<any | any[]>;

    abstract async get(requestedHashes: string[]): Promise<any | any[]>;

    abstract async invalidateCache(requestedHash: any, ttl: number);
}

