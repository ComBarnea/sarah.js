"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const classTest_1 = require("./classTest");
const newTestA = new classTest_1.TestA();
/*
mongoose.connect('mongodb://localhost/shara-test', {
    useMongoClient: true
});
*/
// DBProviders.MongooseDBProvider(mongoose);
console.log('newTestA', typeof newTestA);
newTestA.getDataByIdCacheable({ id: [42, 45, 46] }, {})
    .then((ans) => {
    console.log('pre 2', ans);
    newTestA.getDataByIdCacheable({ id: [42, 44] }, {})
        .then((ans) => {
        console.log('pre 2 post', ans);
        newTestA.getDataByIdCacheable({ id: 46 }, {})
            .then((ans) => {
            console.log('pre 2 post post', ans);
        });
    });
})
    .catch((err) => {
    console.log('err 2', err);
});
