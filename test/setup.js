jest.setTimeout(60000);

require("../models/User"); //requiring this file so that mongoose gets to know about User Model.This is needed because tests files are isolated from main project files so index.js ,our entry file is never executed during tests.Therefore we need to require files mongoose needs

const mongoose = require("mongoose");
const keys = require("../config/keys");

mongoose.Promise = global.Promise;

mongoose.connect(keys.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
});
