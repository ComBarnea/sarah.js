"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const MainCacheProvider_1 = require("./providers/MainCacheProvider");
const objectHash = require("object-hash");
const GLOBAL_SYMBOL = Symbol('__sarah_js_cache');
function cacheable(cacheProvider, name) {
    return (target, propertyKey, descriptor) => {
        if (!(cacheProvider instanceof MainCacheProvider_1.CacheProvider)) {
            console.warn('No cache provider supplied, skipping cache.');
            return {
                configurable: descriptor.configurable,
                writable: descriptor.writable,
                enumerable: descriptor.enumerable,
                value(...args) {
                    return descriptor['value'].apply(target, args);
                }
            };
        }
        const domainName = name || target.constructor.name;
        const cache = cacheProvider;
        const memoizedFn = (context, type, args) => {
            const foundInputIds = _getInputIds(args, descriptor.value.cacheableOptions);
            const scope = _getScope(args, descriptor.value.cacheableOptions);
            const hashes = _generateHashes(cache.name, domainName, args, foundInputIds, scope);
            return cache.get(hashes)
                .then((cachedValue) => {
                // found cache and found ids and length is equal
                if (cachedValue && cachedValue.length && cachedValue.length === (foundInputIds && foundInputIds.length)) {
                    // only cache
                    // request by single id no array
                    if (foundInputIds.singular) {
                        return cachedValue[0];
                    }
                    return cachedValue;
                }
                else if (cachedValue && cachedValue.length && cachedValue.length && !foundInputIds) {
                    // only cache
                    // no id mapping provided
                    return cachedValue[0];
                }
                else {
                    // call the function
                    return _generateNewInputData(args, cachedValue, foundInputIds, descriptor.value.cacheableOptions)
                        .then((newArgs) => {
                        return descriptor[type].apply(context, newArgs);
                    })
                        .then((values) => {
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
                                if (!(foundInputIds && foundInputIds.length))
                                    return answers[0];
                                if (!(descriptor.value.cacheableOptions && descriptor.value.cacheableOptions && descriptor.value.cacheableOptions.output.idKey))
                                    return answers[0];
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
            value(...args) {
                return memoizedFn(target, 'value', args);
            }
        };
    };
}
exports.cacheable = cacheable;
function ttl(ttlOptions) {
    return (target, propertyKey, descriptor) => {
        descriptor.value.ttl = ttlOptions;
        return descriptor;
    };
}
exports.ttl = ttl;
function cacheableOptions(cacheableOptions) {
    return (target, propertyKey, descriptor) => {
        descriptor.value.cacheableOptions = cacheableOptions;
        return descriptor;
    };
}
exports.cacheableOptions = cacheableOptions;
function _guard(arg) {
    return true;
}
function _getInputIds(input, options) {
    if (!(options && options.input && options.input.idKey))
        return null;
    if (!(options && options.output && options.output.idKey))
        return null;
    if (_.isPlainObject(options.input.idKey)) {
        options.input.idKey = [options.input.idKey];
        if (options.input.paramOrdinal && options.input.paramOrdinal > 0) {
            options.input.idKey = _prefixInputArrayWithOrdinal(options.input.paramOrdinal, options.input.idKey[0]);
        }
    }
    else if (_.isString(options.input.idKey)) {
        options.input.idKey = [_convertIdKeyStringToObject(options.input.idKey)];
        if (options.input.paramOrdinal && options.input.paramOrdinal > 0) {
            options.input.idKey = _prefixInputArrayWithOrdinal(options.input.paramOrdinal, options.input.idKey[0]);
        }
    }
    let actions = [];
    actions = _processIdKey(options.input.idKey, actions);
    if (!actions)
        return [];
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
function _processIdKey(input, actions) {
    if (_.isArray(input)) {
        actions = _processArray(input, actions);
        if (!actions)
            return null;
        return actions.reverse();
    }
    else {
        actions = _processObject(input, actions);
        if (!actions)
            return null;
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
function _processScopeLocation(input, actions) {
    if (_.isArray(input)) {
        actions = _processArray(input, actions);
        if (!actions)
            return null;
        return actions.reverse();
    }
    else {
        actions = _processObject(input, actions);
        if (!actions)
            return null;
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
function _processArray(input, actions) {
    if (_.isArray(input)) {
        for (let i = 0; i < input.length; i++) {
            if (input[i] === null)
                continue;
            if (_.isArray(input[i])) {
                _processArray(input[i], actions);
            }
            else {
                _processObject(input[i], actions);
            }
            actions.push({ type: 'array', location: i });
            break;
        }
        return actions;
    }
    else {
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
function _processObject(input, actions) {
    if (_.isBoolean(input)) {
        actions.push({ type: 'boolean', location: 'boolean' });
    }
    else if (_.isObject(input)) {
        const keysArr = Object.keys(input);
        for (let i = 0; i < keysArr.length; i++) {
            if (input.hasOwnProperty(keysArr[i])) {
                if (input[keysArr[i]] === null)
                    continue;
                if (_.isArray(input[keysArr[i]])) {
                    _processArray(input[keysArr[i]], actions);
                }
                else {
                    _processObject(input[keysArr[i]], actions);
                }
                actions.push({ type: 'object', location: keysArr[i] });
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
function _processInputActions(input, actions) {
    if (!(actions && actions.length))
        return [];
    // console.log(input, actions);
    let currentItem = input;
    for (let i = 0; i < actions.length; i++) {
        if (!currentItem)
            break;
        let currentAction = actions[i];
        if (currentAction.type === 'boolean') {
            break;
        }
        if (currentAction.type === 'array') {
            currentItem = currentItem[currentAction.location];
        }
        else if (currentAction.type === 'object') {
            currentItem = currentItem[currentAction.location];
        }
    }
    if (!currentItem)
        currentItem = [];
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
function _processChangeInputActions(input, newIdsData, actions) {
    if (!(actions && actions.length))
        return input;
    // console.log(input, actions);
    let currentItem = input;
    let previousItem;
    let previousAction;
    for (let i = 0; i < actions.length; i++) {
        if (!currentItem)
            break;
        let currentAction = actions[i];
        if (currentAction.type === 'boolean') {
            previousItem[previousAction.location] = newIdsData;
            break;
        }
        if (currentAction.type === 'array') {
            previousAction = currentAction;
            previousItem = currentItem;
            currentItem = currentItem[currentAction.location];
        }
        else if (currentAction.type === 'object') {
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
function _processOutputActions(input, actions) {
    if (!(actions && actions.length))
        return [];
    const answerArray = [];
    if (actions[0].type === 'object') {
        input = [input];
        input.singular = true;
    }
    else {
        actions.shift();
    }
    for (let i = 0; i < input.length; i++) {
        let currentItem = input[i];
        let previousItem;
        let previousAction;
        for (let actionIndex = 0; actionIndex < actions.length; actionIndex++) {
            let currentAction = actions[actionIndex];
            if (currentAction.type === 'boolean') {
                answerArray.push({ val: previousItem, id: previousItem[previousAction.location] });
                break;
            }
            if (currentAction.type === 'array') {
                previousItem = currentItem;
                previousAction = currentAction;
                currentItem = currentItem[currentAction.location];
            }
            else if (currentAction.type === 'object') {
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
function _generateHashes(name, domainName, request, ids, scope) {
    // console.log('_generateHashes', name, domainName, request, ids, scope);
    if (ids && ids.length) {
        return ids.map((singleId) => {
            return `${name}:${domainName}:${singleId}${scope ? `:${_hashData(scope)}` : `:${_hashData(request)}`}`;
        });
    }
    else {
        return [`${name}:${domainName}:${_hashData(request)}`];
    }
}
/**
 * generate hash string from given data
 * @param {string | Object | string[]} data
 * @private
 */
function _hashData(data) {
    return objectHash(data, { /*excludeValues: true,*/ unorderedArrays: true });
}
/**
 * get scope data to hash
 * get the data from specific data given to decorator of location mapping
 * @param input
 * @param {ICacheableOptions} options
 * @return {any}
 * @private
 */
function _getScope(input, options) {
    if (options && options.input && options.input.scopeData) {
        return options.input.scopeData;
    }
    else if (options && options.input && options.input.scopeLocation) {
        let actions = [];
        actions = _processScopeLocation(options.input.scopeLocation, actions);
        if (!actions)
            return [];
        const inputScope = _processInputActions(input, actions);
        return inputScope;
    }
    else {
        return null;
    }
}
function _getOutputIdData(input, options) {
    if (!(options && options.input && options.input.idKey))
        return null;
    if (!(options && options.output && options.output.idKey))
        return null;
    let actions = [];
    if (_.isArray(input)) {
        actions = _processIdKey([options.output.idKey], actions);
    }
    else {
        actions = _processIdKey(options.output.idKey, actions);
    }
    if (!actions)
        return [];
    const outputData = _processOutputActions(input, actions);
    return outputData;
}
function _generateStoreData(receivedData, inputIds, hashes, options, name, domainName) {
    if (!(hashes && hashes.length))
        return [];
    if (!(inputIds && inputIds.length))
        return [{ hash: hashes[0], val: receivedData }];
    if (!(options && options.output && options.output.idKey))
        return [{ hash: hashes[0], val: receivedData }];
    const tmpData = _getOutputIdData(receivedData, options);
    const answerData = _.compact(tmpData.map((singleItem) => {
        const foundHash = hashes.find((singleHash) => {
            return singleHash.includes(`${name}:${domainName}:${singleItem.id}`);
        });
        if (foundHash)
            return {
                val: singleItem.val,
                hash: foundHash
            };
    }));
    return answerData;
}
function _convertIdKeyStringToObject(inputString) {
    const stringSections = inputString.split('.');
    const answerObject = {};
    for (let i = 0; i < stringSections.length; i++) {
        answerObject[stringSections[i]] = {};
        if (i === stringSections.length - 1)
            answerObject[stringSections[i]] = true;
    }
    return answerObject;
}
function _prefixInputArrayWithOrdinal(ordinal, inputData) {
    const emptyArray = new Array(ordinal);
    emptyArray.forEach((single) => single = null);
    emptyArray[ordinal] = inputData;
    return emptyArray;
}
async function _generateNewInputData(args, foundData, foundIds, options) {
    if (!(foundData && foundData.length))
        return args;
    if (!(foundIds && foundIds.length))
        return args;
    if (!(options && options.input && options.input.idKey))
        return args;
    if (!(options && options.output && options.output.idKey))
        return args;
    const outputData = _getOutputIdData(foundData, options).map((singleOutput) => singleOutput.id); /// make array id array
    const diffArray = _.difference(foundIds, outputData);
    let actions = [];
    actions = _processIdKey(options.input.idKey, actions);
    return _processChangeInputActions(args, diffArray, actions);
}
async function _fillAnswersWithCache(newData, foundData, options) {
    if (!(foundData && foundData.length))
        return newData;
    if (!(options && options.input && options.input.idKey))
        return newData;
    if (!(options && options.output && options.output.idKey))
        return newData;
    // console.log('newData', newData);
    // console.log('foundData', foundData);
    const merged = _.concat([], newData, foundData);
    // console.log('merged', merged);
    return merged;
}
async function _orderAnswers(newData, foundIds, options) {
    if (!(newData && newData.length))
        return newData;
    if (!(foundIds && foundIds.length))
        return newData;
    if (!(options && options.input && options.input.idKey))
        return newData;
    if (!(options && options.output && options.output.idKey))
        return newData;
    if (newData.length !== foundIds.length)
        return newData;
    const outputData = _getOutputIdData(newData, options); /// make array id array
    const orderedArray = new Array(newData.length);
    outputData.forEach((singleData) => {
        const indexInAnother = foundIds.indexOf(singleData.id);
        // console.log('singleData', singleData);
        if (indexInAnother === 0) {
            orderedArray[indexInAnother] = singleData.val;
        }
        else if (indexInAnother) {
            orderedArray[indexInAnother] = singleData.val;
        }
    });
    return orderedArray;
}
//# sourceMappingURL=main.js.map