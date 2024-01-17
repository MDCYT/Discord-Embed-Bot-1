const mongoose = require("mongoose");
const { MONGODB_URL } = process.env;
const fs = require("fs");
const path = require("path");
// Connect to MongoDB
mongoose
  .connect(MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {

    global.Client.logger.info("Connected to MongoDB!");
  })
  .catch((err) => {

    global.Client.logger.warn("Error connecting to MongoDB");
    global.Client.logger.warn(err);
  });

global.__Mongoose = mongoose;
  
const models = fs.readdirSync(path.join(__dirname, "databases"));
models.forEach((model) => {

  const modelName = model.split(".")[0];
  const modelPath = path.join(__dirname, "databases", model);
  const modelFile = require(modelPath);
  module.exports[modelName] = modelFile;
  global[modelName] = modelFile;
});
