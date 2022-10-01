const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URL = process.env.DATABASE_URL;
mongoose.connection.once("open", () => {
  console.log("Mongo Server has now started");
});

mongoose.connection.on("error", () => {
  console.error();
});

async function mongoConnect() {
  await mongoose.connect(MONGO_URL);
}

module.exports = { mongoConnect };
