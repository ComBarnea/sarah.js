import * as _ from 'lodash';
import { CacheProvider } from './providers/MainCacheProvider';
import { ICacheableOptions, ICacheProvider } from './main.types';
import { HelperModule } from './helper.module';
const helperModule = new HelperModule();
const GLOBAL_SYMBOL = Symbol('__sarah_js_cache');


export function cacheable(cacheProvider: ICacheProvider | any, name?: string) {
    if (!name && cacheProvider && this.cacheProvider && (typeof cacheProvider === 'string')) {
        name = cacheProvider as any;

        cacheProvider = this.cacheProvider;
    }

    return (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>): PropertyDescriptor => {

        if (!(cacheProvider.type === 'CacheProvider')) {
            console.warn('No cache provider supplied, skipping cache.');

            return {
                configurable: descriptor.configurable,
                writable: descriptor.writable,
                enumerable: descriptor.enumerable,
                value(...args: any[]) {
                    return descriptor['value'].apply(target, args);
                }
            };
        }

        const domainName = name || target.constructor.name;

        return {
            configurable: descriptor.configurable,
            writable: descriptor.writable,
            enumerable: descriptor.enumerable,
            value(...args: any[]) {

                return memoizedFn.call(this, target, 'value', descriptor, cacheProvider, domainName, args);
            }
        };
    };
}

function memoizedFn(context: any, type: string, descriptor: TypedPropertyDescriptor<any>, cache: ICacheProvider, domainName: string,  args: any) {
    const foundInputIds = helperModule.getInputIds(args, descriptor.value.cacheableOptions);
    const scope = helperModule.getScope(args, descriptor.value.cacheableOptions);
    const hashes = helperModule.generateHashes(cache.name, domainName, args, foundInputIds, scope);


    return cache.get(hashes)
        .then((cachedValue: any[]) => {
            // found cache and found ids and length is equal
            if (cachedValue && cachedValue.length && cachedValue.length === (foundInputIds && foundInputIds.length)) {
                // only cache

                // request by single id no array
                if (foundInputIds.singular) {
                    return cachedValue[0];
                }

                return cachedValue;
            } else if (cachedValue && cachedValue.length && cachedValue.length && !foundInputIds) {
                // only cache
                // no id mapping provided

                return cachedValue[0];
            } else {
                // call the function
                return helperModule.generateNewInputData(args, cachedValue, foundInputIds, descriptor.value.cacheableOptions)
                    .then((newArgs) => {
                        return descriptor[type].apply(context, newArgs);
                    })
                    .then((values: any[] | any) => {
                        // non array answers

                        return cache.set(helperModule.generateStoreData(values, foundInputIds, hashes, descriptor.value.cacheableOptions, cache.name, domainName), descriptor.value.ttl ? descriptor.value.ttl * 1000 : descriptor.value.ttl)
                            .then((answers) => {
                                return HelperModule.fillAnswersWithCache(answers, cachedValue, descriptor.value.cacheableOptions);
                            })
                            .then((answers) => {
                                return helperModule.orderAnswers(answers, foundInputIds, descriptor.value.cacheableOptions);
                            })
                            .then((answers) => {
                                if (_.isArray(values)) {
                                    if (!(foundInputIds && foundInputIds.length)) return answers[0];
                                    if (!(descriptor.value.cacheableOptions && descriptor.value.cacheableOptions && descriptor.value.cacheableOptions.output.idKey)) return answers[0];

                                    return answers;

                                }

                                return answers[0];
                            });
                    });
            }
        });
}

export function initCacheable(cacheableFunction: any, cacheProvider: ICacheProvider): (cacheProvider: ICacheProvider | any, name?: string) => any {
    cacheableFunction.cacheProvider = cacheProvider;

    return cacheableFunction.bind(cacheableFunction);
}

export function ttl(ttlOptions: number) {
    return (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>): PropertyDescriptor => {
        descriptor.value.ttl = ttlOptions;

        return descriptor;
    };

}


export function cacheableOptions(cacheableOptions: ICacheableOptions) {
    return (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>): PropertyDescriptor => {
        descriptor.value.cacheableOptions = cacheableOptions;

        return descriptor;
    };
}
