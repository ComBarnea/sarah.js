"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
function MongooseDBProvider(mongooseInstance) {
    // console.log(mongooseInstance);
    const _findById = mongoose.Model.findById;
    mongooseInstance.Model.findById = function (op) {
        // console.log('i am called', op);
        // console.log('i am called', this);
        return _findById.call(this, op);
    };
    mongooseInstance.Model.cacheable = function (op) {
        // console.log('cacheable');
        return this;
    };
    return mongooseInstance;
}
exports.MongooseDBProvider = MongooseDBProvider;
//# sourceMappingURL=mongooseDBProvider.js.map