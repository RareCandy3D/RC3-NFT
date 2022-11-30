const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connection.once("open", () => {
  console.log("Mongo Server has now started");
});

mongoose.connection.on("error", () => {
  console.error();
});

async function mongoConnect() {
  await mongoose.connect(process.env.DATABASE_URL);
}

module.exports = { mongoConnect };
