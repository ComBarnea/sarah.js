import {TestA} from './classTest';
import {DBProviders} from '../../lib';
import * as mongoose from 'mongoose';
const newTestA = new TestA();

mongoose.connect('mongodb://localhost/shara-test', {
    useMongoClient: true
});

DBProviders.MongooseDBProvider(mongoose);

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



newTestA.getKittensByIds({_id: ['59f59bd67fb6661d04bd17a2']}, {})
.then((ans) => {
    console.log('getKittensByIds', ans);
})
.catch((err) => {
    console.log('err getKittensByIds', err);
});
newTestA.getKittenById('59f59bd67fb6661d04bd17a2', {})
.then((ans) => {
    console.log('getKittenById', ans);
})
.catch((err) => {
    console.log('err getKittenById', err);
});


/*
newTestA.addKitten({name: ['mimi', 'mipi', 'momo', 'popo']}, {})
.then((ans) => {
    console.log('addKitten', ans);
})
.catch((err) => {
    console.log('err addKitten', err);
});
*/

