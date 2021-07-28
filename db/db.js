const mongoose = require("mongoose");
require("dotenv").config();

const initDbConn = async () => {
  try {
    await mongoose.connect(process.env.URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    });
    console.log("Db connection successful");
  } catch (error) {
    console.log(error);
    console.log("Could not connect to Db");
  }
};

module.exports = { initDbConn };
