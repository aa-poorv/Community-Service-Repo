const { MongoClient } = require("mongodb");
require("dotenv").config();
let dbConnection;

module.exports = {
  connectDB: async (cb) => {
    await MongoClient.connect(process.env.MONGODB_URI)
      .then((client) => {
        dbConnection = client.db();
        return cb();
      })
      .catch((err) => {
        console.log(err);
        return cb(err);
      });
  },
  getDB: () => dbConnection,
};
