'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const FeaturedEntitySchema_1 = require("../schemes/FeaturedEntitySchema");
module.exports = (sequelize, DataTypes) => {
    const FeaturedEntity = sequelize.define('FeaturedEntity', FeaturedEntitySchema_1.FeaturedEntitySchema, {
        classMethods: {
            associate: (models) => {
            },
            scoping: (models) => {
            }
        }
    });
    return FeaturedEntity;
};
