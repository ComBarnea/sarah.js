import { ICacheProvider, ICacheProviderOptions } from '../main';
/**
 * Controll caches lifetime.
 */
export declare abstract class CacheProvider implements ICacheProvider {
    abstract name: string;
    constructor(options?: ICacheProviderOptions);
    abstract set(requestedData: {
        val: any;
        hash: string;
    }[], ttl?: number): Promise<any | any[]>;
    abstract get(requestedHashes: string[]): Promise<any | any[]>;
    abstract invalidateCache(requestedHash: any, ttl: number): any;
}
