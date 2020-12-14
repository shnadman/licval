const { Driver } = require("../models/driver");
const _ = require("lodash");

exports.cancelParking = async (req, res, next) => {
  const { email, id } = req.params;
  const driver = await Driver.findOne({ email });
  console.log(driver);
  if (driver && driver.id === _.toInteger(id)) {
    await Driver.deleteOne({ email });
    return res.status(200).send("Delete");
  }
  return res.status(400).send("Input doesnt match database");
};
