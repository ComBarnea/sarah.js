import {cacheable, ttl, cacheableOptions, CacheProviders} from '../../lib';
import * as _ from 'lodash';

const {MemoryProvider} = CacheProviders;

const memoryProvider = new MemoryProvider({providerName: 'MainProvider'});

export class TestA {
    @cacheable(memoryProvider)
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