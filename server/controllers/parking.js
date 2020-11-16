const _ = require("lodash");
const mongoose = require("mongoose");
const Jimp = require("jimp");
const nodemailer = require("nodemailer");

const tesseract = require("tesseract.js");
const PSM = require("tesseract.js/src/constants/PSM.js");
const { createWorker } = tesseract;
const { Driver } = require("../models/driver");
import { handleId } from "./helpers/id";
import { handleDriversLicense } from "./helpers/driverLicense";
import { handleCarLis } from "./helpers/carLicense";

const sendMail = async (email, content) => {
  try {
    // Generate test SMTP service account from ethereal.email

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "roshhaain1@gmail.com", // generated ethereal user
        pass: "rosh1234", // generated ethereal password
      },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: "roshhaain1@gmail.com", // sender address
      to: email, // list of receivers
      subject: "Rosh Ha Ayin Parking service notification", // Subject line
      text: content, // plain text body
      html: `<b>${content}</b>`, // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  } catch (e) {
    console.error(e);
  }
};

export const jimpify = (threshold, path) => {
  Jimp.read(path)
    .then((img) => {
      return img
        .quality(100) // set JPEG quality
        .resize(1024, Jimp.AUTO)
        .greyscale()
        .threshold({ max: threshold, autoGreyscale: false })
        .write("renderedNew.png"); // save
    })
    .catch((err) => {
      console.error(err);
    });
};

exports.validateParking = async (req, res, next) => {
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  const { email } = req.body;

  const { driverLicense, carLicense, id } = req.files;
  const [driverLicenseImage, carLicenseImage, idImage] = [
    driverLicense[0]["buffer"],
    carLicense[0]["buffer"],
    id[0]["buffer"],
  ];

  let relevant = { roshHaAyinCitizen: false };
  let idsMatch = false;

  await handleDriversLicense(relevant, driverLicenseImage);
  console.log(relevant, idsMatch);
  /*
  idsMatch = await handleId(relevant, idImage);
   if (!idsMatch)
     return res.send("Id numbers in driver's license and ID don't match!");
*/
  idsMatch = await handleCarLis(relevant, carLicenseImage);
  console.log(relevant);

  if (!idsMatch) {
    await sendMail(
      email,
      "Id numbers in driver's license and car license don't match!"
    );
    return res.send(
      "Id numbers in driver's license and car license don't match!"
    );
  }
  const today = new Date();

  if (!relevant.roshHaAyinCitizen) {
    await sendMail(email, "Denied! Not a citizen of Rosh Ha Ayin");
    return res.send("Denied! Not a citizen of Rosh Ha Ayin");
  }
  if (relevant.driverExpires < today) {
    await sendMail(email, "Denied! Driver license expired");
    return res.status(400).send("Denied! Driver license expired");
  }

  if (relevant.carExpires < today) {
    await sendMail(email, "Denied! Car license expired");
    return res.status(400).send("Denied! Car license expired");
  }

  const driver = new Driver({ ...relevant, email });

  console.log(driver);

  driver.save();

  await sendMail(email, "Yofi, you have been approved for parking");
  res.send("Approved!");
};
