import { ICacheProvider, ICacheProviderOptions } from '../main';
import { CacheProvider } from './MainCacheProvider';
/**
 * Controll caches lifetime.
 */
export declare class MemoryProvider extends CacheProvider implements ICacheProvider {
    private caches;
    name: string;
    constructor(options?: ICacheProviderOptions);
    private compare(singleHash);
    set(requestedData: {
        val: any;
        hash: string;
    }[], ttl?: number): Promise<any | any[]>;
    get(requestedHashes: string[]): Promise<any | any[]>;
    invalidateCache(requestedHash: any, ttl: number): Promise<void>;
    private removeFromCache(requestedHash);
}
