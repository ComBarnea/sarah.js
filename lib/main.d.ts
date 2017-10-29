export interface ICacheableOptions {
    input: {
        idKey: any[] | any[][] | any;
        paramOrdinal?: number;
        scopeData?: string | string[] | object;
        scopeLocation?: any[] | any[][];
    };
    output: {
        idKey: any | any[] | any[][];
    };
}
/**
 * all hashes are constructed as
 * '%providerName%:%domainName%:?%id%:hash'
 */
export interface ICacheProvider {
    set(requestedData: {
        val: any;
        hash: string;
    }[], ttl?: number): Promise<any | any[]>;
    get(requestedHashes: string[]): Promise<any | any[]>;
    invalidateCache(requestedHash: any, ttl: number): any;
}
export interface ICacheProviderOptions {
    providerName: string;
    compareFn?(singleHash: string): any;
}
export declare function cacheable(cacheProvider: ICacheProvider, name?: string): (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => PropertyDescriptor;
export declare function ttl(ttlOptions: number): (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => PropertyDescriptor;
export declare function cacheableOptions(cacheableOptions: ICacheableOptions): (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => PropertyDescriptor;
