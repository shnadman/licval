const winston = require("winston");
const express = require("express");

require("dotenv").config();
const app = express();

require("./startup/cors")(app);
require("./startup/logging")();
require("./startup/routes")(app);
require("./startup/db")();

const port = process.env.PORT || 3001;
const server = app.listen(port, () =>
  winston.info(`Listening on port ${port}...`)
);

module.exports = server;
