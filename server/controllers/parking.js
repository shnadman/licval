const _ = require("lodash");
const nodemailer = require("nodemailer");
const tesseract = require("tesseract.js");
const { createWorker } = tesseract;
const { Driver } = require("../models/driver");
const { handleId } = require("./helpers/id");
const { handleDriversLicense } = require("./helpers/driverLicense");
const { handleCarLis } = require("./helpers/carLicense");
const { handleIdAttachment } = require("./helpers/idAttachment");

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

exports.validateParking = async (req, res, next) => {
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  const { email } = req.body;

  const { id, idAttachment, driverLicense, carLicense } = req.files;

  const [idImage, idAttachmentImage, driverLicenseImage, carLicenseImage] = [
    id[0]["buffer"],
    idAttachment[0]["buffer"],
    driverLicense[0]["buffer"],
    carLicense[0]["buffer"],
  ];

  let relevant = { roshHaAyinCitizen: false };
  let idsMatch = false;

  await handleDriversLicense(relevant, driverLicenseImage);
  idsMatch = await handleId(relevant, idImage);
  if (!idsMatch) {
    await sendMail(email, "Id numbers in driver's license and ID don't match!");
    return res.send("Id numbers in driver's license and ID don't match!");
  }

  idsMatch = await handleCarLis(relevant, carLicenseImage);

  if (!idsMatch) {
    await sendMail(
      email,
      "Id numbers in driver's license and car license don't match!"
    );
    return res.send(
      "Id numbers in driver's license and car license don't match!"
    );
  }
  if (!relevant.carType) {
    await sendMail(email, "Wrong car type!");
    return res.send("Wrong car type!");
  }
  delete relevant.carType;
  const today = new Date();

  const isRHCitizen = handleIdAttachment(relevant, idAttachmentImage);
  if (!relevant.roshHaAyinCitizen || !isRHCitizen) {
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
