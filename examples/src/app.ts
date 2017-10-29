import {TestA} from './classTest';
import {inspect} from 'util';
const newTestA = new TestA();

console.log('newTestA', typeof newTestA);

newTestA.getDataById({id: [42, 45, 46]}, {})
.then((ans) => {

    console.log('pre 2', ans);

    newTestA.getDataById({id: [42, 44]}, {})
        .then((ans) => {

            console.log('pre 2 post', ans);

            newTestA.getDataById({id: 46}, {})
                .then((ans) => {

                    console.log('pre 2 post post', ans);
                });
        });
})
.catch((err) => {
    console.log('err 2', err);
});
