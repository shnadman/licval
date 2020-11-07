const { validateParking } = require("../controllers/parking");
const express = require("express");
const multer = require(`multer`);
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router
  .route("/")
  .post(
    upload.fields([
      { name: "driverLicense" },
      { name: "carLicense" },
      { name: "id" },
    ]),
    validateParking
  );

module.exports = router;
