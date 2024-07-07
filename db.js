const { MongoClient } = require("mongodb");
require("dotenv").config();
const DATABASE = process.env.DATABASE;
let dbconnect;
module.exports = {
  connectToDb: (cb) => {
    MongoClient.connect(
      `mongodb+srv://${DATABASE}@cluster0.ofpbmzj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
    )
      .then((client) => {
        dbconnect = client.db();
        return cb();
      })
      .catch((err) => {
        return cb(err);
      });
  },
  getDb: () => dbconnect,
};
