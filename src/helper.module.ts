import { ICacheableOptions } from './main.types';
import * as _ from 'lodash';
import * as objectHash from 'object-hash';

export interface IIdsActions {
    type: 'array' | 'object' | 'boolean';
    location: number | string;
}

export class HelperModule {
    getInputIds(input: any, options: ICacheableOptions) {
        if (!(options && options.input && options.input.idKey)) return null;
        if (!(options && options.output && options.output.idKey)) return null;

        if (_.isPlainObject(options.input.idKey)) {
            options.input.idKey = [options.input.idKey];

            if (options.input.paramOrdinal && options.input.paramOrdinal > 0) {
                options.input.idKey = HelperModule.prefixInputArrayWithOrdinal(options.input.paramOrdinal, options.input.idKey[0]);
            }
        } else if (_.isString(options.input.idKey)) {
            options.input.idKey = [HelperModule.convertIdKeyStringToObject(options.input.idKey)];

            if (options.input.paramOrdinal && options.input.paramOrdinal > 0) {
                options.input.idKey = HelperModule.prefixInputArrayWithOrdinal(options.input.paramOrdinal, options.input.idKey[0]);
            }
        }

        let actions: IIdsActions[] = [];

        actions = this.processIdKey(options.input.idKey, actions);
        if (!actions) return [];

        return HelperModule.processInputActions(input, actions);
    }

    /**
     * get scope data to hash
     * get the data from specific data given to decorator of location mapping
     * @param input
     * @param {ICacheableOptions} options
     * @return {any}
     */
    getScope(input: any, options: ICacheableOptions) {
        if (options && options.input && options.input.scopeData) {
            return options.input.scopeData;
        } else if (options && options.input && options.input.scopeLocation) {
            let actions: IIdsActions[] = [];

            actions = this.processScopeLocation(options.input.scopeLocation, actions);
            if (!actions) return [];


            return HelperModule.processInputActions(input, actions);
        } else {
            return null;
        }
    }

    /**
     *
     * @param {string} name
     * @param {string} domainName
     * @param {Object[]} request
     * @param {Object[]} ids
     * @param {string | Object | string[]} scope
     * @return {null | string[]}
     */
    generateHashes(name: string, domainName: string, request: any[], ids?: any[], scope?: string | object | string[]) {
        // console.log('_generateHashes', name, domainName, request, ids, scope);
        if (ids && ids.length) {
            return ids.map((singleId) => {
                return `${name}:${domainName}:${singleId}${scope ? `:${ HelperModule.hashData(scope)}` : `:${HelperModule.hashData(request)}`}`;
            });
        } else {
            return [`${name}:${domainName}:${HelperModule.hashData(request)}`];
        }
    }


    static prefixInputArrayWithOrdinal(ordinal: number, inputData: any) {
        const emptyArray = new Array(ordinal);
        emptyArray.forEach((single) => single = null);

        emptyArray[ordinal] = inputData;

        return emptyArray;
    }

    static convertIdKeyStringToObject(inputString: string) {
        const stringSections = inputString.split('.');

        const answerObject: any = {};

        for (let i = 0; i < stringSections.length; i++) {
            answerObject[stringSections[i]] = {

            };

            if (i === stringSections.length - 1) answerObject[stringSections[i]] = true;
        }

        return answerObject;
    }


    /**
     * main wrapper for process chacheable idKey options
     * @param input
     * @param actions
     * @return {any}
     */
    processIdKey(input: any | any[], actions: IIdsActions[]) {
        if (_.isArray(input)) {
            actions =  this.processArray(input, actions);

            if (!actions) return null;

            return actions.reverse();
        } else {
            actions =  this.processObject(input, actions);

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
     */
    processArray(input: any[], actions: IIdsActions[]) {
        if (_.isArray(input)) {
            for (let i = 0; i < input.length; i++) {
                if (input[i] === null) continue;

                if (_.isArray(input[i])) {
                    this.processArray(input[i], actions);
                } else {
                    this.processObject(input[i], actions);
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
     */
    processObject(input: any, actions: IIdsActions[]) {
        if (_.isBoolean(input)) {
            actions.push({type: 'boolean', location: 'boolean'});
        } else if (_.isObject(input)) {
            const keysArr = Object.keys(input);

            for (let i = 0; i < keysArr.length; i++) {
                if (input.hasOwnProperty(keysArr[i])) {
                    if (input[keysArr[i]] === null) continue;

                    if (_.isArray(input[keysArr[i]])) {
                        this.processArray(input[keysArr[i]], actions);
                    } else {
                        this.processObject(input[keysArr[i]], actions);
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
     */
    static processInputActions(input: any | any[], actions: IIdsActions[]) {
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
     * main wrapper for process chacheable scopeLocation options
     * @param input
     * @param actions
     * @return {any}
     */
    processScopeLocation(input: any| any[], actions: IIdsActions[]) {
        if (_.isArray(input)) {
            actions = this.processArray(input, actions);

            if (!actions) return null;

            return actions.reverse();
        } else {
            actions =  this.processObject(input, actions);

            if (!actions) return null;

            return actions.reverse();
        }
    }

    /**
     * generate hash string from given data
     * @param {string | Object | string[]} data
     */
    static hashData(data: string | object | string[]) {
        return objectHash(data, {/*excludeValues: true,*/ unorderedArrays: true});
    }

    async generateNewInputData(args: any, foundData: any[], foundIds: any[], options: ICacheableOptions) {
        if (!(foundData && foundData.length)) return args;
        if (!(foundIds  && foundIds.length)) return args;
        if (!(options && options.input && options.input.idKey)) return args;
        if (!(options && options.output && options.output.idKey)) return args;

        const outputData = this.getOutputIdData(foundData, options).map((singleOutput) => singleOutput.id); /// make array id array
        const diffArray = _.difference(foundIds, outputData);

        let actions: IIdsActions[] = [];
        actions = this.processIdKey(options.input.idKey, actions);

        return HelperModule.processChangeInputActions(args, diffArray, actions);
    }

    getOutputIdData(input: any, options: ICacheableOptions): {val: any, id: string | number}[] {
        if (!(options && options.input && options.input.idKey)) return null;
        if (!(options && options.output && options.output.idKey)) return null;

        let actions: IIdsActions[] = [];
        if (_.isArray(input)) {
            actions = this.processIdKey([options.output.idKey], actions);
        } else {
            actions = this.processIdKey(options.output.idKey, actions);
        }

        if (!actions) return [];

        return HelperModule.processOutputActions(input, actions);
    }



    /**
     * process change input array against actions array
     * return found ids
     * in case of a miss-match return empty array
     * in case of found single number (ie. single id and not array of ids) return it inside array
     * @param input
     * @param actions
     * @param newIdsData
     */
    static processChangeInputActions(input: any | any[], newIdsData: any[], actions: IIdsActions[]) {
        if (!(actions && actions.length)) return input;

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
    static processOutputActions(input: any | any[], actions: IIdsActions[]): {val: any, id: string | number}[] {
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

    generateStoreData(receivedData: any | any[], inputIds: string | string[], hashes: string[], options: ICacheableOptions, name: string, domainName: string): {val: any, hash: string}[] {
        if (!(hashes && hashes.length)) return [];
        if (!(inputIds && inputIds.length)) return [{hash: hashes[0], val: receivedData}];
        if (!(options && options.output && options.output.idKey)) return [{hash: hashes[0], val: receivedData}];

        const tmpData: {val: any, id: string | number}[] = this.getOutputIdData(receivedData, options);

        return _.compact(tmpData.map((singleItem) => {
            const foundHash = hashes.find((singleHash) => {

                return singleHash.includes(`${name}:${domainName}:${singleItem.id}`);
            });

            if (foundHash) return {
                val: singleItem.val,
                hash: foundHash
            };
        }));
    }

    static async fillAnswersWithCache(newData: any[], foundData: any[], options: ICacheableOptions) {
        if (!(foundData && foundData.length)) return newData;
        if (!(options && options.input && options.input.idKey)) return newData;
        if (!(options && options.output && options.output.idKey)) return newData;

        return _.concat([], newData, foundData);
    }

    async orderAnswers(newData: any[], foundIds: any[], options: ICacheableOptions) {
        if (!(newData && newData.length)) return newData;
        if (!(foundIds  && foundIds.length)) return newData;
        if (!(options && options.input && options.input.idKey)) return newData;
        if (!(options && options.output && options.output.idKey)) return newData;
        if (newData.length !== foundIds.length) return newData;

        const outputData = this.getOutputIdData(newData, options); /// make array id array
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
}