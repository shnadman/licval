const { validateParking } = require("../controllers/parking");
const { cancelParking } = require("../controllers/cancelParking");
const express = require("express");
const multer = require(`multer`);
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router
  .route("/")
  .post(
    upload.fields([
      { name: "id" },
      { name: "idAttachment" },
      { name: "driverLicense" },
      { name: "carLicense" },
    ]),
    validateParking
  );

router.route("/cancelParking/:email/:id").delete(cancelParking);

module.exports = router;
