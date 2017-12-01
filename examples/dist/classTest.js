"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../../lib");
const _ = require("lodash");
'use strict';
const Sequelize = require("sequelize");
exports.Sequelize = Sequelize;
process.env.RC_SQL_USERNAME = 'rcdbadmin';
process.env.RC_SQL_PASSWORD = '9Na$yrVUFhX8Lr3C9KurH2gWfANna^&r';
process.env.RC_SQL_DATABASE = 'reccenterdb';
process.env.RC_SQL_HOST = 'rc-dev-eu-db-sql.c8vvoishhbpv.eu-west-1.rds.amazonaws.com';
process.env.RC_SQL_DIALECT = 'postgres';
const sequelizeInstance = new Sequelize(process.env.RC_SQL_DATABASE, process.env.RC_SQL_USERNAME, process.env.RC_SQL_PASSWORD, {
    host: process.env.RC_SQL_HOST,
    dialect: process.env.RC_SQL_DIALECT,
    logging: false,
    pool: {
        max: 150
    }
});
const modelsObject = {};
modelsObject.FeaturedEntity = sequelizeInstance.import('./repositories/FeaturedEntity.js');
Object.keys(modelsObject).forEach((repositoryName) => {
    if (modelsObject[repositoryName].associate) {
        modelsObject[repositoryName].associate(modelsObject);
    }
    if (modelsObject[repositoryName].scoping) {
        modelsObject[repositoryName].scoping(modelsObject);
    }
});
exports.sequelize = sequelizeInstance;
exports.models = modelsObject;
exports.sequelize.sync()
    .then(() => {
    console.log('sequlize then');
})
    .catch((err) => {
    console.log('sequlize catch');
});
const { MemoryProvider } = lib_1.CacheProviders;
const memoryProvider = new MemoryProvider({ providerName: 'MainProvider' });
class TestA {
    getDataByIdCacheable(data, options) {
        return new Promise((resolve, reject) => {
            this.getDataById(data, options)
                .then((data) => {
                resolve(data);
            })
                .catch((err) => {
                reject(err);
            });
        });
    }
    getDataById(data, options) {
        return new Promise((resolve, reject) => {
            console.log('getDataById', data);
            setTimeout(() => {
                if (_.isArray(data.id)) {
                    resolve(data.id.map((singleId) => {
                        return {
                            id: singleId,
                            data: 'some data'
                        };
                    }));
                }
                else {
                    resolve({
                        id: data.id,
                        data: 'some data'
                    });
                }
            }, 2000);
        });
    }
}
__decorate([
    lib_1.cacheable(memoryProvider, 'Kittens'),
    lib_1.ttl(6) // optional
    ,
    lib_1.cacheableOptions({
        input: {
            /*idKey:  // ie, on first input object look for an id key
                {
                    id: true
                },*/
            idKey: 'id',
            scopeData: 'this-is-scope'
        },
        output: {
            idKey: {
                id: true
            }
        }
    })
], TestA.prototype, "getDataByIdCacheable", null);
exports.TestA = TestA;
function checkStuff() {
    exports.models.FeaturedEntity.findAll({})
        .then((data) => {
        console.log('data', data && data.length);
    })
        .catch((err) => {
        console.log('err', err);
    });
}
