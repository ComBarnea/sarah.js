/*
import * as mongoose from 'mongoose';


export function MongooseDBProvider(mongooseInstance: any) {
    // console.log(mongooseInstance);
    const _findById = mongoose.Model.findById;

    mongooseInstance.Model.findById = function (op: any) {
        // console.log('i am called', op);
        // console.log('i am called', this);

        return _findById.call(this, op);
    };




    mongooseInstance.Model.cacheable = function (op: any) {
        // console.log('cacheable');
        return this;
    };

    return mongooseInstance;
}*/
