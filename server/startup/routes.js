const express = require("express");
const parking = require("../routes/parking");
const error = require("../middleware/error");

module.exports = function (app) {
    app.use(express.json());
    app.use("/api/parking", parking);
    app.use(error);
};
