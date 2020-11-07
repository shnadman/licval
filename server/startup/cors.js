const cors = require("cors");
require("express");

module.exports = function (app) {
    app.use(
        cors()
    );
};
