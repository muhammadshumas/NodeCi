const mongoose = require("mongoose");
const exec = mongoose.Query.prototype.exec;

// redis
const redis = require("redis");
const { promisify } = require("util");

const keys = require("../config/keys");

// const redisUrl = "redis://127.0.0.1:6379"; // not neccessary as this is the default url

const client = redis.createClient(keys.redisUrl);

// promisifying client functions
client.hget = promisify(client.hget);

// Function to make caching true.By default no value will be cached
mongoose.Query.prototype.cache = function (options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key) || "";
  // To make function chainable we return this
  return this;
};

// This function is a mongoose function responsible for actually executing every query.This means it runs when ever we perform some task related to querying in mongoose
// We are overwriting this object and before the actual exec is executed we execute custom exec as shown below
mongoose.Query.prototype.exec = async function () {
  // this keyword refers to the current query object mongoose is about to execute

  if (!this.useCache) {
    return exec.apply(this, arguments);
  }

  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      // Object.assign takes first arg as target,and then we can provide as many targets as we want; here we are providing two.But the source must always be an object

      collection: this.mongooseCollection.name,
    })
  );

  // first check if key already exists inside our cache server
  const cacheVal = await client.hget(this.hashKey, key);

  // if we do, return that
  if (cacheVal) {
    // we can simply return JSON.parse(cacheVal); because the mongoose model expects a mongoose document so we have to do following
    const parsedCacheVal = JSON.parse(cacheVal);

    return Array.isArray(parsedCacheVal)
      ? parsedCacheVal.map((val) => new this.model(val))
      : new this.model(parsedCacheVal); // this here refers to the current query object and model refers to the current model so we have creating a new instance of our current model which is same as new Blog(JSON.parse(cacheVal))
  }

  //  else , issue the query and store the result in redis server

  // Executing the query
  const result = await exec.apply(this, arguments);

  // storing data in redis
  console.log(this.hashKey, key);
  await client.hmset(this.hashKey, key, JSON.stringify(result), "EX", 10);

  // returing the normal mongoose documents as happens in a nomral exec function
  return result;
};

// const { promisify } = require("util"); //promisify accepts a function which has its last argument as a callback and make it return a promise

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  },
};
