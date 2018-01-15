

import {ICacheProvider, ICacheProviderOptions} from '../main';

/**
 * Controll caches lifetime.
 */
export class CacheProvider implements ICacheProvider {
    name: string;
    type: string;

    constructor(options?: ICacheProviderOptions) {
        this.type = 'CacheProvider';
    }

    async set(requestedData: { val: any, hash: string }[], ttl?: number): Promise<any | any[]> {
        return;
    };

    async get(requestedHashes: string[]): Promise<any | any[]> {
        return;
    };

    async invalidateCache(requestedHash: any, ttl: number) {
        return;
    };
}

