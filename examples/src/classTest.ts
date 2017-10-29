import {cacheable, ttl, cacheableOptions, CacheProviders} from '../../lib';
import * as _ from 'lodash';
import {Kitten} from './models/Kittens';


const {MemoryProvider} = CacheProviders;

const memoryProvider = new MemoryProvider({providerName: 'MainProvider'});

export interface IGetKittensByIds {
    _id: string[];
}

export interface IAddKitten {
    name: string | string[];
}

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


    async getKittensByIds(data: IGetKittensByIds, options: any) {
        return Kitten.find({_id: {$in: data._id}});
    }

    async getKittenById(_id: string, options: any) {
        return (Kitten as any).cacheable().findById(_id);
    }

    async addKitten(data: IAddKitten, options: any) {
        if (_.isArray(data.name)) {
            return Kitten.create(data.name.map((singleName) => {
                return {
                    name: singleName
                };
            }));
        } else {
            return Kitten.create(data);
        }
    }
}