import {TestA} from './classTest';
import * as objectHash from 'object-hash';

const newTestA = new TestA();

console.log('newTestA', typeof newTestA);

newTestA.getDataByIdCacheable({id: [42, 45, 46]}, {})
.then((ans) => {

    console.log('pre 2', ans);

    return newTestA.getDataByIdCacheable({id: [42, 44]}, {})
        .then((ans) => {

            console.log('pre 2 post', ans);

            return newTestA.getDataByIdCacheable({id: 46}, {})
                .then((ans) => {

                    console.log('pre 2 post post', ans);
                });
        });
}).then(() => {
    newTestA.getDataByIdCacheableV2({id: [42, 45, 46]}, {})
        .then((ans) => {

            console.log('v2 pre 2', ans);

            return newTestA.getDataByIdCacheableV2({id: [42, 44]}, {})
                .then((ans) => {

                    console.log('v2 pre 2 post', ans);

                    return newTestA.getDataByIdCacheableV2({id: 46}, {})
                        .then((ans) => {

                            console.log('v2 pre 2 post post', ans);
                        });
                });
        });
})
.catch((err) => {
    console.log('err 2', err);
});