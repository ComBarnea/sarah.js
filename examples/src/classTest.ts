import {cacheable, ttl, cacheableOptions, CacheProviders} from '../../lib';
import * as _ from 'lodash';
'use strict';
import * as Sequelize  from 'sequelize';

process.env.RC_SQL_USERNAME = 'rcdbadmin';
process.env.RC_SQL_PASSWORD = '9Na$yrVUFhX8Lr3C9KurH2gWfANna^&r';
process.env.RC_SQL_DATABASE = 'reccenterdb';
process.env.RC_SQL_HOST = 'rc-dev-eu-db-sql.c8vvoishhbpv.eu-west-1.rds.amazonaws.com';
process.env.RC_SQL_DIALECT = 'postgres';


const sequelizeInstance: Sequelize.Sequelize = new Sequelize(process.env.RC_SQL_DATABASE, process.env.RC_SQL_USERNAME, process.env.RC_SQL_PASSWORD, {
    host: process.env.RC_SQL_HOST,
    dialect: process.env.RC_SQL_DIALECT,
    logging: false,
    pool: {
        max: 150
    }
});


export const sequelize = sequelizeInstance;
const {DataTypes} = require('sequelize');


// generateInterfaceToEnum
export interface IFeaturedEntitySchema {
    id?: number;
    entityType?: any;
    entityId?: number;
}

export const FeaturedEntitySchema = {
    entityType: DataTypes.STRING,
    entityId: DataTypes.INTEGER
};




export interface FeaturedEntityInstance extends Sequelize.Instance<IFeaturedEntitySchema>, IFeaturedEntitySchema {
}

export interface FeaturedEntityModel extends Sequelize.Model<FeaturedEntityInstance, IFeaturedEntitySchema> { }



const FeaturedEntity = sequelize.define('FeaturedEntity', FeaturedEntitySchema, {

    classMethods: {
        associate: (models) => {
            // console.log('sdsd');
        },
        scoping: (models) => {
            // console.log('sdsd');
        }
    }
});


export interface AppModels {
    FeaturedEntity: FeaturedEntityModel;

}
const modelsObject: AppModels = {} as AppModels;


export const models = modelsObject;
export {Sequelize};


sequelize.sync(/*{force: true}*/)
    .then(() => {
        console.log('sequlize then');
    })
    .catch((err) => {
        console.log('sequlize catch', err);
    });


const {MemoryProvider} = CacheProviders;

const memoryProvider = new MemoryProvider({providerName: 'MainProvider'});

export interface IGetKittensByIds {
    _id: string[];
}

export interface IAddKitten {
    name: string | string[];
}

export class TestA {
    @cacheable(memoryProvider, 'Kittens')
    @ttl(6)  // optional
    @cacheableOptions({  // optional
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
    getDataByIdCacheable(data: any, options: any)  {
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

    getDataById(data: any, options: any)  {
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
                } else {
                    resolve({
                        id: data.id,
                        data: 'some data'
                    });
                }
            }, 2000);
        });
    }

    @cacheable(memoryProvider, 'ent')
    @ttl(6)  // optional
    getEntByIdCacheable(data: any, options: any)  {
        return new Promise((resolve, reject) => {
            this.getEntById(data, options)
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    getEntById(data: any, options: any)  {
        return new Promise((resolve, reject) => {
            console.log('called');
            FeaturedEntity.findAll({})
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                reject(err);
            });
        });
    }
}
