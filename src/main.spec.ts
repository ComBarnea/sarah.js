import { initCacheable, cacheable, ttl, cacheableOptions } from './main';
import { MemoryProvider } from './providers/MemoryProvider';
import 'jest';
import { ICacheableOptions, ICacheProvider } from './main.types';

describe('Main @sarah test', () => {
    it('should warn that no provider is provided', async () => {
        const orgWarn = console.warn;
        console.warn = jest.fn();
        const spy = jest.spyOn(console, 'warn');

        class Test {
            @cacheable('NoProvider')
            async getById(data: {}) {
                return;
            }
        }

        try {
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toBeCalledWith('No cache provider supplied, skipping cache.');
        } catch (e) {
            console.log('e', e);
        }

        console.warn = orgWarn;
    });

    it('should return ttl value as expected', async () => {
        const descriptorResult = {
            value: {
                ttl: 500
            }
        };

        const answer = ttl(500)({}, 'string', {value: {}});

        expect(answer).toEqual(descriptorResult);
    });

    it('should return option object as expected 1', async () => {
        const optionObject: ICacheableOptions = {
            input: {
                idKey: 'id'
            },
            output: {
                idKey: 'id'
            }
        };

        const descriptorResult = {
            value: {
                cacheableOptions: optionObject
            }
        };

        const answer = cacheableOptions(optionObject)({}, 'string', {value: {}});

        expect(answer).toEqual(descriptorResult);
    });

    it('should return option object as expected 2', async () => {
        const optionObject: ICacheableOptions = {
            input: {
                idKey: {
                    id: true
                },
                scopeLocation: [
                    {
                        scope: true
                    }
                ],
                paramOrdinal: 4
            },
            output: {
                idKey: 'id'
            }
        };

        const descriptorResult = {
            value: {
                cacheableOptions: optionObject
            }
        };

        const answer = cacheableOptions(optionObject)({}, 'string', {value: {}});

        expect(answer).toEqual(descriptorResult);
    });


    it('should return bounded to cache prover', async () => {
        const providerName = 'mainProvider';
        const mainProvider = new MemoryProvider({providerName});

        const mockMethod: any = function () {

            return this.cacheProvider;
        };

        const initiatedCache = initCacheable(mockMethod, mainProvider);
        const answer = initiatedCache('cacheName');
        expect(answer.type).toBe('CacheProvider');
        expect(answer.name).toBe(providerName);
    });


    it('should call set cache with data', async () => {
        const mainProvider = new MemoryProvider({providerName: 'mainProvider'});

        mainProvider.set = jest.fn().mockReturnValue(Promise.resolve({id: 12}));
        const spy = jest.spyOn(mainProvider, 'set');

        class Test {
            @cacheable(mainProvider, 'test')
            getById(data: {id: number}) {
                return new Promise((resolve) => {
                    resolve(data);
                });
            }
        }


        const thisTest = new Test();

        await thisTest.getById({id: 12});
        expect(spy.mock.calls[0][0][0].val.id).toBe(12);
    });


    it('should call set cache with data', async () => {
        const mainProvider = new MemoryProvider({providerName: 'mainProvider'});

        mainProvider.set = jest.fn().mockReturnValue(Promise.resolve({id: 12}));
        const spy = jest.spyOn(mainProvider, 'set');

        const initiatedCache = initCacheable(cacheable, mainProvider);

        class Test {
            @initiatedCache('test')
            getById(data: {id: number}) {
                return new Promise((resolve) => {
                    resolve(data);
                });
            }
        }

        const thisTest = new Test();

        await thisTest.getById({id: 12});
        expect(spy.mock.calls[0][0][0].val.id).toBe(12);
    });
});