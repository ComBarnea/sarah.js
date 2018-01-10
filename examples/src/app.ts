import {TestA} from './classTest';
import * as objectHash from 'object-hash';

const newTestA = new TestA();

console.log('newTestA', typeof newTestA);

newTestA.getDataByIdCacheable({id: [42, 45, 46]}, {})
.then((ans) => {

    console.log('pre 2', ans);

    newTestA.getDataByIdCacheable({id: [42, 44]}, {})
        .then((ans) => {

            console.log('pre 2 post', ans);

            newTestA.getDataByIdCacheable({id: 46}, {})
                .then((ans) => {

                    console.log('pre 2 post post', ans);
                });
        });
})
.catch((err) => {
    console.log('err 2', err);
});
newTestA.getDataByIdCacheable({}, {})
.then((data) => {
    console.log('data 1', data[0].entityId);
    return newTestA.getDataByIdCacheable({}, {})
    .then((data) => {
        console.log('data 2', data[0].entityId);
    });
})
.catch((err) => {
    console.log(err);
});