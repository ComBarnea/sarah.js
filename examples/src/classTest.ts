import {cacheable, ttl, cacheableOptions} from '../../lib';
import * as _ from 'lodash';
'use strict';
import {RedisProvider, IRedisProviderOptions} from '../../../sarah.js-redis';
import {MemoryProvider} from '../../../sarah.js-memory';

import {inspect} from 'util';
const memoryProvider = new MemoryProvider({providerName: 'MainProvider'});

const redisProvide = new RedisProvider({providerName: 'MainRedis'});

export interface IGetKittensByIds {
    _id: string[];
}

export interface IAddKitten {
    name: string | string[];
}

export class TestA {
    @cacheable(memoryProvider, 'Kittens')
    @ttl(6)  // optional
    @cacheableOptions({  // optional
        input: {
            /*idKey:  // ie, on first input object look for an id key
                {
                    id: true
                },*/
            idKey: 'id',
            scopeData: 'this-is-scope'
        },
        output: {
            idKey: {
                id: true
            }
        }
    })
    getDataByIdCacheable(data: any, options: any)  {
        return new Promise((resolve, reject) => {
            this.getDataById(data, options)
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    getDataById(data: any, options: any)  {
        return new Promise((resolve, reject) => {
            console.log('getDataById', data);
            setTimeout(() => {
                if (_.isArray(data.id)) {
                    resolve(data.id.map((singleId) => {
                        return {
                            id: singleId,
                            data: 'some data'
                        };
                    }));
                } else {
                    resolve({
                        id: data.id,
                        data: 'some data'
                    });
                }
            }, 2000);
        });
    }
}
