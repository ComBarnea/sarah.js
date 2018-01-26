import * as _ from 'lodash';
import {CacheProvider} from './providers/MainCacheProvider';
import * as objectHash from 'object-hash';

const GLOBAL_SYMBOL = Symbol('__sarah_js_cache');

/*
export function fcache<T extends Function>(fn: T, param: FunctionCacheOption = {}): T {
    const name = fn.name || `${Date.now() + Math.round(Math.random() * 10000)}`;
    class CacheWrapper {
        @cache(param)
        static [name](...args: any[]) {
            return fn(...args);
        }
    }

    return ((...args) => CacheWrapper[name](...args)) as any;
}*/




interface ICachableMethod {
    ttl?: number;
    cacheableOptions?: ICacheableOptions;
}


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

export const func = function (sdsd: string): string {
    return 'sds';
};

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

        const cache = cacheProvider;

        const memoizedFn = (context: any, type: string, args) => {
            const foundInputIds = _getInputIds(args, descriptor.value.cacheableOptions);
            const scope = _getScope(args, descriptor.value.cacheableOptions);
            const hashes = _generateHashes(cache.name, domainName, args, foundInputIds, scope);


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
                    return _generateNewInputData(args, cachedValue, foundInputIds, descriptor.value.cacheableOptions)
                    .then((newArgs) => {
                        return descriptor[type].apply(context, newArgs);
                    })
                    .then((values: any[] | any) => {
                        // non array answers
                        return cache.set(_generateStoreData(values, foundInputIds, hashes, descriptor.value.cacheableOptions, cache.name, domainName), descriptor.value.ttl ? descriptor.value.ttl * 1000 : descriptor.value.ttl)
                        .then((answers) => {
                            return _fillAnswersWithCache(answers, cachedValue, descriptor.value.cacheableOptions);
                        })
                        .then((answers) => {
                            return _orderAnswers(answers, foundInputIds, descriptor.value.cacheableOptions);
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
        };


        return {
            configurable: descriptor.configurable,
            writable: descriptor.writable,
            enumerable: descriptor.enumerable,
            value(...args: any[]) {

                return memoizedFn(target, 'value', args);
            }
        };
    };
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


function _guard(arg: any): arg is ICachableMethod {
    return true;
}
interface IIdsActions {
    type: 'array' | 'object' | 'boolean';
    location: number | string;
}

function _getInputIds(input: any, options: ICacheableOptions) {
    if (!(options && options.input && options.input.idKey)) return null;
    if (!(options && options.output && options.output.idKey)) return null;

    if (_.isPlainObject(options.input.idKey)) {
        options.input.idKey = [options.input.idKey];

        if (options.input.paramOrdinal && options.input.paramOrdinal > 0) {
            options.input.idKey = _prefixInputArrayWithOrdinal(options.input.paramOrdinal, options.input.idKey[0]);
        }
    } else if (_.isString(options.input.idKey)) {
        options.input.idKey = [_convertIdKeyStringToObject(options.input.idKey)];

        if (options.input.paramOrdinal && options.input.paramOrdinal > 0) {
            options.input.idKey = _prefixInputArrayWithOrdinal(options.input.paramOrdinal, options.input.idKey[0]);
        }
    }


    let actions: IIdsActions[] = [];

    actions = _processIdKey(options.input.idKey, actions);
    if (!actions) return [];


    const inputIds = _processInputActions(input, actions);

    return inputIds;
}



/**
 * main wrapper for process chacheable idKey options
 * @param input
 * @param actions
 * @return {any}
 * @private
 */
function _processIdKey(input: any | any[], actions: IIdsActions[]) {
    if (_.isArray(input)) {
        actions =  _processArray(input, actions);

        if (!actions) return null;

        return actions.reverse();
    } else {
        actions =  _processObject(input, actions);

        if (!actions) return null;

        return actions.reverse();
    }
}

/**
 * main wrapper for process chacheable scopeLocation options
 * @param input
 * @param actions
 * @return {any}
 * @private
 */
function _processScopeLocation(input: any| any[], actions: IIdsActions[]) {
    if (_.isArray(input)) {
        actions = _processArray(input, actions);

        if (!actions) return null;

        return actions.reverse();
    } else {
        actions =  _processObject(input, actions);

        if (!actions) return null;

        return actions.reverse();

    }
}

/**
 * process single array, in the odd case this is not an array just return the actions
 * process elements in array, mark first one not boolean
 * @param input
 * @param actions
 * @return {any}
 * @private
 */
function _processArray(input: any[], actions: IIdsActions[]) {
    if (_.isArray(input)) {
        for (let i = 0; i < input.length; i++) {
            if (input[i] === null) continue;

            if (_.isArray(input[i])) {
                _processArray(input[i], actions);
            } else {
                _processObject(input[i], actions);
            }

            actions.push({type: 'array', location: i});
            break;
        }

        return actions;
    } else {
        return actions;
    }
}

/**
 * process single Object
 * if boolean mark it as one
 * if full object iterate over keys and process them mark first found object
 * @param input
 * @param actions
 * @return {IIdsActions[]}
 * @private
 */
function _processObject(input: any, actions: IIdsActions[]) {
    if (_.isBoolean(input)) {
        actions.push({type: 'boolean', location: 'boolean'});
    } else if (_.isObject(input)) {
        const keysArr = Object.keys(input);

        for (let i = 0; i < keysArr.length; i++) {
            if (input.hasOwnProperty(keysArr[i])) {
                if (input[keysArr[i]] === null) continue;

                if (_.isArray(input[keysArr[i]])) {
                    _processArray(input[keysArr[i]], actions);
                } else {
                    _processObject(input[keysArr[i]], actions);
                }

                actions.push({type: 'object', location: keysArr[i]});
                break;
            }
        }
    }

    return actions;
}

/**
 * process input against the actions array
 * return found ids
 * in case of a miss-match return empty array
 * in case of found single number (ie. single id and not array of ids) return it inside array
 * @param input
 * @param actions
 * @private
 */
function _processInputActions(input: any | any[], actions: IIdsActions[]) {
    if (!(actions && actions.length)) return [];
    // console.log(input, actions);
    let currentItem: any = input;

    for (let i = 0; i < actions.length; i++) {
        if (!currentItem) break;
        let currentAction = actions[i];

        if (currentAction.type === 'boolean') {
            break;
        }

        if (currentAction.type === 'array') {
            currentItem = currentItem[currentAction.location];
        } else if (currentAction.type === 'object') {
            currentItem = currentItem[currentAction.location];
        }
    }

    if (!currentItem) currentItem = [];

    // id can be string or number
    if (_.isNumber(currentItem) || _.isString(currentItem)) {
        currentItem = [currentItem];
        currentItem.singular = true;
    }

    return currentItem;
}

/**
 * process change input array against actions array
 * return found ids
 * in case of a miss-match return empty array
 * in case of found single number (ie. single id and not array of ids) return it inside array
 * @param input
 * @param actions
 * @private
 */
function _processChangeInputActions(input: any | any[], newIdsData: any[], actions: IIdsActions[]) {
    if (!(actions && actions.length)) return input;
    // console.log(input, actions);
    let currentItem: any = input;
    let previousItem: any;
    let previousAction: any;

    for (let i = 0; i < actions.length; i++) {
        if (!currentItem) break;
        let currentAction = actions[i];

        if (currentAction.type === 'boolean') {
            previousItem[previousAction.location] = newIdsData;
            break;
        }

        if (currentAction.type === 'array') {
            previousAction = currentAction;
            previousItem = currentItem;
            currentItem = currentItem[currentAction.location];
        } else if (currentAction.type === 'object') {
            previousAction = currentAction;
            previousItem = currentItem;
            currentItem = currentItem[currentAction.location];
        }
    }

    return input;
}


/**
 * process output against the actions array
 * return found data
 * @param input
 * @param actions
 * @private
 */
function _processOutputActions(input: any | any[], actions: IIdsActions[]): {val: any, id: string | number}[] {
    if (!(actions && actions.length)) return [];
    const answerArray = [];

    if (actions[0].type === 'object') {
        input = [input];
        input.singular = true;
    } else {
        actions.shift();
    }


    for (let i = 0; i < input.length; i++) {
        let currentItem: any = input[i];
        let previousItem: any;
        let previousAction: any;

        for (let actionIndex = 0; actionIndex < actions.length; actionIndex++) {
            let currentAction = actions[actionIndex];

            if (currentAction.type === 'boolean') {
                answerArray.push({val: previousItem, id: previousItem[previousAction.location]});
                break;
            }

            if (currentAction.type === 'array') {
                previousItem = currentItem;
                previousAction = currentAction;
                currentItem = currentItem[currentAction.location];
            } else if (currentAction.type === 'object') {
                previousItem = currentItem;
                previousAction = currentAction;
                currentItem = currentItem[currentAction.location];
            }
        }
    }


    return answerArray;
}

/**
 *
 * @param {string} name
 * @param {string} domainName
 * @param {Object[]} request
 * @param {Object[]} ids
 * @param {string | Object | string[]} scope
 * @return {null | string[]}
 * @private
 */
function _generateHashes(name: string, domainName: string, request: any[], ids?: any[], scope?: string | object | string[]) {
    // console.log('_generateHashes', name, domainName, request, ids, scope);
    if (ids && ids.length) {
        return ids.map((singleId) => {
            return `${name}:${domainName}:${singleId}${scope ? `:${ _hashData(scope)}` : `:${_hashData(request)}`}`;
        });
    } else {
        return [`${name}:${domainName}:${_hashData(request)}`];
    }
}

/**
 * generate hash string from given data
 * @param {string | Object | string[]} data
 * @private
 */
function _hashData(data: string | object | string[]) {
    return objectHash(data, {/*excludeValues: true,*/ unorderedArrays: true});
}

/**
 * get scope data to hash
 * get the data from specific data given to decorator of location mapping
 * @param input
 * @param {ICacheableOptions} options
 * @return {any}
 * @private
 */
function _getScope(input: any, options: ICacheableOptions) {
    if (options && options.input && options.input.scopeData) {
        return options.input.scopeData;
    } else if (options && options.input && options.input.scopeLocation) {
        let actions: IIdsActions[] = [];

        actions = _processScopeLocation(options.input.scopeLocation, actions);
        if (!actions) return [];


        const inputScope = _processInputActions(input, actions);

        return inputScope;
    } else {
        return null;
    }
}



function _getOutputIdData(input: any, options: ICacheableOptions): {val: any, id: string | number}[] {
    if (!(options && options.input && options.input.idKey)) return null;
    if (!(options && options.output && options.output.idKey)) return null;

    let actions: IIdsActions[] = [];
    if (_.isArray(input)) {
        actions = _processIdKey([options.output.idKey], actions);
    } else {
        actions = _processIdKey(options.output.idKey, actions);
    }

    if (!actions) return [];


    const outputData = _processOutputActions(input, actions);

    return outputData;
}



function _generateStoreData(receivedData: any | any[], inputIds: string | string[], hashes: string[], options: ICacheableOptions, name: string, domainName: string): {val: any, hash: string}[] {
    if (!(hashes && hashes.length)) return [];
    if (!(inputIds && inputIds.length)) return [{hash: hashes[0], val: receivedData}];
    if (!(options && options.output && options.output.idKey)) return [{hash: hashes[0], val: receivedData}];

    const tmpData: {val: any, id: string | number}[] = _getOutputIdData(receivedData, options);

    const answerData = _.compact(tmpData.map((singleItem) => {
        const foundHash = hashes.find((singleHash) => {

            return singleHash.includes(`${name}:${domainName}:${singleItem.id}`);
        });

        if (foundHash) return {
            val: singleItem.val,
            hash: foundHash
        };
    }));

    return answerData;
}

function _convertIdKeyStringToObject(inputString: string) {
    const stringSections = inputString.split('.');

    const answerObject: any = {

    };

    for (let i = 0; i < stringSections.length; i++) {
        answerObject[stringSections[i]] = {

        };

        if (i === stringSections.length - 1) answerObject[stringSections[i]] = true;
    }

    return answerObject;
}

function _prefixInputArrayWithOrdinal(ordinal: number, inputData: any) {
    const emptyArray = new Array(ordinal);
    emptyArray.forEach((single) => single = null);

    emptyArray[ordinal] = inputData;

    return emptyArray;
}


async function _generateNewInputData(args: any, foundData: any[], foundIds: any[], options: ICacheableOptions) {
    if (!(foundData && foundData.length)) return args;
    if (!(foundIds  && foundIds.length)) return args;
    if (!(options && options.input && options.input.idKey)) return args;
    if (!(options && options.output && options.output.idKey)) return args;

    const outputData = _getOutputIdData(foundData, options).map((singleOutput) => singleOutput.id); /// make array id array
    const diffArray = _.difference(foundIds, outputData);

    let actions: IIdsActions[] = [];
    actions = _processIdKey(options.input.idKey, actions);


    return _processChangeInputActions(args, diffArray, actions);
}


async function _fillAnswersWithCache(newData: any[], foundData: any[], options: ICacheableOptions) {
    if (!(foundData && foundData.length)) return newData;
    if (!(options && options.input && options.input.idKey)) return newData;
    if (!(options && options.output && options.output.idKey)) return newData;

    // console.log('newData', newData);
    // console.log('foundData', foundData);
    const merged = _.concat([], newData, foundData);

    // console.log('merged', merged);

    return merged;
}

async function _orderAnswers(newData: any[], foundIds: any[], options: ICacheableOptions) {
    if (!(newData && newData.length)) return newData;
    if (!(foundIds  && foundIds.length)) return newData;
    if (!(options && options.input && options.input.idKey)) return newData;
    if (!(options && options.output && options.output.idKey)) return newData;
    if (newData.length !== foundIds.length) return newData;

    const outputData = _getOutputIdData(newData, options); /// make array id array
    const orderedArray = new Array(newData.length);

    outputData.forEach((singleData) => {
        const indexInAnother = foundIds.indexOf(singleData.id);
        // console.log('singleData', singleData);
        if (indexInAnother === 0) {
            orderedArray[indexInAnother] = singleData.val;
        } else if (indexInAnother) {
            orderedArray[indexInAnother] = singleData.val;
        }
    });

    return orderedArray;
}

