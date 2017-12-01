import {TestA} from './classTest';
// import {DBProviders} from '../../lib';
//import * as mongoose from 'mongoose';
import * as objectHash from 'object-hash';
import {inspect} from 'util';
import * as Sequelize  from 'sequelize';



const newTestA = new TestA();

/*
mongoose.connect('mongodb://localhost/shara-test', {
    useMongoClient: true
});
*/

// DBProviders.MongooseDBProvider(mongoose);

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
newTestA.getEntByIdCacheable({}, {})
.then((data) => {
    console.log('data 1', data[0].entityId);
    return newTestA.getEntByIdCacheable({}, {})
    .then((data) => {
        console.log('data 2', data[0].entityId);
    });
})
.catch((err) => {
    console.log(err);
});