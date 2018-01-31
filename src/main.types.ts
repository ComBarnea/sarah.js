export interface ICacheableOptions {
    input: {
        idKey: any[] | any[][] | any;
        paramOrdinal?: number;
        scopeData?: string |string[] | object;
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
    name: string;
    type: string;
    set(requestedData: {val: any, hash: string}[], ttl?: number): Promise<any | any[]>;
    get(requestedHashes: string[]): Promise<any | any[]>;
    invalidateCache(requestedHash: any, ttl: number);
}

export interface ICacheProviderOptions {
    providerName: string;
    compareFn?(singleHash: string);
}
